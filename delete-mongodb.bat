@echo off
chcp 65001 >nul
echo mongodb 폴더 삭제를 시도합니다...
echo.

taskkill /F /IM node.exe >nul 2>&1

if exist "%~dp0mongodb" (
    rmdir /s /q "%~dp0mongodb"
    if exist "%~dp0mongodb" (
        echo [실패] mongodb 폴더가 다른 프로그램에서 사용 중입니다.
        echo.
        echo 다음을 확인해 주세요:
        echo   1. Cursor를 완전히 종료 (작업 관리자에서 Cursor.exe 모두 종료)
        echo   2. 탐색기에서 mongodb 폴더가 열려 있지 않은지 확인
        echo   3. 이 배치 파일을 다시 실행
        pause
        exit /b 1
    )
    echo [완료] mongodb 폴더가 삭제되었습니다.
) else (
    echo mongodb 폴더가 이미 없습니다.
)

pause
