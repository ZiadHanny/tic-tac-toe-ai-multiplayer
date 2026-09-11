"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GameStateMessage, Player, RoomSnapshot } from "@ttt/game-core";
import { getSocket } from "@/lib/socket";
import { getPlayerToken } from "@/lib/playerToken";

export type ConnectionStatus =
  | "idle"
  | "connecting"
  | "waiting-for-opponent"
  | "in-game"
  | "opponent-disconnected"
  | "opponent-left"
  | "error";

interface OnlineGameState {
  status: ConnectionStatus;
  roomId: string | null;
  you: Player | null;
  players: RoomSnapshot["players"];
  game: GameStateMessage | null;
  errorMessage: string | null;
  rematchRequestedBy: Player | null;
}

const initialState: OnlineGameState = {
  status: "idle",
  roomId: null,
  you: null,
  players: {},
  game: null,
  errorMessage: null,
  rematchRequestedBy: null,
};

function opponentOf(symbol: Player): Player {
  return symbol === "X" ? "O" : "X";
}

/** Drives one online room end-to-end over Socket.io: create/join, moves,
 * rematch voting, and opponent presence (joined/left/disconnected/reconnected). */
export function useOnlineGame() {
  const [state, setState] = useState<OnlineGameState>(initialState);
  const tokenRef = useRef<string>("");

  useEffect(() => {
    tokenRef.current = getPlayerToken();
    const socket = getSocket();

    const applySnapshot = (snapshot: RoomSnapshot) => {
      const opponentPresent = !!snapshot.players[opponentOf(snapshot.you)];
      setState((prev) => ({
        ...prev,
        roomId: snapshot.roomId,
        you: snapshot.you,
        players: snapshot.players,
        game: snapshot.game,
        status: opponentPresent ? "in-game" : "waiting-for-opponent",
        errorMessage: null,
        rematchRequestedBy: null,
      }));
    };

    const handleOpponentJoined = () => setState((prev) => ({ ...prev, status: "in-game" }));
    const handleOpponentLeft = () => setState((prev) => ({ ...prev, status: "opponent-left" }));
    const handleOpponentDisconnected = () => setState((prev) => ({ ...prev, status: "opponent-disconnected" }));
    const handleOpponentReconnected = () => setState((prev) => ({ ...prev, status: "in-game" }));
    const handleRematchRequested = ({ by }: { by: Player }) =>
      setState((prev) => ({ ...prev, rematchRequestedBy: by }));
    const handleServerError = ({ message }: { message: string }) =>
      setState((prev) => ({ ...prev, errorMessage: message }));

    socket.on("room:state", applySnapshot);
    socket.on("room:opponent-joined", handleOpponentJoined);
    socket.on("room:opponent-left", handleOpponentLeft);
    socket.on("room:opponent-disconnected", handleOpponentDisconnected);
    socket.on("room:opponent-reconnected", handleOpponentReconnected);
    socket.on("game:rematch-requested", handleRematchRequested);
    socket.on("error", handleServerError);

    return () => {
      socket.off("room:state", applySnapshot);
      socket.off("room:opponent-joined", handleOpponentJoined);
      socket.off("room:opponent-left", handleOpponentLeft);
      socket.off("room:opponent-disconnected", handleOpponentDisconnected);
      socket.off("room:opponent-reconnected", handleOpponentReconnected);
      socket.off("game:rematch-requested", handleRematchRequested);
      socket.off("error", handleServerError);
    };
  }, []);

  const createRoom = useCallback(() => {
    setState((prev) => ({ ...prev, status: "connecting", errorMessage: null }));
    getSocket().emit("room:create", { token: tokenRef.current }, (response) => {
      if ("error" in response) {
        setState((prev) => ({ ...prev, status: "error", errorMessage: response.error }));
        return;
      }
      setState((prev) => ({
        ...prev,
        status: "waiting-for-opponent",
        roomId: response.roomId,
        you: response.you,
        players: response.players,
        game: response.game,
      }));
    });
  }, []);

  const joinRoom = useCallback((roomId: string) => {
    setState((prev) => ({ ...prev, status: "connecting", errorMessage: null }));
    getSocket().emit("room:join", { roomId: roomId.trim().toUpperCase(), token: tokenRef.current }, (response) => {
      if ("error" in response) {
        setState((prev) => ({ ...prev, status: "error", errorMessage: response.error }));
        return;
      }
      const opponentPresent = !!response.players[opponentOf(response.you)];
      setState((prev) => ({
        ...prev,
        status: opponentPresent ? "in-game" : "waiting-for-opponent",
        roomId: response.roomId,
        you: response.you,
        players: response.players,
        game: response.game,
      }));
    });
  }, []);

  const leaveRoom = useCallback(() => {
    if (state.roomId) {
      getSocket().emit("room:leave", { roomId: state.roomId, token: tokenRef.current });
    }
    setState(initialState);
  }, [state.roomId]);

  const play = useCallback(
    (index: number) => {
      if (!state.roomId) return;
      getSocket().emit("game:move", { roomId: state.roomId, token: tokenRef.current, index });
    },
    [state.roomId],
  );

  const requestRematch = useCallback(() => {
    if (!state.roomId || !state.you) return;
    // Optimistic: the server only pushes "game:rematch-requested" to the
    // *opponent* (the requester already knows they just clicked it), so
    // this is the only way the requester's own UI learns "waiting on you".
    // The next "room:state" (once both have voted) overwrites this anyway.
    setState((prev) => ({ ...prev, rematchRequestedBy: prev.you }));
    getSocket().emit("game:rematch", { roomId: state.roomId, token: tokenRef.current });
  }, [state.roomId, state.you]);

  return { ...state, createRoom, joinRoom, leaveRoom, play, requestRematch };
}
