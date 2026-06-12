param()

$ErrorActionPreference = 'Stop'

$cliPath = Join-Path $PSScriptRoot 'edge-sidebar-migrate.ps1'
$workDir = Join-Path ([System.IO.Path]::GetTempPath()) "ssp-edge-sidebar-tests-$([Guid]::NewGuid().ToString('n'))"
New-Item -ItemType Directory -Force -Path $workDir | Out-Null

function Assert-Equal {
  param(
    [object]$Actual,
    [object]$Expected,
    [string]$Message
  )

  if ($Actual -ne $Expected) {
    throw "$Message Expected '$Expected', got '$Actual'."
  }
}

try {
  $profileDir = Join-Path $workDir 'Profile 1'
  New-Item -ItemType Directory -Force -Path $profileDir | Out-Null
  $preferencesPath = Join-Path $profileDir 'Preferences'
  $preferences = [ordered]@{
    browser = [ordered]@{
      edge_sidebar_visibility = [ordered]@{
        order = [ordered]@{
          'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' = 1
          'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' = 2
        }
      }
      edge_sidebar_visibility_debug = [ordered]@{
        order_raw_data = [ordered]@{
          'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' = [ordered]@{ name = 'ChatGPT'; pos = '1' }
          'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' = [ordered]@{ name = 'Claude'; pos = '2' }
        }
      }
      hub_app_preferences = [ordered]@{
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' = [ordered]@{
          title = 'ChatGPT'
          url = 'https://chat.openai.com/'
        }
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' = [ordered]@{
          name = 'Claude'
          start_url = 'https://claude.ai/'
        }
      }
    }
  }
  $preferences | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $preferencesPath -Encoding UTF8

  $edgeOut = Join-Path $workDir 'edge-profile-backup.json'
  $edgeListOut = Join-Path $workDir 'edge-profile-link-list.json'
  & powershell -NoProfile -ExecutionPolicy Bypass -File $cliPath export-edge -EdgeProfilePath $profileDir -OutputPath $edgeOut -ShortcutListOutputPath $edgeListOut | Out-Host
  $edgeBackup = Get-Content -LiteralPath $edgeOut -Raw -Encoding UTF8 | ConvertFrom-Json
  Assert-Equal $edgeBackup.shortcuts.Count 2 'Edge profile export shortcut count mismatch.'
  Assert-Equal $edgeBackup.shortcuts[0].title 'ChatGPT' 'First Edge profile shortcut title mismatch.'
  Assert-Equal $edgeBackup.shortcuts[0].url 'https://chat.openai.com/' 'First Edge profile shortcut URL mismatch.'
  Assert-Equal $edgeBackup.shortcuts[1].title 'Claude' 'Second Edge profile shortcut title mismatch.'
  Assert-Equal $edgeBackup.shortcuts[1].url 'https://claude.ai/' 'Second Edge profile shortcut URL mismatch.'
  $edgeList = Get-Content -LiteralPath $edgeListOut -Raw -Encoding UTF8 | ConvertFrom-Json
  Assert-Equal $edgeList.Count 2 'Edge profile link-list export count mismatch.'
  Assert-Equal $edgeList[0].title 'ChatGPT' 'Edge profile link-list first title mismatch.'

  $listPath = Join-Path $workDir 'exported-list.json'
  @(
    [ordered]@{ title = 'Perplexity'; url = 'https://www.perplexity.ai/'; mobile = $true }
  ) | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $listPath -Encoding UTF8

  $listOut = Join-Path $workDir 'file-backup.json'
  & powershell -NoProfile -ExecutionPolicy Bypass -File $cliPath convert -InputPath $listPath -OutputPath $listOut | Out-Host
  $listBackup = Get-Content -LiteralPath $listOut -Raw -Encoding UTF8 | ConvertFrom-Json
  Assert-Equal $listBackup.shortcuts.Count 1 'Exported file conversion shortcut count mismatch.'
  Assert-Equal $listBackup.shortcuts[0].title 'Perplexity' 'Exported file conversion title mismatch.'

  Write-Host 'All edge sidebar migration tests passed.'
} finally {
  Remove-Item -LiteralPath $workDir -Recurse -Force -ErrorAction SilentlyContinue
}
