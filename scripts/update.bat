@echo off
git stash save
git pull
git stash pop
Start regenPrisma.bat
npm i