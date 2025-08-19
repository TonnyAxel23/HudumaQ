const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

// Store all connected clients
const clients = new Set();

wss.on('connection', (ws) => {
  console.log('New client connected');
  clients.add(ws);
  
  ws.on('message', (message) => {
    console.log('Received:', message);
    // Broadcast to all clients
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });
  
  ws.on('close', () => {
    console.log('Client disconnected');
    clients.delete(ws);
  });
});


console.log('WebSocket server running on ws://localhost:8080');
