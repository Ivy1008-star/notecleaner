@echo off
chcp 65001 >nul
title NoteCleaner 开发服务器
color 0A

echo ===================================
echo    NoteCleaner 本地开发服务器
echo ===================================
echo.
echo [1/3] 检查目录...
cd /d "%~dp0"
echo       当前目录: %CD%
echo.

echo [2/3] 检查依赖...
if not exist node_modules (
    echo [警告] node_modules 不存在
    echo.
    echo 正在尝试从 D 盘复制...
    if exist "D:\ObsidianVaults\codex 工作录\notecleaner-next\node_modules" (
        echo 找到 D 盘完整依赖，正在复制...
        xcopy "D:\ObsidianVaults\codex 工作录\notecleaner-next\node_modules" "node_modules\" /E /I /Q /Y >nul
        echo 复制完成！
    ) else (
        echo D 盘也没有找到完整依赖
        echo 请手动运行: npm install
        echo.
        pause
        exit /b
    )
)
echo [OK] 依赖已就绪
echo.

echo [3/3] 启动 Next.js 开发服务器...
echo.
echo ===================================
echo 服务器启动后，请访问:
echo http://localhost:3000
echo ===================================
echo.

call npx next dev

echo.
echo 服务器已停止运行
pause
