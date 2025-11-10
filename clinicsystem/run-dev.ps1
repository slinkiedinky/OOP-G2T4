# clinicsystem\run-dev.ps1 — load .env (module or repo root) and run backend from clinicsystem folder (PowerShell)
param()

function Get-EnvFilePath {
  if (Test-Path -Path '.env') { return (Resolve-Path '.env').Path }
  if (Test-Path -Path '..\.env') { return (Resolve-Path '..\.env').Path }
  return $null
}

$envFile = Get-EnvFilePath
if (-not $envFile) {
  Write-Host ".env not found in module or repo root. Copy ..\.env.sample to .env and fill values." -ForegroundColor Yellow
  exit 1
}

Get-Content $envFile | ForEach-Object {
  $line = $_.Trim()
  if ($line -eq '' -or $line.StartsWith('#')) { return }
  $parts = $line -split '=', 2
  if ($parts.Length -ge 2) {
    $name = $parts[0].Trim()
    $value = $parts[1].Trim()
    $env:$name = $value
  }
}

Write-Host "Loaded environment from $envFile"

# Start the backend using the Maven wrapper in this folder
& .\mvnw.cmd -Dspring-boot.run.profiles=local spring-boot:run
