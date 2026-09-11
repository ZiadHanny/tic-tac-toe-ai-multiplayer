import { createServer } from "node:http";
import cors from "cors";
import express from "express";
import { Server } from "socket.io";
import type { ClientToServerEvents, Player, RoomSnapshot, ServerToClientEvents } from "@ttt/game-core";
import { RoomStore, type Room } from "./rooms.js";

const PORT = Number(process.env.PORT ?? 4000);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? "*";

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN }));
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: CLIENT_ORIGIN },
});

const store = new RoomStore();

function emitRoomState(room: Room) {
  for (const symbol of ["X", "O"] as Player[]) {
    const seat = room.seats[symbol];
    if (seat?.socketId) {
      const snapshot: RoomSnapshot = store.getSnapshot(room, symbol);
      io.to(seat.socketId).emit("room:state", snapshot);
    }
  }
}

function otherSymbol(symbol: Player): Player {
  return symbol === "X" ? "O" : "X";
}

io.on("connection", (socket) => {
  socket.on("room:create", ({ token }, ack) => {
    const { room, symbol } = store.createRoom(token, socket.id);
    socket.join(room.id);
    ack(store.getSnapshot(room, symbol));
  });

  socket.on("room:join", ({ roomId, token }, ack) => {
    const result = store.joinRoom(roomId.toUpperCase(), token, socket.id);
    if (!result.ok) {
      ack({ error: result.error });
      return;
    }

    const { room, symbol, reconnected } = result.value;
    socket.join(room.id);
    ack(store.getSnapshot(room, symbol));

    const opponentSeat = room.seats[otherSymbol(symbol)];
    if (opponentSeat?.socketId) {
      io.to(opponentSeat.socketId).emit(reconnected ? "room:opponent-reconnected" : "room:opponent-joined");
    }
    emitRoomState(room);
  });

  socket.on("room:leave", ({ roomId, token }) => {
    const result = store.leaveRoom(roomId, token);
    if (!result.ok) return;

    const room = store.getRoom(roomId);
    if (room) {
      const opponentSeat = room.seats[otherSymbol(result.value.symbol)];
      if (opponentSeat?.socketId) {
        io.to(opponentSeat.socketId).emit("room:opponent-left");
      }
    }
    socket.leave(roomId);
  });

  socket.on("game:move", ({ roomId, token, index }) => {
    const result = store.makeMove(roomId, token, index);
    if (!result.ok) {
      socket.emit("error", { message: result.error });
      return;
    }
    emitRoomState(result.value.room);
  });

  socket.on("game:rematch", ({ roomId, token }) => {
    const result = store.requestRematch(roomId, token);
    if (!result.ok) {
      socket.emit("error", { message: result.error });
      return;
    }

    const { room, symbol, bothReady } = result.value;
    if (bothReady) {
      emitRoomState(room);
    } else {
      const opponentSeat = room.seats[otherSymbol(symbol)];
      if (opponentSeat?.socketId) {
        io.to(opponentSeat.socketId).emit("game:rematch-requested", { by: symbol });
      }
    }
  });

  socket.on("disconnect", () => {
    const disconnected = store.disconnectSocket(socket.id);
    if (!disconnected) return;

    const room = store.getRoom(disconnected.roomId);
    const opponentSeat = room?.seats[otherSymbol(disconnected.symbol)];
    if (opponentSeat?.socketId) {
      io.to(opponentSeat.socketId).emit("room:opponent-disconnected");
    }
  });
});

setInterval(() => store.sweepStaleRooms(), 5 * 60 * 1000);

httpServer.listen(PORT, () => {
  console.log(`Tic-Tac-Toe socket server listening on port ${PORT}`);
});
