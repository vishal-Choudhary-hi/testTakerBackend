const express = require("express");
const routes = require("./routes");
const cors = require("cors");
const bodyParser = require("body-parser");
const http = require("http");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));
app.use("/", routes);

// Create shared HTTP server
const server = http.createServer(app);

// ✅ Pass server to WebSocket initializer
require("./webScokets/MessageWebSocket")(server);

// Start server
server.listen(port, () => {
  console.log(`Server and WebSocket listening on port: ${port}`);
});
