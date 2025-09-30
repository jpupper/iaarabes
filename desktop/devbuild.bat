@echo off
setlocal ENABLEEXTENSIONS
pushd "%~dp0"

REM Build Tauri installer (MSI and app)
cargo tauri build

set ERR=%ERRORLEVEL%
popd
exit /b %ERR%
