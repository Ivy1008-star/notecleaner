@echo off
cd /d %~dp0
title NoteCleaner
color 0B
echo 正在启动 NoteCleaner...
echo 请访问: http://localhost:3000
echo.
node node_modules\next\dist\bin\next dev
pause
