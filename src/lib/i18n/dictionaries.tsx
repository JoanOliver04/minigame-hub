import type { ReactNode } from "react";

/**
 * All copy for the app lives here, split by locale. Adding a language means
 * adding one more entry to `dictionaries` whose shape matches `Dictionary`
 * (enforced by `satisfies` below — a missing/extra key is a type error).
 */

export type Locale = "en" | "es";

export interface GameMeta {
  name: string;
  description: string;
}

export interface Dictionary {
  app: {
    title: string;
    vsLine: string;
    tagline: string;
  };
  hub: {
    scoreboard: string;
  };
  stats: {
    game: string;
    wins: string;
    losses: string;
    ties: string;
    overall: string;
    tieDash: string;
  };
  /** Keyed by GameDefinition.id ("guess" | "rps" | "ttt"). */
  gamesMeta: Record<string, GameMeta>;
  common: {
    aiDifficulty: string;
    matchLength: string;
    easy: string;
    medium: string;
    hard: string;
    playAgain: string;
    changeSettings: string;
    you: string;
    ai: string;
    backLink: string;
    startMatch: string;
    youWinMatch: string;
    aiWinsMatch: string;
    finalScore: (you: number, ai: number) => string;
    roundsPlayed: string;
    returnToHub: string;
    howToPlay: string;
    close: string;
  };
  guess: {
    rules: ReactNode;
    rangeLabel: string;
    rangeOptions: { r50: string; r100: string; r500: string; custom: string };
    customRangeLabel: string;
    minPlaceholder: string;
    maxPlaceholder: string;
    difficultyTipLabel: string;
    difficultyTip: ReactNode;
    delayToggle: string;
    soundToggle: string;
    startGame: string;
    errorMinMax: string;
    errorMaxGtMin: string;
    errorRangeHuge: string;
    errorEnterNumber: string;
    errorWholeNumber: string;
    errorStayBetween: (min: number, max: number) => string;
    turnPlayer: string;
    turnAi: string;
    possibleRange: string;
    rangeCaptionSuffix: string;
    guessPlaceholder: string;
    guessButton: string;
    feedback: (who: string, guess: number, verdict: "high" | "low" | "correct") => string;
    logTitle: string;
    verdictHigh: string;
    verdictLow: string;
    verdictCorrect: string;
    youWin: string;
    aiWins: string;
    secretWas: string;
    yourGuesses: string;
    aiGuesses: string;
  };
  rps: {
    rules: ReactNode;
    difficultyTipLabel: string;
    difficultyTip: ReactNode;
    firstTo: (n: number) => string;
    moveLabels: { rock: string; paper: string; scissors: string };
    yourRoundWins: string;
    aiRoundWins: string;
    tallyYou: (score: number) => string;
    tallyGoal: (target: number) => string;
    tallyAi: (score: number) => string;
    pickMove: string;
    shaking: string;
    resultWin: (a: string, b: string) => string;
    resultLose: (a: string, b: string) => string;
    resultTie: (a: string) => string;
    logTitle: string;
    logYouWin: string;
    logAiWins: string;
    logTie: string;
  };
  ttt: {
    rules: ReactNode;
    difficultyTipLabel: string;
    difficultyTip: ReactNode;
    lengthOptions: { single: string; three: string; five: string };
    yourWins: string;
    aiWins: string;
    draws: string;
    tallyYou: (score: number) => string;
    tallyGoal: (target: number, draws: number) => string;
    tallyAi: (score: number) => string;
    yourTurn: string;
    choosePiece: string;
    chooseDestination: string;
    aiThinking: string;
    winRound: string;
    loseRound: string;
    drawRound: string;
    cellLabel: (n: number, cell: "X" | "O" | null) => string;
  };
  higherOrLower: {
    rules: ReactNode;
    difficultyTipLabel: string;
    difficultyTip: ReactNode;
    tenRounds: string;
    twentyRounds: string;
    aceRule: string;
    aceLow: string;
    aceHigh: string;
    allowSame: string;
    yourScore: string;
    aiScore: string;
    yourBestStreak: string;
    aiBestStreak: string;
    score: (value: number) => string;
    streak: (value: number) => string;
    best: (value: number) => string;
    roundProgress: (current: number, total: number) => string;
    cardsRemaining: (count: number) => string;
    currentCard: string;
    nextCard: string;
    choosePrediction: string;
    predictions: Record<"higher" | "lower" | "same", string>;
    revealFeedback: (playerCorrect: boolean, aiPrediction: string, aiCorrect: boolean) => string;
    historyTitle: string;
    historyPlayer: (prediction: string, correct: boolean) => string;
    historyAi: (prediction: string, correct: boolean) => string;
    endTitle: (winner: "player" | "ai" | "tie") => string;
  };
  memoryMatch: {
    rules: ReactNode;
    difficultyTipLabel: string;
    difficultyTip: ReactNode;
    boardSize: string;
    grid4: string;
    grid6: string;
    yourPairs: string;
    aiPairs: string;
    yourMoves: string;
    aiMoves: string;
    pairs: (count: number) => string;
    moves: (count: number) => string;
    yourTurn: string;
    aiTurn: string;
    aiThinking: string;
    chooseTiles: string;
    matchFound: (actor: string) => string;
    noMatch: (actor: string) => string;
    hiddenTile: string;
    visibleTile: (value: string) => string;
    solvedTile: string;
    endTitle: (winner: "player" | "ai" | "tie") => string;
  };
  connectFour: {
    rules: ReactNode;
    difficultyTipLabel: string;
    difficultyTip: ReactNode;
    singleRound: string;
    firstTo: (target: number) => string;
    yourWins: string;
    aiWins: string;
    draws: string;
    tallyYou: (score: number) => string;
    tallyGoal: (target: number, draws: number) => string;
    tallyAi: (score: number) => string;
    yourTurn: string;
    aiThinking: string;
    winRound: string;
    loseRound: string;
    drawRound: string;
    boardLabel: string;
    columnLabel: (column: number) => string;
  };
  nim: {
    rules: ReactNode;
    difficultyTipLabel: string;
    difficultyTip: ReactNode;
    ruleLabel: string;
    ruleTipLabel: string;
    ruleTip: ReactNode;
    ruleNormal: string;
    ruleMisere: string;
    randomizeLabel: string;
    lengthOptions: { single: string; three: string; five: string };
    yourWins: string;
    aiWins: string;
    totalMovesLabel: string;
    tallyYou: (score: number) => string;
    tallyGoal: (target: number) => string;
    tallyAi: (score: number) => string;
    yourTurn: string;
    aiThinking: string;
    chooseTokens: string;
    winRound: string;
    loseRound: string;
    boardLabel: string;
    emptyPile: string;
    tokenLabel: (pile: string, tokenNumber: number, pileSize: number) => string;
    selectionSummary: (pile: string, tokensRemoved: number, before: number, after: number) => string;
    clearSelection: string;
    confirmMove: string;
    logTitle: string;
    logEntry: (pile: string, tokensRemoved: number, before: number, after: number) => string;
    finalMoveSummary: (
      actor: string,
      pile: string,
      tokensRemoved: number,
      before: number,
      after: number,
    ) => string;
  };
  wordGuess: {
    rules: ReactNode;
    difficultyTipLabel: string;
    difficultyTip: ReactNode;
    category: string;
    categories: Record<"animals" | "countries" | "food" | "technology", string>;
    language: string;
    langEn: string;
    langEs: string;
    yourTurn: string;
    aiThinking: string;
    patternLabel: (pattern: string) => string;
    sharedBudget: string;
    budgetLabel: (used: number) => string;
    yourMistakes: string;
    aiMistakes: string;
    keyboardLabel: string;
    wordPlaceholder: string;
    guessWord: string;
    historyTitle: string;
    correctGuess: string;
    missCost: (cost: number) => string;
    feedback: (
      actor: string,
      kind: "letter" | "word",
      value: string,
      correct: boolean,
    ) => string;
    errors: Record<string, string>;
    endTitle: (winner: "player" | "ai" | "tie") => string;
  };
  blackjack: {
    rules: ReactNode;
    difficultyLabel: string;
    difficultyTipLabel: string;
    difficultyTip: ReactNode;
    lengthOptions: { three: string; five: string; ten: string };
    yourWins: string;
    aiWins: string;
    pushes: string;
    chipsLabel: string;
    tallyYou: (score: number) => string;
    tallyGoal: (target: number, pushes: number) => string;
    tallyAi: (score: number) => string;
    playerLabel: string;
    dealerLabel: string;
    holeCardLabel: string;
    hitButton: string;
    standButton: string;
    hintLabel: (action: "hit" | "stand") => string;
    totalLabel: (total: number, isSoft: boolean, isBust: boolean) => string;
    blackjackLabel: string;
    dealingStatus: string;
    yourTurn: string;
    dealerTurn: string;
    winRound: (blackjack: boolean) => string;
    loseRound: string;
    pushRound: string;
    logTitle: string;
    logEntry: (
      round: number,
      playerTotal: number,
      dealerTotal: number,
      result: "win" | "lose" | "push",
      blackjack: boolean,
    ) => string;
  };
  reactionTime: {
    rules: ReactNode;
    difficultyTipLabel: string;
    difficultyTip: ReactNode;
    firstTo: (n: number) => string;
    yourWins: string;
    aiWins: string;
    ties: string;
    tallyYou: (score: number) => string;
    tallyGoal: (target: number) => string;
    tallyAi: (score: number) => string;
    waitingLabel: string;
    readyLabel: string;
    goLabel: string;
    tapHint: string;
    yourTimeLabel: (ms: number | null) => string;
    aiTimeLabel: (ms: number | null) => string;
    playerFalseStartResult: string;
    aiFalseStartResult: string;
    winRound: string;
    loseRound: string;
    pushRound: string;
    logTitle: string;
    logEntry: (
      round: number,
      playerTimeMs: number | null,
      playerFalseStart: boolean,
      aiTimeMs: number,
      aiFalseStart: boolean,
      winner: "player" | "ai" | "tie",
    ) => string;
    avgYourLabel: string;
    avgAiLabel: string;
    noDataLabel: string;
    msSuffix: (ms: number) => string;
  };
  penaltyKick: {
    rules: ReactNode;
    difficultyTipLabel: string;
    difficultyTip: ReactNode;
    goals: string;
    stops: string;
    goalsCount: (count: number) => string;
    stopsCount: (count: number) => string;
    kickCount: (current: number, total: number) => string;
    aimPrompt: string;
    shooting: string;
    goal: string;
    saved: string;
    missed: string;
    power: string;
    shoot: string;
    goalLabel: string;
    kickHistory: string;
    endWin: string;
    endLoss: string;
    finalScore: (goals: number, stops: number) => string;
  };
  basketShot: {
    rules: ReactNode;
    difficultyTipLabel: string;
    difficultyTip: ReactNode;
    yourPoints: string;
    aiPoints: string;
    tallyYou: (score: number) => string;
    tallyAi: (score: number) => string;
    roundLabel: (round: number, total: number, points: number) => string;
    pointValue: (points: number) => string;
    releasePrompt: string;
    yourShot: string;
    madeShot: (points: number) => string;
    missedShot: string;
    aiShot: string;
    aiMade: (points: number) => string;
    aiMissed: string;
    meterLabel: string;
    early: string;
    perfect: string;
    late: string;
    shoot: string;
    courtLabel: string;
    historyLabel: string;
    endTitle: (winner: "player" | "ai" | "tie") => string;
    finalScore: (you: number, ai: number) => string;
  };
}

