# Use Node.js 18 Alpine for smaller image size
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install system dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production --no-audit --prefer-offline

# Copy app source
COPY . .

# Set environment to production
ENV NODE_ENV=production

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD [ "node", "index.js" ]
