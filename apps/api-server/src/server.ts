import http from "http";
import { buildApp } from "./app.js";
import { config } from "./lib/config.js";
import { initWs } from "./ws.js";

const app = buildApp();
const server = http.createServer(app);

initWs(server);

server.listen(config.PORT, () => {
  console.log(`API server listening on http://localhost:${config.PORT}`);
});
