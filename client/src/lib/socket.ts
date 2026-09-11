import { io, type Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "@ttt/game-core";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4000";

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

/** One shared socket connection per browser tab, created lazily on first use. */
export function getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> {
  if (!socket) {
    socket = io(SOCKET_URL, { autoConnect: true, reconnectionAttempts: Infinity });
  }
  return socket;
}
