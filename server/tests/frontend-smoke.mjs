import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const DEBUG_PORT = Number(process.env.CHROME_DEBUG_PORT || 9223);
const chromeCandidates = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium-browser",
  "/usr/bin/chromium"
].filter(Boolean);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForJson(url, timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return response.json();
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await sleep(250);
  }
  throw lastError || new Error(`Timed out waiting for ${url}`);
}

async function findChromePath() {
  for (const candidate of chromeCandidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  throw new Error("Chrome or Edge executable was not found. Set CHROME_PATH to run the smoke test.");
}

class CdpSession {
  constructor(webSocketUrl) {
    this.webSocketUrl = webSocketUrl;
    this.nextId = 1;
    this.pending = new Map();
  }

  async connect() {
    this.socket = new WebSocket(this.webSocketUrl);
    this.socket.addEventListener("message", event => {
      const payload = JSON.parse(event.data);
      if (!payload.id) return;
      const waiter = this.pending.get(payload.id);
      if (!waiter) return;
      this.pending.delete(payload.id);
      if (payload.error) waiter.reject(new Error(payload.error.message));
      else waiter.resolve(payload.result);
    });

    await new Promise((resolve, reject) => {
      this.socket.addEventListener("open", resolve, { once: true });
      this.socket.addEventListener("error", reject, { once: true });
    });
  }

  send(method, params = {}) {
    const id = this.nextId++;
    const message = JSON.stringify({ id, method, params });
    this.socket.send(message);
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });
  }

  close() {
    this.socket?.close();
  }
}

