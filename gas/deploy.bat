@echo off
REM AI Quiz - one click GAS deploy
REM push code to HEAD, then update the SAME deployment (URL stays the same)

cd /d "%~dp0"

echo [1/2] clasp push -f ...
call clasp push -f
if errorlevel 1 (
  echo.
  echo ERROR: push failed. Run "clasp login" first, and check scriptId in .clasp.json
  pause
  exit /b 1
)

echo.
echo [2/2] clasp deploy ...
call clasp deploy -i AKfycbzghI6ju_IQJDa8BKUTisfk3syoX_fdzxkivY40S0YcRiQar3iEgxZrZ-_hlwgt5vnssA
if errorlevel 1 (
  echo.
  echo ERROR: deploy failed. Run "clasp deployments" to list valid deployment IDs.
  pause
  exit /b 1
)

echo.
echo DONE. Deployment updated, URL unchanged.
pause
