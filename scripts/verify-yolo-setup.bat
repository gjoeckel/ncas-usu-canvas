@echo off
REM Cross-platform YOLO verification script
REM Detects OS and runs appropriate verification script

echo YOLO Setup Verification (Cross-Platform)
echo ========================================

REM Get script directory
set SCRIPT_DIR=%~dp0
set CURSOR_GLOBAL_DIR=%SCRIPT_DIR%..
set CONFIG_DIR=%CURSOR_GLOBAL_DIR%\config

REM Check if we're on Windows
if "%OS%"=="Windows_NT" (
    echo Running Windows PowerShell verification...
    powershell -ExecutionPolicy Bypass -File "%SCRIPT_DIR%verify-yolo-setup.ps1"
    if %ERRORLEVEL% equ 0 (
        echo YOLO verification completed successfully!
        exit /b 0
    ) else (
        echo YOLO verification failed!
        exit /b 1
    )
) else (
    echo Running Unix bash verification...
    bash "%SCRIPT_DIR%verify-yolo-setup.sh"
    if %ERRORLEVEL% equ 0 (
        echo YOLO verification completed successfully!
        exit /b 0
    ) else (
        echo YOLO verification failed!
        exit /b 1
    )
)