const en: Dictionary = {
  app: {
    title: "Mini-Game Hub",
    vsLine: "You vs AI",
    tagline: "Pick a game. Beat the machine.",
  },
  hub: {
    scoreboard: "Session scoreboard",
  },
  stats: {
    game: "Game",
    wins: "Wins",
    losses: "Losses",
    ties: "Ties",
    overall: "Σ Overall",
    tieDash: "–",
  },
  gamesMeta: {
    guess: {
      name: "Number Duel",
      description: "Race the AI to find the secret number. Binary-search brain vs yours.",
    },
    rps: {
      name: "Rock · Paper · Scissors",
      description: "Best-of-N duel. The AI studies your habits and predicts your next move.",
    },
    ttt: {
      name: "Tic-Tac-Toe",
      description: "Place three marks, then choose and move one each turn.",
    },
    "higher-or-lower": {
      name: "Higher or Lower",
      description: "Read the odds, predict the next card and outscore the AI.",
    },
    "memory-match": {
      name: "Memory Match",
      description: "Find matching pairs before an AI with fallible memory.",
    },
    "connect-four": {
      name: "Connect Four",
      description: "Drop red pieces, build four in a row and outthink the AI.",
    },
    nim: {
      name: "Nim",
      description: "Take tokens from the piles. Avoid the AI's nim-sum math.",
    },
    "word-guess": {
      name: "Word Guess",
      description: "Reveal the shared word before the AI exhausts the mistake budget.",
    },
    blackjack: {
      name: "Blackjack",
      description: "Beat the dealer's fixed rules without going over 21.",
    },
    "reaction-time": {
      name: "Reaction Time",
      description: "Wait for the signal, then react faster than the AI.",
    },
    "penalty-kick": {
      name: "Penalty Shootout",
      description: "Pick your corner, control the power and beat the goalkeeper.",
    },
    "basket-shot": {
      name: "Basket Challenge",
      description: "Time your release, sink 2- and 3-pointers and outscore the AI.",
    },
  },
  common: {
    aiDifficulty: "AI difficulty",
    matchLength: "Match length",
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
    playAgain: "Play again",
    changeSettings: "Change settings",
    you: "You",
    ai: "AI",
    backLink: "← Back to hub",
    startMatch: "Start match",
    youWinMatch: "You win the match!",
    aiWinsMatch: "AI wins the match!",
    finalScore: (you, ai) => `Final score ${you} – ${ai}`,
    roundsPlayed: "Rounds played",
    returnToHub: "Return to hub",
    howToPlay: "How to play",
    close: "Close",
  },
  guess: {
    rules: (
      <>
        <p>
          A secret number is hidden inside the range you pick. You and the AI take turns
          guessing it — <strong>you go first</strong>.
        </p>
        <p>
          After every guess you&apos;re told whether the secret is <strong>higher</strong> or{" "}
          <strong>lower</strong>. Use that to close in on it.
        </p>
        <p>The first to guess the exact number wins the round.</p>
      </>
    ),
    rangeLabel: "Number range",
    rangeOptions: { r50: "1 – 50", r100: "1 – 100", r500: "1 – 500", custom: "Custom" },
    customRangeLabel: "Custom range",
    minPlaceholder: "Min",
    maxPlaceholder: "Max",
    difficultyTipLabel: "How the AI guesses",
    difficultyTip: (
      <>
        The AI tracks the interval where the secret number can still be using{" "}
        <em>all visible clues</em>, including yours. On <strong>Hard</strong> it picks the midpoint
        (binary search — optimal, ~log₂(range) guesses). On <strong>Medium</strong> it picks near
        the midpoint with some noise. On <strong>Easy</strong> it picks a random number inside the
        remaining interval.
      </>
    ),
    delayToggle: "AI thinking delay (simulated pause before AI guesses)",
    soundToggle: "Sound effects",
    startGame: "Start game",
    errorMinMax: "Please enter both a min and a max number.",
    errorMaxGtMin: "Max must be greater than min.",
    errorRangeHuge: "That range is huge! Keep it within 1,000,000 numbers.",
    errorEnterNumber: "Type a number first!",
    errorWholeNumber: "Whole numbers only — no decimals.",
    errorStayBetween: (min, max) => `Stay between ${min} and ${max}.`,
    turnPlayer: "Your turn — enter a guess",
    turnAi: "AI is thinking",
    possibleRange: "Possible range:",
    rangeCaptionSuffix: "(based on all feedback so far)",
    guessPlaceholder: "Your guess…",
    guessButton: "Guess",
    feedback: (who, guess, verdict) =>
      verdict === "high"
        ? `${who} guessed ${guess} — too high!`
        : verdict === "low"
          ? `${who} guessed ${guess} — too low!`
          : `${who} guessed ${guess} — correct! 🎉`,
    logTitle: "Guess history",
    verdictHigh: "Too high ↓",
    verdictLow: "Too low ↑",
    verdictCorrect: "Correct! 🎯",
    youWin: "You win!",
    aiWins: "AI wins!",
    secretWas: "The secret number was",
    yourGuesses: "Your guesses",
    aiGuesses: "AI guesses",
  },
  rps: {
    rules: (
      <>
        <p>Each round, you and the AI secretly pick a move at the same time.</p>
        <p>
          <strong>Rock</strong> beats scissors, <strong>scissors</strong> beats paper,{" "}
          <strong>paper</strong> beats rock. Same move = tie, replay the round.
        </p>
        <p>First to reach the target number of round wins takes the match.</p>
      </>
    ),
    difficultyTipLabel: "How the RPS AI plays",
    difficultyTip: (
      <>
        <strong>Easy</strong> plays fully random. <strong>Medium</strong> counts which move you
        throw most and leans toward countering it. <strong>Hard</strong> combines your overall and
        recent habits, transitions and repeated patterns to predict your next throw.
      </>
    ),
    firstTo: (n) => `First to ${n}`,
    moveLabels: { rock: "Rock", paper: "Paper", scissors: "Scissors" },
    yourRoundWins: "Your round wins",
    aiRoundWins: "AI round wins",
    tallyYou: (score) => `You ${score}`,
    tallyGoal: (target) => `first to ${target}`,
    tallyAi: (score) => `${score} AI`,
    pickMove: "Pick your move!",
    shaking: "Rock… paper… scissors…",
    resultWin: (a, b) => `You win the round! ${a} beats ${b}`,
    resultLose: (a, b) => `AI wins the round! ${a} beats ${b}`,
    resultTie: (a) => `Tie — both threw ${a}`,
    logTitle: "Round history",
    logYouWin: "You win",
    logAiWins: "AI wins",
    logTie: "Tie",
  },
  ttt: {
    rules: (
      <>
        <p>
          You are <strong>X</strong> and move first; the AI is <strong>O</strong>. This is a
          movement variant, not classic tic-tac-toe.
        </p>
        <p>
          <strong>Phase 1:</strong> each side places three marks on empty cells.
        </p>
        <p>
          <strong>Phase 2:</strong> on your turn pick one of your own marks and slide it to any
          empty cell.
        </p>
        <p>Line up three in a row — horizontal, vertical or diagonal — to win the round.</p>
      </>
    ),
    difficultyTipLabel: "How the tic-tac-toe AI plays",
    difficultyTip: (
      <>
        <strong>Easy</strong> picks a random empty cell. <strong>Medium</strong> takes an
        immediate win or blocks yours, then looks several moves ahead. <strong>Hard</strong> uses
        a deeper minimax search with alpha-beta pruning. Each player places three active marks;
        after that, choose one of your own marks and move it to any empty cell.
      </>
    ),
    lengthOptions: { single: "Single game", three: "First to 3", five: "First to 5" },
    yourWins: "Your wins",
    aiWins: "AI wins",
    draws: "Draws",
    tallyYou: (score) => `You (X) ${score}`,
    tallyGoal: (target, draws) => `first to ${target}${draws > 0 ? ` · ${draws} draws` : ""}`,
    tallyAi: (score) => `${score} (O) AI`,
    yourTurn: "Your turn — place an X",
    choosePiece: "Your turn — choose an X to move",
    chooseDestination: "Now choose an empty destination",
    aiThinking: "AI is thinking",
    winRound: "You win the round! Three in a row 🎉",
    loseRound: "AI wins the round — it got three in a row.",
    drawRound: "Draw — nobody lined up three.",
    cellLabel: (n, cell) => `Cell ${n}${cell ? `, taken by ${cell}` : ", empty"}`,
  },
  higherOrLower: {
    rules: (
      <>
        <p>
          A card is shown. Predict whether the <strong>next</strong> card will be{" "}
          <strong>higher</strong> or <strong>lower</strong> (or <strong>Same</strong>, if you
          enable it).
        </p>
        <p>
          You and the AI both predict every round, in parallel. A correct call scores a point and
          extends your streak.
        </p>
        <p>
          The Ace can count low (1) or high (14) — your choice at setup. Highest score after all
          the cards wins; ties break on best streak.
        </p>
      </>
    ),
    difficultyTipLabel: "How the Higher or Lower AI plays",
    difficultyTip: (
      <>
        <strong>Easy</strong> randomly chooses Higher or Lower. <strong>Medium</strong> uses the
        standard rank distribution without remembering dealt cards. <strong>Hard</strong> counts
        every remaining card and selects the outcome with the highest exact probability.
      </>
    ),
    tenRounds: "10 cards",
    twentyRounds: "20 cards",
    aceRule: "Ace value",
    aceLow: "Ace low (1)",
    aceHigh: "Ace high (14)",
    allowSame: "Allow Same as a prediction",
    yourScore: "Your score",
    aiScore: "AI score",
    yourBestStreak: "Your best streak",
    aiBestStreak: "AI best streak",
    score: (value) => `Score ${value}`,
    streak: (value) => `Streak ${value}`,
    best: (value) => `Best ${value}`,
    roundProgress: (current, total) => `Card ${current + 1} of ${total}`,
    cardsRemaining: (count) => `${count} left`,
    currentCard: "Current",
    nextCard: "Next",
    choosePrediction: "Will the next card be higher or lower?",
    predictions: { higher: "Higher", lower: "Lower", same: "Same" },
    revealFeedback: (playerCorrect, aiPrediction, aiCorrect) =>
      `${playerCorrect ? "Correct!" : "Incorrect."} AI chose ${aiPrediction} and was ${aiCorrect ? "correct" : "wrong"}.`,
    historyTitle: "Card history",
    historyPlayer: (prediction, correct) =>
      `You: ${prediction} ${correct ? "✓" : "✕"}`,
    historyAi: (prediction, correct) => `AI: ${prediction} ${correct ? "✓" : "✕"}`,
    endTitle: (winner) =>
      winner === "player" ? "You win the match!" : winner === "ai" ? "AI wins the match!" : "Match tied!",
  },
  memoryMatch: {
    rules: (
      <>
        <p>
          All tiles start face down. On your turn, flip <strong>two</strong> tiles —{" "}
          <strong>you go first</strong>.
        </p>
        <p>
          Match a pair and you score it and <strong>play again</strong>. No match — both flip back
          and the turn passes to the AI.
        </p>
        <p>Whoever has the most pairs once the whole board is cleared wins.</p>
      </>
    ),
    difficultyTipLabel: "How the Memory Match AI remembers",
    difficultyTip: (
      <>
        The AI only learns a tile when either side reveals it. <strong>Easy</strong> retains about
        30% of observations, <strong>Medium</strong> 60%, and <strong>Hard</strong> 93%. It always
        uses a matching pair it remembers and otherwise prefers unseen positions.
      </>
    ),
    boardSize: "Board size",
    grid4: "4 × 4 · 8 pairs",
    grid6: "6 × 6 · 18 pairs",
    yourPairs: "Your pairs",
    aiPairs: "AI pairs",
    yourMoves: "Your moves",
    aiMoves: "AI moves",
    pairs: (count) => `${count} pairs`,
    moves: (count) => `${count} moves`,
    yourTurn: "Your turn",
    aiTurn: "AI turn",
    aiThinking: "AI is remembering",
    chooseTiles: "Choose two tiles",
    matchFound: (actor) => `${actor} found a pair and plays again!`,
    noMatch: (actor) => `${actor} did not find a pair.`,
    hiddenTile: "Hidden tile",
    visibleTile: (value) => `Revealed tile: ${value}`,
    solvedTile: "Solved pair",
    endTitle: (winner) =>
      winner === "player" ? "You win the board!" : winner === "ai" ? "AI wins the board!" : "Board tied!",
  },
  connectFour: {
    rules: (
      <>
        <p>
          Pick a column to drop your <strong>red</strong> piece into; it falls to the lowest empty
          slot. You move first, the AI drops <strong>yellow</strong>.
        </p>
        <p>
          Get <strong>four of your color in a row</strong> — horizontal, vertical or diagonal — to
          win the round.
        </p>
        <p>If the board fills with no four-in-a-row, the round is a draw.</p>
      </>
    ),
    difficultyTipLabel: "How the Connect Four AI plays",
    difficultyTip: (
      <>
        <strong>Easy</strong> plays mostly at random but often blocks an immediate win.{" "}
        <strong>Medium</strong> searches three plies ahead. <strong>Hard</strong> searches six
        plies with alpha-beta pruning, center-first move ordering and a stronger threat heuristic.
      </>
    ),
    singleRound: "Single round",
    firstTo: (target) => `First to ${target}`,
    yourWins: "Your round wins",
    aiWins: "AI round wins",
    draws: "Draws",
    tallyYou: (score) => `You (Red) ${score}`,
    tallyGoal: (target, draws) => `first to ${target}${draws ? ` · ${draws} draws` : ""}`,
    tallyAi: (score) => `${score} (Yellow) AI`,
    yourTurn: "Your turn — choose a column",
    aiThinking: "AI is thinking",
    winRound: "You connected four!",
    loseRound: "AI connected four.",
    drawRound: "Draw — the board is full.",
    boardLabel: "Connect Four board",
    columnLabel: (column) => `Drop a red piece in column ${column}`,
  },
  nim: {
    rules: (
      <>
        <p>
          Several piles of tokens sit on the table. On your turn, remove <strong>any number of
          tokens (at least one)</strong> from a <strong>single</strong> pile — <strong>you go
          first</strong>.
        </p>
        <p>
          Tap a token to select it and every token after it in that pile, then press Confirm.
        </p>
        <p>
          <strong>Normal:</strong> taking the very last token wins. <strong>Misère:</strong> taking
          the last token loses. Pick the rule at setup.
        </p>
      </>
    ),
    difficultyTipLabel: "How the Nim AI plays",
    difficultyTip: (
      <>
        The AI&apos;s strategy is built on the <strong>nim-sum</strong> — the XOR of all
        pile sizes. <strong>Easy</strong> ignores it completely and moves at random.{" "}
        <strong>Medium</strong> calculates the optimal nim-sum move but only takes it
        about 65% of the time, otherwise moving randomly. <strong>Hard</strong> always
        takes the mathematically optimal move when one exists, for either rule — it is
        unbeatable from a winning position.
      </>
    ),
    ruleLabel: "Win condition",
    ruleTipLabel: "Normal vs Misère",
    ruleTip: (
      <>
        <strong>Normal play:</strong> whoever takes the last token wins. <strong>Misère
        play:</strong> whoever takes the last token loses instead — this flips the
        optimal strategy entirely, especially in the endgame once every pile is down
        to 0 or 1 tokens.
      </>
    ),
    ruleNormal: "Normal — last token wins",
    ruleMisere: "Misère — last token loses",
    randomizeLabel: "Randomize starting piles",
    lengthOptions: { single: "Single game", three: "First to 3", five: "First to 5" },
    yourWins: "Your wins",
    aiWins: "AI wins",
    totalMovesLabel: "Total moves",
    tallyYou: (score) => `You ${score}`,
    tallyGoal: (target) => `first to ${target}`,
    tallyAi: (score) => `${score} AI`,
    yourTurn: "Your turn — pick tokens to remove from one pile",
    aiThinking: "AI is calculating the nim-sum",
    chooseTokens: "Tap Confirm to remove the highlighted tokens",
    winRound: "You win the round!",
    loseRound: "AI wins the round.",
    boardLabel: "Nim piles",
    emptyPile: "(empty)",
    tokenLabel: (pile, tokenNumber, pileSize) =>
      `Pile ${pile}, token ${tokenNumber} of ${pileSize} — removes this token and every token after it`,
    selectionSummary: (pile, tokensRemoved, before, after) =>
      `Remove ${tokensRemoved} from Pile ${pile} (${before} → ${after})`,
    clearSelection: "Clear selection",
    confirmMove: "Confirm move",
    logTitle: "Move history",
    logEntry: (pile, tokensRemoved, before, after) =>
      `removed ${tokensRemoved} from Pile ${pile} (${before}→${after})`,
    finalMoveSummary: (actor, pile, tokensRemoved, before, after) =>
      `Final move: ${actor} removed ${tokensRemoved} from Pile ${pile} (${before} → ${after}).`,
  },
  wordGuess: {
    rules: (
      <>
        <p>
          One hidden word, shared with the AI. You take turns — <strong>you go first</strong>.
        </p>
        <p>
          Guess a <strong>letter</strong> (reveals every spot it appears) or guess the{" "}
          <strong>whole word</strong>. A correct guess earns you another turn.
        </p>
        <p>
          Mistakes come out of a <strong>shared budget of 8</strong>: a wrong letter costs 1, a
          wrong word costs 2.
        </p>
        <p>
          Name the word to win. If the budget runs out first, whoever made{" "}
          <strong>fewer mistakes</strong> wins.
        </p>
      </>
    ),
    difficultyTipLabel: "How the Word Guess AI plays",
    difficultyTip: (
      <>
        <strong>Easy</strong> picks unused letters randomly. <strong>Medium</strong> follows
        English letter frequency and guesses a word when very few candidates remain.{" "}
        <strong>Hard</strong> continuously filters the word list and chooses the letter that
        most evenly splits the remaining candidates.
      </>
    ),
    category: "Word category",
    categories: {
      animals: "Animals",
      countries: "Countries",
      food: "Food",
      technology: "Technology",
    },
    language: "Word language",
    langEn: "English",
    langEs: "Spanish",
    yourTurn: "Your turn — choose a letter or guess the word",
    aiThinking: "AI is analysing the word",
    patternLabel: (pattern) => `Word pattern: ${pattern}`,
    sharedBudget: "Shared mistake budget",
    budgetLabel: (used) => `${used} of 8 shared mistakes used`,
    yourMistakes: "Your mistakes",
    aiMistakes: "AI mistakes",
    keyboardLabel: "Letter keyboard",
    wordPlaceholder: "Guess the full word…",
    guessWord: "Guess word",
    historyTitle: "Guess history",
    correctGuess: "Correct — extra turn",
    missCost: (cost) => `Miss · +${cost}`,
    feedback: (actor, kind, value, correct) =>
      `${actor} guessed ${kind === "letter" ? "letter" : "word"} ${value} — ${
        correct ? "correct!" : "incorrect."
      }`,
    errors: {
      letter: "Choose exactly one letter from A to Z.",
      used: "That letter has already been guessed.",
      word: "Use letters only for a full-word guess.",
      usedWord: "That word has already been attempted.",
    },
    endTitle: (winner) =>
      winner === "player" ? "You win the round!" : winner === "ai" ? "AI wins the round." : "Round drawn!",
  },
  blackjack: {
    rules: (
      <>
        <p>
          Get closer to <strong>21</strong> than the dealer without going over. Number cards are
          face value, face cards are 10, an <strong>Ace is 1 or 11</strong> (whichever helps).
        </p>
        <p>
          <strong>Hit</strong> to draw another card, <strong>Stand</strong> to hold. Go over 21 and
          you bust — an instant loss.
        </p>
        <p>
          When you stand, the dealer plays by a fixed rule: hit on 16 or below, stand on 17 or
          above. A two-card 21 is a <strong>Blackjack</strong> and beats a regular 21.
        </p>
        <p>Equal totals are a <strong>push</strong> (tie).</p>
      </>
    ),
    difficultyLabel: "Player help level",
    difficultyTipLabel: "What each level shows you (the dealer's play never changes)",
    difficultyTip: (
      <>
        The dealer always follows the same fixed rule — hit on 16 or below, stand on 17 or
        above — no matter what you pick. <strong>Easy</strong> shows a live basic-strategy
        hint (Hit/Stand) plus your hand total. <strong>Medium</strong> shows your hand total
        (soft/hard) with no hint. <strong>Hard</strong> hides your total entirely — you track
        your own hand, like at a real table.
      </>
    ),
    lengthOptions: { three: "First to 3", five: "First to 5", ten: "First to 10" },
    yourWins: "Your wins",
    aiWins: "Dealer wins",
    pushes: "Pushes",
    chipsLabel: "Chips",
    tallyYou: (score) => `You ${score}`,
    tallyGoal: (target, pushes) => `first to ${target}${pushes > 0 ? ` · ${pushes} pushes` : ""}`,
    tallyAi: (score) => `${score} Dealer`,
    playerLabel: "You",
    dealerLabel: "Dealer",
    holeCardLabel: "Dealer's hidden card",
    hitButton: "Hit",
    standButton: "Stand",
    hintLabel: (action) => `Suggested: ${action === "hit" ? "Hit" : "Stand"}`,
    totalLabel: (total, isSoft, isBust) =>
      isBust ? `Bust (${total})` : isSoft ? `Soft ${total}` : `${total}`,
    blackjackLabel: "Blackjack!",
    dealingStatus: "Dealing…",
    yourTurn: "Your turn — Hit or Stand?",
    dealerTurn: "Dealer is playing",
    winRound: (blackjack) => (blackjack ? "Blackjack! You win the round!" : "You win the round!"),
    loseRound: "Dealer wins the round.",
    pushRound: "Push — no winner this round.",
    logTitle: "Round history",
    logEntry: (round, playerTotal, dealerTotal, result, blackjack) =>
      `Round ${round}: Player ${playerTotal} vs Dealer ${dealerTotal} — ${
        result === "win" ? (blackjack ? "Blackjack win" : "Win") : result === "lose" ? "Loss" : "Push"
      }`,
  },
  reactionTime: {
    rules: (
      <>
        <p>
          Wait for the box to turn <strong>green</strong>, then tap or click it as fast as you can.
          You and the AI race the same signal.
        </p>
        <p>
          Tapping <strong>before</strong> green is a <strong>false start</strong> and loses the
          round instantly — hold your nerve.
        </p>
        <p>Whoever reacts faster wins the round. First to the target wins the match.</p>
      </>
    ),
    difficultyTipLabel: "How the AI's reflexes are tuned",
    difficultyTip: (
      <>
        <strong>Easy</strong> reacts slowly (400–700ms) and sometimes jumps the gun (~13% of
        rounds). <strong>Medium</strong> reacts like a solid average human (250–400ms, ~5% false
        starts). <strong>Hard</strong> reacts near the floor of realistic human reflexes
        (150–220ms, ~1.5% false starts) — genuinely tough to beat.
      </>
    ),
    firstTo: (n) => `First to ${n}`,
    yourWins: "Your wins",
    aiWins: "AI wins",
    ties: "Ties",
    tallyYou: (score) => `You ${score}`,
    tallyGoal: (target) => `first to ${target}`,
    tallyAi: (score) => `${score} AI`,
    waitingLabel: "Get ready…",
    readyLabel: "Wait for green…",
    goLabel: "GO! Tap now!",
    tapHint: "Tap or click the box",
    yourTimeLabel: (ms) => `You: ${ms === null ? "—" : `${ms}ms`}`,
    aiTimeLabel: (ms) => `AI: ${ms === null ? "—" : `${ms}ms`}`,
    playerFalseStartResult: "False Start! You clicked before the signal — AI wins the round.",
    aiFalseStartResult: "AI False Start! It jumped the gun — you win the round.",
    winRound: "You win the round!",
    loseRound: "AI wins the round.",
    pushRound: "Push — identical reaction!",
    logTitle: "Round history",
    logEntry: (round, playerTimeMs, playerFalseStart, aiTimeMs, aiFalseStart, winner) =>
      `Round ${round}: You ${
        playerFalseStart ? "false start" : playerTimeMs === null ? "—" : `${playerTimeMs}ms`
      } vs AI ${aiFalseStart ? "false start" : `${aiTimeMs}ms`} — ${
        winner === "player" ? "You win" : winner === "ai" ? "AI wins" : "Push"
      }`,
    avgYourLabel: "Your avg reaction",
    avgAiLabel: "AI avg reaction",
    noDataLabel: "—",
    msSuffix: (ms) => `${ms}ms`,
  },
  penaltyKick: {
    rules: (
      <>
        <p>
          Take <strong>five penalties</strong>. Click or tap inside the goal
          to choose where to aim, set the power and shoot.
        </p>
        <p>
          More power makes the ball harder to save, but extreme power reduces
          accuracy and can send it wide.
        </p>
        <p>Score at least three goals to win the shootout.</p>
      </>
    ),
    difficultyTipLabel: "How the goalkeeper reacts",
    difficultyTip: (
      <>
        On <strong>Easy</strong>, the goalkeeper usually guesses. On{" "}
        <strong>Medium</strong>, they read some shots. On <strong>Hard</strong>,
        they anticipate most kicks and cover more of the goal.
      </>
    ),
    goals: "Goals",
    stops: "Saves and misses",
    goalsCount: (count) => `${count} goals`,
    stopsCount: (count) => `${count} stopped`,
    kickCount: (current, total) => `Kick ${Math.min(current, total)} of ${total}`,
    aimPrompt: "Pick a spot in the goal, then shoot",
    shooting: "The ball is flying…",
    goal: "GOAL!",
    saved: "Saved by the goalkeeper!",
    missed: "Wide! The shot missed the goal.",
    power: "Power",
    shoot: "Shoot",
    goalLabel: "Goal: click or tap to choose your aim",
    kickHistory: "Penalty history",
    endWin: "You win the shootout!",
    endLoss: "The goalkeeper wins the shootout.",
    finalScore: (goals, stops) => `${goals} goals · ${stops} stopped`,
  },
  basketShot: {
    rules: (
      <>
        <p>
          You and the AI take <strong>five shots each</strong>, mixing
          two- and three-pointers.
        </p>
        <p>
          The timing marker sweeps across the shot meter. Press{" "}
          <strong>Shoot</strong> as close to the green centre as possible:
          a perfect release has the best chance to score.
        </p>
        <p>The player with the most points after five rounds wins.</p>
      </>
    ),
    difficultyTipLabel: "How difficulty changes the challenge",
    difficultyTip: (
      <>
        Higher difficulty makes the meter move faster and increases the
        AI&apos;s shooting percentage. Three-pointers are harder for both
        players on every level.
      </>
    ),
    yourPoints: "Your points",
    aiPoints: "AI points",
    tallyYou: (score) => `You ${score}`,
    tallyAi: (score) => `${score} AI`,
    roundLabel: (round, total, points) =>
      `Round ${round}/${total} · ${points}PT`,
    pointValue: (points) => `${points} points`,
    releasePrompt: "Stop the marker in the green zone",
    yourShot: "Your shot is in the air…",
    madeShot: (points) => `Swish! You score ${points}.`,
    missedShot: "Off the rim! No points.",
    aiShot: "The AI takes its shot…",
    aiMade: (points) => `The AI scores ${points}.`,
    aiMissed: "The AI misses!",
    meterLabel: "Shot timing meter",
    early: "Early",
    perfect: "Perfect",
    late: "Late",
    shoot: "Shoot",
    courtLabel: "Basketball court and hoop",
    historyLabel: "Round results: player and AI",
    endTitle: (winner) =>
      winner === "player"
        ? "You win the challenge!"
        : winner === "ai"
          ? "The AI wins the challenge."
          : "The challenge ends tied!",
    finalScore: (you, ai) => `Final score ${you} – ${ai}`,
  },
};

