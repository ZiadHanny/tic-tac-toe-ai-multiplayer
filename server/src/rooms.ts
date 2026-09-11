import { customAlphabet } from "nanoid";
import {
  applyMove,
  checkWinner,
  createEmptyBoard,
  isDraw,
  otherPlayer,
} from "@ttt/game-core";
import type { Board, GameStateMessage, Player, RoomSnapshot } from "@ttt/game-core";

// No 0/O/1/I so a spoken-aloud or handwritten room code is never ambiguous.
const generateRoomId = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 5);

const ROOM_TTL_MS = 30 * 60 * 1000;

interface Seat {
  token: string;
  symbol: Player;
  socketId: string | null;
  connected: boolean;
}

export interface Room {
  id: string;
  board: Board;
  currentPlayer: Player;
  startingPlayer: Player;
  seats: Partial<Record<Player, Seat>>;
  rematchVotes: Set<Player>;
  updatedAt: number;
}

export type RoomResult<T> = { ok: true; value: T } | { ok: false; error: string };

export class RoomStore {
  private rooms = new Map<string, Room>();

  createRoom(token: string, socketId: string): { room: Room; symbol: Player } {
    let id = generateRoomId();
    while (this.rooms.has(id)) id = generateRoomId();

    const room: Room = {
      id,
      board: createEmptyBoard(),
      currentPlayer: "X",
      startingPlayer: "X",
      seats: { X: { token, symbol: "X", socketId, connected: true } },
      rematchVotes: new Set(),
      updatedAt: Date.now(),
    };
    this.rooms.set(id, room);
    return { room, symbol: "X" };
  }

  /** Returns whether this join was a reconnect to an existing seat vs. a brand new player. */
  joinRoom(
    roomId: string,
    token: string,
    socketId: string,
  ): RoomResult<{ room: Room; symbol: Player; reconnected: boolean }> {
    const room = this.rooms.get(roomId);
    if (!room) return { ok: false, error: "Room not found." };

    const existing = this.findSeat(room, token);
    if (existing) {
      existing.socketId = socketId;
      existing.connected = true;
      room.updatedAt = Date.now();
      return { ok: true, value: { room, symbol: existing.symbol, reconnected: true } };
    }

    const takenSymbols = Object.keys(room.seats) as Player[];
    if (takenSymbols.length >= 2) {
      return { ok: false, error: "This room is full." };
    }

    const symbol: Player = takenSymbols.includes("X") ? "O" : "X";
    room.seats[symbol] = { token, symbol, socketId, connected: true };
    room.updatedAt = Date.now();
    return { ok: true, value: { room, symbol, reconnected: false } };
  }

  leaveRoom(roomId: string, token: string): RoomResult<{ symbol: Player; roomDeleted: boolean }> {
    const room = this.rooms.get(roomId);
    if (!room) return { ok: false, error: "Room not found." };

    const seat = this.findSeat(room, token);
    if (!seat) return { ok: false, error: "You are not part of this room." };

    delete room.seats[seat.symbol];
    room.updatedAt = Date.now();

    const roomDeleted = !room.seats.X && !room.seats.O;
    if (roomDeleted) this.rooms.delete(roomId);

    return { ok: true, value: { symbol: seat.symbol, roomDeleted } };
  }

  makeMove(roomId: string, token: string, index: number): RoomResult<{ room: Room }> {
    const room = this.rooms.get(roomId);
    if (!room) return { ok: false, error: "Room not found." };

    const seat = this.findSeat(room, token);
    if (!seat) return { ok: false, error: "You are not part of this room." };
    if (seat.symbol !== room.currentPlayer) return { ok: false, error: "It's not your turn." };
    if (checkWinner(room.board) || isDraw(room.board)) {
      return { ok: false, error: "The game is already over." };
    }
    if (index < 0 || index > 8 || room.board[index] !== null) {
      return { ok: false, error: "That cell can't be played." };
    }

    room.board = applyMove(room.board, index, seat.symbol);
    room.currentPlayer = otherPlayer(seat.symbol);
    room.rematchVotes.clear();
    room.updatedAt = Date.now();

    return { ok: true, value: { room } };
  }

  requestRematch(roomId: string, token: string): RoomResult<{ room: Room; symbol: Player; bothReady: boolean }> {
    const room = this.rooms.get(roomId);
    if (!room) return { ok: false, error: "Room not found." };

    const seat = this.findSeat(room, token);
    if (!seat) return { ok: false, error: "You are not part of this room." };

    room.rematchVotes.add(seat.symbol);
    const bothReady = room.rematchVotes.size >= 2 && !!room.seats.X && !!room.seats.O;

    if (bothReady) {
      room.board = createEmptyBoard();
      room.startingPlayer = otherPlayer(room.startingPlayer);
      room.currentPlayer = room.startingPlayer;
      room.rematchVotes.clear();
    }
    room.updatedAt = Date.now();

    return { ok: true, value: { room, symbol: seat.symbol, bothReady } };
  }

  /** Marks whichever seat holds this socket as disconnected (kept for a possible reconnect). */
  disconnectSocket(socketId: string): { roomId: string; symbol: Player } | null {
    for (const room of this.rooms.values()) {
      for (const symbol of ["X", "O"] as Player[]) {
        const seat = room.seats[symbol];
        if (seat?.socketId === socketId) {
          seat.connected = false;
          seat.socketId = null;
          room.updatedAt = Date.now();
          return { roomId: room.id, symbol };
        }
      }
    }
    return null;
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  getSnapshot(room: Room, you: Player): RoomSnapshot {
    const result = checkWinner(room.board);
    const game: GameStateMessage = {
      board: room.board,
      currentPlayer: room.currentPlayer,
      winner: result?.winner ?? null,
      winningLine: result?.line ?? null,
      isDraw: !result && isDraw(room.board),
    };

    const players: RoomSnapshot["players"] = {};
    for (const symbol of ["X", "O"] as Player[]) {
      const seat = room.seats[symbol];
      if (seat) players[symbol] = { symbol, connected: seat.connected };
    }

    return { roomId: room.id, you, players, game };
  }

  /** Drops rooms nobody has touched in a while, so memory doesn't grow unbounded. */
  sweepStaleRooms(): void {
    const now = Date.now();
    for (const [id, room] of this.rooms) {
      if (now - room.updatedAt > ROOM_TTL_MS) this.rooms.delete(id);
    }
  }

  private findSeat(room: Room, token: string): Seat | undefined {
    return (Object.values(room.seats) as (Seat | undefined)[]).find((seat) => seat?.token === token);
  }
}
