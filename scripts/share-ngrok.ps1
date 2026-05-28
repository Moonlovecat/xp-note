$ErrorActionPreference = "Stop"

if (-not $env:NGROK_AUTHTOKEN) {
  throw "NGROK_AUTHTOKEN is required. Create an ngrok account, copy your authtoken, then set `$env:NGROK_AUTHTOKEN."
}

$containerName = "weenai-ngrok"
$target = if ($env:NGROK_TARGET) { $env:NGROK_TARGET } else { "host.docker.internal:3000" }

$existing = docker ps -aq --filter "name=^/$containerName$"
if ($existing) {
  docker rm -f $containerName | Out-Null
}

$args = @(
  "run", "--rm",
  "--name", $containerName,
  "-e", "NGROK_AUTHTOKEN=$env:NGROK_AUTHTOKEN",
  "ngrok/ngrok:latest",
  "http", $target
)

if ($env:NGROK_URL) {
  $args += @("--url", $env:NGROK_URL)
}

docker @args
