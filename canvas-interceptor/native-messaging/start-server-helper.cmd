@echo off
REM Native Messaging Host helper: reads a single JSON message and attempts to start the server.
REM This is a very lightweight stub; real native messaging should parse stdin length+payload.

setlocal ENABLEDELAYEDEXPANSION
REM Attempt to start the dev server in background (Git Bash recommended)
start "Canvas Dev Interceptor" "%USERPROFILE%\AppData\Local\Programs\Git\bin\bash.exe" -lc "cd ~/cursor-global/canvas-interceptor && npm start"

REM Write a minimal response to stdout (length-prefixed JSON would be proper; Chrome may require it)
echo {"ok":true}
endlocal


