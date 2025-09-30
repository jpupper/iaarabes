@echo off
setlocal ENABLEEXTENSIONS
pushd "%~dp0"

REM Run Tauri app in dev (window) mode
cargo tauri dev

set ERR=%ERRORLEVEL%
popd
exit /b %ERR%
