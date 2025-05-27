#!/bin/bash
# Install dependencies
npm install

# Deploy commands
node deploy-commands.js

# Start the bot
node index.js
