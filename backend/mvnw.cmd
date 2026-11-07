@echo off
rem Minimal Maven Wrapper for Windows: on first use, downloads the Maven version named in
rem .mvn\wrapper\maven-wrapper.properties into %USERPROFILE%\.m2\wrapper\dists, then runs it.
setlocal
set "BASEDIR=%~dp0"
for /f "usebackq tokens=1,* delims==" %%a in ("%BASEDIR%.mvn\wrapper\maven-wrapper.properties") do if "%%a"=="distributionUrl" set "URL=%%b"
for %%f in ("%URL%") do set "ZIP=%%~nf"
set "NAME=%ZIP:-bin=%"
if "%MAVEN_USER_HOME%"=="" set "MAVEN_USER_HOME=%USERPROFILE%\.m2"
set "DIST=%MAVEN_USER_HOME%\wrapper\dists\%NAME%"
if not exist "%DIST%\bin\mvn.cmd" (
  echo Downloading %URL%
  powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; $t=Join-Path $env:TEMP ('mvnw-'+[guid]::NewGuid()); New-Item -ItemType Directory $t | Out-Null; Invoke-WebRequest -UseBasicParsing -Uri '%URL%' -OutFile (Join-Path $t 'maven.zip'); Expand-Archive (Join-Path $t 'maven.zip') $t; New-Item -ItemType Directory -Force (Split-Path '%DIST%') | Out-Null; Move-Item (Join-Path $t '%NAME%') '%DIST%'"
  if errorlevel 1 exit /b 1
)
"%DIST%\bin\mvn.cmd" %*
