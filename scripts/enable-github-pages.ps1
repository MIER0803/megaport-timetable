# 用 GitHub API 將倉庫設為「GitHub Actions」建置 Pages（免手動點 Settings）
# Token：Personal Access Token (classic)，勾選 repo
#
#   $env:GITHUB_TOKEN = "ghp_xxx"
#   .\scripts\enable-github-pages.ps1
#
param(
  [string] $Owner = "MIER0803",
  [string] $Repo = "megaport-timetable"
)

$ErrorActionPreference = "Stop"

if (-not $env:GITHUB_TOKEN) {
  Write-Host "請設定: `$env:GITHUB_TOKEN = 'ghp_你的Token' （classic，勾選 repo）" -ForegroundColor Yellow
  exit 1
}

$headers = @{
  Authorization          = "Bearer $($env:GITHUB_TOKEN)"
  Accept                 = "application/vnd.github+json"
  "X-GitHub-Api-Version" = "2022-11-28"
  "User-Agent"           = "megaport-enable-pages"
}

$base = "https://api.github.com/repos/$Owner/$Repo/pages"

try {
  $existing = Invoke-RestMethod -Uri $base -Headers $headers -Method Get
  Write-Host "已有 Pages 設定，build_type=$($existing.build_type)"
  if ($existing.build_type -ne "workflow") {
    Write-Host "改為 workflow（GitHub Actions）..."
    Invoke-RestMethod -Uri $base -Method Put -Headers $headers -ContentType "application/json" -Body (@{
      build_type = "workflow"
    } | ConvertTo-Json -Compress) | Out-Null
    Write-Host "已更新。"
  }
  else {
    Write-Host "已是 GitHub Actions 建置，無需變更。"
  }
}
catch {
  $resp = $_.Exception.Response
  if (-not $resp -or [int]$resp.StatusCode -ne 404) {
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.ErrorDetails.Message) { Write-Host $_.ErrorDetails.Message }
    throw
  }
  Write-Host "尚未啟用 Pages，正在建立（build_type=workflow）..."
  Invoke-RestMethod -Uri $base -Method Post -Headers $headers -ContentType "application/json" -Body (@{
    build_type = "workflow"
  } | ConvertTo-Json -Compress) | Out-Null
  Write-Host "已建立。"
}

Write-Host ""
Write-Host "請到 Actions 確認「Deploy GitHub Pages」；必要時 Re-run workflow。" -ForegroundColor Green
Write-Host "網站（成功後）： https://$($Owner.ToLower()).github.io/$Repo/" -ForegroundColor Green
