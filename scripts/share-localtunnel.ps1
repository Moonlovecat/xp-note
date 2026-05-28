$ErrorActionPreference = "Stop"

$args = @("--yes", "localtunnel", "--port", "3000")

if ($env:LOCALTUNNEL_SUBDOMAIN) {
  $args += @("--subdomain", $env:LOCALTUNNEL_SUBDOMAIN)
}

npx @args
