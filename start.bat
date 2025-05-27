@echo off
echo Installing dependencies...
call npm install

echo Deploying commands...
call node deploy-commands.js

echo Starting bot...
call node index.js

pause
