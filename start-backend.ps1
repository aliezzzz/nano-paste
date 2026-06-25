param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$GoArgs
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path $repoRoot "apps\backend"

if (-not (Test-Path -LiteralPath $backendDir)) {
    throw "Backend directory not found: $backendDir"
}

$gccBinCandidates = @(
    "C:\msys64\ucrt64\bin",
    "C:\msys64\mingw64\bin"
)

foreach ($gccBin in $gccBinCandidates) {
    if (Test-Path -LiteralPath (Join-Path $gccBin "gcc.exe")) {
        if (-not ($env:Path -split ";" | Where-Object { $_ -eq $gccBin })) {
            $env:Path = "$gccBin;$env:Path"
        }
        break
    }
}

$env:CGO_ENABLED = "1"
$env:CC = "gcc"
$env:CXX = "g++"

if (-not $GoArgs -or $GoArgs.Count -eq 0) {
    $GoArgs = @("./cmd/server")
}

Push-Location $backendDir
try {
    & go run @GoArgs
}
finally {
    Pop-Location
}
