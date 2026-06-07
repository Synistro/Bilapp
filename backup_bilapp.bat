@echo off
:: ============================================================
:: backup_bilapp.bat
:: Crée un zip horodaté de Bilapp dans un dossier Backups/
:: Usage : double-clic ou appel depuis PowerShell
:: ============================================================

setlocal

set PROJECT=C:\Users\Julie\Documents\Perso\Projects\Bilapp
set BACKUP_DIR=C:\Users\Julie\Documents\Perso\Projects\Backups
set TIMESTAMP=%DATE:~6,4%%DATE:~3,2%%DATE:~0,2%_%TIME:~0,2%%TIME:~3,2%%TIME:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set ZIPNAME=bilapp_backup_%TIMESTAMP%.zip

if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

echo.
echo [Bilapp Backup] Source  : %PROJECT%
echo [Bilapp Backup] Archive : %BACKUP_DIR%\%ZIPNAME%
echo.

powershell -NoProfile -Command ^
  "Compress-Archive -Path '%PROJECT%\*' -DestinationPath '%BACKUP_DIR%\%ZIPNAME%' -Force"

if %ERRORLEVEL% == 0 (
  echo [OK] Backup cree : %ZIPNAME%
) else (
  echo [ERREUR] Echec de la compression. Code : %ERRORLEVEL%
  exit /b 1
)

:: Nettoyage : garde les 10 derniers backups, supprime les plus anciens
echo.
echo [Bilapp Backup] Nettoyage ^(conservation des 10 derniers^)...
powershell -NoProfile -Command ^
  "Get-ChildItem '%BACKUP_DIR%\bilapp_backup_*.zip' | Sort-Object LastWriteTime -Descending | Select-Object -Skip 10 | Remove-Item -Force"

echo [OK] Termine.
echo.
pause
endlocal
