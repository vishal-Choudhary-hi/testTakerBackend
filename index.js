const express = require("express");
const routes = require("./routes")
const cors = require("cors");
const bodyParser = require("body-parser");

require('dotenv').config();
const app = express();
const port = process.env.PORT;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));
app.use('/', routes);
// require('./cronProcess/Producer'); // Start the cron job producer
// require('./cronProcess/worker'); // Start the cron job worker
require('./webScokets/MessageWebSocket'); // Start the WebSocket server

app.listen(port, () => {
    console.log(`Server listening on port: ${port}`);
})