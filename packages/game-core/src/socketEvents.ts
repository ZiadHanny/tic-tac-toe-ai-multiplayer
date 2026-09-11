import type { Board, Line, Player } from "./types";

/**
 * The Socket.io event contract shared by client and server, so the two
 * sides can never drift apart on event names or payload shapes.
 */

export interface GameStateMessage {
  board: Board;
  currentPlayer: Player;
  winner: Player | null;
  winningLine: Line | null;
  isDraw: boolean;
}

export interface RoomPlayerInfo {
  symbol: Player;
  connected: boolean;
}

export interface RoomSnapshot {
  roomId: string;
  you: Player;
  players: Partial<Record<Player, RoomPlayerInfo>>;
  game: GameStateMessage;
}

/** Client -> server events. */
export interface ClientToServerEvents {
  "room:create": (payload: { token: string }, ack: (response: RoomSnapshot | { error: string }) => void) => void;
  "room:join": (
    payload: { roomId: string; token: string },
    ack: (response: RoomSnapshot | { error: string }) => void,
  ) => void;
  "room:leave": (payload: { roomId: string; token: string }) => void;
  "game:move": (payload: { roomId: string; token: string; index: number }) => void;
  "game:rematch": (payload: { roomId: string; token: string }) => void;
}

/** Server -> client events. */
export interface ServerToClientEvents {
  "room:state": (snapshot: RoomSnapshot) => void;
  "room:opponent-joined": () => void;
  "room:opponent-left": () => void;
  "room:opponent-disconnected": () => void;
  "room:opponent-reconnected": () => void;
  "room:closed": (payload: { reason: string }) => void;
  "game:rematch-requested": (payload: { by: Player }) => void;
  "error": (payload: { message: string }) => void;
}
