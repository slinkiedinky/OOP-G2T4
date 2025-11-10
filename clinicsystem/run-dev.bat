@echo off
REM clinicsystem\run-dev.bat — load .env (module or repo root) and start backend from clinicsystem folder
setlocal DISABLEDELAYEDEXPANSION

REM Prefer module-local .env, fall back to repo root ..\.env
if exist ".env" (
  set "ENVFILE=.env"
) else if exist "..\.env" (
  set "ENVFILE=..\.env"
) else (
  echo .env not found in module or repo root. Copy .env.sample to .env and fill values.
  echo Use: copy ..\.env.sample .env  OR edit clinicsystem\.env.sample
  pause
  exit /b 1
)

for /f "usebackq tokens=1* delims==" %%A in ("%ENVFILE%") do (
  if not "%%A"=="" (
    set "%%A=%%B"
  )
)

echo Loaded environment from %ENVFILE%

REM Run the Maven wrapper in this module
call .\mvnw.cmd -Dspring-boot.run.profiles=local spring-boot:run

endlocal
