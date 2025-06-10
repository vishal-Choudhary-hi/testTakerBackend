const WebSocket = require('ws');
const { prisma } = require('../prisma/getPrismaClient');

const wss = new WebSocket.Server({ port: 8080 });
const clients = new Map();

wss.on('connection', (ws) => {
  let userId = null;

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      // First message should be registration: { type: "register", userId: "user1" }
      if (data.type === 'register') {
        userId = data.userId;
        clients.set(userId, ws);
        return;
      }

      // Message sending: { type: "message", to: "user2", content: "hello" }
      if (data.type === 'message' && data.to && data.content) {
        const target = clients.get(data.to);
        let chatData={
          test_id:parseInt(data.testId),
          sender_id:userId,
          receiver_id: parseInt(data.to),
          message: data.content,
        }
        prisma.testChats.create({
          data:chatData
        }).then(() => {
        }
        ).catch((err) => {
          console.error("Error saving message to database:", err);
        });
        if (target && target.readyState === WebSocket.OPEN) {
          target.send(JSON.stringify({
            from: userId,
            content: data.content,
          }));
        }
      }

    } catch (err) {
      console.error("Invalid message:", err);
    }
  });

  ws.on('close', () => {
    if (userId) clients.delete(userId);
  });
});