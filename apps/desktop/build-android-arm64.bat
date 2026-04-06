@echo off
setlocal

REM Build Android APK (arm64-v8a) with temporary env only.

set "PROJECT_DIR=%~dp0"
set "ANDROID_SDK_ROOT=C:\Users\50414\AppData\Local\Android\Sdk"
set "ANDROID_HOME=%ANDROID_SDK_ROOT%"

set "JAVA_HOME=C:\Program Files\Java\jdk-22"
if not exist "%JAVA_HOME%\bin\java.exe" (
  set "JAVA_HOME=C:\Program Files\Java\jdk-17"
)

if not exist "%JAVA_HOME%\bin\java.exe" (
  echo [ERROR] Java not found. Please install JDK 22 or JDK 17.
  exit /b 1
)

if not exist "%ANDROID_SDK_ROOT%" (
  echo [ERROR] Android SDK not found: %ANDROID_SDK_ROOT%
  exit /b 1
)

set "PATH=%JAVA_HOME%\bin;%ANDROID_SDK_ROOT%\platform-tools;%ANDROID_SDK_ROOT%\cmdline-tools\latest\bin;%PATH%"

REM Do not set org.gradle.java.home here because JAVA_HOME may contain spaces
REM (e.g. C:\Program Files\Java\jdk-22), which can break Java arg parsing on Windows.

echo [INFO] JAVA_HOME=%JAVA_HOME%
echo [INFO] ANDROID_SDK_ROOT=%ANDROID_SDK_ROOT%

cd /d "%PROJECT_DIR%"
call npm run android:build
set "BUILD_EXIT=%ERRORLEVEL%"

if not "%BUILD_EXIT%"=="0" (
  echo [ERROR] Android build failed with code %BUILD_EXIT%.
  exit /b %BUILD_EXIT%
)

echo [OK] Android build completed.
exit /b 0
