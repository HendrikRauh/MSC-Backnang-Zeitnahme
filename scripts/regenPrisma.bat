@echo off
cd ..

call pm2 stop ecosystem.config.cjs
call npx prisma generate
call npx prisma migrate dev --name init

call pm2 restart ecosystem.config.cjs
exit