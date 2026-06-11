param(
  [Parameter(Position = 0)]
  [ValidateSet('export-edge', 'convert', 'help')]
  [string]$Command = 'help',

  [string]$EdgeProfilePath,

  [string]$InputPath,

  [string]$OutputPath,

  [string]$ShortcutListOutputPath,

  [switch]$Desktop
)

$ErrorActionPreference = 'Stop'

$converter = Join-Path $PSScriptRoot 'edge-sidebar-to-backup.ps1'

function Show-Help {
  Write-Host @'
Edge Sidebar Migration CLI

Commands:
  export-edge  Export old Edge Sidebar/App Tower links from an Edge profile.
  convert      Convert an already exported JSON or Markdown link list.
  help         Show this help.

Examples:
  powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\edge-sidebar-migrate\edge-sidebar-migrate.ps1 export-edge `
    -EdgeProfilePath "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default" `
    -OutputPath .\Side-Shortcuts-Popout-edge-sidebar-backup.json `
    -ShortcutListOutputPath .\edge-sidebar-link-list.json

  powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\edge-sidebar-migrate\edge-sidebar-migrate.ps1 convert `
    -InputPath .\edge-sidebar-link-list.json `
    -OutputPath .\Side-Shortcuts-Popout-edge-sidebar-backup.json

Options:
  -Desktop                   Save imported shortcuts in desktop mode.
  -ShortcutListOutputPath    Also write a plain {title,url,mobile} link list.
'@
}

if ($Command -eq 'help') {
  Show-Help
  exit 0
}

if ($Command -eq 'export-edge') {
  if (-not $EdgeProfilePath) {
    throw 'export-edge requires -EdgeProfilePath.'
  }

  $argsList = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $converter, '-EdgeProfilePath', $EdgeProfilePath)
  if ($OutputPath) { $argsList += @('-OutputPath', $OutputPath) }
  if ($ShortcutListOutputPath) { $argsList += @('-ShortcutListOutputPath', $ShortcutListOutputPath) }
  if ($Desktop) { $argsList += '-Desktop' }
  & powershell @argsList
  exit $LASTEXITCODE
}

if ($Command -eq 'convert') {
  if (-not $InputPath) {
    throw 'convert requires -InputPath.'
  }

  $argsList = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $converter, '-InputPath', $InputPath)
  if ($OutputPath) { $argsList += @('-OutputPath', $OutputPath) }
  if ($ShortcutListOutputPath) { $argsList += @('-ShortcutListOutputPath', $ShortcutListOutputPath) }
  if ($Desktop) { $argsList += '-Desktop' }
  & powershell @argsList
  exit $LASTEXITCODE
}
