@echo off
chcp 65001 >nul
echo ===================================
echo NoteCleaner 本地开发服务器启动
echo ===================================
echo.

REM 杀死所有node进程（防止端口占用）
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

REM 检查是否安装了依赖
if not exist node_modules (
    echo node_modules 不存在！
    echo 请先运行: npm install
    echo.
    pause
    exit /b 1
)

echo 正在启动 Next.js 开发服务器...
echo.
echo ===================================
echo 服务器启动后请访问: http://localhost:3000
echo ===================================
echo.

REM 直接运行 Next.js
node node_modules\next\dist\bin\next.js dev

pause
