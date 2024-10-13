@echo off
setlocal enabledelayedexpansion

echo Starting installation...

echo #Installing Driver
start /wait "" "%~dp0PL23XX-M_LogoDriver_Setup_408_20220725.exe"

echo #Installing Node
msiexec /i "%~dp0node-v22.9.0-x64.msi" /qb

echo #Installing Packages
call npm install

echo #Installing PM2
call npm install -g pm2

echo #Linking PM2
call pm2 link uya5t4t5nmc2omi qauke1wfo0unsp0 ZEITNAHME

pause
