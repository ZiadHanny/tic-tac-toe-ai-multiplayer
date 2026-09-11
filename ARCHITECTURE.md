# Architecture

## Monorepo layout

```
packages/game-core/   Pure game logic + the Socket.io event contract. No React, no
                       Express — just TypeScript functions and types. Both /client
                       and /server depend on it, so the rules of the game and the
                       shape of every network message are defined exactly once.
client/                Next.js (App Router) + TypeScript + Tailwind CSS.
server/                Express + Socket.io room server.
```

`client` consumes `@ttt/game-core`'s TypeScript source directly via Next's
`transpilePackages`; `server` runs it directly via `tsx` (no separate build
step for either). This is what the brief's "reuse the code, don't duplicate
the logic" constraint means in practice: `checkWinner`, `isDraw`, and the
Minimax AI are called from both the client (Local/AI modes, and — see below
— server-side move validation) and the server (validating every online
move), and the `ClientToServerEvents` / `ServerToClientEvents` types in
`game-core/src/socketEvents.ts` are the single source of truth both sides
import, so client and server can never quietly drift apart on an event name
or payload shape.

Local 2-player and Player-vs-AI never touch the network: `useLocalGame`
holds the board/turn/score state entirely in the browser via `useReducer`,
and `useAiGame` is a thin wrapper that calls `getAiMove` from `game-core`
whenever it becomes the AI's turn. The app works fully offline for both of
those modes, per the brief's constraint.

## The Minimax AI

`getBestMove(board, aiPlayer, maxDepth)` in `game-core/src/minimax.ts`
implements Minimax with alpha-beta pruning:

- **Maximizing** on the AI's turn, **minimizing** on the opponent's turn.
- A terminal board scores `10 - depth` for an AI win, `depth - 10` for an
  AI loss, `0` for a draw — depth is subtracted/added so the AI prefers a
  win *sooner* and a loss *later*, rather than being indifferent between
  winning next move and winning five moves from now.
- **Alpha-beta pruning** cuts off branches that can't change the outcome
  (`if (beta <= alpha) break`). Tic-tac-toe's search tree is tiny (at most
  9! ≈ 362,880 leaf paths, and far fewer once wins/draws prune branches
  early), so pruning isn't strictly *necessary* for performance here — it's
  included because doing it properly, with correct alpha/beta threading
  through the recursion, is itself the thing worth demonstrating.
- `maxDepth` caps the lookahead. Beyond that depth, an unresolved position
  is scored as a neutral draw (`0`) rather than searched further — a
  deliberately crude cutoff (no positional heuristic), because the point of
  the cutoff is to make an *easier* difficulty, not a smarter one:
  - **Hard** — `maxDepth = Infinity`: the full game tree, always. Provably
    unbeatable; the worst a human can force is a draw. Covered by a test
    that simulates 50 full games (AI as both X and O) against a random
    opponent and asserts the AI never loses.
  - **Medium** — `maxDepth = 3`, plus a 15% chance of a random move instead.
    Plays solidly but the shallow lookahead means it sometimes misses a
    multi-move trap, and the occasional random move creates openings —
    beatable, but you have to actually play well.
  - **Easy** — 70% random moves, 30% `maxDepth = 2` — mostly makes plausible
    but unplanned moves; loses often.
- Move ties (several moves score equally) are broken randomly, so hard mode
  is unbeatable without being a predictable, always-plays-the-same-opening
  bot.

## Online multiplayer: rooms and the message flow

The server keeps rooms in memory (`server/src/rooms.ts`, `RoomStore`) —
no database, since a room only needs to exist for the lifetime of one match
between two people who are both online right now. A room is a 5-character
code (`nanoid`'s `customAlphabet`, excluding `0/O/1/I` so it's unambiguous
read aloud or handwritten), a board, whose turn it is, and up to two
"seats" (`X`/`O`), each holding a **player token** rather than a bare
socket id.

That token — a `crypto.randomUUID()` generated once per browser tab and
kept in `sessionStorage` (`client/src/lib/playerToken.ts`) — is what makes
reconnection work. A Socket.io connection is ephemeral: refresh the page,
or have the connection drop and come back, and you get a *new* socket id.
If seats were keyed by socket id, a refresh would look identical to a
stranger trying to take the (already full) second seat. Instead, every
`room:join` first checks whether the token already owns a seat in that
room — if so, this is the *same player* reconnecting, and the server just
re-attaches the new socket id to their existing seat and notifies the
opponent via `room:opponent-reconnected`. Only a truly new token can claim
the empty second seat.

```
Creator                         Server                          Joiner
   |--- room:create({token}) --->|
   |<--- ack: RoomSnapshot -------|   (seat X, board, code "AB3XQ")
   |                              |
   |                              |<--- room:join({roomId, token}) ---|
   |                              |   (new token -> assigned seat O)
   |                              |--- room:opponent-joined --------->| (to X)
   |<---------- room:state -------|--------- room:state ------------>|  (to both)
   |                              |
   |--- game:move({index}) ----->|
   |                              |  (server re-validates: right turn?
   |                              |   cell empty? game not over? — using
   |                              |   the same game-core functions the
   |                              |   client uses for local play)
   |<---------- room:state -------|--------- room:state ------------>|
   |                              |
   |          ...on disconnect...
   |                              |--- room:opponent-disconnected -->|
   |--- (same token) room:join -->|   (reconnect: same seat, new socket id)
   |                              |--- room:opponent-reconnected --->|
```

Every `game:move` is re-validated server-side with the exact same
`checkWinner` / `applyMove` functions the client's local modes use — the
client's own UI already prevents illegal moves (see Accessibility for why
cells stay focusable-but-inert rather than `disabled`), but the server
never trusts that; it is the authority on whether a move is legal.

**Rematch** is a two-vote handshake (`game:rematch`): the first vote is
broadcast to the opponent as `game:rematch-requested`; once both players
have voted, the server resets the board and flips who goes first (fair
across a multi-game session), and clears the votes.

**Room cleanup**: a `setInterval` sweep (`RoomStore.sweepStaleRooms`)
drops any room untouched for 30 minutes, so an abandoned in-memory room
doesn't linger for the life of the server process.

## Why Socket.io (and why not deploy it to Vercel)

Real-time turn exchange needs a persistent, bidirectional connection — an
HTTP request/response cycle (which is what Vercel's serverless functions
give you) can't push a move to the *other* player the instant it happens
without the client polling. Socket.io was chosen over a raw WebSocket
because it gives room support (`socket.join`/`io.to`), automatic
reconnection with backoff, and a graceful fallback to HTTP long-polling for
any network that blocks WebSocket upgrades — all as one library, rather
than reimplementing that on top of the raw `ws` API.

This is also exactly why the server is its own small Express + Socket.io
process rather than a Next.js API route: Vercel's functions are
short-lived and don't hold a persistent connection open, so a WebSocket
server has to run somewhere that keeps a long-running process alive
(Render, Railway, Fly.io, a VM — anywhere that isn't "serverless"). The
client and server are two separate deployables for exactly this reason.
