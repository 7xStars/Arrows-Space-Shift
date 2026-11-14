@echo off
setlocal
cd /d "%~dp0"
where py >nul 2>nul
if %ERRORLEVEL% EQU 0 goto py_launcher
where python >nul 2>nul
if %ERRORLEVEL% EQU 0 goto python_exe
where node >nul 2>nul
if %ERRORLEVEL% EQU 0 goto node_exe
echo Please install Python or Node.js to play the browser build locally.
echo You can also upload the PLAY ZIP directly to itch.io as an HTML game.
pause
exit /b 1
:py_launcher
py -3 "tools\launch-local.py"
exit /b %ERRORLEVEL%
:python_exe
python "tools\launch-local.py"
exit /b %ERRORLEVEL%
:node_exe
node "tools\local-server.mjs" --open
exit /b %ERRORLEVEL%
