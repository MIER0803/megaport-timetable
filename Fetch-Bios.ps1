# Requires PowerShell 5+
$ErrorActionPreference = 'Stop'
$ids = @{
  'a1' = 16288
  'a2' = 15529
  'a3' = 15514
  'a4' = 17067
  'a5' = 15520
  'a6' = 17405
  'b1' = 15523
  'b2' = 15526
  'b4' = 15685
}

function Strip-Html([string]$raw) {
  $t = $raw -replace '(?s)<script[^>]*>.*?</script>', ' '
  $t = $t -replace '(?s)<style[^>]*>.*?</style>', ' '
  $t = $t -replace '(?i)<br\s*/?>', "`n"
  $t = $t -replace '</p>', "`n"
  $t = $t -replace '<[^>]+>', ' '
  $t = [System.Net.WebUtility]::HtmlDecode($t)
  $t = $t -replace '[ \t]+', ' '
  $t = $t -replace "(`r`n|`n|`r)+", "`n"
  return $t.Trim()
}

function Extract-Bio([string]$html) {
  $matches = [regex]::Matches($html, '(?s)class=''avia_textblock''[^>]*>\s*<p[^>]*>(.*?)</p>')
  $parts = @()
  foreach ($m in $matches) {
    $t = Strip-Html $m.Groups[1].Value
    if ($t.Length -gt 25 -and $t -notmatch 'T-lineup' -and $t -notmatch 'width=') {
      $parts += $t
    }
  }
  if ($parts.Count -gt 0) {
    return ($parts[0..([Math]::Min(2, $parts.Count - 1))] -join "`n`n")
  }
  $full = Strip-Html $html
  return ($full.Substring(0, [Math]::Min(1000, $full.Length)))
}

$out = @{}
foreach ($e in $ids.GetEnumerator()) {
  $key = $e.Key
  $postId = $e.Value
  $url = "https://megaportfest.com/wp-json/wp/v2/portfolio/$postId"
  $resp = Invoke-RestMethod -Uri $url -Method Get
  $title = $resp.title.rendered
  $link = $resp.link
  $bio = Extract-Bio $resp.content.rendered
  $out[$key] = @{
    title = $title
    link  = $link
    bio   = $bio
  }
}

$out | ConvertTo-Json -Depth 5 -Compress:$false | Set-Content -Path "$PSScriptRoot\_bios_extracted.json" -Encoding UTF8
Write-Host "Wrote _bios_extracted.json"
