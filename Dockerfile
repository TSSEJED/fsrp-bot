# Use Node.js 18 LTS
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy app source
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD [ "node", "index.js" ]
