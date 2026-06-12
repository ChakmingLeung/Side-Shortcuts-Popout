param(
  [Parameter(Position = 0)]
  [string]$InputPath,

  [Parameter(Position = 1)]
  [string]$OutputPath,

  [string]$EdgeProfilePath,

  [string]$ShortcutListOutputPath,

  [switch]$Desktop
)

$ErrorActionPreference = 'Stop'

if (-not $InputPath) {
  $InputPath = Join-Path $PSScriptRoot 'edge-sidebar-shortcuts.json'
}
if (-not $OutputPath) {
  $OutputPath = Join-Path $PSScriptRoot 'Side-Shortcuts-Popout-edge-sidebar-backup.json'
}

function Normalize-Url {
  param([string]$Raw)

  $value = ''
  if ($null -ne $Raw) {
    $value = $Raw.Trim()
  }
  if (-not $value) { return $null }
  if ($value -notmatch '^https?://') {
    $value = "https://$value"
  }

  try {
    $uri = [System.Uri]::new($value)
    if ($uri.Scheme -ne 'http' -and $uri.Scheme -ne 'https') { return $null }
    return $uri.AbsoluteUri
  } catch {
    return $null
  }
}

function New-StableShortcutId {
  param([string]$Url)

  $sha = [System.Security.Cryptography.SHA256]::Create()
  try {
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($Url.ToLowerInvariant())
    $hash = $sha.ComputeHash($bytes)
    $hex = -join ($hash | ForEach-Object { $_.ToString('x2') })
    return "edge-sidebar-$($hex.Substring(0, 16))"
  } finally {
    $sha.Dispose()
  }
}

function ConvertFrom-MarkdownShortcutList {
  param([string]$Text)

  $items = [System.Collections.Generic.List[object]]::new()
  foreach ($line in ($Text -split "`r?`n")) {
    $trimmed = $line.Trim()
    if (-not $trimmed) { continue }

    $title = $null
    $url = $null

    if ($trimmed -match '\[(?<title>[^\]]+)\]\((?<url>https?://[^)]+)\)') {
      $title = $Matches.title
      $url = $Matches.url
    } elseif ($trimmed -match '^\s*(?:[-*]|\d+[.)])\s*(?<title>.+?)\s*(?:--|\u2014|-)\s*(?<url>https?://\S+)\s*$') {
      $title = $Matches.title
      $url = $Matches.url
    } elseif ($trimmed -match '^\s*(?:[-*]|\d+[.)])?\s*(?<url>https?://\S+)\s*$') {
      $url = $Matches.url
      try {
        $title = ([System.Uri]::new($url)).Host
      } catch {
        $title = $url
      }
    }

    if ($title -and $url) {
      $items.Add([pscustomobject]@{
        title = $title.Trim()
        url = $url.Trim()
      })
    }
  }
  return $items
}

function Get-ObjectPropertyValue {
  param(
    [object]$Object,
    [string[]]$Names
  )

  if (-not ($Object -is [pscustomobject])) { return $null }
  foreach ($name in $Names) {
    $prop = $Object.PSObject.Properties[$name]
    if ($prop -and $null -ne $prop.Value) {
      $value = [string]$prop.Value
      if ($value.Trim()) { return $value.Trim() }
    }
  }
  return $null
}

function Get-EdgeSidebarOrder {
  param([object]$Preferences)

  $order = @{}
  $debug = $Preferences.browser.edge_sidebar_visibility_debug
  if ($debug -and $debug.order_list) {
    $index = 0
    foreach ($name in @($debug.order_list)) {
      $key = [string]$name
      if ($key -and -not $order.ContainsKey($key)) {
        $order[$key] = $index
      }
      $index++
    }
  }

  if ($debug -and $debug.order_raw_data) {
    foreach ($prop in $debug.order_raw_data.PSObject.Properties) {
      $name = Get-ObjectPropertyValue -Object $prop.Value -Names @('name', 'title')
      if ($name -and $order.ContainsKey($name) -and -not $order.ContainsKey($prop.Name)) {
        $order[$prop.Name] = $order[$name]
      }
    }
  }

  if ($Preferences.browser.edge_sidebar_visibility.order) {
    foreach ($prop in $Preferences.browser.edge_sidebar_visibility.order.PSObject.Properties) {
      if (-not $order.ContainsKey($prop.Name)) {
        $order[$prop.Name] = [int64]$prop.Value
      }
    }
  }

  return $order
}

