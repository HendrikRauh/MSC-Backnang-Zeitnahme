@echo off
call pm2 delete all
call pm2 start .\ecosystem.config.cjs
start msedge.exe --kiosk localhost/display --edge-kiosk-type=fullscreen
start http://localhost