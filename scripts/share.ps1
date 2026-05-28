$ErrorActionPreference = "Stop"

if (-not $env:JWT_SECRET) {
  $env:JWT_SECRET = ([guid]::NewGuid().ToString("N") + [guid]::NewGuid().ToString("N"))
}

if (-not $env:COOKIE_SECURE) {
  $env:COOKIE_SECURE = "true"
}

docker compose -f docker-compose.share.yml up --build