const es: Dictionary = {
  app: {
    title: "Mini-Game Hub",
    vsLine: "Tú vs IA",
    tagline: "Elige un juego. Vence a la máquina.",
  },
  hub: {
    scoreboard: "Marcador de la sesión",
  },
  stats: {
    game: "Juego",
    wins: "Victorias",
    losses: "Derrotas",
    ties: "Empates",
    overall: "Σ Total",
    tieDash: "–",
  },
  gamesMeta: {
    guess: {
      name: "Duelo de Números",
      description: "Compite con la IA por adivinar el número secreto. Búsqueda binaria vs tú.",
    },
    rps: {
      name: "Piedra · Papel · Tijera",
      description: "Duelo al mejor de N. La IA estudia tus hábitos y predice tu próxima jugada.",
    },
    ttt: {
      name: "Tres en Raya",
      description: "Coloca tres fichas; después elige y mueve una en cada turno.",
    },
    "higher-or-lower": {
      name: "Mayor o Menor",
      description: "Calcula las probabilidades, predice la carta y supera a la IA.",
    },
    "memory-match": {
      name: "Juego de Memoria",
      description: "Encuentra parejas antes que una IA con memoria imperfecta.",
    },
    "connect-four": {
      name: "Cuatro en Raya",
      description: "Deja caer fichas rojas, conecta cuatro y supera a la IA.",
    },
    nim: {
      name: "Nim",
      description: "Retira fichas de los montones. Cuidado con la matemática de la IA.",
    },
    "word-guess": {
      name: "Adivina la Palabra",
      description: "Descubre la palabra compartida antes de que la IA agote los fallos.",
    },
    blackjack: {
      name: "Blackjack",
      description: "Vence al crupier, que juega con reglas fijas, sin pasarte de 21.",
    },
    "reaction-time": {
      name: "Tiempo de Reacción",
      description: "Espera la señal y reacciona más rápido que la IA.",
    },
    "penalty-kick": {
      name: "Tiros a Portería",
      description: "Elige la escuadra, controla la potencia y bate al portero.",
    },
    "basket-shot": {
      name: "Desafío de Canasta",
      description: "Calcula el momento del tiro, encesta de 2 y 3 y supera a la IA.",
    },
  },
  common: {
    aiDifficulty: "Dificultad de la IA",
    matchLength: "Duración de la partida",
    easy: "Fácil",
    medium: "Media",
    hard: "Difícil",
    playAgain: "Jugar de nuevo",
    changeSettings: "Cambiar ajustes",
    you: "Tú",
    ai: "IA",
    backLink: "← Volver al hub",
    startMatch: "Iniciar partida",
    youWinMatch: "¡Ganas la partida!",
    aiWinsMatch: "¡Gana la IA la partida!",
    finalScore: (you, ai) => `Marcador final ${you} – ${ai}`,
    roundsPlayed: "Rondas jugadas",
    returnToHub: "Volver al hub",
    howToPlay: "Cómo jugar",
    close: "Cerrar",
  },
  guess: {
    rules: (
      <>
        <p>
          Hay un número secreto oculto dentro del rango que elijas. Tú y la IA os turnáis para
          adivinarlo — <strong>empiezas tú</strong>.
        </p>
        <p>
          Tras cada intento se te dice si el secreto es <strong>mayor</strong> o{" "}
          <strong>menor</strong>. Úsalo para acercarte.
        </p>
        <p>El primero que acierte el número exacto gana la ronda.</p>
      </>
    ),
    rangeLabel: "Rango de números",
    rangeOptions: { r50: "1 – 50", r100: "1 – 100", r500: "1 – 500", custom: "Personalizado" },
    customRangeLabel: "Rango personalizado",
    minPlaceholder: "Mín",
    maxPlaceholder: "Máx",
    difficultyTipLabel: "Cómo adivina la IA",
    difficultyTip: (
      <>
        La IA sigue el intervalo donde aún puede estar el número secreto usando{" "}
        <em>todas las pistas visibles</em>, incluidas las tuyas. En <strong>Difícil</strong> elige
        el punto medio
        exacto (búsqueda binaria — óptimo, ~log₂(rango) intentos). En <strong>Media</strong> elige
        cerca del punto medio con algo de ruido. En <strong>Fácil</strong> elige un número
        aleatorio dentro del intervalo restante.
      </>
    ),
    delayToggle: "Pausa de la IA al pensar (simula que reflexiona antes de adivinar)",
    soundToggle: "Efectos de sonido",
    startGame: "Empezar partida",
    errorMinMax: "Introduce un mínimo y un máximo.",
    errorMaxGtMin: "El máximo debe ser mayor que el mínimo.",
    errorRangeHuge: "¡Ese rango es enorme! Mantenlo dentro de 1.000.000 de números.",
    errorEnterNumber: "¡Escribe un número primero!",
    errorWholeNumber: "Solo números enteros — sin decimales.",
    errorStayBetween: (min, max) => `Mantente entre ${min} y ${max}.`,
    turnPlayer: "Tu turno — introduce un número",
    turnAi: "La IA está pensando",
    possibleRange: "Rango posible:",
    rangeCaptionSuffix: "(según toda la información hasta ahora)",
    guessPlaceholder: "Tu número…",
    guessButton: "Adivinar",
    feedback: (who, guess, verdict) =>
      verdict === "high"
        ? `${who} dijo ${guess} — ¡muy alto!`
        : verdict === "low"
          ? `${who} dijo ${guess} — ¡muy bajo!`
          : `${who} dijo ${guess} — ¡correcto! 🎉`,
    logTitle: "Historial de intentos",
    verdictHigh: "Muy alto ↓",
    verdictLow: "Muy bajo ↑",
    verdictCorrect: "¡Correcto! 🎯",
    youWin: "¡Ganas!",
    aiWins: "¡Gana la IA!",
    secretWas: "El número secreto era",
    yourGuesses: "Tus intentos",
    aiGuesses: "Intentos de la IA",
  },
  rps: {
    rules: (
      <>
        <p>Cada ronda, tú y la IA elegís una jugada en secreto a la vez.</p>
        <p>
          <strong>Piedra</strong> vence a tijera, <strong>tijera</strong> vence a papel,{" "}
          <strong>papel</strong> vence a piedra. Misma jugada = empate, se repite la ronda.
        </p>
        <p>El primero que alcance el número objetivo de rondas ganadas se lleva la partida.</p>
      </>
    ),
    difficultyTipLabel: "Cómo juega la IA a piedra, papel o tijera",
    difficultyTip: (
      <>
        <strong>Fácil</strong> juega totalmente al azar. <strong>Media</strong> cuenta qué jugada
        lanzas más y tiende a contrarrestarla. <strong>Difícil</strong> combina tus hábitos
        generales y recientes, transiciones y patrones repetidos para predecir tu próxima jugada.
      </>
    ),
    firstTo: (n) => `Primero a ${n}`,
    moveLabels: { rock: "Piedra", paper: "Papel", scissors: "Tijera" },
    yourRoundWins: "Rondas ganadas por ti",
    aiRoundWins: "Rondas ganadas por la IA",
    tallyYou: (score) => `Tú ${score}`,
    tallyGoal: (target) => `primero a ${target}`,
    tallyAi: (score) => `${score} IA`,
    pickMove: "¡Elige tu jugada!",
    shaking: "Piedra… papel… tijera…",
    resultWin: (a, b) => `¡Ganas la ronda! ${a} vence a ${b}`,
    resultLose: (a, b) => `¡Gana la IA la ronda! ${a} vence a ${b}`,
    resultTie: (a) => `Empate — ambos lanzasteis ${a}`,
    logTitle: "Historial de rondas",
    logYouWin: "Ganas tú",
    logAiWins: "Gana la IA",
    logTie: "Empate",
  },
  ttt: {
    rules: (
      <>
        <p>
          Tú eres <strong>X</strong> y empiezas; la IA es <strong>O</strong>. Es una variante con
          movimiento, no el tres en raya clásico.
        </p>
        <p>
          <strong>Fase 1:</strong> cada lado coloca tres fichas en casillas vacías.
        </p>
        <p>
          <strong>Fase 2:</strong> en tu turno, elige una ficha tuya y deslízala a cualquier
          casilla vacía.
        </p>
        <p>Alinea tres en raya — horizontal, vertical o diagonal — para ganar la ronda.</p>
      </>
    ),
    difficultyTipLabel: "Cómo juega la IA al tres en raya",
    difficultyTip: (
      <>
        <strong>Fácil</strong> elige una casilla vacía al azar. <strong>Media</strong> aprovecha
        una victoria inmediata o bloquea la tuya y después anticipa varias jugadas.{" "}
        <strong>Difícil</strong> usa una búsqueda minimax más profunda con poda alfa-beta. Cada
        jugador coloca tres fichas; después elige una ficha propia y la mueve a cualquier
        casilla vacía.
      </>
    ),
    lengthOptions: { single: "Partida única", three: "Primero a 3", five: "Primero a 5" },
    yourWins: "Tus victorias",
    aiWins: "Victorias de la IA",
    draws: "Empates",
    tallyYou: (score) => `Tú (X) ${score}`,
    tallyGoal: (target, draws) => `primero a ${target}${draws > 0 ? ` · ${draws} empates` : ""}`,
    tallyAi: (score) => `${score} (O) IA`,
    yourTurn: "Tu turno — coloca una X",
    choosePiece: "Tu turno — elige una X para mover",
    chooseDestination: "Ahora elige una casilla vacía",
    aiThinking: "La IA está pensando",
    winRound: "¡Ganas la ronda! Tres en raya 🎉",
    loseRound: "Gana la IA la ronda — consiguió tres en raya.",
    drawRound: "Empate — nadie alineó tres.",
    cellLabel: (n, cell) => `Casilla ${n}${cell ? `, ocupada por ${cell}` : ", vacía"}`,
  },
  higherOrLower: {
    rules: (
      <>
        <p>
          Se muestra una carta. Predice si la <strong>siguiente</strong> será{" "}
          <strong>mayor</strong> o <strong>menor</strong> (o <strong>Igual</strong>, si lo
          activas).
        </p>
        <p>
          Tú y la IA predecís cada ronda, en paralelo. Un acierto suma un punto y alarga tu racha.
        </p>
        <p>
          El As puede valer bajo (1) o alto (14) — tú eliges en los ajustes. Gana quien tenga más
          puntos al final; los empates se deciden por la mejor racha.
        </p>
      </>
    ),
    difficultyTipLabel: "Cómo juega la IA a Mayor o Menor",
    difficultyTip: (
      <>
        <strong>Fácil</strong> elige Mayor o Menor al azar. <strong>Media</strong> usa la
        distribución normal de rangos sin recordar las cartas jugadas. <strong>Difícil</strong>{" "}
        cuenta cada carta restante y elige el resultado con la probabilidad exacta más alta.
      </>
    ),
    tenRounds: "10 cartas",
    twentyRounds: "20 cartas",
    aceRule: "Valor del as",
    aceLow: "As bajo (1)",
    aceHigh: "As alto (14)",
    allowSame: "Permitir Igual como predicción",
    yourScore: "Tu puntuación",
    aiScore: "Puntuación IA",
    yourBestStreak: "Tu mejor racha",
    aiBestStreak: "Mejor racha IA",
    score: (value) => `Puntos ${value}`,
    streak: (value) => `Racha ${value}`,
    best: (value) => `Récord ${value}`,
    roundProgress: (current, total) => `Carta ${current + 1} de ${total}`,
    cardsRemaining: (count) => `${count} restantes`,
    currentCard: "Actual",
    nextCard: "Siguiente",
    choosePrediction: "¿La siguiente carta será mayor o menor?",
    predictions: { higher: "Mayor", lower: "Menor", same: "Igual" },
    revealFeedback: (playerCorrect, aiPrediction, aiCorrect) =>
      `${playerCorrect ? "¡Correcto!" : "Incorrecto."} La IA eligió ${aiPrediction} y ${aiCorrect ? "acertó" : "falló"}.`,
    historyTitle: "Historial de cartas",
    historyPlayer: (prediction, correct) =>
      `Tú: ${prediction} ${correct ? "✓" : "✕"}`,
    historyAi: (prediction, correct) => `IA: ${prediction} ${correct ? "✓" : "✕"}`,
    endTitle: (winner) =>
      winner === "player" ? "¡Ganas la partida!" : winner === "ai" ? "¡Gana la IA!" : "¡Partida empatada!",
  },
  memoryMatch: {
    rules: (
      <>
        <p>
          Todas las fichas empiezan boca abajo. En tu turno, gira <strong>dos</strong> fichas —{" "}
          <strong>empiezas tú</strong>.
        </p>
        <p>
          Si haces pareja, la anotas y <strong>vuelves a jugar</strong>. Si no, ambas se giran de
          nuevo y el turno pasa a la IA.
        </p>
        <p>Quien tenga más parejas al despejar todo el tablero gana.</p>
      </>
    ),
    difficultyTipLabel: "Cómo recuerda la IA del Juego de Memoria",
    difficultyTip: (
      <>
        La IA solo aprende una ficha cuando alguien la revela. En <strong>Fácil</strong> retiene
        cerca del 30% de lo visto, en <strong>Media</strong> el 60% y en <strong>Difícil</strong>{" "}
        el 93%. Siempre aprovecha una pareja que recuerde y, si no conoce ninguna, prefiere
        posiciones nuevas.
      </>
    ),
    boardSize: "Tamaño del tablero",
    grid4: "4 × 4 · 8 parejas",
    grid6: "6 × 6 · 18 parejas",
    yourPairs: "Tus parejas",
    aiPairs: "Parejas de la IA",
    yourMoves: "Tus movimientos",
    aiMoves: "Movimientos IA",
    pairs: (count) => `${count} parejas`,
    moves: (count) => `${count} movimientos`,
    yourTurn: "Tu turno",
    aiTurn: "Turno de la IA",
    aiThinking: "La IA está recordando",
    chooseTiles: "Elige dos fichas",
    matchFound: (actor) => `¡${actor} encontró una pareja y vuelve a jugar!`,
    noMatch: (actor) => `${actor} no encontró una pareja.`,
    hiddenTile: "Ficha oculta",
    visibleTile: (value) => `Ficha revelada: ${value}`,
    solvedTile: "Pareja resuelta",
    endTitle: (winner) =>
      winner === "player" ? "¡Ganas el tablero!" : winner === "ai" ? "¡La IA gana el tablero!" : "¡Tablero empatado!",
  },
  connectFour: {
    rules: (
      <>
        <p>
          Elige una columna para dejar caer tu ficha <strong>roja</strong>; cae hasta la ranura
          libre más baja. Tú empiezas, la IA usa las <strong>amarillas</strong>.
        </p>
        <p>
          Conecta <strong>cuatro de tu color en línea</strong> — horizontal, vertical o diagonal —
          para ganar la ronda.
        </p>
        <p>Si el tablero se llena sin cuatro en línea, la ronda es empate.</p>
      </>
    ),
    difficultyTipLabel: "Cómo juega la IA a Cuatro en Raya",
    difficultyTip: (
      <>
        <strong>Fácil</strong> juega casi al azar, pero suele bloquear una victoria inmediata.{" "}
        <strong>Media</strong> anticipa tres medias jugadas. <strong>Difícil</strong> anticipa seis
        con poda alfa-beta, orden central de columnas y una heurística avanzada de amenazas.
      </>
    ),
    singleRound: "Ronda única",
    firstTo: (target) => `Primero a ${target}`,
    yourWins: "Rondas ganadas por ti",
    aiWins: "Rondas ganadas por la IA",
    draws: "Empates",
    tallyYou: (score) => `Tú (Rojo) ${score}`,
    tallyGoal: (target, draws) => `primero a ${target}${draws ? ` · ${draws} empates` : ""}`,
    tallyAi: (score) => `${score} (Amarillo) IA`,
    yourTurn: "Tu turno — elige una columna",
    aiThinking: "La IA está pensando",
    winRound: "¡Has conectado cuatro!",
    loseRound: "La IA ha conectado cuatro.",
    drawRound: "Empate — el tablero está lleno.",
    boardLabel: "Tablero de Cuatro en Raya",
    columnLabel: (column) => `Dejar caer una ficha roja en la columna ${column}`,
  },
  nim: {
    rules: (
      <>
        <p>
          Hay varios montones de fichas en la mesa. En tu turno, retira{" "}
          <strong>cualquier número de fichas (al menos una)</strong> de un{" "}
          <strong>único</strong> montón — <strong>empiezas tú</strong>.
        </p>
        <p>
          Toca una ficha para seleccionarla junto con todas las siguientes de ese montón, y pulsa
          Confirmar.
        </p>
        <p>
          <strong>Normal:</strong> quien retira la última ficha gana. <strong>Misère:</strong> quien
          retira la última ficha pierde. Elige la regla en los ajustes.
        </p>
      </>
    ),
    difficultyTipLabel: "Cómo juega la IA a Nim",
    difficultyTip: (
      <>
        La estrategia de la IA se basa en la <strong>suma nim</strong> — el XOR de
        todos los montones. <strong>Fácil</strong> la ignora por completo y juega al
        azar. <strong>Media</strong> calcula el movimiento óptimo pero solo lo aplica
        cerca del 65% de las veces; el resto del tiempo juega al azar.{" "}
        <strong>Difícil</strong> siempre juega el movimiento matemáticamente óptimo
        cuando existe, para cualquiera de las dos reglas — es invencible desde una
        posición ganadora.
      </>
    ),
    ruleLabel: "Condición de victoria",
    ruleTipLabel: "Normal vs Misère",
    ruleTip: (
      <>
        <strong>Juego normal:</strong> quien retira la última ficha gana.{" "}
        <strong>Juego misère:</strong> quien retira la última ficha pierde — esto
        invierte por completo la estrategia óptima, sobre todo en el final de partida
        cuando todos los montones quedan en 0 o 1 ficha.
      </>
    ),
    ruleNormal: "Normal — la última ficha gana",
    ruleMisere: "Misère — la última ficha pierde",
    randomizeLabel: "Aleatorizar montones iniciales",
    lengthOptions: { single: "Partida única", three: "Primero a 3", five: "Primero a 5" },
    yourWins: "Tus victorias",
    aiWins: "Victorias de la IA",
    totalMovesLabel: "Movimientos totales",
    tallyYou: (score) => `Tú ${score}`,
    tallyGoal: (target) => `primero a ${target}`,
    tallyAi: (score) => `${score} IA`,
    yourTurn: "Tu turno — elige fichas para retirar de un montón",
    aiThinking: "La IA está calculando la suma nim",
    chooseTokens: "Pulsa Confirmar para retirar las fichas resaltadas",
    winRound: "¡Ganas la ronda!",
    loseRound: "La IA gana la ronda.",
    boardLabel: "Montones de Nim",
    emptyPile: "(vacío)",
    tokenLabel: (pile, tokenNumber, pileSize) =>
      `Montón ${pile}, ficha ${tokenNumber} de ${pileSize} — retira esta ficha y todas las siguientes`,
    selectionSummary: (pile, tokensRemoved, before, after) =>
      `Retirar ${tokensRemoved} del Montón ${pile} (${before} → ${after})`,
    clearSelection: "Borrar selección",
    confirmMove: "Confirmar movimiento",
    logTitle: "Historial de movimientos",
    logEntry: (pile, tokensRemoved, before, after) =>
      `retiró ${tokensRemoved} del Montón ${pile} (${before}→${after})`,
    finalMoveSummary: (actor, pile, tokensRemoved, before, after) =>
      `Movimiento final: ${actor} retiró ${tokensRemoved} del Montón ${pile} (${before} → ${after}).`,
  },
  wordGuess: {
    rules: (
      <>
        <p>
          Una palabra oculta, compartida con la IA. Os turnáis — <strong>empiezas tú</strong>.
        </p>
        <p>
          Prueba una <strong>letra</strong> (revela todas sus posiciones) o adivina la{" "}
          <strong>palabra completa</strong>. Un acierto te da otro turno.
        </p>
        <p>
          Los fallos salen de un <strong>presupuesto compartido de 8</strong>: una letra fallada
          cuesta 1, una palabra fallada cuesta 2.
        </p>
        <p>
          Di la palabra para ganar. Si el presupuesto se agota antes, gana quien haya cometido{" "}
          <strong>menos fallos</strong>.
        </p>
      </>
    ),
    difficultyTipLabel: "Cómo juega la IA a Adivina la Palabra",
    difficultyTip: (
      <>
        En <strong>Fácil</strong> elige letras disponibles al azar. En <strong>Media</strong>{" "}
        sigue la frecuencia de letras en inglés e intenta la palabra cuando quedan muy pocas
        candidatas. En <strong>Difícil</strong> filtra continuamente la lista y elige la letra
        que divide de forma más equilibrada las candidatas restantes.
      </>
    ),
    category: "Categoría de palabras",
    categories: {
      animals: "Animales",
      countries: "Países",
      food: "Comida",
      technology: "Tecnología",
    },
    language: "Idioma de las palabras",
    langEn: "Inglés",
    langEs: "Castellano",
    yourTurn: "Tu turno — elige una letra o adivina la palabra",
    aiThinking: "La IA está analizando la palabra",
    patternLabel: (pattern) => `Patrón de la palabra: ${pattern}`,
    sharedBudget: "Presupuesto compartido de fallos",
    budgetLabel: (used) => `${used} de 8 fallos compartidos usados`,
    yourMistakes: "Tus fallos",
    aiMistakes: "Fallos de la IA",
    keyboardLabel: "Teclado de letras",
    wordPlaceholder: "Adivina la palabra completa…",
    guessWord: "Probar palabra",
    historyTitle: "Historial de intentos",
    correctGuess: "Correcto — turno extra",
    missCost: (cost) => `Fallo · +${cost}`,
    feedback: (actor, kind, value, correct) =>
      `${actor} probó ${kind === "letter" ? "la letra" : "la palabra"} ${value} — ${
        correct ? "¡correcto!" : "incorrecto."
      }`,
    errors: {
      letter: "Elige exactamente una letra de la A a la Z.",
      used: "Esa letra ya se ha probado.",
      word: "Usa solo letras para probar una palabra completa.",
      usedWord: "Esa palabra ya se ha probado.",
    },
    endTitle: (winner) =>
      winner === "player" ? "¡Ganas la ronda!" : winner === "ai" ? "La IA gana la ronda." : "¡Ronda empatada!",
  },
  blackjack: {
    rules: (
      <>
        <p>
          Acércate a <strong>21</strong> más que el crupier sin pasarte. Las cartas numéricas valen
          su número, las figuras 10 y el <strong>As vale 1 u 11</strong> (lo que convenga).
        </p>
        <p>
          <strong>Pedir</strong> saca otra carta, <strong>Plantarse</strong> mantiene tu mano.
          Pásate de 21 y te plantas por fuerza — pierdes al instante.
        </p>
        <p>
          Cuando te plantas, el crupier juega con regla fija: pide con 16 o menos, se planta con 17
          o más. Un 21 con dos cartas es <strong>Blackjack</strong> y vence a un 21 normal.
        </p>
        <p>Los totales iguales son <strong>empate</strong> (push).</p>
      </>
    ),
    difficultyLabel: "Nivel de ayuda",
    difficultyTipLabel: "Qué muestra cada nivel (el crupier siempre juega igual)",
    difficultyTip: (
      <>
        El crupier sigue siempre la misma regla fija — pide con 16 o menos, se planta con 17 o
        más — elijas lo que elijas. <strong>Fácil</strong> muestra una sugerencia de estrategia
        básica (Pedir/Plantarse) y tu total de mano. <strong>Media</strong> muestra tu total
        (blando/duro) sin sugerencias. <strong>Difícil</strong> oculta tu total por completo —
        llevas la cuenta tú, como en una mesa real.
      </>
    ),
    lengthOptions: { three: "Primero a 3", five: "Primero a 5", ten: "Primero a 10" },
    yourWins: "Tus victorias",
    aiWins: "Victorias del crupier",
    pushes: "Empates (push)",
    chipsLabel: "Fichas",
    tallyYou: (score) => `Tú ${score}`,
    tallyGoal: (target, pushes) => `primero a ${target}${pushes > 0 ? ` · ${pushes} empates` : ""}`,
    tallyAi: (score) => `${score} Crupier`,
    playerLabel: "Tú",
    dealerLabel: "Crupier",
    holeCardLabel: "Carta oculta del crupier",
    hitButton: "Pedir",
    standButton: "Plantarse",
    hintLabel: (action) => `Sugerencia: ${action === "hit" ? "Pedir" : "Plantarse"}`,
    totalLabel: (total, isSoft, isBust) =>
      isBust ? `Pasado (${total})` : isSoft ? `Blando ${total}` : `${total}`,
    blackjackLabel: "¡Blackjack!",
    dealingStatus: "Repartiendo…",
    yourTurn: "Tu turno — ¿Pedir o plantarte?",
    dealerTurn: "El crupier está jugando",
    winRound: (blackjack) => (blackjack ? "¡Blackjack! ¡Ganas la ronda!" : "¡Ganas la ronda!"),
    loseRound: "Gana la ronda el crupier.",
    pushRound: "Empate — nadie gana esta ronda.",
    logTitle: "Historial de rondas",
    logEntry: (round, playerTotal, dealerTotal, result, blackjack) =>
      `Ronda ${round}: Jugador ${playerTotal} vs Crupier ${dealerTotal} — ${
        result === "win" ? (blackjack ? "Blackjack" : "Victoria") : result === "lose" ? "Derrota" : "Empate"
      }`,
  },
  reactionTime: {
    rules: (
      <>
        <p>
          Espera a que el recuadro se ponga <strong>verde</strong> y entonces tócalo lo más rápido
          que puedas. Tú y la IA competís por la misma señal.
        </p>
        <p>
          Tocar <strong>antes</strong> del verde es una <strong>salida en falso</strong> y pierde la
          ronda al instante — aguanta los nervios.
        </p>
        <p>Quien reaccione más rápido gana la ronda. El primero al objetivo gana la partida.</p>
      </>
    ),
    difficultyTipLabel: "Cómo son los reflejos de la IA",
    difficultyTip: (
      <>
        <strong>Fácil</strong> reacciona despacio (400–700ms) y a veces se adelanta a la señal
        (~13% de las rondas). <strong>Media</strong> reacciona como un humano promedio sólido
        (250–400ms, ~5% de salidas en falso). <strong>Difícil</strong> reacciona cerca del límite
        de los reflejos humanos reales (150–220ms, ~1,5% de salidas en falso) — muy difícil de
        superar.
      </>
    ),
    firstTo: (n) => `Primero a ${n}`,
    yourWins: "Tus victorias",
    aiWins: "Victorias de la IA",
    ties: "Empates",
    tallyYou: (score) => `Tú ${score}`,
    tallyGoal: (target) => `primero a ${target}`,
    tallyAi: (score) => `${score} IA`,
    waitingLabel: "Prepárate…",
    readyLabel: "Espera al verde…",
    goLabel: "¡YA! Toca ahora",
    tapHint: "Toca o haz clic en el recuadro",
    yourTimeLabel: (ms) => `Tú: ${ms === null ? "—" : `${ms}ms`}`,
    aiTimeLabel: (ms) => `IA: ${ms === null ? "—" : `${ms}ms`}`,
    playerFalseStartResult: "¡Salida en falso! Has hecho clic antes de la señal — gana la IA.",
    aiFalseStartResult: "¡Salida en falso de la IA! Se ha adelantado — ganas tú la ronda.",
    winRound: "¡Ganas la ronda!",
    loseRound: "Gana la ronda la IA.",
    pushRound: "Empate — ¡reacción idéntica!",
    logTitle: "Historial de rondas",
    logEntry: (round, playerTimeMs, playerFalseStart, aiTimeMs, aiFalseStart, winner) =>
      `Ronda ${round}: Tú ${
        playerFalseStart ? "salida en falso" : playerTimeMs === null ? "—" : `${playerTimeMs}ms`
      } vs IA ${aiFalseStart ? "salida en falso" : `${aiTimeMs}ms`} — ${
        winner === "player" ? "Ganas tú" : winner === "ai" ? "Gana la IA" : "Empate"
      }`,
    avgYourLabel: "Tu reacción media",
    avgAiLabel: "Reacción media IA",
    noDataLabel: "—",
    msSuffix: (ms) => `${ms}ms`,
  },
  penaltyKick: {
    rules: (
      <>
        <p>
          Lanza <strong>cinco penaltis</strong>. Pulsa dentro de la portería
          para elegir dónde apuntar, ajusta la potencia y dispara.
        </p>
        <p>
          Una potencia alta dificulta la parada, pero pasarte reduce la
          precisión y puede mandar el balón fuera.
        </p>
        <p>Marca al menos tres goles para ganar la tanda.</p>
      </>
    ),
    difficultyTipLabel: "Cómo reacciona el portero",
    difficultyTip: (
      <>
        En <strong>Fácil</strong>, el portero casi siempre adivina. En{" "}
        <strong>Media</strong>, lee algunos tiros. En <strong>Difícil</strong>,
        anticipa la mayoría y cubre más espacio de la portería.
      </>
    ),
    goals: "Goles",
    stops: "Paradas y fallos",
    goalsCount: (count) => `${count} goles`,
    stopsCount: (count) => `${count} detenidos`,
    kickCount: (current, total) => `Tiro ${Math.min(current, total)} de ${total}`,
    aimPrompt: "Elige un punto de la portería y dispara",
    shooting: "El balón está en el aire…",
    goal: "¡GOL!",
    saved: "¡Parada del portero!",
    missed: "¡Fuera! El tiro no entró en la portería.",
    power: "Potencia",
    shoot: "Disparar",
    goalLabel: "Portería: pulsa para elegir dónde apuntar",
    kickHistory: "Historial de penaltis",
    endWin: "¡Ganas la tanda de penaltis!",
    endLoss: "El portero gana la tanda.",
    finalScore: (goals, stops) => `${goals} goles · ${stops} detenidos`,
  },
  basketShot: {
    rules: (
      <>
        <p>
          Tú y la IA lanzáis <strong>cinco tiros cada uno</strong>, combinando
          canastas de dos y tres puntos.
        </p>
        <p>
          El marcador recorre el medidor de tiro. Pulsa{" "}
          <strong>Disparar</strong> lo más cerca posible del centro verde:
          una suelta perfecta ofrece la máxima probabilidad de encestar.
        </p>
        <p>Quien tenga más puntos tras cinco rondas gana.</p>
      </>
    ),
    difficultyTipLabel: "Cómo cambia el desafío con la dificultad",
    difficultyTip: (
      <>
        Al subir la dificultad, el medidor se mueve más rápido y aumenta el
        porcentaje de acierto de la IA. Los triples son más difíciles para
        ambos jugadores en todos los niveles.
      </>
    ),
    yourPoints: "Tus puntos",
    aiPoints: "Puntos de la IA",
    tallyYou: (score) => `Tú ${score}`,
    tallyAi: (score) => `${score} IA`,
    roundLabel: (round, total, points) =>
      `Ronda ${round}/${total} · ${points}PT`,
    pointValue: (points) => `${points} puntos`,
    releasePrompt: "Detén el marcador en la zona verde",
    yourShot: "Tu tiro está en el aire…",
    madeShot: (points) => `¡Dentro! Sumas ${points} puntos.`,
    missedShot: "¡Al aro! No sumas puntos.",
    aiShot: "La IA lanza a canasta…",
    aiMade: (points) => `La IA suma ${points} puntos.`,
    aiMissed: "¡La IA falla!",
    meterLabel: "Medidor del momento de tiro",
    early: "Pronto",
    perfect: "Perfecto",
    late: "Tarde",
    shoot: "Disparar",
    courtLabel: "Pista de baloncesto y canasta",
    historyLabel: "Resultados por ronda: jugador e IA",
    endTitle: (winner) =>
      winner === "player"
        ? "¡Ganas el desafío!"
        : winner === "ai"
          ? "La IA gana el desafío."
          : "¡El desafío termina en empate!",
    finalScore: (you, ai) => `Marcador final ${you} – ${ai}`,
  },
};

export const dictionaries: Record<Locale, Dictionary> = { en, es };
