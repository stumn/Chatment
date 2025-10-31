# backup-database.ps1
# データベースバックアップスクリプト（PowerShell版）

param(
    [string]$mongoUri = $env:MONGODB_URL,
    [string]$outputDir = ".\backup"
)

# デフォルト値設定
if ([string]::IsNullOrEmpty($mongoUri)) {
    $mongoUri = "mongodb://127.0.0.1:27017/chatment"
}

# タイムスタンプ生成
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupPath = Join-Path $outputDir $timestamp

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "   Chatment データベースバックアップ" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "接続先: $mongoUri" -ForegroundColor Yellow
Write-Host "出力先: $backupPath" -ForegroundColor Yellow
Write-Host ""

# 出力ディレクトリ作成
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

# mongodumpコマンド実行
Write-Host "バックアップ開始..." -ForegroundColor Green
try {
    & mongodump --uri="$mongoUri" --out="$backupPath"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ バックアップ成功！" -ForegroundColor Green
        Write-Host "保存場所: $backupPath" -ForegroundColor Green
        
        # バックアップサイズを表示
        $size = (Get-ChildItem -Path $backupPath -Recurse | Measure-Object -Property Length -Sum).Sum
        $sizeKB = [math]::Round($size / 1KB, 2)
        $sizeMB = [math]::Round($size / 1MB, 2)
        
        if ($sizeMB -gt 1) {
            Write-Host "サイズ: $sizeMB MB" -ForegroundColor Cyan
        } else {
            Write-Host "サイズ: $sizeKB KB" -ForegroundColor Cyan
        }
        
        # 復元コマンドを表示
        Write-Host ""
        Write-Host "復元コマンド:" -ForegroundColor Yellow
        Write-Host "  mongorestore --uri=`"$mongoUri`" --drop `"$backupPath`"" -ForegroundColor Gray
    } else {
        throw "mongodumpが失敗しました"
    }
} catch {
    Write-Host ""
    Write-Host "❌ バックアップ失敗" -ForegroundColor Red
    Write-Host "エラー: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