async function run() {
  const chromePath = await findChromePath();
  console.log(`Using browser: ${chromePath}`);
  const profileDir = join(tmpdir(), `weenai-chrome-${Date.now()}`);
  const artifactDir = join(process.cwd(), "tests", "artifacts");
  await mkdir(artifactDir, { recursive: true });

  console.log("Launching headless browser...");
  const chrome = spawn(chromePath, [
    "--headless=new",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--no-first-run",
    "--no-default-browser-check",
    `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${profileDir}`,
    "about:blank"
  ], { stdio: "ignore" });

  let session;
  try {
    console.log("Connecting to DevTools...");
    await waitForJson(`http://127.0.0.1:${DEBUG_PORT}/json/version`);
    const targets = await waitForJson(`http://127.0.0.1:${DEBUG_PORT}/json`);
    const pageTarget = targets.find(target => target.type === "page");
    assert(pageTarget?.webSocketDebuggerUrl, "No debuggable page target was found.");

    session = new CdpSession(pageTarget.webSocketDebuggerUrl);
    await session.connect();
    await session.send("Page.enable");
    await session.send("Runtime.enable");

    const evaluate = async expression => {
      const result = await session.send("Runtime.evaluate", {
        expression,
        awaitPromise: true,
        returnByValue: true,
        userGesture: true
      });
      if (result.exceptionDetails) {
        throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
      }
      return result.result?.value;
    };

    const waitFor = async (expression, label, timeoutMs = 10000) => {
      const deadline = Date.now() + timeoutMs;
      while (Date.now() < deadline) {
        if (await evaluate(`Boolean(${expression})`)) return;
        await sleep(150);
      }
      throw new Error(`Timed out waiting for ${label}`);
    };

    console.log(`Navigating to ${FRONTEND_URL}...`);
    await session.send("Page.navigate", { url: FRONTEND_URL });
    await waitFor("document.readyState === 'complete'", "page load");
    await waitFor("document.querySelectorAll('.game-card').length === 20", "20 game cards");

    const initialStats = await evaluate(`({
      cards: document.querySelectorAll('.game-card').length,
      games: document.querySelector('#gameCount')?.textContent.trim(),
      reviews: document.querySelector('#reviewCount')?.textContent.trim(),
      requests: document.querySelector('#requestCount')?.textContent.trim()
    })`);
    assert(initialStats.cards === 20, "Expected 20 game cards.");
    assert(initialStats.games === "20", "Expected game count KPI to be 20.");
    const initialReviewCount = Number(initialStats.reviews);
    const initialRequestCount = Number(initialStats.requests);
    assert(initialReviewCount >= 100, "Expected seeded review count KPI to be at least 100.");
    assert(initialRequestCount >= 5, "Expected seeded request count KPI to be at least 5.");

    console.log("Testing auth gate, signup, review create/edit, and game request...");
    await evaluate("document.querySelector('.game-card').click()");
    await waitFor("document.querySelector('#writeReviewButton')", "game detail");
    await evaluate("document.querySelector('#writeReviewButton').click()");
    await waitFor("document.querySelector('#authModal')?.classList.contains('open')", "auth modal");

    const unique = Date.now();
    await evaluate(`
      document.querySelector('[data-auth-tab="signup"]').click();
      document.querySelector('#signupNickname').value = 'smoke-${unique}';
      document.querySelector('#signupEmail').value = 'smoke-${unique}@example.com';
      document.querySelector('#signupPassword').value = 'Pass1234!';
      document.querySelector('#signupForm').requestSubmit();
    `);
    await waitFor("!document.querySelector('#authModal')?.classList.contains('open')", "signup completion");
    await waitFor("document.querySelector('#userPill')?.textContent.includes('smoke-')", "signed-in header");

    await evaluate("document.querySelector('#writeReviewButton').click()");
    await waitFor("document.querySelector('#reviewModal')?.classList.contains('open')", "review modal");
    const simpleReviewForm = await evaluate(`({
      type: document.querySelector("input[name='reviewType']:checked")?.value,
      scoreFieldHidden: document.querySelector('#scoreField')?.hidden,
      recommendationHidden: document.querySelector('#recommendationField')?.hidden
    })`);
    assert(simpleReviewForm.type === "review", "Expected review to be the default writing type.");
    assert(simpleReviewForm.scoreFieldHidden === true, "Expected item score inputs to be hidden for simple reviews.");
    assert(simpleReviewForm.recommendationHidden === true, "Expected recommendation input to be hidden for simple reviews.");
    await evaluate(`
      document.querySelector('#reviewRating').value = '4.5';
      document.querySelector('#reviewRating').dispatchEvent(new Event('input', { bubbles: true }));
      document.querySelector('#reviewComment').value = '프론트 스모크 리뷰';
      document.querySelector('#reviewForm').requestSubmit();
    `);
    await waitFor("!document.querySelector('#reviewModal')?.classList.contains('open')", "review creation");
    await waitFor("document.querySelector('#writeReviewButton')?.textContent.includes('수정')", "my review state");

    await evaluate("document.querySelector('#writeReviewButton').click()");
    await waitFor("document.querySelector('#reviewModal')?.classList.contains('open')", "edit review modal");
    await evaluate(`
      document.querySelector('#reviewComment').value = '프론트 스모크 리뷰 수정';
      document.querySelector('#reviewForm').requestSubmit();
    `);
    await waitFor("document.body.textContent.includes('프론트 스모크 리뷰 수정')", "edited review text");

    await evaluate("document.querySelector('#requestGameButton').click()");
    await waitFor("document.querySelector('#requestModal')?.classList.contains('open')", "game request modal");
    await evaluate(`
      document.querySelector('#requestTitle').value = '스모크 테스트 신청 게임';
      document.querySelector('#requestPlatform').value = 'Nintendo';
      document.querySelector('#requestYear').value = '2026';
      document.querySelector('#requestReason').value = '프론트 신청 플로우 확인';
      document.querySelector('#gameRequestForm').requestSubmit();
    `);
    await waitFor("!document.querySelector('#requestModal')?.classList.contains('open')", "game request submission");
    await waitFor(`Number(document.querySelector('#requestCount')?.textContent.trim()) === ${initialRequestCount + 1}`, "request count update");

    await evaluate("document.querySelector('#homeButton').click()");
    await waitFor("document.querySelector('#listView')?.classList.contains('active')", "list view");
    await evaluate(`
      const input = document.querySelector('#searchInput');
      input.value = '마리오';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    `);
    await waitFor("document.querySelectorAll('.game-card').length > 0 && document.querySelectorAll('.game-card').length < 20", "search filtering");

    await session.send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 900,
      deviceScaleFactor: 1,
      mobile: true
    });
    await sleep(300);
    const mobile = await evaluate(`({
      width: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      cards: document.querySelectorAll('.game-card').length
    })`);
    assert(mobile.scrollWidth <= mobile.width, `Mobile horizontal overflow: ${mobile.scrollWidth} > ${mobile.width}`);

    const screenshot = await session.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
    const screenshotPath = join(artifactDir, "frontend-smoke-mobile.png");
    await writeFile(screenshotPath, Buffer.from(screenshot.data, "base64"));

    console.log(JSON.stringify({
      ok: true,
      initialStats,
      mobile,
      screenshotPath
    }, null, 2));
  } finally {
    session?.close();
    chrome.kill();
  }
}

run().catch(error => {
  console.error(error);
  process.exit(1);
});
