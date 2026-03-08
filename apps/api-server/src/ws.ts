import { WebSocketServer } from "ws";
import type { Server as HttpServer } from "http";

let wss: WebSocketServer | null = null;

export function initWs(server: HttpServer) {
  wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (socket) => {
    socket.send(
      JSON.stringify({
        type: "system.connected",
        timestamp: new Date().toISOString()
      })
    );
  });
}

export function broadcast(event: string, payload: unknown) {
  if (!wss) return;

  const data = JSON.stringify({
    event,
    payload,
    timestamp: new Date().toISOString()
  });

  for (const client of wss.clients) {
    if (client.readyState === client.OPEN) {
      client.send(data);
    }
  }
}
