<#
.SYNOPSIS
  Singularity.AI game build and release script
.DESCRIPTION
  Build -> clean release -> copy source -> copy dist -> copy launcher templates
  Idempotent: cleans old release on each run
.PARAMETER ReleaseDir
  Release folder path. Default: ..\project4-release
.EXAMPLE
  .\build-release.ps1
  .\build-release.ps1 -ReleaseDir "D:\releases\v1.0"
#>
param(
    [string]$ReleaseDir = ""
)

$ErrorActionPreference = "Stop"

# Resolve script root (compatible with powershell -File invocation)
if ($PSScriptRoot) {
    $ProjectRoot = $PSScriptRoot
} else {
    $ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
}
if (-not $ProjectRoot) { $ProjectRoot = (Get-Location).Path }
$TemplateDir = Join-Path $ProjectRoot "release-templates"

if (-not $ReleaseDir) {
    $ReleaseDir = Join-Path (Split-Path $ProjectRoot -Parent) "project4-release"
}

function Write-Step { param([string]$msg) Write-Host "`n[STEP] $msg" -ForegroundColor Cyan }
function Write-OK   { param([string]$msg) Write-Host "  [OK] $msg" -ForegroundColor Green }
function Write-Warn { param([string]$msg) Write-Host "  [!]  $msg" -ForegroundColor Yellow }
function Write-Err  { param([string]$msg) Write-Host "  [X]  $msg" -ForegroundColor Red }

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Singularity.AI Build & Release Script" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Project:  $ProjectRoot"
Write-Host "  Release:  $ReleaseDir"

# ============================================================
# Step 1: Build production bundle
# ============================================================
Write-Step "Building production bundle..."

if (-not (Test-Path (Join-Path $ProjectRoot "package.json"))) {
    Write-Err "package.json not found in $ProjectRoot"
    exit 1
}

# Detect package manager
$PkgMgr = ""
if (Get-Command pnpm -ErrorAction SilentlyContinue) {
    $PkgMgr = "pnpm"
} elseif (Get-Command npm -ErrorAction SilentlyContinue) {
    $PkgMgr = "npm"
} else {
    Write-Err "Neither pnpm nor npm found. Please install Node.js first."
    exit 1
}
Write-OK "Package manager: $PkgMgr"

# Install deps if node_modules missing
if (-not (Test-Path (Join-Path $ProjectRoot "node_modules"))) {
    Write-Warn "node_modules not found, installing dependencies..."
    & $PkgMgr install
    if ($LASTEXITCODE -ne 0) { Write-Err "Dependency install failed"; exit 1 }
    Write-OK "Dependencies installed"
} else {
    Write-OK "node_modules exists, skip install"
}

# Build
Write-Host "  Running: $PkgMgr run build" -ForegroundColor DarkGray
& $PkgMgr run build
if ($LASTEXITCODE -ne 0) { Write-Err "Build failed"; exit 1 }
Write-OK "Build completed"

$DistDir = Join-Path $ProjectRoot "dist"
if (-not (Test-Path (Join-Path $DistDir "index.html"))) {
    Write-Err "dist/index.html not found after build"
    exit 1
}
Write-OK "dist/index.html verified"

# ============================================================
# Step 2: Check template files
# ============================================================
Write-Step "Checking templates..."

if (-not (Test-Path $TemplateDir)) {
    Write-Err "Template dir not found: $TemplateDir"
    exit 1
}

# Match by extension to avoid Chinese filename encoding issues in script
$TemplateServer = Join-Path $TemplateDir "server.mjs"
if (-not (Test-Path $TemplateServer)) {
    Write-Err "Template missing: server.mjs"
    exit 1
}
$BatTemplates = @(Get-ChildItem $TemplateDir -Filter "*.bat")
if ($BatTemplates.Count -eq 0) {
    Write-Err "Template missing: *.bat"
    exit 1
}
$TxtTemplates = @(Get-ChildItem $TemplateDir -Filter "*.txt")
if ($TxtTemplates.Count -eq 0) {
    Write-Err "Template missing: *.txt"
    exit 1
}
Write-OK "All templates found"

# ============================================================
# Step 3: Clean and create release folders
# ============================================================
Write-Step "Preparing release directory..."

if (Test-Path $ReleaseDir) {
    Write-Warn "Release dir exists, cleaning..."
    Remove-Item $ReleaseDir -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $ReleaseDir | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $ReleaseDir "game") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $ReleaseDir "source") | Out-Null
Write-OK "Release structure created"

# ============================================================
# Step 4: Copy source to release/source (exclude heavy dirs)
# ============================================================
Write-Step "Copying source code..."

$ExcludeDirs = @('node_modules', 'dist', '.git', 'singularity-mvp', '.workbuddy', '.trae', 'release-templates')
$DstSrcDir = Join-Path $ReleaseDir "source"

Get-ChildItem -Path $ProjectRoot -Force | Where-Object {
    $name = $_.Name
    -not ($ExcludeDirs -contains $name) -and
    -not ($name.EndsWith('.tsbuildinfo')) -and
    $name -ne 'build-release.ps1'
} | ForEach-Object {
    $target = Join-Path $DstSrcDir $_.Name
    if ($_.PSIsContainer) {
        Copy-Item -Path $_.FullName -Destination $target -Recurse -Force
    } else {
        Copy-Item -Path $_.FullName -Destination $target -Force
    }
}
Write-OK "Source code copied (excluded: $($ExcludeDirs -join ', '))"

# ============================================================
# Step 5: Copy dist to release/game/dist
# ============================================================
Write-Step "Copying build output..."

Copy-Item -Path $DistDir -Destination (Join-Path $ReleaseDir "game\dist") -Recurse -Force
Write-OK "dist copied to game/dist"

# ============================================================
# Step 6: Copy template files
# ============================================================
Write-Step "Copying launcher and server..."

# server.mjs -> game/server.mjs
Copy-Item -Path $TemplateServer -Destination (Join-Path $ReleaseDir "game\server.mjs") -Force
Write-OK "server.mjs copied"

# *.bat -> release root (keep original filename)
$BatTemplates | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination $ReleaseDir -Force
    Write-OK "$($_.Name) copied"
}

# *.txt -> release root (keep original filename)
$TxtTemplates | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination $ReleaseDir -Force
    Write-OK "$($_.Name) copied"
}

# ============================================================
# Step 7: Done - show final structure
# ============================================================
Write-Step "Release build complete!"

Write-Host "`n  Release directory: $ReleaseDir" -ForegroundColor Green

Write-Host "  Structure:" -ForegroundColor DarkGray
Get-ChildItem $ReleaseDir -Recurse -Depth 2 | ForEach-Object {
    $rel = $_.FullName.Replace($ReleaseDir + "\", "")
    $prefix = if ($_.PSIsContainer) { "[DIR] " } else { "      " }
    Write-Host "  $prefix$rel" -ForegroundColor DarkGray
}

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "  Done!" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan
