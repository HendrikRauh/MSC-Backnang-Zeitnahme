@echo off
git stash save
git pull
git stash pop
tsc -b
Start regenPrisma.bat
npm i