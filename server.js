const http = require('http');

// Create a simple HTTP server for Railway's health checks
const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Bot is running!');
});

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

server.listen(PORT, HOST, () => {
    console.log(`✅ Keep-alive server running on http://${HOST}:${PORT}`);
});

// Handle server errors
server.on('error', (error) => {
    console.error('Server error:', error);
});
