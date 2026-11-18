Set-Location $PSScriptRoot

Write-Host "Starting CrediFit Backend Server..."
$proc = Start-Process node -ArgumentList "src/server.js" -PassThru -NoNewWindow
Start-Sleep -Seconds 3

try {
    Write-Host "Running comprehensive test suite..."
    node test-suite.js
} finally {
    Write-Host "Stopping Backend Server Process (PID: $($proc.Id))..."
    Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
}
