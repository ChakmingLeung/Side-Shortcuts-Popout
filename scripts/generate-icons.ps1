param(
  [string]$Source = (Join-Path $PSScriptRoot "..\icons\source.png")
)

$dir = Join-Path $PSScriptRoot "..\icons"
New-Item -ItemType Directory -Force -Path $dir | Out-Null

if (-not (Test-Path $Source)) {
  Write-Error "Source image not found: $Source"
  exit 1
}

Add-Type -AssemblyName System.Drawing

$src = [System.Drawing.Image]::FromFile((Resolve-Path $Source))
try {
  foreach ($size in @(16, 48, 128)) {
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.DrawImage($src, 0, 0, $size, $size)
    $g.Dispose()
    $path = Join-Path $dir "icon$size.png"
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Wrote $path"
  }
} finally {
  $src.Dispose()
}

Write-Host "Icons written to $dir"