function Find-EdgeSidebarShortcutObjects {
  param(
    [object]$Node,
    [string]$Path = ''
  )

  $items = [System.Collections.Generic.List[object]]::new()
  if ($null -eq $Node) { return $items }

  if ($Node -is [System.Collections.IEnumerable] -and -not ($Node -is [string]) -and -not ($Node -is [pscustomobject])) {
    $index = 0
    foreach ($child in $Node) {
      foreach ($item in Find-EdgeSidebarShortcutObjects -Node $child -Path "$Path[$index]") {
        $items.Add($item)
      }
      $index++
    }
    return $items
  }

  if (-not ($Node -is [pscustomobject])) { return $items }

  $url = Get-ObjectPropertyValue -Object $Node -Names @(
    'url',
    'app_url',
    'start_url',
    'launch_url',
    'target_url',
    'page_url',
    'home_url'
  )
  $title = Get-ObjectPropertyValue -Object $Node -Names @(
    'title',
    'name',
    'app_name',
    'display_name',
    'short_name'
  )

  if ($url -and $Path -match '(?i)(hub_app|sidebar|side_bar|app_tower)') {
    $sourceId = $null
    if ($Path -match '([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})') {
      $sourceId = $Matches[1]
    }
    $items.Add([pscustomobject]@{
      title = $title
      url = $url
      source = $Path
      sourceId = $sourceId
    })
  }

  foreach ($prop in $Node.PSObject.Properties) {
    $childPath = if ($Path) { "$Path.$($prop.Name)" } else { $prop.Name }
    foreach ($item in Find-EdgeSidebarShortcutObjects -Node $prop.Value -Path $childPath) {
      $items.Add($item)
    }
  }

  return $items
}

function Read-EdgeProfileShortcuts {
  param([string]$ProfilePath)

  if (-not $ProfilePath) {
    throw 'EdgeProfilePath is required.'
  }

  $preferencesPath = $ProfilePath
  if ((Test-Path -LiteralPath $ProfilePath -PathType Container)) {
    $preferencesPath = Join-Path $ProfilePath 'Preferences'
  }
  if (-not (Test-Path -LiteralPath $preferencesPath -PathType Leaf)) {
    throw "Edge Preferences file not found: $preferencesPath"
  }

  $preferences = Get-Content -LiteralPath $preferencesPath -Raw -Encoding UTF8 | ConvertFrom-Json
  $order = Get-EdgeSidebarOrder -Preferences $preferences
  $raw = @(Find-EdgeSidebarShortcutObjects -Node $preferences)
  $seen = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
  $items = [System.Collections.Generic.List[object]]::new()

  foreach ($item in $raw) {
    $url = Normalize-Url -Raw ([string]$item.url)
    if (-not $url) { continue }
    if (-not $seen.Add($url)) { continue }

    $title = ([string]$item.title).Trim()
    if (-not $title) {
      $title = ([System.Uri]::new($url)).Host
    }

    $sortKey = [int64]::MaxValue
    if ($item.sourceId -and $order.ContainsKey($item.sourceId)) {
      $sortKey = [int64]$order[$item.sourceId]
    } elseif ($order.ContainsKey($title)) {
      $sortKey = [int64]$order[$title]
    }

    $items.Add([pscustomobject]@{
      title = $title
      url = $url
      mobile = $true
      sortKey = $sortKey
      source = $item.source
    })
  }

  if ($items.Count -eq 0) {
    $debugNames = @()
    if ($preferences.browser.edge_sidebar_visibility_debug.order_list) {
      $debugNames = @($preferences.browser.edge_sidebar_visibility_debug.order_list)
    }
    if ($debugNames.Count -gt 0) {
      throw "Edge sidebar titles still exist in Preferences, but URL records were not found. Edge 149 may have already cleaned the App Tower URL data. Use a pre-cleanup Preferences backup or an exported URL list. Recovered titles: $($debugNames -join ', ')"
    }
    throw 'No Edge sidebar shortcut URLs were found in the Preferences file.'
  }

  return @($items | Sort-Object sortKey, title | ForEach-Object {
    [pscustomobject]@{
      title = $_.title
      url = $_.url
      mobile = $_.mobile
    }
  })
}

