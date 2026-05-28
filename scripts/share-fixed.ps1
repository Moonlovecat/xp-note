$ErrorActionPreference = "Stop"

if (-not $env:CLOUDFLARE_TUNNEL_TOKEN) {
  throw "CLOUDFLARE_TUNNEL_TOKEN is required. Create a Cloudflare Tunnel and paste its token into this environment variable."
}

if (-not $env:JWT_SECRET) {
  $env:JWT_SECRET = ([guid]::NewGuid().ToString("N") + [guid]::NewGuid().ToString("N"))
}

docker compose -f docker-compose.fixed.yml up --build
