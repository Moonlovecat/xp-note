$ErrorActionPreference = "Stop"

if (-not (Get-Command tailscale -ErrorAction SilentlyContinue)) {
  throw "Tailscale CLI is required. Install Tailscale, log in, and enable Funnel for your tailnet first."
}

tailscale funnel --bg 3000
tailscale funnel status
