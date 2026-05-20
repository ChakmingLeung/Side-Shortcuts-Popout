# 打包 Chrome/Edge 扩展为 zip（解压后根目录含 manifest.json，可直接「加载解压缩的扩展」）
param(
  [string]$OutDir = (Join-Path $PSScriptRoot "..\dist")
)

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$manifestPath = Join-Path $root "manifest.json"
if (-not (Test-Path $manifestPath)) {
  Write-Error "manifest.json not found at $root"
  exit 1
}

$manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
$version = $manifest.version
$zipName = "Side-Shortcuts-Popout-v$version.zip"

$include = @(
  "manifest.json",
  "background.js",
  "shared.js",
  "theme.js",
  "backup.js",
  "i18n.js",
  "sidepanel.html",
  "sidepanel.js",
  "sidepanel.css",
  "options.html",
  "options.js",
  "options.css",
  "LICENSE",
  "README.zh-CN.md",
  "icons\icon16.png",
  "icons\icon48.png",
  "icons\icon128.png",
  "_locales\en\messages.json",
  "_locales\zh_CN\messages.json"
)

$stage = Join-Path $OutDir "stage"
$zipPath = Join-Path $OutDir $zipName

if (Test-Path $OutDir) {
  Remove-Item -Recurse -Force (Join-Path $OutDir "stage") -ErrorAction SilentlyContinue
}
New-Item -ItemType Directory -Force -Path $stage | Out-Null
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

foreach ($rel in $include) {
  $src = Join-Path $root $rel
  if (-not (Test-Path $src)) {
    Write-Error "Missing required file: $rel"
    exit 1
  }
  $dest = Join-Path $stage $rel
  $destParent = Split-Path $dest -Parent
  if (-not (Test-Path $destParent)) {
    New-Item -ItemType Directory -Force -Path $destParent | Out-Null
  }
  Copy-Item -Force $src $dest
}

if (Test-Path $zipPath) {
  Remove-Item -Force $zipPath
}
Compress-Archive -Path (Join-Path $stage "*") -DestinationPath $zipPath -CompressionLevel Optimal

Remove-Item -Recurse -Force $stage

Write-Host "Created: $zipPath"
Write-Host "Install: unzip, then load unpacked extension folder (folder must contain manifest.json)."
