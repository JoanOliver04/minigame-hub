<div align="center">

<img src="docs/screenshots/logo.png" alt="Mini-Game Hub logo" width="180" />

# 🎮 Mini-Game Hub — You vs AI

### **Twenty-six browser mini-games sharing one hub, one scoreboard and one bilingual UI — each played against an AI opponent built on a genuinely different algorithm, from XOR nim-sum game theory to Monte Carlo tree search. Every one of them can also be played live against a friend over a room code.**

[![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React_19-149ECA?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![ESLint](https://img.shields.io/badge/ESLint_9-4B32C3?style=for-the-badge&logo=eslint&logoColor=white)](https://eslint.org/)

![Status](https://img.shields.io/badge/status-active-2ea44f?style=flat-square)
![Games](https://img.shields.io/badge/mini--games-26-1d3a5f?style=flat-square)
![Multiplayer](https://img.shields.io/badge/multiplayer_rooms-all_26_games-6f42c1?style=flat-square)
![Dependencies](https://img.shields.io/badge/dependencies-Next%2FReact_%2B_Firebase_(rooms_only)-blue?style=flat-square)
![License](https://img.shields.io/badge/license-proprietary-lightgrey?style=flat-square)

**[▶ Live demo](https://minigame-hub-orcin.vercel.app/)**

<br/>

<img src="docs/screenshots/home-hub.png" alt="Mini-Game Hub — main menu" width="720" />

</div>

---

Mini-Game Hub is a Next.js application built around a simple idea repeated twenty-six different ways: given a small, well-defined game, design an opponent whose difficulty tiers come from an actual algorithm — minimax with alpha-beta pruning, combinatorial game theory, A* pathfinding, Monte Carlo tree search, expectimax, Bayesian-ish placement inference, exact card counting, meld evaluation — not a random-number fudge factor. All twenty-six solo games are **fully client-side**: no server, no database, no network call, `localStorage` for scores and preferences. Every one of them *also* supports a **live multiplayer room** — a friend joins with a short code and you play head-to-head in real time — backed by a thin Firebase layer (Cloud Firestore + Anonymous Auth) that is the project's only backend of any kind, and its only dependency beyond Next.js/React. The room layer is game-agnostic; each game plugs in with a small `room.ts`/`use<Name>Room.ts`/`<Name>RoomGame.tsx` triple that **reuses the same pure rules the solo AI mode uses** and adds only uid-keyed bookkeeping. See [§2](#2-multiplayer-rooms) for how that layer works and the five sync patterns the 26 games fall into.

**Author:** Joan V. Oliver Rosell
**License:** Proprietary — source is public for portfolio/evaluation purposes only, see [LICENSE](LICENSE)

---

## Table of contents

1. [Games & AI opponents](#1-games--ai-opponents)
2. [Multiplayer Rooms](#2-multiplayer-rooms)
3. [Screenshots](#3-screenshots)
4. [Architecture](#4-architecture)
5. [Tech stack](#5-tech-stack)
6. [Inside the AI — six strategies in depth](#6-inside-the-ai--six-strategies-in-depth)
7. [Project structure](#7-project-structure)
8. [Adding a new mini-game](#8-adding-a-new-mini-game)
9. [Getting started](#9-getting-started)
10. [Engineering principles](#10-engineering-principles)
11. [Roadmap](#11-roadmap)
12. [Author](#12-author)

---

## 1. Games & AI opponents

Every game exposes three difficulty tiers. "Hard" is never a stat multiplier — it is the AI actually computing the best move it can find in real time, client-side, inside a React render loop.

| Game | Route | AI strategy |
|---|---|---|
| 🔢 Number Duel | `/games/guess` | Binary search over the public candidate interval — Hard converges in ⌈log₂(range)⌉ guesses |
| ✊ Rock · Paper · Scissors | `/games/rps` | Blended predictor: overall + recency-weighted move frequency, a one-step Markov transition table, and repeated two-move pattern detection |
| ⭕ Tic-Tac-Toe | `/games/ttt` | Three-mark movement variant; depth-limited **minimax + alpha-beta pruning** with a heuristic board evaluator and transposition cache |
| 🃏 Higher or Lower | `/games/higher-or-lower` | Hard does exact O(n) card-counting over the real remaining deck; Medium reasons from the nominal 52-card distribution only |
| 🧠 Memory Match | `/games/memory-match` | The AI never inspects hidden tiles — it *observes* flips and retains them at a difficulty-tuned probability (30% / 60% / 93%), like a fallible human memory |
| 🔴 Connect Four | `/games/connect-four` | **Minimax + alpha-beta** over a windowed threat-scoring heuristic (open threes, double threats, center control), center-first move ordering, 6-ply search on Hard |
| 🪵 Nim | `/games/nim` | Exact **nim-sum (XOR) optimal play** (Bouton's theorem, 1901) for both normal and misère rulesets, including the misère endgame parity flip |
| 🔤 Word Guess | `/games/word-guess` | Filters the live candidate-word pool against every hit/miss, then picks the letter that most evenly bisects it — an **information-gain** heuristic |
| 🃏 Blackjack | `/games/blackjack` | Dealer plays a fixed casino rule; difficulty only gates a basic-strategy Hit/Stand hint shown to the player on Easy |
| 🔷 Prism Clash | `/games/prism-clash` | Hand-aware card utility balances colour control, power timing, combo continuations and preserving flexible Prism cards |
| 🎲 Parchís Duel | `/games/parchis` | Move utility weighs captures, safe squares, bridges, threats, exact finishes and optimal 20/10-space bonus targets |
| 🪿 Game of the Goose | `/games/goose-game` | Limited-reroll strategy compares each landing against the expected value of all six possible rolls |
| 🧩 Tile Rummy | `/games/tile-rummy` | Meld search scores groups, runs, jokers, 30-point opening pressure and endgame rack size |
| ⚡ Reaction Time | `/games/reaction-time` | Simulated human reflex window (150–700 ms) tuned per difficulty, with a false-start chance |
| ⚽ Penalty Shootout | `/games/penalty-kick` | Pre-commit keeper AI, pattern learning and three balanced shot techniques |
| 🏀 Basket Challenge | `/games/basket-shot` | Release-timing meter for the player; difficulty-scaled make probability for the AI (42% / 58% / 74%, −11% on three-pointers) |
| 🕵️ Shadow Protocol | `/games/shadow-protocol` | A* pathfinding over evidence with a reachability "heatmap" tracking every tile the intruder could occupy since last seen — never the real hidden position |
| 🚢 Fleet Command | `/games/fleet-command` | Posterior placement heatmap: enumerates every legal remaining-ship placement consistent with shot history, fires the modal cell |
| 🏹 Windline Archery | `/games/windline-archery` | Aims against a noisy wind reading (±35% / ±15% / exact) rather than the true wind, with a difficulty-scaled release-hand variance |
| 🎵 Beat Reactor | `/games/beat-reactor` | Every judgement error is precomputed for the whole chart before the song starts and never reacts to the player mid-song |
| ⚡ Circuit Breaker | `/games/circuit-breaker` | Flood-fill reachable-space evaluation on Medium; simultaneous-move minimax over the joint-action matrix on Hard |
| 🏎️ Neon Drift | `/games/neon-drift` | Steers a precomputed racing line via look-ahead + curvature braking, bound by the same physics as the player — no rubber-banding |
| 🔐 Signal Breaker | `/games/signal-breaker` | Knuth-style worst-case minimax over every candidate code still consistent with its own guess history |
| 🎲 Diceforge Arena | `/games/diceforge-arena` | Exact reroll-outcome evaluation, seeded shops and build-aware face upgrades |
| ⬡ Hex Dominion | `/games/hex-dominion` | Immediate tactical win/block checks, bridge heuristics and fixed-budget UCT Monte Carlo tree search |
| ⚡ Spellstorm | `/games/spellstorm` | Seeded WPM timelines, corrected-typo delays and health-aware spell utility |

Every game in the table above is **also playable live against a friend** over a room code instead of the AI — see [§2](#2-multiplayer-rooms).

Full breakdown of six of the search/probability-driven opponents — a sample of the ones with a real algorithm behind them — in [§6](#6-inside-the-ai--six-strategies-in-depth).

---

## 2. Multiplayer Rooms

Every game can also be played **against a friend, live**, instead of the AI: one player creates a room and gets a short code, the other joins with it, and both see every move as it happens. No account, no email, no password — a name and a code is the entire flow.

```
Create room  →  share 6-char code  →  friend joins  →  live match  →  rematch, switch game/settings or leave
   (host)          (e.g. K7RXPQ)        (guest)
```

### How it works

- **Identity without accounts.** Joining triggers Firebase **Anonymous Authentication** invisibly (`ensureSignedIn()` in `src/lib/firebase/anonAuth.ts`) — every player gets a stable `uid` for that browser/device, with no signup form. A display name is remembered in `localStorage` for next time.
- **Rooms live in Cloud Firestore.** One document per room at `rooms/{code}` — the room code *is* the document id, and the collection is never listable, so a room is only reachable by whoever has its exact code (see [Security model](#security-model) below).
- **The room code survives game changes.** Once both players are in a room, the host can switch to any multiplayer game and adjust supported room settings without creating a new code or making the guest rejoin. Applying a different game/settings combination reseeds the room for both players and clears rematch votes, while preserving the same `rooms/{code}` document and seated players.
- **Room settings are first-class.** `src/games/roomTypes.ts` exposes typed `settings`/`defaultSettings` metadata for room modules, and `src/games/roomRegistry.ts` declares the options shown in the room UI. Examples include Memory Match 4×4/6×6 boards, Parchís 2/4 pieces, Nim normal/misère, Higher or Lower ace/target rules, Beat Reactor BPM/length/density, and match-length targets for games like RPS, Tic-Tac-Toe, Connect Four, Reaction Time and Blackjack.
- **Five sync patterns cover all 26 games** — every game picks the one that fits its shape, all built on the same generic `runRoomUpdate` transaction primitive:
  - **Turn-based** (Tic-Tac-Toe, Connect Four, Number Duel, Higher or Lower, Nim, Word Guess, Blackjack, Prism Clash, Parchís Duel, Game of the Goose, Hex Dominion). The payload carries a `turn: uid` field; the moving player's own transaction re-validates and applies the move against the **same pure functions the solo AI uses**, and Firestore Security Rules reject any write from the uid whose turn it isn't ([Security model](#security-model)).
  - **Simultaneous-move** (Rock-Paper-Scissors, Penalty Shootout, Basket Challenge, Windline Archery). Both clients write their own pending move blind; whichever listener first sees both present runs a transaction that resolves the round. A lost race is a safe, logged no-op, not an error.
  - **Lockstep** (Circuit Breaker). A simultaneous-turn light-cycle duel: each tick both players commit a turn and the tick only advances once both are in — which is also what keeps it fair over network latency.
  - **Shared-seed score-attack / time-attack** (Shadow Protocol, Beat Reactor, Neon Drift). The two players get an identical world from one shared seed (same facility / chart / track), play their own run locally reusing the whole solo engine, and submit a final score or lap time — higher score / faster time wins.
  - **Live-synced duel** (Spellstorm, Diceforge Arena). Each client is authoritative for its own side and mirrors it into the doc for the opponent's HUD; a spell / attack writes a small event the opponent's client applies exactly once.
- **Rules are never reimplemented for multiplayer.** Each game's `room.ts` imports its solo `logic.ts`'s pure functions (`judge`, `applyMove`, `resolveArrow`, `resolveTick`, `scoreGuess`, `resolveCombat`, `placeStone`, …) and adds only uid-keyed score/turn/pending bookkeeping — the AI-shaped solo state types are never touched.
- **No server compute of any kind.** Every sync pattern runs entirely as Firestore client-SDK writes and transactions — there are no Cloud Functions, no API routes, no Firebase Hosting. The project stays on Firebase's free **Spark** plan.
- **Room-specific scores, not the AI scoreboard.** A PvP result is intentionally **not** written to the same `ScoresContext` the hub's "you vs AI" table reads — that table's semantics are specifically solo-vs-AI, and conflating the two would make it meaningless. Each room's own score/history lives only in that room's Firestore document.
- **Rematch is mutual.** Either player can propose one; the reset only applies once both players have agreed (`rematchVotes`), using the same idempotent-transaction pattern as round resolution.
- **Leaving closes the room.** Current clients physically delete the Firestore room document when a seated player leaves, so closed rooms do not leave abandoned `status: "abandoned"` residue behind. Existing listeners treat the missing document as a closed/gone room for the other player.

### Security model

Firestore **Security Rules** (`firestore.rules`, deployed to the Firebase console — not application code) are the actual access-control boundary, not just the client:

- A room can only be **read/written by a signed-in (anonymous) user**, and only **written by one of its two seated players** — enforced per-field, not just per-document.
- In Tic-Tac-Toe, a write is rejected unless `request.auth.uid` matches the room's current `turn` — a client cannot move out of turn even if it forges local UI state.
- Room codes are **never enumerable** (`allow list: false`): the only way to reach a room is to already have its code.
- Only the seated host can switch a room to a different game/settings payload, and only to a game id in the Security Rules allow-list; the code, host, players and expiry fields must stay unchanged.
- **Soft expiry**: every room carries `expiresAt` (`createdAt + 24h`); a rule-level `notExpired()` check denies gameplay updates — join, move, rematch, game switch — on an expired room, regardless of what the client sends.
- A room can only be **deleted by a seated player**. This allows intentional cleanup when someone leaves while still preventing deletion of rooms by users who merely know/guess another code but are not seated in it.

### Expiry and cleanup

Every room is time-boxed to 24 hours via its `expiresAt` field. Normal user-closed rooms are physically deleted by `leaveRoom()` (`deleteDoc(rooms/{code})`), so they do not accumulate as abandoned documents. Expiry is still enforced separately: the Security Rules' `notExpired()` check makes a stale room unusable for gameplay the moment it ages out, and the client mirrors the same check (`src/lib/rooms/expiry.ts`) to show a clear "this room has expired" message instead of a generic error. A native Firestore TTL policy can still be enabled later as an additive cleanup layer for rooms that expire without anyone explicitly closing them.

### Trust model

There is no server to hide secret state, so for the games with hidden information — a battleship fleet, a Mastermind code, a Memory Match board, a Word Guess answer — that secret necessarily lives in the room document (a client transaction has to read it to resolve a move). A determined peer could read it from the raw Firestore snapshot. This is an accepted trade-off for a casual friends hub: the actual enforcement boundary (who can write, whose turn it is, whether a room is expired) is Security Rules, but *concealment* of secret state would require Cloud Functions, which this free-tier, no-server project deliberately avoids. The in-game UI never reveals it.

### Scope

The room layer (`src/lib/rooms/`, `src/games/roomTypes.ts`, `src/games/roomRegistry.ts`) is generic and game-agnostic by design, and **all 26 games** now plug into it. Adding a room mode to a game is the same additive change every time — a `room.ts`/`use<Name>Room.ts`/`<Name>RoomGame.tsx` triple plus one registry entry and a `supportsMultiplayer: true` flag — and it never touches the game's existing solo files ([§8](#8-adding-a-new-mini-game)).

---

## 3. Screenshots

### The hub

<table>
  <tr>
    <td width="50%"><img src="docs/screenshots/home-hub.png" alt="Hub — main menu with the game grid" /><br/><sub><b>Hub</b> — the registry-driven game grid</sub></td>
    <td width="50%"><img src="docs/screenshots/session-scoreboard.png" alt="Session scoreboard of wins, losses and ties per game" /><br/><sub><b>Session scoreboard</b> — per-game W/L/T from <code>ScoresContext</code></sub></td>
  </tr>
</table>

### Playing solo vs the AI

<table>
  <tr>
    <td width="33%"><img src="docs/screenshots/number-duel-setup.png" alt="Number Duel setup screen" /><br/><sub><b>Number Duel</b> — setup</sub></td>
    <td width="33%"><img src="docs/screenshots/number-duel-play.png" alt="Number Duel in progress" /><br/><sub><b>Number Duel</b> — binary-search race</sub></td>
    <td width="33%"><img src="docs/screenshots/number-duel-win.png" alt="Number Duel victory screen" /><br/><sub><b>Number Duel</b> — win</sub></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/rps-play.png" alt="Rock Paper Scissors in progress" /><br/><sub><b>Rock · Paper · Scissors</b> — blended predictor</sub></td>
    <td><img src="docs/screenshots/tic-tac-toe-setup.png" alt="Tic-Tac-Toe setup screen" /><br/><sub><b>Tic-Tac-Toe</b> — minimax + αβ</sub></td>
    <td><img src="docs/screenshots/connect-four-play.png" alt="Connect Four in progress" /><br/><sub><b>Connect Four</b> — 6-ply search</sub></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/higher-or-lower-play.png" alt="Higher or Lower in progress" /><br/><sub><b>Higher or Lower</b> — card counting</sub></td>
    <td><img src="docs/screenshots/memory-match-play.png" alt="Memory Match in progress" /><br/><sub><b>Memory Match</b> — fallible AI memory</sub></td>
    <td><img src="docs/screenshots/word-guess-play.png" alt="Word Guess in progress" /><br/><sub><b>Word Guess</b> — information-gain letters</sub></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/blackjack-play.png" alt="Blackjack in progress" /><br/><sub><b>Blackjack</b> — fixed dealer rule</sub></td>
    <td><img src="docs/screenshots/penalty-shootout-play.png" alt="Penalty Shootout in progress" /><br/><sub><b>Penalty Shootout</b> — pre-commit keeper</sub></td>
    <td><img src="docs/screenshots/basket-challenge-play.png" alt="Basket Challenge in progress" /><br/><sub><b>Basket Challenge</b> — release-timing meter</sub></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/windline-archery-play.png" alt="Windline Archery in progress" /><br/><sub><b>Windline Archery</b> — aim against the wind</sub></td>
    <td></td>
    <td></td>
  </tr>
</table>

### Multiplayer rooms

<table>
  <tr>
    <td width="50%"><img src="docs/screenshots/create-room.png" alt="Create a multiplayer room and share the code" /><br/><sub><b>Create a room</b> — pick a game, share the 6-char code</sub></td>
    <td width="50%"><img src="docs/screenshots/join-room.png" alt="Join a multiplayer room by code" /><br/><sub><b>Join a room</b> — a name and a code is the whole flow</sub></td>
  </tr>
</table>

---

## 4. Architecture

A Next.js App Router application. The twenty-six solo games are **fully static and client-only** — no backend, no network call, `localStorage` for scores and preferences. Multiplayer rooms are the one exception: they're backed by Cloud Firestore + Firebase Anonymous Auth, a serverless BaaS layer with no server of the project's own (no custom API routes, no Cloud Functions).

```mermaid
flowchart TB
    subgraph Browser
        direction TB
        Hub["/  — HubScreen<br/>GameCard grid + StatsTable"]
        Game["/games/[gameId]<br/>generateStaticParams · dynamicParams=false"]
        Rooms["/rooms, /rooms/[code]<br/>client-rendered, dynamic"]
        LC["LocaleContext<br/>EN/ES · localStorage"]
        SC["ScoresContext<br/>per-game W/L/T · localStorage (solo only)"]
        Hub --> Game
        Hub --> Rooms
        LC -.-> Hub
        LC -.-> Game
        LC -.-> Rooms
        SC -.-> Hub
        SC -.-> Game
    end

    subgraph PerGame["Each src/games/<id>/ (22x solo)"]
        direction TB
        Logic["logic.ts — pure rules,<br/>no React, no DOM"]
        AI["ai.ts — pure opponent<br/>strategy over that state"]
        Hook["use<Name>.ts — phase machine<br/>setup → playing → end"]
        View["<Name>.tsx — client component"]
        Logic --> AI --> Hook --> View
    end

    subgraph RoomLayer["Multiplayer (all 26 games)"]
        direction TB
        RoomLib["src/lib/rooms/<br/>roomsApi.ts · expiry.ts · code.ts"]
        RoomGame["src/games/<id>/room.ts<br/>reuses logic.ts's pure functions"]
        RoomHook["use<Name>Room.ts"]
        RoomView["<Name>RoomGame.tsx"]
        RoomLib --> RoomGame --> RoomHook --> RoomView
    end

    Game --> PerGame
    Rooms --> RoomLayer

    subgraph Firebase["Firebase (Spark / free plan, no Cloud Functions)"]
        direction TB
        Auth["Anonymous Authentication"]
        FS[("Cloud Firestore<br/>rooms/{code}")]
        Rules["Security Rules<br/>seat + turn + expiry checks"]
    end

    RoomLib --> Auth
    RoomLib --> FS
    Rules -.enforces.-> FS
```

**Key decisions:**

- **Static by construction for solo games.** `src/app/games/[gameId]/page.tsx` sets `dynamicParams = false` and generates one page per entry in the game registry at build time — any unregistered id 404s, there is no dynamic catch-all. `/rooms` and `/rooms/[code]` are a separate, client-rendered route tree, since room data only exists at runtime.
- **Registry-driven UI.** The hub grid, the `/games/<id>` routes and the scoreboard rows are all *derived* from `src/games/registry.ts` — nothing about the game list is hardcoded into a component. Multiplayer follows the same idea one layer down, via `src/games/roomRegistry.ts`.
- **Logic isolated from React — and from the network.** Every game's `logic.ts` (state transitions) and `ai.ts` (opponent strategy) are plain, framework-free TypeScript. The multiplayer `room.ts` modules reuse those same pure functions for the parts that are genuinely just game rules (`judge`, `applyMove`, `checkOutcome`, `legalMoves`), and only add new, uid-keyed bookkeeping for the PvP-specific parts (scores, turns, pending moves) — the AI-shaped `MatchState`/`TttMatchState` types are never touched or repurposed.
- **Two small global contexts, no store library, for local state.** `LocaleContext` and `ScoresContext` both follow the same SSR-safe pattern: initialize to a fixed default for the server render, hydrate from `localStorage` in a post-mount `useEffect`, so there is never a hydration mismatch on first paint. Multiplayer state does **not** go through either context — it lives in Firestore and streams in via `onSnapshot`.
- **Additive score schema.** `ScoresContext.record(gameId, outcome)` has no dependency on the game registry — a brand-new game id gets a zeroed win/loss/tie row automatically on its first recorded result. This store is solo-only by design (see [§2](#2-multiplayer-rooms)).

---

## 5. Tech stack

| Layer | Choice | Why |
|---|---|---|
| **Framework** | Next.js 16 (App Router, Turbopack) | Static generation per solo-game route, client-rendered dynamic routes for rooms, zero server to operate |
| **Language** | TypeScript (strict) | End-to-end type safety, including a `satisfies`-checked i18n dictionary |
| **UI runtime** | React 19 | Server + Client Components; every game screen is a small client-side state machine |
| **Styling** | Hand-written CSS (`globals.css`) | Custom-property design tokens, zero utility-CSS or component-library dependency |
| **Local state** | React Context + `localStorage` | Locale and solo-game scores/preferences — no external store |
| **Multiplayer backend** | Firebase — Cloud Firestore + Anonymous Auth | Serverless realtime sync and transactions for room state, invisible per-device identity, no server of the project's own, free Spark plan |
| **Multiplayer access control** | Firestore Security Rules (`firestore.rules`) | The actual enforcement layer for who can read/write a room and when — not just client code (see [§2](#2-multiplayer-rooms)) |
| **Audio** | Native Web Audio API (`lib/sound.ts`) | Four synthesized cues (win/lose/error/blip), no audio asset files |
| **i18n** | Custom typed dictionary (`lib/i18n/dictionaries.tsx`) | `satisfies Dictionary` on both locales — a missing/extra key is a compile error, not a runtime blank string |
| **Tooling** | ESLint 9 (flat config, `eslint-config-next`) | `core-web-vitals` + `typescript` rule sets, zero custom overrides |

---

## 6. Inside the AI — six strategies in depth

Six of the twenty-six opponents are driven by an actual algorithm rather than a probability roll. This is the part of the project worth reading the source for.

#### Minimax + alpha-beta pruning — Tic-Tac-Toe & Connect Four
Both games share the same shape: a depth-limited [`minimax`](src/games/connect-four/ai.ts) search with alpha-beta pruning and a `Map`-based transposition cache keyed on board state. Connect Four adds **move ordering** (center columns searched first — `[3, 2, 4, 1, 5, 0, 6]`), which both improves play quality and dramatically increases the pruning rate, and a **windowed threat heuristic** that scores every open four-cell line, penalizing the opponent's threats more heavily than symmetric AI opportunities. Hard mode searches 6 plies on a 7×6 board — deep enough to be genuinely hard to beat without blocking the UI thread.

#### Nim-sum (XOR) optimal play — Nim
A self-contained implementation of Bouton's 1901 theorem: the bitwise XOR of all pile sizes (the *nim-sum*) tells you, with mathematical certainty, whether the player to move is winning. [`findNormalOptimalMove`](src/games/nim/ai.ts) reduces a pile so the nim-sum returns to zero, at least one of which is always legal whenever the position is won. The trickier part is **misère play** (last player to move *loses*): the strategy tracks the same nim-sum right up until every pile is size 0 or 1, at which point the correct move flips to a parity game on the count of remaining single-token piles — implemented as its own three-case branch.

#### Blended move prediction — Rock · Paper · Scissors
Hard mode scores the player's next move from four independent signals — overall move frequency, a recency-weighted window over the last six rounds, a one-step **Markov transition table** keyed on the player's previous move, and detection of a repeated two-move sequence — then counters the highest-scoring prediction. A small (8%) random floor keeps the predictor itself from becoming a pattern the player can exploit back.

#### Information-gain letter selection — Word Guess
[`pickInformationLetter`](src/games/word-guess/ai.ts) filters the live candidate word list against every revealed hit and miss, then — rather than guessing the statistically most frequent letter — scores each remaining letter by how evenly it **bisects** the candidate pool. A letter that splits 50 remaining words into 25/25 eliminates more uncertainty than one that splits them 49/1, regardless of which side the true answer falls on.

#### Exact card counting — Higher or Lower
Medium reasons from the nominal 52-card rank distribution with only the visible card removed. Hard instead runs an O(n) pass over the *actual* remaining deck ([`calculateRemainingProbabilities`](src/games/higher-or-lower/ai.ts)) and argmaxes over exact counts — no floating-point probability needed, since comparing counts is sufficient to pick the best of Higher/Lower/Same.

#### Fallible probabilistic memory — Memory Match
The AI is structurally incapable of cheating: it never reads tile values directly. [`observeTile`](src/games/memory-match/ai.ts) is the only way a value enters its memory, and it only "sticks" with a difficulty-tuned retention probability (30% / 60% / 93%) — modeling a human memory that sometimes fails to register what it just saw, rather than an oracle with an artificial miss chance bolted on.

---

## 7. Project structure

```
src/
├── app/
│   ├── layout.tsx              Root layout — Locale/Scores providers + header
│   ├── page.tsx                Hub (main menu)
│   ├── globals.css             Design tokens + shared component classes
│   ├── games/[gameId]/page.tsx Static route — generateStaticParams, dynamicParams=false
│   └── rooms/
│       ├── page.tsx            Create/join landing (client-rendered)
│       └── [code]/
│           ├── page.tsx        Thin server shell — extracts `code`
│           └── RoomClient.tsx  Auth + room lookup, dispatches to the game's RoomComponent
├── components/
│   ├── hub/                    AppHeader, HubScreen, GameCard, StatsTable
│   └── ui/                     SegPicker, Toggle, HowToPlay, InfoTip, BackLink
├── context/
│   ├── LocaleContext.tsx       EN/ES switch, localStorage-backed
│   └── ScoresContext.tsx       Per-game W/L/T store, localStorage-backed, solo games only
├── games/
│   ├── types.ts                GameDefinition contract (incl. `supportsMultiplayer`)
│   ├── registry.ts             Central game list — see §8
│   ├── roomTypes.ts            RoomGameModule<TGame> contract for multiplayer-capable games
│   ├── roomRegistry.ts         Games with a PvP room mode (all 26)
│   ├── guess/                  logic.ts · ai.ts · useGuessGame.ts · GuessGame.tsx · index.ts
│   ├── rps/                    solo files + room.ts · useRpsRoom.ts · RpsRoomGame.tsx
│   ├── ttt/                    solo files + room.ts · useTttRoom.ts · TttRoomGame.tsx (minimax in ai.ts)
│   ├── higher-or-lower/        + types.ts, CardFace.tsx (shared with blackjack)
│   ├── memory-match/           + types.ts
│   ├── connect-four/           + types.ts
│   ├── nim/                    + types.ts
│   ├── word-guess/             + types.ts, words.ts, letters.ts
│   ├── blackjack/               hints.ts instead of ai.ts — the dealer's play is a fixed rule
│   ├── prism-clash/            colour-matching rules, utility AI + room mode
│   ├── parchis/                68-square race rules, tactical AI + room mode
│   ├── goose-game/             63-square race, reroll strategy + room mode
│   ├── tile-rummy/             tile meld validation, joker AI + room mode
│   ├── reaction-time/          + types.ts
│   ├── penalty-kick/           + types.ts
│   ├── basket-shot/            + types.ts
│   ├── shadow-protocol/        + types.ts, generation.ts, visibility.ts, sound.ts
│   ├── fleet-command/          + types.ts
│   ├── windline-archery/       + types.ts, physics.ts
│   ├── beat-reactor/           + types.ts, chart generation + Web Audio clock
│   ├── circuit-breaker/        + types.ts
│   ├── neon-drift/             + types.ts, tracks.ts, fixed-step physics
│   ├── signal-breaker/         + types.ts
│   ├── diceforge-arena/        + types.ts
│   ├── hex-dominion/           + types.ts
│   └── spellstorm/             + types.ts, words.ts
└── lib/
    ├── i18n/dictionaries.tsx   All copy, EN + ES, typed via `satisfies Dictionary` (incl. `rooms.*`)
    ├── cards.ts                Deck primitives shared by higher-or-lower & blackjack
    ├── random.ts               randomInt(lo, hi)
    ├── rng.ts                  Seeded Rng (next/int/pick/shuffle) — production uses Math.random, tests seed it
    ├── prefs.ts                Versioned GamePreferenceEnvelope<T> for per-game calibration/control-scheme storage
    ├── motion.ts                Reduced-motion preference, respects `prefers-reduced-motion`
    ├── sound.ts                WebAudio synth — win/lose/error/blip
    ├── settings.ts             Session-only settings (AI "thinking" delay toggle)
    ├── firebase/
    │   ├── client.ts           HMR-safe Firebase App/Firestore/Auth singleton, reads NEXT_PUBLIC_FIREBASE_*
    │   └── anonAuth.ts         ensureSignedIn() — invisible Anonymous Auth
    └── rooms/
        ├── types.ts            RoomDoc<TGame>, RoomPlayer, RoomStatus
        ├── code.ts             generateRoomCode() — 6 chars, unambiguous alphabet
        ├── roomsApi.ts         createRoom/joinRoom/switchRoomGame/subscribeRoom/leaveRoom/voteRematch/runRoomUpdate
        ├── expiry.ts           isRoomExpired() — client mirror of the Security Rules' notExpired()
        └── usePlayerName.ts    localStorage-backed display name, same hydration pattern as ScoresContext

firestore.rules                 Security Rules — seat membership, turn ownership, soft expiry (see §2)
firebase.json                   Points the Firebase CLI at firestore.rules (rules are otherwise pasted
                                 into the Firebase console manually — no CLI/Cloud Functions dependency)
.env.example                    NEXT_PUBLIC_FIREBASE_* placeholders — see §9
```

Every solo game follows the same five-file layered pattern:

- **`logic.ts`** — pure rules and state transitions. No React, no DOM. Unit-testable in isolation.
- **`ai.ts`** — pure opponent strategy over that state (Blackjack keeps `hints.ts` instead, since its only "AI" surface is a player-facing hint).
- **`use<Name>.ts`** — the React hook owning the phase machine (`setup → playing → end`), timers, sound cues and score recording.
- **`<Name>.tsx`** — the client component rendering the three phases.
- **`index.ts`** — exports the `GameDefinition` (id, icon, `hasTies`, component).

Every game adds a parallel, equally small set of files (`room.ts`, `use<Name>Room.ts`, `<Name>RoomGame.tsx`) rather than branching the solo files — see [§2](#2-multiplayer-rooms) and [§4](#4-architecture) for why.

---

## 8. Adding a new mini-game

1. Create `src/games/<id>/` following the five-file pattern above.
2. Register it in `src/games/registry.ts`:

   ```ts
   export const GAMES: GameDefinition[] = [guessGame, rpsGame, /* … */, myNewGame];
   ```

3. Add its display name and description under `gamesMeta.<id>` in `src/lib/i18n/dictionaries.tsx`, for **both** locales (`en` and `es`) — the `satisfies Dictionary` typing makes a missing entry a build-time error, not a silent blank.

That's it. The hub card, the `/games/<id>` route and the scoreboard row are all derived from the registry — `ScoresContext` creates a zeroed win/loss/tie entry for any new game id the first time `record()` is called on it.

**Optional — adding a multiplayer room mode to a game:** create its `room.ts` (uid-keyed reducers, reusing that game's pure `logic.ts` functions), `use<Name>Room.ts` and `<Name>RoomGame.tsx`, register the module in `src/games/roomRegistry.ts`, and set `supportsMultiplayer: true` in the game's `GameDefinition`. If the room mode has configurable options, add `defaultSettings` and typed `settings` metadata in `roomRegistry.ts`; the shared room shell will render the controls automatically. This is entirely additive — it never touches the game's existing solo files.

---

## 9. Getting started

**Live:** [minigame-hub-orcin.vercel.app](https://minigame-hub-orcin.vercel.app/) — deployed on Vercel, redeploys automatically on every push to `main`.

**Prerequisites:** Node.js ≥ 20, npm.

```bash
npm install
npm run dev      # http://localhost:3000 (Turbopack)
```

| Script | What it does |
|---|---|
| `npm run dev` | Starts Next.js in development with Turbopack |
| `npm run build` | Production build |
| `npm start` | Serves the production build |
| `npm run lint` | ESLint over the whole project |

All twenty-six solo games work immediately with no configuration — they have no dependency on the steps below.

### Multiplayer setup (optional)

Only needed to run `/rooms` locally. Without it, everything else in the app works exactly the same.

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com) (free **Spark** plan is enough — no billing required).
2. Enable **Cloud Firestore** (production mode) and **Authentication → Anonymous** sign-in.
3. Register a Web App in the project's settings and copy its config values.
4. Copy `.env.example` to `.env.local` and fill in the six `NEXT_PUBLIC_FIREBASE_*` values from step 3. These are safe to expose client-side — Firestore Security Rules are the real access control, not hiding this config. **Never commit real values or any service-account/admin credentials** — `.env.local` is git-ignored.
5. Paste the contents of `firestore.rules` into the Firebase console's Firestore → Rules tab and publish. This step is what actually enforces access control (see [§2](#2-multiplayer-rooms)) — the app will run without it, but every room read/write will be rejected.

---

## 10. Engineering principles

- **Difficulty is an algorithm, not a multiplier.** Where a game admits a real strategy (Tic-Tac-Toe, Connect Four, Nim, RPS, Word Guess, Higher or Lower), "Hard" runs that strategy at full strength — it is never simulated by inflating a hit chance.
- **The AI only ever sees what it's allowed to see.** Memory Match's AI has no code path that reads a hidden tile's value directly; Higher or Lower's Medium tier reasons from the nominal deck, not the real one — the *information asymmetry* is the difficulty knob.
- **Logic first, React second — and network third.** Every game's rules and AI live in framework-free `.ts` modules; the React hook is a thin state-machine wrapper on top. Multiplayer's `room.ts` modules follow the same discipline one layer further out: game rules stay pure and reused, only the network/transaction plumbing is new. This is what makes twenty-six independent games (plus a multiplayer layer) maintainable by one person.
- **Type-checked content.** The bilingual dictionary uses `satisfies Dictionary` on both locales — English/Spanish key drift is a compile error, not a runtime gap discovered by a user.
- **SSR-safe client state.** Both global contexts hydrate from `localStorage` after mount rather than during the server render, so there is no hydration-mismatch warning and no flash of default state.
- **Access control lives in the backend, not the client.** Every multiplayer permission (who can join, whose turn it is, whether a room has expired) is enforced by Firestore Security Rules, independent of what the client sends — the client-side checks in the hooks are a UX convenience for instant feedback, not the actual boundary.
- **Minimal, deliberate dependencies.** The twenty-six solo games add nothing beyond Next.js/React. Multiplayer adds exactly one dependency, `firebase`, chosen because it's a serverless BaaS that needs no infrastructure of the project's own to run or operate.

---

## 11. Roadmap

- **Automated tests** — the `logic.ts`/`ai.ts` split exists specifically to make the pure game rules and AI strategies unit-testable (Vitest is a natural fit); this coverage doesn't exist yet.
- **CI** — lint + test on every push once the test suite lands.
- **Presence detection** — knocked-out and timed-out players in the real-time modes are handled, but a peer who simply closes their tab mid-match (without clicking "Leave") isn't auto-detected today; real presence would need either Realtime Database's `onDisconnect` or a small heartbeat scheme.
- **Physical TTL cleanup for abandoned expired rooms** — user-closed rooms are already deleted immediately; enabling Firestore's native TTL policy later would only clean up rooms that expire without anyone pressing leave/close.
- **More games** — the registry pattern in [§8](#8-adding-a-new-mini-game) is designed for this; new opponents keep the "real algorithm per difficulty tier" bar from [§10](#10-engineering-principles).

---

## 12. Author

**Joan V. Oliver Rosell** — full-stack engineering, game/AI logic design, i18n architecture, realtime multiplayer.

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0077B5?style=flat&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/joanvoliver)
[![Email](https://img.shields.io/badge/Email-Contact-D14836?style=flat&logo=gmail&logoColor=white)](mailto:joanoliverrosell@gmail.com)
[![GitHub](https://img.shields.io/badge/GitHub-JoanOliver04-181717?style=flat&logo=github&logoColor=white)](https://github.com/JoanOliver04)

---

<div align="center">
<sub>© 2026 Joan V. Oliver Rosell. All rights reserved. See <a href="LICENSE">LICENSE</a>.</sub>
</div>
