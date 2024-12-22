@echo off
cd ..
call pm2 delete all
call pm2 start .\ecosystem.config.cjs
start http://localhost