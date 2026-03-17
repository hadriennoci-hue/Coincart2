$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$sourcePath = Join-Path $root ".coincart.env.local"

if (-not (Test-Path $sourcePath)) {
    throw "Missing canonical env file: $sourcePath"
}

foreach ($line in Get-Content -Path $sourcePath) {
    $trimmed = $line.Trim()
    if (-not $trimmed -or $trimmed.StartsWith("#")) {
        continue
    }

    $parts = $trimmed -split "=", 2
    if ($parts.Count -ne 2) {
        continue
    }

    $key = $parts[0].Trim()
    $value = $parts[1]
    if ($key) {
        [Environment]::SetEnvironmentVariable($key, $value, "Process")
    }
}

if ($args.Count -eq 0) {
    throw "Usage: run-with-root-env.ps1 <command> [args...]"
}

$command = $args[0]
$commandArgs = @()
if ($args.Count -gt 1) {
    $commandArgs = $args[1..($args.Count - 1)]
}

& $command @commandArgs
$exitCode = $LASTEXITCODE
if ($null -ne $exitCode) {
    exit $exitCode
}
