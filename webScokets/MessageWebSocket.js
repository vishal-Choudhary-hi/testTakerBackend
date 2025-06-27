const WebSocket = require("ws");
const { prisma } = require("../prisma/getPrismaClient");

module.exports = (server) => {
  const wss = new WebSocket.Server({ server }); // ✅ Use the shared server
  const clients = new Map();

  wss.on("connection", (ws) => {
    let userId = null;

    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message);

        if (data.type === "register") {
          userId = data.userId;
          clients.set(userId, ws);
          return;
        }

        if (data.type === "message" && data.to && data.content) {
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
            target.send(JSON.stringify({ from: userId, content: data.content }));
          }
        }
      } catch (err) {
        console.error("Invalid message:", err);
      }
    });

    ws.on("close", () => {
      if (userId) clients.delete(userId);
    });
  });

  console.log("WebSocket server initialized.");
};
