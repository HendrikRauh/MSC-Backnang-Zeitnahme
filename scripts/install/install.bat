@echo off
setlocal enabledelayedexpansion

echo Starting installation...

echo #Installing Driver
start /wait "" "%~dp0PL23XX-M_LogoDriver_Setup_4300_20240704.exe"

echo #Installing Node
msiexec /i "%~dp0node-v22.11.0-x64.msi" /qb

echo #Installing Packages
call npm install

echo #Installing PM2
call npm install -g pm2

echo #Linking PM2
call pm2 link uya5t4t5nmc2omi qauke1wfo0unsp0

echo #Install git
start /wait "" "%~dp0Git-2.47.0.2-64-bit.exe"

echo Bitte lasse nun das Script "UPDATE" laufen. Anschließend kann mit "EASYSTART" fortgefahren werden!
pause
