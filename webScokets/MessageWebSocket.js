const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const { prisma } = require('../prisma/getPrismaClient');

const app = express();
app.use(cors());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server }); // ✅ Attach WS to HTTP server

const clients = new Map();

wss.on('connection', (ws) => {
  let userId = null;

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log("Received:", data);

      if (data.type === 'register') {
        userId = data.userId;
        clients.set(userId, ws);
        console.log("User registered:", userId);
        return;
      }

      if (data.type === 'message' && data.to && data.content) {
        const target = clients.get(data.to);
        const chatData = {
          test_id: parseInt(data.testId),
          sender_id: parseInt(userId),
          receiver_id: parseInt(data.to),
          message: data.content,
        };

        prisma.testChats.create({ data: chatData }).catch((err) =>
          console.error("DB Error:", err)
        );

        if (target && target.readyState === WebSocket.OPEN) {
          target.send(
            JSON.stringify({ from: userId, content: data.content })
          );
        }
      }
    } catch (err) {
      console.error("Message parse error:", err);
    }
  });

  ws.on('close', () => {
    if (userId) clients.delete(userId);
  });
});

// ✅ This will work on platforms like Render, Railway, etc.
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server with WebSocket listening on port ${PORT}`);
});