function Read-ShortcutInput {
  param([string]$Path)

  if (-not (Test-Path -LiteralPath $Path)) {
    throw "Input file not found: $Path"
  }

  $text = Get-Content -LiteralPath $Path -Raw -Encoding UTF8
  try {
    $data = $text | ConvertFrom-Json
    if ($data -is [array]) { return @($data) }
    if ($data.shortcuts -is [array]) { return @($data.shortcuts) }
    if ($data.url -and $data.title) { return @($data) }
    throw 'JSON input must be an array or an object with a shortcuts array.'
  } catch {
    $parsed = @(ConvertFrom-MarkdownShortcutList -Text $text)
    if ($parsed.Count -gt 0) { return $parsed }
    throw "Could not parse $Path as Side Shortcuts JSON or a Markdown URL list."
  }
}

if ($EdgeProfilePath -and $PSBoundParameters.ContainsKey('InputPath')) {
  throw 'Use either -EdgeProfilePath or -InputPath, not both.'
}

$rawItems = @()
if ($EdgeProfilePath) {
  $rawItems = @(Read-EdgeProfileShortcuts -ProfilePath $EdgeProfilePath)
} else {
  $rawItems = @(Read-ShortcutInput -Path $InputPath)
}
$shortcuts = [System.Collections.Generic.List[object]]::new()
$seen = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)

foreach ($item in $rawItems) {
  $url = Normalize-Url -Raw ([string]$item.url)
  if (-not $url) { continue }
  if (-not $seen.Add($url)) { continue }

  $title = ([string]$item.title).Trim()
  if (-not $title) {
    $title = ([System.Uri]::new($url)).Host
  }
  if ($title.Length -gt 40) {
    $title = $title.Substring(0, 40)
  }

  $mobile = $true
  if ($Desktop) {
    $mobile = $false
  } elseif ($null -ne $item.mobile) {
    $mobile = [bool]$item.mobile
  }

  $id = if ([string]$item.id) { ([string]$item.id).Trim() } else { New-StableShortcutId -Url $url }
  $shortcuts.Add([ordered]@{
    id = $id
    title = $title
    url = $url
    mobile = $mobile
  })
}

if ($shortcuts.Count -eq 0) {
  throw 'No valid http(s) shortcuts were found.'
}

if ($ShortcutListOutputPath) {
  $shortcutListDir = Split-Path -Parent $ShortcutListOutputPath
  if ($shortcutListDir) {
    New-Item -ItemType Directory -Force -Path $shortcutListDir | Out-Null
  }
  @($shortcuts | ForEach-Object {
    [ordered]@{
      title = $_.title
      url = $_.url
      mobile = $_.mobile
    }
  }) | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $ShortcutListOutputPath -Encoding UTF8
  Write-Host "Wrote shortcut link list to $ShortcutListOutputPath"
}

$payload = [ordered]@{
  version = 1
  exportedAt = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ss.fffZ')
  app = 'side-shortcuts-popout'
  source = 'edge-sidebar-migrate'
  shortcuts = $shortcuts
  settings = $null
}

$outputDir = Split-Path -Parent $OutputPath
if ($outputDir) {
  New-Item -ItemType Directory -Force -Path $outputDir | Out-Null
}

$payload | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $OutputPath -Encoding UTF8
Write-Host "Wrote $($shortcuts.Count) shortcut(s) to $OutputPath"
Write-Host 'Import it from Side Shortcuts Popout Options -> Import -> Merge.'
