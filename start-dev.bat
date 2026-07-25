@echo off
echo ===================================
echo NoteCleaner 本地启动
echo ===================================
echo.

REM 检查node_modules是否存在
if not exist "node_modules" (
    echo node_modules 不存在，正在安装依赖...
    echo 这可能需要几分钟时间...
    echo.
    call npm install
)

echo.
echo 启动 Next.js 开发服务器...
echo 访问: http://localhost:3000
echo ===================================
echo.
call npx next dev

pause
