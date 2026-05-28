# XP Note 공유 실행

## 추천 순서

| 방식 | 소유 도메인 필요 | URL 고정성 | 비용/조건 | 권장도 |
| --- | --- | --- | --- | --- |
| zrok reserved name | 없음 | `public:<name>` 예약 이름으로 고정 | zrok 계정/CLI 필요, hosted free tier 가능 | 1순위 |
| Tailscale Funnel | 없음 | `*.ts.net` 주소 사용 | Tailscale 계정/클라이언트 필요, Funnel 설정 필요 | 2순위 |
| ngrok dev domain | 없음 | 계정에 배정된 dev domain 재사용 | 이미 무료 도메인을 사용 중이면 추가 고정 URL이 어려움 | 보류 |
| localtunnel | 없음 | 랜덤 URL, 지정 subdomain은 후원 필요 | 간단하지만 안정성 낮음 | 임시용 |
| Cloudflare quick tunnel | 없음 | 랜덤 `trycloudflare.com` | 가장 간단하지만 재시작 시 URL 변경 | 임시용 |

## 1. zrok으로 고정 URL 공유

zrok v2는 CLI 이름이 `zrok2`이고, 예전 `zrok reserve` 방식 대신 namespace/name을 사용합니다.
이 MVP는 Express 서버를 터널링하므로 zrok `proxy` backend mode로 공유합니다.

아래 명령은 프로젝트 루트에서 실행합니다.

```powershell
Set-Location "C:\Users\ReS\Desktop\Project\weenai"
```

### 1.1 zrok2 설치

Windows에서 프로젝트 로컬 `.tools/zrok2`에 설치합니다.

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install-zrok2.ps1
```

이미 `zrok2`가 PATH에 있으면 설치 스크립트는 생략해도 됩니다.

### 1.2 zrok 계정 활성화

zrok 계정 토큰을 받은 뒤 한 번만 enable합니다. 토큰은 비밀번호처럼 취급하고 문서나 저장소에 남기지 않습니다.

처음 한 번은 토큰 입력과 이름 생성을 같이 실행합니다. 실행하면 토큰 입력 프롬프트가 뜹니다.

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\share-zrok.ps1 -PromptForToken -CreateName -RestartOnExit
```

이미 enable과 이름 생성이 끝났다면 다음부터는 토큰 없이 실행합니다.

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\share-zrok.ps1 -RestartOnExit
```

이전 실행이 비정상 종료되어 `shareConflict`가 나면 기존 share를 정리하고 다시 엽니다.

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\share-zrok.ps1 -CleanExistingShare -RestartOnExit
```

PowerShell을 쓰고 있다면 처음 실행 때 환경변수로 넣고 실행할 수도 있습니다.

```powershell
$env:ZROK2_ACCOUNT_TOKEN = "실제_zrok_토큰값"
powershell -ExecutionPolicy Bypass -File .\scripts\share-zrok.ps1 -CreateName -RestartOnExit
```

`cmd.exe`를 쓰고 있다면 PowerShell 문법인 `$env:...`가 동작하지 않습니다. 이 경우 아래처럼 실행합니다.

```cmd
set "ZROK2_ACCOUNT_TOKEN=실제_zrok_토큰값"
powershell -ExecutionPolicy Bypass -File .\scripts\share-zrok.ps1 -CreateName -RestartOnExit
```

기본 공유 이름은 `weenaireview`입니다. 성공하면 공유 URL은 다음 형태입니다.

```text
https://weenaireview.shares.zrok.io
```

원하는 이름을 쓰려면 4-32자의 영문 소문자/숫자/허용 문자 이름으로 바꿔 실행합니다. 이미 같은 이름을 다른 사용자가 쓰고 있으면 다른 이름을 선택해야 합니다.

```powershell
$env:ZROK2_NAME='weenaigame'
powershell -ExecutionPolicy Bypass -File .\scripts\share-zrok.ps1 -CreateName -RestartOnExit
```

## 2. Tailscale Funnel로 공유

Tailscale에 로그인하고 Funnel을 tailnet에서 허용한 뒤 실행합니다.

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\share-tailscale.ps1
```

URL은 `https://<machine>.<tailnet>.ts.net` 형태입니다. 팀원이 Tailscale을 설치할 필요는 없지만, 내 기기에서 Tailscale이 계속 실행 중이어야 합니다.

## 3. ngrok로 공유

ngrok 계정을 만들고 authtoken을 복사한 뒤 실행합니다.

```powershell
$env:NGROK_AUTHTOKEN='ngrok_authtoken'
powershell -ExecutionPolicy Bypass -File .\scripts\share-ngrok.ps1
```

무료 플랜에서는 계정에 자동 배정된 dev domain을 쓰게 됩니다. 이미 무료 dev domain을 다른 프로젝트에서 사용 중이면 이번 프로젝트는 zrok을 우선 사용합니다.

## 4. localtunnel 임시 공유

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\share-localtunnel.ps1
```

지정 subdomain은 localtunnel sponsorship 조건이 붙습니다.

```powershell
$env:LOCALTUNNEL_SUBDOMAIN='weenaireview'
powershell -ExecutionPolicy Bypass -File .\scripts\share-localtunnel.ps1
```

## 5. Cloudflare 임시 URL 공유

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\share.ps1
```

`trycloudflare.com` URL은 도메인 없이 바로 만들 수 있지만, 재시작하면 바뀔 수 있습니다.

## 현재 로컬 서버만 터널링하기

이미 `http://localhost:3000` 서버가 떠 있다면 앱 컨테이너를 새로 만들지 않고 터널만 열 수 있습니다.

```powershell
docker run --rm --name weenai-tunnel cloudflare/cloudflared:latest tunnel --no-autoupdate --url http://host.docker.internal:3000
```

## 주의

- 공개 URL에서는 실제 비밀번호를 쓰지 마세요. 현재 인증은 MVP용입니다.
- zrok 계정 토큰, `JWT_SECRET`, DB 비밀번호는 저장소에 커밋하지 마세요.
- 장기 운영은 DB 백업, 관리자 기능, 로그 관리, rate limit을 별도로 강화해야 합니다.
