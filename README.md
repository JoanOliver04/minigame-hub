# Mini-Game Hub — You vs AI

A hub of browser mini-games where you battle an AI opponent. Built with Next.js (App Router) + TypeScript, no external UI libraries. Fully bilingual (EN/ES) via a global language switch.

Current games:

| Game | Route | AI |
| --- | --- | --- |
| 🔢 Number Duel | `/games/guess` | Public-interval binary search (Easy/Medium/Hard) |
| ✊ Rock · Paper · Scissors | `/games/rps` | Frequency + Markov-chain prediction (Easy/Medium/Hard) |
| ⭕ Tic-Tac-Toe | `/games/ttt` | Three-mark movement variant; depth-limited minimax + alpha-beta on Hard |
| 🃏 Higher or Lower | `/games/higher-or-lower` | Rank odds + exact remaining-deck counting on Hard |
| 🧠 Memory Match | `/games/memory-match` | Probabilistic retained-tile memory (Easy/Medium/Hard) |
| 🔴 Connect Four | `/games/connect-four` | Depth-limited minimax + alpha-beta + threat heuristics |
| 🪵 Nim | `/games/nim` | Nim-sum (XOR) optimal play, normal and misère rules |
| 🔤 Word Guess | `/games/word-guess` | Candidate filtering + information-gain letter choice on Hard |
| 🃏 Blackjack | `/games/blackjack` | Fixed dealer rules; difficulty controls player help only |
| ⚡ Reaction Time | `/games/reaction-time` | Simulated human reflex ranges with false-start chance |
| ⚽ Penalty Shootout | `/games/penalty-kick` | Difficulty-based goalkeeper reads, reach and shot accuracy |
| 🏀 Basket Challenge | `/games/basket-shot` | Release-timing meter + difficulty-based AI shooting percentage |

## Run

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build (Turbopack)
npm start
```

## Architecture

```
src/
├── app/
│   ├── layout.tsx              # Root layout: header + Locale/Scores providers
│   ├── page.tsx                # Hub (main menu)
│   ├── globals.css             # Design tokens + shared component classes
│   └── games/[gameId]/page.tsx # Dynamic route, SSG via generateStaticParams
├── components/
│   ├── hub/                    # HubScreen, GameCard, StatsTable, AppHeader
│   └── ui/                     # SegPicker, Toggle, InfoTip, BackLink
├── context/
│   ├── ScoresContext.tsx       # Global per-game W/L/T store (localStorage)
│   └── LocaleContext.tsx       # EN/ES switch (localStorage)
├── games/
│   ├── types.ts                # GameDefinition contract
│   ├── registry.ts             # Game list — see "Adding a new mini-game"
│   ├── guess/                  # logic.ts (pure rules) · ai.ts · useGuessGame.ts · GuessGame.tsx · index.ts
│   ├── rps/                    # same structure
│   ├── ttt/                    # same structure (minimax AI in ai.ts)
│   ├── higher-or-lower/        # + types.ts and CardFace.tsx (shared with blackjack)
│   ├── memory-match/           # + types.ts
│   ├── connect-four/           # + types.ts
│   ├── nim/                    # + types.ts
│   ├── word-guess/             # + types.ts and words.ts (word lists)
│   ├── blackjack/              # hints.ts instead of ai.ts (dealer's play is a fixed rule)
│   ├── reaction-time/          # + types.ts
│   ├── penalty-kick/           # + types.ts
│   └── basket-shot/            # + types.ts
└── lib/
    ├── i18n/dictionaries.tsx   # All copy, EN + ES, incl. per-game gamesMeta
    └── random.ts · cards.ts · sound.ts · settings.ts
```

Each game follows the same layered pattern:

- **`logic.ts`** — pure rules and state transitions. No React, no DOM. Unit-testable.
- **`ai.ts`** — pure opponent strategy over that state. (Blackjack has `hints.ts` instead: the dealer's play is a fixed game rule in `logic.ts`, so the only "AI" surface is the Easy-mode player hint.)
- **`use<Name>.ts`** — React hook owning the phase machine (`setup → playing → end`), timers, sounds, and score recording.
- **`<Name>.tsx`** — the client component rendering the three phases.
- **`index.ts`** — exports the `GameDefinition` (id, icon, hasTies, component).
- **`types.ts`** *(optional)* — the later games keep their type definitions here; the first three (guess, rps, ttt) declare them inside `logic.ts`. Both are accepted layouts.

## Adding a new mini-game

1. Create `src/games/<id>/` with the files above.
2. Register it in `src/games/registry.ts`:

   ```ts
   export const GAMES: GameDefinition[] = [guessGame, rpsGame, /* … */, myNewGame];
   ```

3. Add its display name and description under `gamesMeta.<id>` in `src/lib/i18n/dictionaries.tsx`, for **both** locales (`en` and `es`). The hub card and the stats table read this entry and require it to exist.

That's it — the hub card, the `/games/<id>` route, and the scoreboard row are all derived from the registry. Scores need no schema change: `ScoresContext` creates a zeroed win/loss/tie entry for any new game id on first `record()`.
