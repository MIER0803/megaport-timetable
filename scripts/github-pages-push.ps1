# Usage (PowerShell, project root):
#   $env:GITHUB_TOKEN = "ghp_your_token"
#   .\scripts\github-pages-push.ps1
#
# Token: GitHub - Settings - Developer settings - Personal access tokens - repo scope
#
param(
  [string] $RepoName = "megaport-timetable"
)

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot)

if (-not $env:GITHUB_TOKEN) {
  Write-Host "Please set GITHUB_TOKEN, e.g.:" -ForegroundColor Yellow
  Write-Host '  $env:GITHUB_TOKEN = "ghp_xxxxxxxx"' -ForegroundColor Cyan
  Write-Host ""
  Write-Host "Or manual:" -ForegroundColor Yellow
  Write-Host "  1. Open https://github.com/new?name=$RepoName (name=$RepoName, no README)"
  Write-Host "  2. Then: git push -u origin main"
  exit 1
}

$headers = @{
  Authorization = "Bearer $($env:GITHUB_TOKEN)"
  Accept          = "application/vnd.github+json"
  "User-Agent"    = "megaport-timetable-push"
}

$user = (Invoke-RestMethod -Uri "https://api.github.com/user" -Headers $headers).login
Write-Host "GitHub user: $user"

$exists = $false
try {
  Invoke-RestMethod -Uri "https://api.github.com/repos/$user/$RepoName" -Headers $headers | Out-Null
  $exists = $true
}
catch {
  $resp = $_.Exception.Response
  if ($resp -and [int]$resp.StatusCode -eq 404) {
    $exists = $false
  }
  else {
    throw
  }
}

if (-not $exists) {
  Write-Host "Creating repo $user/$RepoName ..."
  $body = @{ name = $RepoName; private = $false; auto_init = $false } | ConvertTo-Json
  Invoke-RestMethod -Uri "https://api.github.com/user/repos" -Method Post -Headers $headers -Body $body -ContentType "application/json" | Out-Null
  Write-Host "Created."
}
else {
  Write-Host "Repo already exists, skip create."
}

$url = "https://github.com/$user/$RepoName.git"
$null = git remote get-url origin 2>&1
if ($LASTEXITCODE -eq 0) {
  git remote set-url origin $url
}
else {
  git remote add origin $url
}

Write-Host "Pushing to $url ..."
git push -u origin main
Write-Host ""
Write-Host "Done. Repo - Settings - Pages - Source: GitHub Actions" -ForegroundColor Green
Write-Host "Site (after workflow): https://$user.github.io/$RepoName/" -ForegroundColor Green
