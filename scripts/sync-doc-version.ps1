# Sync version from manifest.json to documentation files
$root = Split-Path $PSScriptRoot -Parent
$manifestPath = Join-Path $root "manifest.json"
if (-not (Test-Path $manifestPath)) {
  Write-Error "manifest.json not found"
  exit 1
}

$manifest = Get-Content $manifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
$version = [string]$manifest.version
if ([string]::IsNullOrWhiteSpace($version)) {
  Write-Error "manifest.json has no version"
  exit 1
}

Write-Host "Syncing docs to version $version"

$files = @(
  "README.md",
  "README.zh-CN.md",
  "docs\PRD.md",
  "docs\PRD.zh-CN.md",
  "docs\ARCHITECTURE.md",
  "docs\ARCHITECTURE.zh-CN.md",
  "docs\README.md"
)

$badgePattern = 'version-\d+\.\d+\.\d+-blue'
$badgeReplacement = "version-$version-blue"

foreach ($rel in $files) {
  $file = Join-Path $root $rel
  if (-not (Test-Path $file)) {
    Write-Warning "Skip: $rel"
    continue
  }

  $content = [System.IO.File]::ReadAllText($file)
  $original = $content

  if ($rel -like "README*") {
    $content = [regex]::Replace($content, $badgePattern, $badgeReplacement)
  }

  $content = [regex]::Replace($content, '\| Doc version \| v\d+\.\d+\.\d+', "| Doc version | v$version")
  $content = [regex]::Replace($content, '\| Doc version \| \d+\.\d+\.\d+ \|', "| Doc version | $version |")
  $content = [regex]::Replace($content, '\| Product version \| \d+\.\d+\.\d+ \|', "| Product version | $version |")
  $content = [regex]::Replace($content, '\| Doc version \| 1\.\d+\.\d+ \|', "| Doc version | $version |")
  $content = [regex]::Replace($content, '\*\*Current version:\*\* \d+\.\d+\.\d+', "**Current version:** $version")
  $content = [regex]::Replace($content, 'Latest: \*\*v\d+\.\d+\.\d+\*\*', "Latest: **v$version**")
  $content = [regex]::Replace($content, '\| 产品版本 \| \d+\.\d+\.\d+ \|', "| 产品版本 | $version |")
  $content = [regex]::Replace($content, '\| 文档版本 \| v\d+\.\d+\.\d+ \|', "| 文档版本 | v$version |")

  if ($content -ne $original) {
    [System.IO.File]::WriteAllText($file, $content, [System.Text.UTF8Encoding]::new($false))
    Write-Host "  Updated: $rel"
  }
}

Write-Host "Done. Add CHANGELOG.md entry for v$version if needed."
