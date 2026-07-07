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
  prismClash: {
    rules: ReactNode;
    tagline: string;
    difficultyDescription: Record<"easy" | "medium" | "hard", string>;
    matchLengthLabel: string;
    singleWin: string;
    bestOfThree: string;
    playFriend: string;
    colors: Record<"ember" | "tide" | "bloom" | "volt", string>;
    yourTurn: string;
    aiTurn: string;
    actionDraw: (actor: string) => string;
    actionCombo: (actor: string) => string;
    actionFreeze: (actor: string) => string;
    actionDraw2: (actor: string) => string;
    actionPrism: (actor: string, color: string) => string;
    roundWin: (actor: string) => string;
    scoreYou: (score: number) => string;
    scoreAi: (score: number) => string;
    firstTo: (target: number) => string;
    cardsCount: (count: number) => string;
    opponentHand: string;
    hiddenCard: string;
    drawCard: string;
    drawPile: string;
    activeColor: (color: string) => string;
    chooseColor: string;
    cardLabel: (
      kind: "number" | "freeze" | "draw2" | "prism",
      color: string,
      value?: number,
    ) => string;
    yourHand: string;
    playHint: string;
    drawHint: string;
    waitHint: string;
  };
  propertyBaron: {
    rules: ReactNode;
    tagline: string;
    difficultyDescription: Record<"easy" | "medium" | "hard", string>;
    shortGame: string;
    standardGame: string;
    playFriend: string;
    cash: (name: string, money: number) => string;
    round: (round: number, max: number) => string;
    netWorthLine: (you: number, them: number) => string;
    rollPrompt: string;
    decisionPrompt: (tile: string) => string;
    aiTurn: string;
    rollDice: string;
    dice: (a: number, b: number) => string;
    buy: string;
    upgrade: string;
    pass: string;
    logTitle: string;
    logFinalAudit: string;
    logHoldingFineReason: string;
    logCharge: (reason: string, from: string, amount: number, to: string | null) => string;
    logLeaveHolding: (actor: string) => string;
    logRoll: (actor: string, a: number, b: number, tile: string) => string;
    logPassStart: (actor: string, amount: number) => string;
    logBonus: (actor: string, amount: number) => string;
    logMarket: (actor: string, amount: number) => string;
    logBuy: (actor: string, tile: string, price: number) => string;
    logUpgrade: (actor: string, tile: string, level: number) => string;
    logPass: (actor: string) => string;
  };
  parchis: {
    rules: ReactNode;
    tagline: string;
    difficultyDescription: Record<"easy" | "medium" | "hard", string>;
    gameLength: string;
    quickGame: string;
    classicGame: string;
    playFriend: string;
    finishedCount: (count: number) => string;
    yourRoll: string;
    choosePiece: string;
    aiTurn: string;
    chooseBonus: (steps: number) => string;
    captured: (actor: string) => string;
    reachedGoal: (actor: string) => string;
    tripleSix: (actor: string) => string;
    noMove: (actor: string) => string;
    pieceStatus: (home: number, goal: number) => string;
    boardLabel: string;
    pieceStatuses: Record<"home" | "track" | "lane" | "goal", string>;
    pieceLabel: (actor: string, piece: number, status: string) => string;
    rollDice: string;
    moveSteps: (steps: number) => string;
    rollPrompt: string;
    waitPrompt: string;
    safeLegend: string;
    bridgeLegend: string;
  };
  gooseGame: {
    rules: ReactNode;
    tagline: string;
    difficultyDescription: Record<"easy" | "medium" | "hard", string>;
    playFriend: string;
    goalReached: string;
    yourRoll: string;
    chooseRoll: (roll: number) => string;
    aiTurn: string;
    rerolled: (actor: string, roll: number) => string;
    specialNames: Record<
      "goose" | "bridge" | "inn" | "dice" | "well" | "maze" | "prison" | "death" | "goal",
      string
    >;
    specialFeedback: Record<
      "goose" | "bridge" | "inn" | "dice" | "well" | "maze" | "prison" | "death" | "goal",
      (actor: string, destination: number) => string
    >;
    moved: (actor: string, destination: number) => string;
    swapped: (actor: string) => string;
    skippedTurns: (count: number) => string;
    squareStatus: (square: number) => string;
    feathers: (count: number) => string;
    boardLabel: string;
    squareLabel: (square: number, special?: string) => string;
    tokenLabel: (actor: string, square: number) => string;
    dieResult: (roll: number) => string;
    dieReady: string;
    rollDice: string;
    moveButton: (roll: number) => string;
    move: string;
    useFeather: string;
  };
  tileRummy: {
    rules: ReactNode;
    tagline: string;
    difficultyDescription: Record<"easy" | "medium" | "hard", string>;
    playFriend: string;
    colors: Record<"ruby" | "sun" | "leaf" | "sky", string>;
    meldKinds: Record<"group" | "run", string>;
    invalidReasons: Record<"tooFew" | "mixed" | "duplicateColor" | "gap" | "opening", string>;
    emptyRack: string;
    yourTurn: string;
    aiTurn: string;
    drew: (actor: string) => string;
    played: (actor: string, count: number, score: number) => string;
    won: (actor: string) => string;
    tilesLeft: (count: number) => string;
    opened: string;
    needsOpening: string;
    pool: string;
    openingRule: string;
    tableLabel: string;
    emptyTable: string;
    points: (score: number) => string;
    playMeld: (score: number) => string;
    playSelection: string;
    drawTile: string;
    selectedCount: (count: number) => string;
    yourRack: string;
    drawHint: string;
    playHint: string;
    jokerTile: string;
    tileLabel: (color: string, value: number) => string;
  };
  domino: {
    rules: ReactNode;
    tagline: string;
    difficultyDescription: Record<"easy" | "medium" | "hard", string>;
    playFriend: string;
    blockedTie: string;
    endScore: (you: number, them: number) => string;
    yourTurn: string;
    aiTurn: string;
    played: (actor: string, tile: string) => string;
    drew: (actor: string) => string;
    passed: (actor: string) => string;
    won: (actor: string) => string;
    notPlayable: string;
    pool: string;
    tilesLeft: (count: number) => string;
    emptyBoard: string;
    boardLabel: string;
    playLeft: string;
    playRight: string;
    drawTile: string;
    pass: string;
    yourHand: string;
    drawHint: string;
    playHint: string;
    tileLabel: (a: number, b: number) => string;
  };
  slidingPuzzle: {
    rules: ReactNode;
    tagline: string;
    boardSize: string;
    sizeLabels: Record<3 | 4 | 5, string>;
    sizeDescription: Record<3 | 4 | 5, string>;
    solvedTitle: string;
    result: (moves: number, seconds: number) => string;
    moves: string;
    time: string;
    size: string;
    playingHint: string;
    boardLabel: string;
    emptyTile: string;
    tileLabel: (tile: number) => string;
    moveHint: string;
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
    setupSummary: string;
    goals: string;
    saves: string;
    conversion: string;
    bestQuality: string;
    goalsCount: (count: number) => string;
    stopsCount: (count: number) => string;
    kickCount: (current: number, total: number) => string;
    pendingKick: (kick: number) => string;
    onTargetCount: (count: number) => string;
    missCount: (count: number) => string;
    aimPrompt: (target: string) => string;
    shooting: string;
    resultName: Record<"goal" | "saved" | "post" | "miss", string>;
    shotStyle: string;
    styles: Record<"placed" | "power" | "chip", string>;
    styleDescriptions: Record<"placed" | "power" | "chip", string>;
    quality: string;
    speed: string;
    keeperDecision: string;
    keeperStrategies: Record<"guess" | "learn" | "read", string>;
    power: string;
    powerHint: (power: number, ideal: number) => string;
    target: string;
    targetName: (
      horizontal: "left" | "center" | "right",
      vertical: "high" | "middle" | "low",
    ) => string;
    estimatedAccuracy: string;
    estimatedSpeed: string;
    shoot: string;
    goalLabel: (target: string) => string;
    keyboardHint: string;
    kickHistory: string;
    endWin: string;
    endLoss: string;
    endRating: (goals: number) => string;
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
    yellowShot: string;
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
  shadowProtocol: {
    rules: ReactNode;
    difficultyTipLabel: string;
    difficultyTip: ReactNode;
    turnLabel: (turn: number) => string;
    coreCollected: string;
    coreMissing: string;
    alarmLabel: (remaining: number, total: number) => string;
    boardLabel: string;
    dpadLabel: string;
    statusSneak: string;
    statusSpotted: (remaining: number) => string;
    statusCore: string;
    statusHeard: string;
    statusAimBeacon: string;
    statusSprintArmed: string;
    actionWait: string;
    actionHack: string;
    actionSprint: string;
    actionBeacon: string;
    legend: string;
    endWin: string;
    endLoss: string;
    lossHint: string;
    scoreTotal: string;
    scoreStealth: string;
    scoreAlarm: string;
    scoreTurns: string;
    cellLabel: (
      x: number,
      y: number,
      tile: string,
      player: boolean,
      guard: boolean,
      camera: boolean,
      seen: boolean,
    ) => string;
  };
  fleetCommand: {
    rules: ReactNode;
    difficultyTipLabel: string;
    difficultyTip: ReactNode;
    placementTitle: string;
    placeShipHint: (length: number) => string;
    fleetReady: string;
    rotateToVertical: string;
    rotateToHorizontal: string;
    randomPlacement: string;
    clearPlacement: string;
    placementCellLabel: (x: number, y: number, ship: boolean) => string;
    yourTurn: string;
    aiThinking: string;
    sonarButton: string;
    sonarSpent: string;
    sonarPrompt: string;
    enemyWaters: string;
    yourFleet: string;
    enemyBoardLabel: string;
    yourBoardLabel: string;
    enemyCellLabel: (x: number, y: number, mark: string) => string;
    ownCellLabel: (x: number, y: number, ship: boolean, mark: string) => string;
    enemyFleetStatus: (remaining: number, total: number) => string;
    yourShots: string;
    aiShots: string;
    endWin: string;
    endLoss: string;
  };
  windlineArchery: {
    rules: ReactNode;
    difficultyTipLabel: string;
    difficultyTip: ReactNode;
    endLabel: (current: number, total: number) => string;
    tallyYou: (score: number) => string;
    tallyAi: (score: number) => string;
    windLabel: string;
    windDetail: (horizontal: number, vertical: number) => string;
    targetLabel: string;
    aimPrompt: string;
    releasePrompt: string;
    yourResult: (score: number) => string;
    bothResult: (you: number, ai: number) => string;
    angleLabel: (deg: number) => string;
    windageLabel: (deg: number) => string;
    powerLabel: (power: number) => string;
    drawButton: string;
    releaseButton: string;
    meterLabel: string;
    yourCenters: string;
    aiCenters: string;
    yourPrecision: string;
    aiPrecision: string;
    endTitle: (winner: "player" | "ai" | "tie") => string;
  };
  beatReactor: {
    rules: ReactNode;
    difficultyTipLabel: string;
    difficultyTip: ReactNode;
    bpmLabel: string;
    lengthLabel: string;
    barsShort: string;
    barsMedium: string;
    barsLong: string;
    densityLabel: string;
    densityLight: string;
    densityNormal: string;
    densityDense: string;
    silentMode: string;
    calibrationLabel: (ms: number) => string;
    tallyYou: (score: number) => string;
    tallyAi: (score: number) => string;
    lanesLabel: string;
    laneButtonLabel: (n: number) => string;
    judgementLabel: Record<"perfect" | "great" | "good" | "miss", string>;
    comboYou: (combo: number) => string;
    comboAi: (combo: number) => string;
    yourBestCombo: string;
    aiBestCombo: string;
    accuracy: string;
    endTitle: (winner: "player" | "ai" | "tie") => string;
  };
  circuitBreaker: {
    rules: ReactNode;
    difficultyTipLabel: string;
    difficultyTip: ReactNode;
    tallyYou: (score: number) => string;
    tallyGoal: (target: number) => string;
    tallyAi: (score: number) => string;
    steer: string;
    winRound: string;
    loseRound: string;
    tieRound: string;
    arenaLabel: string;
    turnLeft: string;
    straight: string;
    turnRight: string;
    yourWins: string;
    aiWins: string;
    ties: string;
  };
  diceforgeArena: {
    rules: ReactNode;
    difficultyTipLabel: string;
    difficultyTip: ReactNode;
    youLabel: string;
    aiLabel: string;
    roundLabel: (round: number, total: number) => string;
    yourRoll: string;
    aiRoll: string;
    lockPrompt: string;
    lockDie: (die: number) => string;
    resultLine: (you: number, ai: number) => string;
    shopPrompt: string;
    costLabel: (cost: number) => string;
    replaceLabel: (die: number, face: number) => string;
    skipShop: string;
    healthResult: (you: number, ai: number) => string;
    endTitle: (winner: "player" | "ai" | "tie") => string;
  };
  hexDominion: {
    rules: ReactNode;
    difficultyTipLabel: string;
    difficultyTip: ReactNode;
    yourTurn: string;
    aiThinking: string;
    yourGoal: string;
    aiGoal: string;
    boardLabel: string;
    emptyCell: (row: number, col: number) => string;
    ownedCell: (row: number, col: number, owner: "player" | "ai") => string;
    youLegend: string;
    aiLegend: string;
    movesLabel: (moves: number) => string;
    endTitle: (winner: "player" | "ai") => string;
  };
  neonDrift: {
    rules: ReactNode;
    difficultyTipLabel: string;
    difficultyTip: ReactNode;
    trackLabel: string;
    trackNames: Record<string, string>;
    lapLabel: (lap: number, total: number) => string;
    leading: string;
    chasing: string;
    trackAria: string;
    boostLabel: string;
    steerLeft: string;
    steerRight: string;
    brake: string;
    brakeShort: string;
    boost: string;
    boostShort: string;
    endTitle: (outcome: "player" | "ai" | "tie") => string;
    finishTimes: (you: string, ai: string) => string;
    bestLap: string;
    offTrack: string;
    boostEff: string;
    personalBest: string;
  };
  signalBreaker: {
    rules: ReactNode;
    difficultyTipLabel: string;
    difficultyTip: ReactNode;
    allowRepeats: string;
    yourAttack: string;
    aiAttack: string;
    guessCount: (used: number, max: number) => string;
    slotLabel: (n: number) => string;
    submit: string;
    clear: string;
    waitingForAi: string;
    legend: string;
    endTitle: (outcome: "player" | "ai" | "tie") => string;
    yourGuesses: string;
    aiGuesses: string;
    codeWas: string;
  };
  spellstorm: {
    rules: ReactNode;
    difficultyTipLabel: string;
    difficultyTip: ReactNode;
    you: string;
    ai: string;
    timeLabel: (seconds: number) => string;
    elementLabels: Record<"fire" | "ice" | "shield", string>;
    spellLabels: Record<"fire" | "ice" | "shield", string>;
    spellEffects: Record<"fire" | "ice" | "shield", string>;
    typeLabel: string;
    typePrompt: string;
    frozen: string;
    aiTyping: string;
    aiCorrecting: string;
    energyHint: (cost: number) => string;
    castFeedback: (actor: "player" | "ai", spell: "fire" | "ice" | "shield") => string;
    endTitle: (outcome: "player" | "ai" | "tie") => string;
    healthResult: (you: number, ai: number) => string;
    yourWords: string;
    aiWords: string;
  };
  /** Multiplayer rooms (create/join by code) — RPS and Tic-Tac-Toe for now. */
  rooms: {
    navLink: string;
    title: string;
    tagline: string;
    yourNameLabel: string;
    namePlaceholder: string;
    createTab: string;
    joinTab: string;
    chooseGameLabel: string;
    currentGameLabel: string;
    roomSettingsTitle: string;
    hostSettingsHint: string;
    guestSettingsHint: string;
    applyRoomSettings: string;
    changingGame: string;
    settingLabels: Record<string, string>;
    settingOptionLabels: Record<string, Record<string, string>>;
    createButton: string;
    roomCodeLabel: string;
    codePlaceholder: string;
    joinButton: string;
    nameRequired: string;
    codeRequired: string;
    connecting: string;
    waitingTitle: string;
    shareCode: (code: string) => string;
    waitingHint: string;
    leaveButton: string;
    backToRooms: string;
    roomNotFound: string;
    roomGone: string;
    roomExpired: string;
    errorGeneric: string;
    opponentJoined: (name: string) => string;
    submittedWaiting: string;
    roundResultWin: string;
    roundResultLose: string;
    roundResultTie: string;
    matchWinYou: string;
    matchWinOpponent: (name: string) => string;
    rematchButton: string;
    rematchWaiting: string;
    turnYours: string;
    turnOpponent: (name: string) => string;
  };
  penaltyRoom: {
    youShoot: string;
    youKeep: string;
    shootPrompt: string;
    keepPrompt: string;
    zones: Record<"HL" | "HC" | "HR" | "LL" | "LC" | "LR", string>;
    resultYouScored: string;
    resultConceded: string;
    resultYouMissed: string;
    resultYouSaved: string;
    tallyYou: (score: number) => string;
    tallyGoal: (target: number) => string;
    historyLabel: string;
    youWord: string;
    goalWord: string;
    saveWord: string;
  };
  basketRoom: {
    youShoot: string;
    youDefend: string;
    shootPrompt: string;
    defendPrompt: string;
    spots: Record<"layup" | "mid" | "three", string>;
    pts: (points: number) => string;
    resultYouScored: (points: number) => string;
    resultConceded: (points: number) => string;
    resultYouBlocked: string;
    resultYouStopped: string;
    tallyYou: (score: number) => string;
    tallyGoal: (target: number) => string;
    historyLabel: string;
    youWord: string;
    plusPts: (points: number) => string;
    blockedWord: string;
  };
  guessRoom: {
    yourTurn: string;
    opponentTurn: (name: string) => string;
    rangePrompt: (low: number, high: number) => string;
    guessButton: string;
    inputPlaceholder: string;
    tallyYou: (score: number) => string;
    tallyGoal: (target: number) => string;
    verdicts: Record<"high" | "low", string>;
    correctWord: string;
    logTitle: string;
    youWord: string;
  };
  holRoom: {
    yourTurn: string;
    opponentTurn: (name: string) => string;
    callPrompt: string;
    calls: Record<"higher" | "lower", string>;
    currentLabel: string;
    tallyYou: (score: number) => string;
    tallyGoal: (target: number) => string;
    lastCall: (name: string, call: string, correct: boolean) => string;
    correctWord: string;
    missWord: string;
    tieTitle: string;
    logTitle: string;
    youWord: string;
  };
  memoryRoom: {
    yourTurn: string;
    opponentTurn: (name: string) => string;
    matchBy: (name: string) => string;
    missBy: (name: string) => string;
    tallyYou: (score: number) => string;
    pairsLeft: (count: number) => string;
    tieTitle: string;
    youWord: string;
  };
  reactionRoom: {
    getReady: string;
    waitGreen: string;
    tapNow: string;
    falseStart: string;
    roundWon: string;
    roundLost: string;
    roundTied: string;
    ms: (value: number) => string;
    tallyYou: (score: number) => string;
    tallyGoal: (target: number) => string;
    youWord: string;
  };
  fleetRoom: {
    placingTitle: string;
    placingHint: string;
    shuffle: string;
    ready: string;
    readyWaiting: string;
    yourFleet: string;
    enemyWaters: string;
    shotResult: (name: string, result: "miss" | "hit" | "sunk") => string;
    cellLabel: (index: number) => string;
    youWord: string;
  };
  shadowRoom: {
    waitingOpponent: string;
    youEscaped: (score: number) => string;
    youCaught: string;
    tieTitle: string;
    scoreLine: (you: number, them: number) => string;
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
    "prism-clash": {
      name: "Prism Clash",
      description: "Match colours and symbols, chain clever combos and empty your hand first.",
    },
    "property-baron": {
      name: "Property Baron",
      description: "Buy streets, collect rent, upgrade holdings and bankrupt the rival investor.",
    },
    parchis: {
      name: "Parchís Duel",
      description: "Race home through safe squares, captures, bridges and tactical bonus moves.",
    },
    "goose-game": {
      name: "Game of the Goose",
      description: "Race across 63 squares, survive classic traps and spend rerolls wisely.",
    },
    "tile-rummy": {
      name: "Tile Rummy",
      description: "Build groups and runs, open with 30 points and empty your rack first.",
    },
    domino: {
      name: "Domino",
      description: "Place double-six tiles on either end, draw when blocked and empty your hand.",
    },
    "sliding-puzzle": {
      name: "Sliding Puzzle",
      description: "Slide numbered tiles into order on a solvable 3x3, 4x4 or 5x5 board.",
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
    "shadow-protocol": {
      name: "Shadow Protocol",
      description: "Steal the data core and slip past patrols, cameras and sound.",
    },
    "fleet-command": {
      name: "Fleet Command",
      description: "Hide your fleet, read the sonar and out-target a Bayesian AI.",
    },
    "windline-archery": {
      name: "Windline Archery",
      description: "Read the crosswind, steady your release and out-shoot the AI.",
    },
    "beat-reactor": {
      name: "Beat Reactor",
      description: "Hit generated beats on the audio clock and out-score the AI.",
    },
    "circuit-breaker": {
      name: "Circuit Breaker",
      description: "Trap the AI's light-cycle in a simultaneous-turn duel.",
    },
    "diceforge-arena": {
      name: "Diceforge Arena",
      description: "Build custom dice, forge stronger faces and outfight an expectimax rival.",
    },
    "hex-dominion": {
      name: "Hex Dominion",
      description: "Connect opposite edges before a bridge-building tactical AI.",
    },
    "neon-drift": {
      name: "Neon Drift",
      description: "Race a rival AI through neon circuits with clean lines and boost.",
    },
    "signal-breaker": {
      name: "Signal Breaker",
      description: "Crack the AI's secret code before it cracks yours.",
    },
    spellstorm: {
      name: "Spellstorm",
      description: "Type elemental words, manage energy and out-cast a timeline-driven AI.",
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
  prismClash: {
    rules: (
      <>
        <p>
          Your goal is to <strong>empty your hand first</strong>. On your turn, play a card
          matching the discard pile&apos;s <strong>active colour, number or symbol</strong>.
          Prism cards match anything and let you choose the next colour.
        </p>
        <p>
          <strong>Freeze ❄</strong> skips your rival and lets you play again.{" "}
          <strong>Draw +2</strong> makes your rival take two cards. If you have no legal card,
          draw one card and your turn ends.
        </p>
        <p>
          The signature rule is the <strong>Prism Combo</strong>: play the same number in a
          different colour to earn one extra play. A combo can trigger only once before the turn
          passes, so choose the follow-up carefully.
        </p>
        <p>
          Each round starts with seven cards. The first player to empty their hand wins the
          round. Choose <strong>one win</strong> for a fast match or <strong>best of three</strong>
          for the full duel. In friend rooms, hands stay
          hidden on screen and the same rules apply.
        </p>
      </>
    ),
    tagline: "Control the colour. Build the combo. Leave nothing behind.",
    difficultyDescription: {
      easy: "Plays any legal card without planning ahead.",
      medium: "Uses powers and colour balance, with occasional imperfect choices.",
      hard: "Tracks hand structure, protects Prism cards and pressures a short rival hand.",
    },
    matchLengthLabel: "Victory condition",
    singleWin: "One win",
    bestOfThree: "Best of 3",
    playFriend: "Play with a friend",
    colors: { ember: "Ember", tide: "Tide", bloom: "Bloom", volt: "Volt" },
    yourTurn: "Your turn — match the colour, number or symbol.",
    aiTurn: "The AI is reading the prism…",
    actionDraw: (actor) => `${actor} had no match and drew a card.`,
    actionCombo: (actor) => `${actor} triggered a Prism Combo — one extra play!`,
    actionFreeze: (actor) => `${actor} froze the rival — one extra play!`,
    actionDraw2: (actor) => `${actor} surged: the rival draws two cards.`,
    actionPrism: (actor, color) => `${actor} shifted the active colour to ${color}.`,
    roundWin: (actor) => `${actor} emptied the hand and won the round!`,
    scoreYou: (score) => `You ${score}`,
    scoreAi: (score) => `${score} AI`,
    firstTo: (target) => `first to ${target}`,
    cardsCount: (count) => `${count} ${count === 1 ? "card" : "cards"}`,
    opponentHand: "Opponent's hidden hand",
    hiddenCard: "Hidden card",
    drawCard: "Draw one card",
    drawPile: "Draw pile",
    activeColor: (color) => `Active: ${color}`,
    chooseColor: "Choose the next colour",
    cardLabel: (kind, color, value) =>
      kind === "number"
        ? `${color} ${value}`
        : kind === "freeze"
          ? `${color} Freeze`
          : kind === "draw2"
            ? `${color} Draw two`
            : "Prism wild card",
    yourHand: "Your hand",
    playHint: "Bright cards are legal plays. Match colour, number or symbol.",
    drawHint: "No match available — draw one card.",
    waitHint: "Wait for your rival to finish the turn.",
  },
  propertyBaron: {
    rules: (
      <>
        <p>
          Roll two dice and move around the city loop. Landing on an empty property lets you buy it;
          landing on a rival property makes you pay rent.
        </p>
        <p>
          Your own properties can be upgraded twice. Higher levels cost money now but multiply future
          rent, so the key decision is whether to invest or keep enough cash for taxes and rent.
        </p>
        <p>
          Bonus and market squares inject cash, tax squares drain it. The match ends when someone
          goes bankrupt or when the round limit is reached; then the highest net worth wins.
        </p>
      </>
    ),
    tagline: "Build the city. Tax the rival. Stay liquid.",
    difficultyDescription: {
      easy: "Buys and upgrades loosely, often running short of cash.",
      medium: "Keeps a cash reserve and invests when the return is obvious.",
      hard: "Values rent pressure, group control and liquidity before every investment.",
    },
    shortGame: "Short · 12 rounds",
    standardGame: "Standard · 20 rounds",
    playFriend: "Play with a friend",
    cash: (name, money) => `${name}: $${money}`,
    round: (round, max) => `Round ${Math.min(round, max)}/${max}`,
    netWorthLine: (you, them) => `Net worth: $${you} · $${them}`,
    rollPrompt: "Roll the dice and choose your next investment.",
    decisionPrompt: (tile) => `Decision on ${tile}: buy, upgrade or pass.`,
    aiTurn: "The AI is checking cash flow…",
    rollDice: "Roll dice",
    dice: (a, b) => `${a}+${b}`,
    buy: "Buy",
    upgrade: "Upgrade",
    pass: "Pass",
    logTitle: "Move history",
    logFinalAudit: "Final audit: richest portfolio wins.",
    logHoldingFineReason: "Holding fine",
    logCharge: (reason, from, amount, to) => `${reason}: ${from} pays $${amount}${to ? ` to ${to}` : ""}.`,
    logLeaveHolding: (actor) => `${actor} pays to leave holding.`,
    logRoll: (actor, a, b, tile) => `${actor} rolls ${a}+${b} and lands on ${tile}.`,
    logPassStart: (actor, amount) => `${actor} passes Start and collects $${amount}.`,
    logBonus: (actor, amount) => `${actor} collects a $${amount} bonus.`,
    logMarket: (actor, amount) => `${actor} profits $${amount} from the market shift.`,
    logBuy: (actor, tile, price) => `${actor} buys ${tile} for $${price}.`,
    logUpgrade: (actor, tile, level) => `${actor} upgrades ${tile} to level ${level}.`,
    logPass: (actor) => `${actor} passes.`,
  },
  parchis: {
    rules: (
      <>
        <p>
          Bring every piece from <strong>home to the central goal</strong>. Roll the die, then
          choose one of the glowing pieces. A natural <strong>5 must bring a piece out</strong>{" "}
          whenever your start square has room.
        </p>
        <p>
          A <strong>6 gives another roll</strong>; once every piece is out, a 6 moves seven
          spaces instead. Three consecutive sixes send your last moved piece home. Reaching the
          goal requires the <strong>exact number</strong>.
        </p>
        <p>
          Dotted squares are <strong>safe</strong>: pieces there cannot be captured. Land on an
          exposed rival elsewhere to send it home, then choose any legal piece for a{" "}
          <strong>20-space bonus</strong>. Reaching goal grants a similar 10-space bonus.
        </p>
        <p>
          Two pieces of one colour on the same square form a <strong>bridge</strong> that nobody
          may cross. On a 6, you must open one of your bridges if possible. Quick mode uses two
          pieces; Classic uses four. Friend rooms keep these same movement, capture and bridge rules.
        </p>
      </>
    ),
    tagline: "Race, block, capture — and count every square.",
    difficultyDescription: {
      easy: "Moves a random legal piece.",
      medium: "Prioritises exits, captures, safe squares and reaching goal.",
      hard: "Also evaluates threats, bridge building and the best target for each bonus.",
    },
    gameLength: "Game format",
    quickGame: "Quick · 2 pieces",
    classicGame: "Classic · 4 pieces",
    playFriend: "Play with a friend",
    finishedCount: (count) => `${count} pieces reached the goal`,
    yourRoll: "Your turn — roll the die.",
    choosePiece: "Choose one of the glowing pieces.",
    aiTurn: "The AI is counting squares…",
    chooseBonus: (steps) => `Bonus move: choose a piece to advance ${steps} spaces.`,
    captured: (actor) => `${actor}: rival piece captured — choose a piece for the bonus.`,
    reachedGoal: (actor) => `${actor}: piece in goal — choose a piece for the 10-space bonus.`,
    tripleSix: (actor) => `${actor}: third six; the last piece returns home.`,
    noMove: (actor) => `No legal move for ${actor}.`,
    pieceStatus: (home, goal) => `${home} home · ${goal} goal`,
    boardLabel: "Parchís board",
    pieceStatuses: { home: "at home", track: "on the track", lane: "in the home lane", goal: "in goal" },
    pieceLabel: (actor, piece, status) => `${actor}, piece ${piece}, ${status}`,
    rollDice: "Roll die",
    moveSteps: (steps) => `Move ${steps} spaces`,
    rollPrompt: "Roll to begin your move",
    waitPrompt: "Wait for the rival",
    safeLegend: "Safe square",
    bridgeLegend: "Bridge blocks passage",
  },
  gooseGame: {
    rules: (
      <>
        <p>
          Be the first to reach <strong>square 63</strong>. Roll, then move that many squares.
          You need the exact count: if you pass 63, your token <strong>bounces backwards</strong>.
        </p>
        <p>
          Landing on a <strong>goose</strong> jumps to the next goose and grants another turn.
          The bridge (6→12) and dice (26↔53) also grant another turn. If you finish on your
          rival, the two tokens <strong>swap positions</strong>.
        </p>
        <p>
          Classic hazards still apply: the inn loses 1 turn, the well 2, the maze returns to 30,
          prison loses 3 and death sends you back to the start. The board marks every special
          square with an icon.
        </p>
        <p>
          Each player has <strong>three Fortune Feathers</strong>. After seeing a roll, spend one
          to reroll once before moving. Easy spends them almost randomly; Hard compares the roll
          against every possible destination. Friend rooms use exactly the same rules.
        </p>
      </>
    ),
    tagline: "From goose to goose — if fortune lets you.",
    difficultyDescription: {
      easy: "Rarely rerolls and does so without much judgement.",
      medium: "Uses feathers to escape the worst hazards.",
      hard: "Compares the current landing with the expected value of all six rolls.",
    },
    playFriend: "Play with a friend",
    goalReached: "Square 63 reached",
    yourRoll: "Your turn — roll the die.",
    chooseRoll: (roll) => `You rolled ${roll}. Move or spend a Fortune Feather.`,
    aiTurn: "The AI is consulting its fortune…",
    rerolled: (actor, roll) => `${actor}: Fortune Feather spent — new roll ${roll}.`,
    specialNames: {
      goose: "Goose",
      bridge: "Bridge",
      inn: "Inn",
      dice: "Dice",
      well: "Well",
      maze: "Maze",
      prison: "Prison",
      death: "Death",
      goal: "Goal",
    },
    specialFeedback: {
      goose: (actor, destination) => `${actor}: goose jump to ${destination} — roll again!`,
      bridge: (actor) => `${actor}: across the bridge to 12 — roll again!`,
      inn: (actor) => `${actor}: the inn costs one turn.`,
      dice: (actor, destination) => `${actor}: from dice to dice, landing on ${destination} — roll again!`,
      well: (actor) => `${actor}: trapped in the well for two turns.`,
      maze: (actor) => `${actor}: lost in the maze, back to 30.`,
      prison: (actor) => `${actor}: prison costs three turns.`,
      death: (actor) => `${actor}: death sends the token back to the start.`,
      goal: (actor) => `${actor}: square 63 — victory!`,
    },
    moved: (actor, destination) => `${actor}: moved to square ${destination}.`,
    swapped: (actor) => `${actor} landed on the rival: positions swapped.`,
    skippedTurns: (count) => `${count} pending ${count === 1 ? "turn was" : "turns were"} skipped.`,
    squareStatus: (square) => (square === 0 ? "Start" : `Square ${square}`),
    feathers: (count) => `${count} ${count === 1 ? "feather" : "feathers"}`,
    boardLabel: "Game of the Goose board, squares 1 to 63",
    squareLabel: (square, special) => `Square ${square}${special ? `, ${special}` : ""}`,
    tokenLabel: (actor, square) => `${actor} on ${square === 0 ? "the start" : `square ${square}`}`,
    dieResult: (roll) => `Die result: ${roll}`,
    dieReady: "Die ready to roll",
    rollDice: "Roll die",
    moveButton: (roll) => `Move ${roll}`,
    move: "Move",
    useFeather: "Reroll",
  },
  tileRummy: {
    rules: (
      <>
        <p>
          Each player starts with <strong>14 tiles</strong>. On your turn, select tiles from your
          rack and play one valid meld to the table, or draw one tile if you have no legal meld.
          First player to empty their rack wins.
        </p>
        <p>
          A <strong>group</strong> is 3 or 4 tiles with the same number and different colours. A{" "}
          <strong>run</strong> is 3 or more consecutive numbers in the same colour. Jokers can
          replace any missing tile.
        </p>
        <p>
          Before playing normal melds, you must <strong>open with at least 30 points</strong> in a
          single meld. After that, any valid meld is allowed. Tile points are their face values;
          jokers score the value they represent.
        </p>
        <p>
          This version keeps turns clean for online play: you build new melds from your rack rather
          than rearranging the whole table. Friend rooms use the exact same rules as solo mode.
        </p>
      </>
    ),
    tagline: "Read the rack, save the joker, strike at the right time.",
    difficultyDescription: {
      easy: "Plays a random legal meld and often wastes jokers.",
      medium: "Usually chooses the highest scoring meld, with occasional imperfect choices.",
      hard: "Prioritises opening, efficient runs and endgame pressure.",
    },
    playFriend: "Play with a friend",
    colors: { ruby: "ruby", sun: "sun", leaf: "leaf", sky: "sky" },
    meldKinds: { group: "Group", run: "Run" },
    invalidReasons: {
      tooFew: "Select at least three tiles.",
      mixed: "That is not a valid group or run.",
      duplicateColor: "A group cannot repeat a colour.",
      gap: "The run has a gap the jokers cannot cover.",
      opening: "Your first meld must be worth at least 30 points.",
    },
    emptyRack: "Rack emptied",
    yourTurn: "Your turn — build a group or run.",
    aiTurn: "The AI is scanning its rack…",
    drew: (actor) => `${actor} drew one tile.`,
    played: (actor, count, score) => `${actor} played ${count} tiles for ${score} points.`,
    won: (actor) => `${actor} emptied the rack.`,
    tilesLeft: (count) => `${count} ${count === 1 ? "tile" : "tiles"}`,
    opened: "Opened",
    needsOpening: "Needs 30",
    pool: "Pool",
    openingRule: "Open with 30",
    tableLabel: "Tile Rummy table",
    emptyTable: "No melds on the table yet.",
    points: (score) => `${score} pts`,
    playMeld: (score) => `Play meld · ${score}`,
    playSelection: "Play selection",
    drawTile: "Draw tile",
    selectedCount: (count) => `${count} selected`,
    yourRack: "Your rack",
    drawHint: "No legal meld available: draw one tile.",
    playHint: "Select three or more tiles that form a group or a run.",
    jokerTile: "Joker tile",
    tileLabel: (color, value) => `${color} ${value}`,
  },
  domino: {
    rules: (
      <>
        <p>
          Each player starts with <strong>7 double-six dominoes</strong>. On your turn, play one
          tile on the left or right end of the chain. Matching pips must touch.
        </p>
        <p>
          If you cannot play, draw from the pool. When the pool is empty, you may pass. Empty your
          hand to win.
        </p>
        <p>
          If both players pass with no pool left, the board is blocked. The player with the lowest
          pip total in hand wins; equal totals count as a tie.
        </p>
      </>
    ),
    tagline: "Control the ends, count the pips, block at the right moment.",
    difficultyDescription: {
      easy: "Plays a random legal tile and does not plan the open ends.",
      medium: "Usually sheds high-value tiles and keeps some flexibility.",
      hard: "Prioritises doubles, end control and late blocking pressure.",
    },
    playFriend: "Play with a friend",
    blockedTie: "Blocked board — tied pip totals.",
    endScore: (you, them) => `Pips left: ${you} / ${them}`,
    yourTurn: "Your turn — choose a tile and an end.",
    aiTurn: "The AI is counting the open ends…",
    played: (actor, tile) => `${actor} played ${tile}.`,
    drew: (actor) => `${actor} drew a domino.`,
    passed: (actor) => `${actor} passed.`,
    won: (actor) => `${actor} emptied the hand.`,
    notPlayable: "That domino does not match either open end.",
    pool: "Pool",
    tilesLeft: (count) => `${count} ${count === 1 ? "tile" : "tiles"}`,
    emptyBoard: "Play any domino to start the chain.",
    boardLabel: "Domino board",
    playLeft: "Play left",
    playRight: "Play right",
    drawTile: "Draw",
    pass: "Pass",
    yourHand: "Your hand",
    drawHint: "No matching tile available: draw from the pool.",
    playHint: "Select a domino, then choose the left or right end.",
    tileLabel: (a, b) => `Domino ${a}-${b}`,
  },
  slidingPuzzle: {
    rules: (
      <>
        <p>
          Slide tiles into the empty space until every number is back in order, left to right and
          top to bottom. The empty space belongs in the bottom-right corner.
        </p>
        <p>
          Every board is generated by legal shuffling from the solved layout, so the puzzle is
          always possible. Larger boards require more planning and fewer impulsive moves.
        </p>
      </>
    ),
    tagline: "Read the gap, plan the row, bring every tile home.",
    boardSize: "Board size",
    sizeLabels: { 3: "3 × 3", 4: "4 × 4", 5: "5 × 5" },
    sizeDescription: {
      3: "Fast puzzle with eight tiles.",
      4: "Classic fifteen-puzzle balance.",
      5: "Large board for a longer solve.",
    },
    solvedTitle: "Puzzle solved",
    result: (moves, seconds) => `${moves} moves · ${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}`,
    moves: "Moves",
    time: "Time",
    size: "Size",
    playingHint: "Slide a tile adjacent to the empty space.",
    boardLabel: "Sliding puzzle board",
    emptyTile: "Empty space",
    tileLabel: (tile) => `Tile ${tile}`,
    moveHint: "Only highlighted neighbours can move into the gap.",
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
          Take <strong>five penalties</strong> and score at least three. Pick
          any point in the goal, choose a technique and tune its power.
        </p>
        <p>
          <strong>Placed</strong> shots are precise, <strong>Power</strong>{" "}
          shots beat the keeper&apos;s reach at the cost of control, and a{" "}
          <strong>Chip</strong> punishes a keeper who commits away from the
          centre.
        </p>
        <p>
          The keeper commits before the final trajectory is calculated. Mix
          your targets: stronger AI learns repeated placement but never sees
          the final ball position.
        </p>
      </>
    ),
    difficultyTipLabel: "How the goalkeeper thinks",
    difficultyTip: (
      <>
        <strong>Easy</strong> mostly guesses and has limited reach.{" "}
        <strong>Medium</strong> occasionally reads your body shape and starts
        noticing repeated targets. <strong>Hard</strong> learns patterns more
        aggressively, reads some strikes and covers more ground — but still
        commits before the ball&apos;s random deviation is known.
      </>
    ),
    setupSummary:
      "Five kicks. Three goals win. Every technique has a real trade-off.",
    goals: "Goals",
    saves: "Keeper saves",
    conversion: "Conversion",
    bestQuality: "Best execution",
    goalsCount: (count) => `${count} goals`,
    stopsCount: (count) => `${count} denied`,
    kickCount: (current, total) => `Kick ${Math.min(current, total)} of ${total}`,
    pendingKick: (kick) => `Kick ${kick} pending`,
    onTargetCount: (count) => `${count} on target`,
    missCount: (count) => `${count} off target`,
    aimPrompt: (target) => `Aiming ${target} — choose your technique`,
    shooting: "The ball is flying…",
    resultName: {
      goal: "GOAL! Clinical finish.",
      saved: "Saved! The keeper got across.",
      post: "Off the frame! So close.",
      miss: "Wide! The shot missed the target.",
    },
    shotStyle: "Technique",
    styles: {
      placed: "Placed",
      power: "Power",
      chip: "Chip",
    },
    styleDescriptions: {
      placed: "Accurate and controlled",
      power: "Fast but less forgiving",
      chip: "Beats an early dive",
    },
    quality: "Execution",
    speed: "Ball speed",
    keeperDecision: "Keeper",
    keeperStrategies: {
      guess: "Guessed",
      learn: "Followed your pattern",
      read: "Read the strike",
    },
    power: "Power",
    powerHint: (power, ideal) =>
      Math.abs(power - ideal) <= 7
        ? `Sweet spot · ideal ${ideal}%`
        : power < ideal
          ? `Underhit · ideal ${ideal}%`
          : `Overhit · ideal ${ideal}%`,
    target: "Target",
    targetName: (horizontal, vertical) => {
      const h = { left: "left", center: "centre", right: "right" }[horizontal];
      const v = { high: "high", middle: "middle", low: "low" }[vertical];
      return `${v} ${h}`;
    },
    estimatedAccuracy: "Control",
    estimatedSpeed: "Speed",
    shoot: "Strike",
    goalLabel: (target) =>
      `Goal. Current target: ${target}. Click or tap to aim; use arrow keys for fine control.`,
    keyboardHint:
      "Keyboard: arrows aim · Shift + arrows moves faster · Enter shoots",
    kickHistory: "Penalty history",
    endWin: "You win the shootout!",
    endLoss: "The goalkeeper wins the shootout.",
    endRating: (goals) =>
      goals === 5
        ? "Flawless · World class"
        : goals === 4
          ? "Clinical finisher"
          : goals === 3
            ? "Ice-cold under pressure"
            : goals === 2
              ? "Promising, but denied"
              : "The keeper owned the night",
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
          <strong>Shoot</strong> in the green zone for the full shot value.
          The yellow zone scores one point; every other colour misses.
        </p>
        <p>The player with the most points after five rounds wins.</p>
      </>
    ),
    difficultyTipLabel: "How difficulty changes the challenge",
    difficultyTip: (
      <>
        Higher difficulty makes the meter move faster and increases the
        AI&apos;s shooting percentage. Your result is deterministic: green
        scores the full value, yellow scores one point and all other colours
        miss.
      </>
    ),
    yourPoints: "Your points",
    aiPoints: "AI points",
    tallyYou: (score) => `You ${score}`,
    tallyAi: (score) => `${score} AI`,
    roundLabel: (round, total, points) =>
      `Round ${round}/${total} · ${points}PT`,
    pointValue: (points) => `Up to ${points} points`,
    releasePrompt: "Green: full points · Yellow: 1 point",
    yourShot: "Your shot is in the air…",
    madeShot: (points) => `Swish! You score ${points}.`,
    yellowShot: "Basket! The yellow zone scores 1 point.",
    missedShot: "Wide! That colour does not score.",
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
  shadowProtocol: {
    rules: (
      <>
        <p>
          Move one tile per turn through the facility, grab the data core 💾 and
          reach the exit 🚪. Guards patrol and cameras rotate after every one of
          your actions — the tinted tiles show exactly what security can see.
        </p>
        <p>
          Sprinting covers two tiles but makes noise, the one-use beacon lures
          guards toward its sound, and hacking toggles an adjacent door or
          camera for three turns. Being seen starts a three-turn alarm: break
          line of sight before it runs out or the mission fails.
        </p>
      </>
    ),
    difficultyTipLabel: "How the security AI changes",
    difficultyTip: (
      <>
        <p>Easy guards step greedily toward evidence and forget it after one turn.</p>
        <p>Medium guards use A* pathfinding, remember for three turns and one chaser cuts off the exit.</p>
        <p>
          Hard guards intercept: they compute every tile you could have reached
          since last seen and cover the route to your objective. They never read
          your real hidden position.
        </p>
      </>
    ),
    turnLabel: (turn) => `Turn ${turn}`,
    coreCollected: "💾 Core secured",
    coreMissing: "💾 Core not taken",
    alarmLabel: (remaining, total) => `🚨 Alarm ${remaining}/${total}`,
    boardLabel: "Facility map",
    dpadLabel: "Movement controls",
    statusSneak: "Plan your move — security acts after you.",
    statusSpotted: (remaining) =>
      `Spotted! Break line of sight — ${remaining} alarm turn${remaining === 1 ? "" : "s"} left.`,
    statusCore: "Core secured — now reach the exit!",
    statusHeard: "A guard heard something and is investigating…",
    statusAimBeacon: "Tap a highlighted tile to throw the noise beacon.",
    statusSprintArmed: "Sprint armed — your next move covers two tiles but makes noise.",
    actionWait: "⏳ Wait",
    actionHack: "🔧 Hack",
    actionSprint: "💨 Sprint",
    actionBeacon: "📡 Beacon",
    legend:
      "🥷 you · 💂 guard · 📷 camera · 💾 core · 🚪 exit · tinted tiles are watched · rings are noise",
    endWin: "Extraction complete!",
    endLoss: "You were caught by facility security.",
    lossHint: "Watch the cones: guards see 5 tiles ahead in a 90° arc, cameras 7.",
    scoreTotal: "Score",
    scoreStealth: "No detection",
    scoreAlarm: "Alarm unused",
    scoreTurns: "Turns vs par",
    cellLabel: (x, y, tile, player, guard, camera, seen) => {
      const parts = [`Tile ${x + 1}, ${y + 1}: ${tile.replace("-", " ")}`];
      if (player) parts.push("you are here");
      if (guard) parts.push("guard");
      if (camera) parts.push("camera");
      if (seen) parts.push("watched by security");
      return parts.join(", ");
    },
  },
  fleetCommand: {
    rules: (
      <>
        <p>
          Place four ships (4, 3, 2, 2 cells) on your 8×8 grid — they cannot
          overlap or touch, not even diagonally. You and the AI then alternate
          single shots; sink the whole enemy fleet first to win.
        </p>
        <p>
          Once per match you can fire a sonar pulse instead of guessing blind:
          it reveals how many occupied cells exist in a 3×3 region, but not
          where. The AI has one sonar pulse too.
        </p>
      </>
    ),
    difficultyTipLabel: "How the targeting AI changes",
    difficultyTip: (
      <>
        <p>Easy fires at random and pokes around its hits.</p>
        <p>Medium hunts on a checkerboard and extends hit lines by orientation.</p>
        <p>
          Hard enumerates every legal placement of every surviving ship that
          matches its misses, hits and sonar count, then fires at the most
          probable cell. It never reads your real board.
        </p>
      </>
    ),
    placementTitle: "Deploy your fleet",
    placeShipHint: (length) => `Tap a cell to place your ${length}-cell ship (tap a ship to remove it).`,
    fleetReady: "Fleet deployed — ready to start. Tap a ship to reposition it.",
    rotateToVertical: "↕ Vertical",
    rotateToHorizontal: "↔ Horizontal",
    randomPlacement: "🎲 Random",
    clearPlacement: "Clear",
    placementCellLabel: (x, y, ship) => `Cell ${x}, ${y}${ship ? ": your ship" : ""}`,
    yourTurn: "Your turn — fire at the enemy grid.",
    aiThinking: "Enemy is aiming",
    sonarButton: "📡 Sonar pulse",
    sonarSpent: "📡 Sonar used",
    sonarPrompt: "Tap an enemy cell: sonar counts ships in that 3×3 region.",
    enemyWaters: "Enemy waters",
    yourFleet: "Your fleet",
    enemyBoardLabel: "Enemy grid — tap to fire",
    yourBoardLabel: "Your grid",
    enemyCellLabel: (x, y, mark) =>
      `Enemy cell ${x}, ${y}: ${mark === "none" ? "not fired" : mark}`,
    ownCellLabel: (x, y, ship, mark) =>
      `Your cell ${x}, ${y}: ${ship ? "ship" : "water"}${mark !== "none" ? `, ${mark}` : ""}`,
    enemyFleetStatus: (remaining, total) => `Enemy ships afloat: ${remaining}/${total}`,
    yourShots: "Your shots",
    aiShots: "AI shots",
    endWin: "Enemy fleet destroyed — you win!",
    endLoss: "Your fleet was sunk.",
  },
  windlineArchery: {
    rules: (
      <>
        <p>
          Five ends, one arrow each per end. Set your elevation, windage and
          draw power, then stop the swinging stability meter as close to centre
          as you can — the further off, the more your release drifts.
        </p>
        <p>
          The crosswind changes before every end and pushes your arrow while it
          flies. Rings score 10/8/6/4/2. Ties break on exact centres, then on
          total precision.
        </p>
      </>
    ),
    difficultyTipLabel: "How the AI archer changes",
    difficultyTip: (
      <>
        <p>Easy misreads the wind by up to ±35% and has a shaky release.</p>
        <p>Medium misreads by up to ±15% with a steadier hand.</p>
        <p>
          Hard reads the wind exactly but still has a small human release
          variance. Every tier obeys the same physics you do, and the AI arrow
          is locked in before you shoot.
        </p>
      </>
    ),
    endLabel: (current, total) => `End ${current}/${total}`,
    tallyYou: (score) => `You ${score}`,
    tallyAi: (score) => `AI ${score}`,
    windLabel: "Wind",
    windDetail: (horizontal, vertical) =>
      `${Math.abs(horizontal).toFixed(1)} ${horizontal >= 0 ? "→" : "←"} · ${Math.abs(vertical).toFixed(1)} ${vertical >= 0 ? "↑" : "↓"}`,
    targetLabel: "Archery target with arrow impacts",
    aimPrompt: "Set angle and power, then draw.",
    releasePrompt: "Tap release when the needle crosses the centre!",
    yourResult: (score) => `Your arrow scores ${score}. AI is shooting…`,
    bothResult: (you, ai) => `You scored ${you} — the AI scored ${ai}.`,
    angleLabel: (deg) => `Elevation: ${deg.toFixed(1)}°`,
    windageLabel: (deg) =>
      `Windage: ${deg === 0 ? "centred" : `${Math.abs(deg).toFixed(1)}° ${deg > 0 ? "right" : "left"}`}`,
    powerLabel: (power) => `Draw power: ${power}`,
    drawButton: "🏹 Draw",
    releaseButton: "Release!",
    meterLabel: "Release stability meter",
    yourCenters: "Your 10s",
    aiCenters: "AI 10s",
    yourPrecision: "Your drift",
    aiPrecision: "AI drift",
    endTitle: (winner) =>
      winner === "player"
        ? "You win the shoot-off!"
        : winner === "ai"
          ? "The AI wins the shoot-off."
          : "A perfect tie — even after tie-breaks!",
  },
  beatReactor: {
    rules: (
      <>
        <p>
          Four lanes feed generated notes toward the judgement line. Hit D, F,
          J, K (or tap the pads) exactly when a note crosses it — everything is
          timed against the audio clock, not the animation.
        </p>
        <p>
          Perfect ≤35 ms, Great ≤75 ms, Good ≤120 ms, otherwise a miss. Combo
          multiplies your base score: ×1.1 at 10, ×1.2 at 25, ×1.3 at 50.
        </p>
      </>
    ),
    difficultyTipLabel: "How the AI rival changes",
    difficultyTip: (
      <>
        <p>Every AI hit error is generated for the whole song before it starts and never changes.</p>
        <p>Easy averages 48 ms off with a 12% miss chance.</p>
        <p>Medium averages 20 ms off with a 5% miss chance.</p>
        <p>Hard averages 4 ms off with a 1.5% miss chance — still not perfect.</p>
      </>
    ),
    bpmLabel: "Tempo",
    lengthLabel: "Song length",
    barsShort: "Short",
    barsMedium: "Medium",
    barsLong: "Long",
    densityLabel: "Note density",
    densityLight: "Light",
    densityNormal: "Normal",
    densityDense: "Dense",
    silentMode: "Silent mode (visual only)",
    calibrationLabel: (ms) => `Audio calibration: ${ms > 0 ? "+" : ""}${ms} ms`,
    tallyYou: (score) => `You ${score}`,
    tallyAi: (score) => `AI ${score}`,
    lanesLabel: "Four note lanes",
    laneButtonLabel: (n) => `Lane ${n}`,
    judgementLabel: { perfect: "PERFECT", great: "GREAT", good: "GOOD", miss: "MISS" },
    comboYou: (combo) => `Your combo: ${combo}`,
    comboAi: (combo) => `AI combo: ${combo}`,
    yourBestCombo: "Your best combo",
    aiBestCombo: "AI best combo",
    accuracy: "Accuracy",
    endTitle: (winner) =>
      winner === "player"
        ? "Reactor stabilized — you win!"
        : winner === "ai"
          ? "The AI out-scored you."
          : "Dead even!",
  },
  circuitBreaker: {
    rules: (
      <>
        <p>
          Both light-cycles move every tick at the same time. Turn left,
          right, or go straight — you leave a permanent wall behind you.
          Crash into a wall, the border, or the other cycle and you&apos;re out.
        </p>
        <p>
          Both moves are collected before either applies, so there is no
          first-move advantage. First to 3 round wins takes the match; a
          head-on collision ties the round.
        </p>
      </>
    ),
    difficultyTipLabel: "How the rival cycle changes",
    difficultyTip: (
      <>
        <p>Easy picks a random turn, only avoiding an immediate crash.</p>
        <p>Medium floods the arena from each option and picks the one leaving it the most open space.</p>
        <p>
          Hard runs a simultaneous-move search several rounds ahead (time-boxed
          to stay under budget), weighing reachable space and containment
          pressure. It never reads your pending move before deciding its own.
        </p>
      </>
    ),
    tallyYou: (score) => `You ${score}`,
    tallyGoal: (target) => `First to ${target}`,
    tallyAi: (score) => `AI ${score}`,
    steer: "Steer left, right, or hold straight.",
    winRound: "You trapped the AI!",
    loseRound: "You crashed.",
    tieRound: "Head-on collision — round tied.",
    arenaLabel: "Light-cycle arena",
    turnLeft: "Left",
    straight: "Straight",
    turnRight: "Right",
    yourWins: "Your round wins",
    aiWins: "AI round wins",
    ties: "Ties",
  },
  diceforgeArena: {
    rules: (
      <>
        <p>Both fighters roll three custom dice. Lock one die, reroll the other two, then resolve damage, shields and energy simultaneously.</p>
        <p>Three damage faces gain 50% damage; three shields gain a persistent bonus. Damage + shield + energy earns a forge discount. Wild copies the strongest non-wild face. After combat, replace at most one die face from the seeded shop.</p>
      </>
    ),
    difficultyTipLabel: "How the forge rival changes",
    difficultyTip: (
      <>
        <p>Easy locks and buys randomly from legal options.</p>
        <p>Medium enumerates every reroll outcome and values the next upgrade.</p>
        <p>Hard uses the same exact roll search with shop-aware build synergy. It receives no hidden information and uses the same dice and economy.</p>
      </>
    ),
    youLabel: "YOU", aiLabel: "AI", roundLabel: (round, total) => `Round ${round}/${total}`,
    yourRoll: "Your dice", aiRoll: "AI dice", lockPrompt: "Lock one die. The other two reroll once.",
    lockDie: die => `Lock die ${die}`, resultLine: (you, ai) => `Damage: you ${you} · AI ${ai}.`,
    shopPrompt: "Forge one face, or save your coins.", costLabel: cost => `${cost} coins`,
    replaceLabel: (die, face) => `Replace face ${face} on die ${die}`, skipShop: "Save coins",
    healthResult: (you, ai) => `Health: you ${you} · AI ${ai}`,
    endTitle: winner => winner === "player" ? "You rule the forge!" : winner === "ai" ? "The rival claims the arena." : "The forge ends dead even.",
  },
  hexDominion: {
    rules: (
      <>
        <p>Place one stone per turn on the 7×7 hex board. Your blue stones must connect west to east; the AI&apos;s pink stones connect north to south.</p>
        <p>Connections use all six neighbouring hexes. Paths may twist and form bridges. There are no captures or hidden rules: the first complete path wins.</p>
      </>
    ),
    difficultyTipLabel: "How the territory AI changes",
    difficultyTip: (
      <>
        <p>Easy chooses legal cells with a mild edge preference.</p>
        <p>Medium blocks immediate wins and scores centre, edge and bridge patterns.</p>
        <p>Hard first checks forced wins and blocks, then runs 350 deterministic UCT playouts with centre- and bridge-biased rollouts.</p>
      </>
    ),
    yourTurn: "Your turn — connect blue from left to right.", aiThinking: "AI is mapping a route…",
    yourGoal: "Your path", aiGoal: "AI path", boardLabel: "Seven by seven Hex Dominion board",
    emptyCell: (row, col) => `Empty cell, row ${row}, column ${col}`,
    ownedCell: (row, col, owner) => `${owner === "player" ? "Your" : "AI"} cell, row ${row}, column ${col}`,
    youLegend: "You: west → east", aiLegend: "AI: north → south",
    movesLabel: moves => `${moves} stones placed`,
    endTitle: winner => winner === "player" ? "Your path spans the dominion!" : "The AI completed its path.",
  },
  neonDrift: {
    rules: (
      <>
        <p>
          Three laps against an AI rival. Your throttle is held automatically —
          you steer, brake into corners, and spend a limited boost meter on the
          straights. Leaving the track cuts your grip and acceleration, so keep
          a clean racing line.
        </p>
        <p>
          Steer with ◀ ▶ (or arrow keys / A-D), brake with the brake pad (or
          Down/S), and boost with the boost pad (or Space). Cross all six
          checkpoints each lap in order. Fastest total time wins.
        </p>
      </>
    ),
    difficultyTipLabel: "How the rival driver changes",
    difficultyTip: (
      <>
        <p>The rival obeys the exact same grip, acceleration, boost and off-track rules you do — no rubber-banding.</p>
        <p>Easy uses a short look-ahead, drives at 82% of the racing-line speed and botches one brake per lap.</p>
        <p>Medium looks further ahead and carries 94% of the line speed.</p>
        <p>Hard uses curvature-aware look-ahead, full line speed and no scripted mistakes.</p>
      </>
    ),
    trackLabel: "Circuit",
    trackNames: { circuit: "Circuit", serpent: "Serpent", speedway: "Speedway" },
    lapLabel: (lap, total) => `Lap ${lap}/${total}`,
    leading: "Leading",
    chasing: "Chasing",
    trackAria: "Race track, top-down view",
    boostLabel: "Boost meter",
    steerLeft: "Steer left",
    steerRight: "Steer right",
    brake: "Brake",
    brakeShort: "BRAKE",
    boost: "Boost",
    boostShort: "BOOST",
    endTitle: (outcome) =>
      outcome === "player"
        ? "You take the checkered flag!"
        : outcome === "ai"
          ? "The AI crosses the line first."
          : "A photo finish — dead heat!",
    finishTimes: (you, ai) => `You ${you} · AI ${ai}`,
    bestLap: "Best lap",
    offTrack: "Off-track",
    boostEff: "Clean racing",
    personalBest: "Track record",
  },
  signalBreaker: {
    rules: (
      <>
        <p>
          You and the AI each hide a secret 4-symbol code and race to crack the
          other&apos;s in at most 8 guesses. Tap a slot to cycle symbols (or pick
          from the palette), then submit.
        </p>
        <p>
          After each guess: a filled dot means a symbol is right and in the
          right place; a hollow dot means a symbol is right but in the wrong
          place. Fewest guesses wins; equal counts are decided by solve time.
        </p>
      </>
    ),
    difficultyTipLabel: "How the AI cracks codes",
    difficultyTip: (
      <>
        <p>The AI only ever sees the feedback from its own guesses, never your code.</p>
        <p>Easy guesses a random code still consistent with its clues.</p>
        <p>Medium runs minimax elimination over a sampled candidate set.</p>
        <p>
          Hard uses exact worst-case minimax over every remaining candidate, and
          its code-setter picks a secret that resists your usual opening guesses.
        </p>
      </>
    ),
    allowRepeats: "Allow repeated symbols",
    yourAttack: "Your attack",
    aiAttack: "AI attack",
    guessCount: (used, max) => `Guess ${used}/${max}`,
    slotLabel: (n) => `Code slot ${n} — tap to change`,
    submit: "Submit guess",
    clear: "Clear",
    waitingForAi: "Code cracked — waiting for the AI to finish…",
    legend: "● filled = right symbol, right spot · ○ hollow = right symbol, wrong spot",
    endTitle: (outcome) =>
      outcome === "player"
        ? "You cracked it first!"
        : outcome === "ai"
          ? "The AI cracked your code first."
          : "A dead heat — same guesses, same time!",
    yourGuesses: "Your guesses",
    aiGuesses: "AI guesses",
    codeWas: "The AI's code was",
  },
  spellstorm: {
    rules: (
      <>
        <p>
          Type each displayed word correctly to gain energy equal to its length.
          A typo stays visible and resets your combo; correct it with Backspace.
          The duel lasts 75 seconds, or ends immediately when a mage reaches zero health.
        </p>
        <p>
          At 20 energy cast Fire for 18 damage, Ice to delay the rival&apos;s next
          word, or Shield to absorb 15 damage. Damage hits shields before health.
          Highest health wins when time expires.
        </p>
      </>
    ),
    difficultyTipLabel: "How the rival typist changes",
    difficultyTip: (
      <>
        <p>Easy types at 120–180 WPM with an 8% corrected-typo chance and picks spells randomly.</p>
        <p>Medium types at 180–240 WPM with 3% corrected typos and shields when badly hurt.</p>
        <p>Hard types at 260–330 WPM with 0.8% corrected typos and maximizes one-step spell utility. Every completion time is fixed before its word begins.</p>
      </>
    ),
    you: "YOU",
    ai: "AI",
    timeLabel: (seconds) => `${seconds} seconds remaining`,
    elementLabels: { fire: "Fire word", ice: "Ice word", shield: "Shield word" },
    spellLabels: { fire: "Fire", ice: "Ice", shield: "Shield" },
    spellEffects: { fire: "18 damage", ice: "Slow next word", shield: "Absorb 15" },
    typeLabel: "Type the current spell word",
    typePrompt: "Type the word exactly",
    frozen: "Frozen — next word delayed",
    aiTyping: "AI is typing",
    aiCorrecting: "AI corrected a typo",
    energyHint: (cost) => `Correct words charge energy. Cast a spell at ${cost}.`,
    castFeedback: (actor, spell) =>
      `${actor === "player" ? "You cast" : "AI casts"} ${spell === "fire" ? "Fire" : spell === "ice" ? "Ice" : "Shield"}!`,
    endTitle: (outcome) =>
      outcome === "player" ? "You command the storm!" : outcome === "ai" ? "The rival mage wins." : "The storm ends in a draw.",
    healthResult: (you, ai) => `Health: you ${you} · AI ${ai}`,
    yourWords: "Your words",
    aiWords: "AI words",
  },
  rooms: {
    navLink: "Play with Friends",
    title: "Play with Friends",
    tagline: "Create a room, share the code, play live against a friend instead of the AI.",
    yourNameLabel: "Your name",
    namePlaceholder: "e.g. Joan",
    createTab: "Create a room",
    joinTab: "Join a room",
    chooseGameLabel: "Game",
    currentGameLabel: "Current game",
    roomSettingsTitle: "Room game & settings",
    hostSettingsHint: "Host controls: changing game or settings restarts the room for both players, keeping the same code.",
    guestSettingsHint: "The host can change game or settings here without creating a new room.",
    applyRoomSettings: "Apply to room",
    changingGame: "Changing room…",
    settingLabels: {
      size: "Board size",
      pieceCount: "Pieces",
      rule: "Rules",
      target: "Match length",
      aceHigh: "Ace rule",
      maxRounds: "Game length",
      bpm: "BPM",
      bars: "Length",
      density: "Density",
    },
    settingOptionLabels: {
      size: { "4": "4 × 4", "6": "6 × 6" },
      pieceCount: { "2": "Quick · 2 pieces", "4": "Classic · 4 pieces" },
      rule: { normal: "Normal", misere: "Misère" },
      target: { "1": "One win", "2": "Best of 3", "3": "First to 3", "5": "First to 5", "10": "First to 10" },
      aceHigh: { true: "Ace high", false: "Ace low" },
      maxRounds: { "12": "Short · 12 rounds", "20": "Standard · 20 rounds" },
      bpm: { "90": "90", "110": "110", "130": "130" },
      bars: { "8": "8 bars", "12": "12 bars", "16": "16 bars" },
      density: { light: "Light", normal: "Normal", dense: "Dense" },
    },
    createButton: "Create room",
    roomCodeLabel: "Room code",
    codePlaceholder: "e.g. K7RXPQ",
    joinButton: "Join room",
    nameRequired: "Enter your name first.",
    codeRequired: "Enter the room code.",
    connecting: "Connecting…",
    waitingTitle: "Waiting for your friend",
    shareCode: (code) => `Share this code: ${code}`,
    waitingHint: "The match starts as soon as they join with this code.",
    leaveButton: "Leave room",
    backToRooms: "Back to rooms",
    roomNotFound: "That room doesn't exist. Check the code and try again.",
    roomGone: "This room has ended.",
    roomExpired: "This room has expired (rooms last 24 hours). Create a new one.",
    errorGeneric: "Something went wrong. Please try again.",
    opponentJoined: (name) => `${name} joined!`,
    submittedWaiting: "Waiting for your opponent…",
    roundResultWin: "You win the round!",
    roundResultLose: "You lose the round.",
    roundResultTie: "Tie round.",
    matchWinYou: "You win the match! 🏆",
    matchWinOpponent: (name) => `${name} wins the match.`,
    rematchButton: "Play again",
    rematchWaiting: "Waiting for your opponent to accept the rematch…",
    turnYours: "Your turn",
    turnOpponent: (name) => `${name}'s turn`,
  },
  penaltyRoom: {
    youShoot: "⚽ You shoot",
    youKeep: "🧤 You're in goal",
    shootPrompt: "Pick a corner to aim for — blind.",
    keepPrompt: "Pick where to dive — blind.",
    zones: {
      HL: "Top left",
      HC: "Top centre",
      HR: "Top right",
      LL: "Bottom left",
      LC: "Bottom centre",
      LR: "Bottom right",
    },
    resultYouScored: "⚽ GOAL! You scored.",
    resultConceded: "😖 Goal conceded.",
    resultYouMissed: "🧤 Saved! Keeper guessed right.",
    resultYouSaved: "🧤 Great save!",
    tallyYou: (score) => `You: ${score}`,
    tallyGoal: (target) => `First to ${target} goals`,
    historyLabel: "Kick history",
    youWord: "You",
    goalWord: "Goal",
    saveWord: "Save",
  },
  basketRoom: {
    youShoot: "🏀 You shoot",
    youDefend: "🛡️ You defend",
    shootPrompt: "Pick your shot — blind. Bigger shots score more.",
    defendPrompt: "Pick the spot to contest — blind.",
    spots: {
      layup: "Layup",
      mid: "Mid-range",
      three: "Three",
    },
    pts: (points) => `${points} pt${points === 1 ? "" : "s"}`,
    resultYouScored: (points) => `🏀 Bucket! +${points}.`,
    resultConceded: (points) => `😖 Bucket conceded (+${points}).`,
    resultYouBlocked: "🛡️ Blocked! No points.",
    resultYouStopped: "🛡️ Great stop!",
    tallyYou: (score) => `You: ${score}`,
    tallyGoal: (target) => `First to ${target} points`,
    historyLabel: "Shot history",
    youWord: "You",
    plusPts: (points) => `+${points}`,
    blockedWord: "Blocked",
  },
  guessRoom: {
    yourTurn: "Your turn — take a guess",
    opponentTurn: (name) => `${name} is guessing…`,
    rangePrompt: (low, high) => `The number is between ${low} and ${high}.`,
    guessButton: "Guess",
    inputPlaceholder: "Number",
    tallyYou: (score) => `You: ${score}`,
    tallyGoal: (target) => `First to ${target} rounds`,
    verdicts: { high: "Too high", low: "Too low" },
    correctWord: "Got it! 🎯",
    logTitle: "This round",
    youWord: "You",
  },
  holRoom: {
    yourTurn: "Your turn — higher or lower?",
    opponentTurn: (name) => `${name} is calling…`,
    callPrompt: "Will the next card be higher or lower?",
    calls: { higher: "Higher", lower: "Lower" },
    currentLabel: "Current card",
    tallyYou: (score) => `You: ${score}`,
    tallyGoal: (target) => `First to ${target} points`,
    lastCall: (name, call, correct) =>
      `${name} called ${call} — ${correct ? "correct! ✓" : "missed ✗"}`,
    correctWord: "Correct",
    missWord: "Missed",
    tieTitle: "It's a tie! 🤝",
    logTitle: "Call history",
    youWord: "You",
  },
  memoryRoom: {
    yourTurn: "Your turn — flip two tiles",
    opponentTurn: (name) => `${name} is flipping…`,
    matchBy: (name) => `${name} found a pair! 🎉`,
    missBy: (name) => `${name} missed.`,
    tallyYou: (score) => `You: ${score}`,
    pairsLeft: (count) => `${count} pair${count === 1 ? "" : "s"} left`,
    tieTitle: "It's a tie! 🤝",
    youWord: "You",
  },
  reactionRoom: {
    getReady: "Get ready…",
    waitGreen: "Wait for green…",
    tapNow: "TAP!",
    falseStart: "Too early!",
    roundWon: "You won the round! ⚡",
    roundLost: "Opponent was faster.",
    roundTied: "Dead heat!",
    ms: (value) => `${value} ms`,
    tallyYou: (score) => `You: ${score}`,
    tallyGoal: (target) => `First to ${target} rounds`,
    youWord: "You",
  },
  fleetRoom: {
    placingTitle: "Place your fleet",
    placingHint: "Shuffle until you like the layout, then ready up.",
    shuffle: "Shuffle",
    ready: "Ready",
    readyWaiting: "Waiting for your opponent to be ready…",
    yourFleet: "Your fleet",
    enemyWaters: "Enemy waters",
    shotResult: (name, result) =>
      result === "sunk" ? `${name} sunk a ship! 💥` : result === "hit" ? `${name} scored a hit!` : `${name} missed.`,
    cellLabel: (index) => `Fire at cell ${index + 1}`,
    youWord: "You",
  },
  shadowRoom: {
    waitingOpponent: "Waiting for your opponent to finish their run…",
    youEscaped: (score) => `You escaped! Score ${score}.`,
    youCaught: "You were caught.",
    tieTitle: "It's a tie! 🤝",
    scoreLine: (you, them) => `Your score ${you} · Opponent ${them}`,
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
    "prism-clash": {
      name: "Choque Prisma",
      description: "Combina colores y símbolos, encadena combos y vacía tu mano primero.",
    },
    "property-baron": {
      name: "Barón Inmobiliario",
      description: "Compra calles, cobra alquileres, mejora propiedades y arruina al rival.",
    },
    parchis: {
      name: "Parchís Duelo",
      description: "Lleva tus fichas a meta usando seguros, capturas, puentes y bonus tácticos.",
    },
    "goose-game": {
      name: "Juego de la Oca",
      description: "Recorre 63 casillas, supera las trampas clásicas y administra tus repeticiones.",
    },
    "tile-rummy": {
      name: "Rummy de Fichas",
      description: "Forma grupos y escaleras, abre con 30 puntos y vacía tu atril antes que el rival.",
    },
    domino: {
      name: "Dominó",
      description: "Coloca fichas doble-seis en los extremos, roba si te bloqueas y vacía la mano.",
    },
    "sliding-puzzle": {
      name: "Rompecabezas",
      description: "Desliza fichas numeradas hasta ordenarlas en tableros 3x3, 4x4 o 5x5.",
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
    "shadow-protocol": {
      name: "Protocolo Sombra",
      description: "Roba el núcleo de datos y esquiva patrullas, cámaras y sonido.",
    },
    "fleet-command": {
      name: "Flota al Mando",
      description: "Oculta tu flota, usa el sónar y supera a una IA bayesiana.",
    },
    "windline-archery": {
      name: "Tiro con Viento",
      description: "Lee el viento cruzado, controla la suelta y gana a la IA.",
    },
    "beat-reactor": {
      name: "Reactor de Ritmo",
      description: "Acierta los ritmos generados con el reloj de audio y supera a la IA.",
    },
    "circuit-breaker": {
      name: "Ruptor de Circuito",
      description: "Atrapa la moto de luz de la IA en un duelo de turnos simultáneos.",
    },
    "diceforge-arena": {
      name: "Arena Diceforge",
      description: "Crea dados personalizados, forja caras y vence a una IA expectimax.",
    },
    "hex-dominion": {
      name: "Dominio Hex",
      description: "Conecta los bordes opuestos antes que una IA táctica.",
    },
    "neon-drift": {
      name: "Derrape Neón",
      description: "Corre contra la IA por circuitos de neón con trazadas limpias y turbo.",
    },
    "signal-breaker": {
      name: "Rompeseñales",
      description: "Descifra el código secreto de la IA antes de que descifre el tuyo.",
    },
    spellstorm: {
      name: "Tormenta de Hechizos",
      description: "Escribe palabras elementales, gestiona energía y supera a una IA temporal.",
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
  prismClash: {
    rules: (
      <>
        <p>
          Tu objetivo es <strong>vaciar la mano antes que tu rival</strong>. En tu turno, juega
          una carta que coincida con el <strong>color activo, número o símbolo</strong> del
          descarte. Las cartas Prisma combinan con todo y permiten elegir el próximo color.
        </p>
        <p>
          <strong>Congelar ❄</strong> salta al rival y te deja jugar de nuevo.{" "}
          <strong>Robo +2</strong> obliga al rival a tomar dos cartas. Si no tienes ninguna
          jugada válida, robas una carta y termina tu turno.
        </p>
        <p>
          La regla especial es el <strong>Combo Prisma</strong>: juega el mismo número con un
          color diferente para conseguir una jugada extra. Solo puede activarse un combo antes
          de ceder el turno, así que elige bien la continuación.
        </p>
        <p>
          Cada ronda comienza con siete cartas. Quien vacíe antes su mano gana la ronda;{" "}
          Puedes elegir <strong>una victoria</strong> para una partida rápida o{" "}
          <strong>mejor de 3</strong> para el duelo completo. En las salas con amigos
          las manos permanecen ocultas en pantalla y se aplican las mismas reglas.
        </p>
      </>
    ),
    tagline: "Controla el color. Construye el combo. Vacía tu mano.",
    difficultyDescription: {
      easy: "Juega cualquier carta válida sin preparar el siguiente turno.",
      medium: "Usa poderes y equilibra colores, aunque a veces se equivoca.",
      hard: "Analiza su mano, conserva cartas Prisma y presiona cuando te quedan pocas.",
    },
    matchLengthLabel: "Condición de victoria",
    singleWin: "Una victoria",
    bestOfThree: "Mejor de 3",
    playFriend: "Jugar con un amigo",
    colors: { ember: "Brasa", tide: "Marea", bloom: "Brote", volt: "Voltio" },
    yourTurn: "Tu turno — combina color, número o símbolo.",
    aiTurn: "La IA está leyendo el prisma…",
    actionDraw: (actor) => `${actor} no tenía combinación y robó una carta.`,
    actionCombo: (actor) => `${actor} activó un Combo Prisma — ¡una jugada extra!`,
    actionFreeze: (actor) => `${actor} congeló al rival — ¡una jugada extra!`,
    actionDraw2: (actor) => `${actor} lanzó una sobrecarga: el rival roba dos.`,
    actionPrism: (actor, color) => `${actor} cambió el color activo a ${color}.`,
    roundWin: (actor) => `¡${actor} vació la mano y ganó la ronda!`,
    scoreYou: (score) => `Tú ${score}`,
    scoreAi: (score) => `${score} IA`,
    firstTo: (target) => `primero a ${target}`,
    cardsCount: (count) => `${count} ${count === 1 ? "carta" : "cartas"}`,
    opponentHand: "Mano oculta del rival",
    hiddenCard: "Carta oculta",
    drawCard: "Robar una carta",
    drawPile: "Mazo de robo",
    activeColor: (color) => `Activo: ${color}`,
    chooseColor: "Elige el próximo color",
    cardLabel: (kind, color, value) =>
      kind === "number"
        ? `${color} ${value}`
        : kind === "freeze"
          ? `${color} Congelar`
          : kind === "draw2"
            ? `${color} Roba dos`
            : "Carta comodín Prisma",
    yourHand: "Tu mano",
    playHint: "Las cartas iluminadas son válidas. Combina color, número o símbolo.",
    drawHint: "No hay ninguna combinación — roba una carta.",
    waitHint: "Espera a que el rival termine su turno.",
  },
  propertyBaron: {
    rules: (
      <>
        <p>
          Tira dos dados y avanza por el circuito de la ciudad. Si caes en una propiedad libre
          puedes comprarla; si caes en una del rival, pagas alquiler.
        </p>
        <p>
          Tus propiedades pueden mejorarse dos veces. Las mejoras cuestan dinero ahora pero
          multiplican el alquiler futuro, así que debes decidir entre invertir o conservar liquidez.
        </p>
        <p>
          Las casillas de bonus y mercado dan dinero; los impuestos lo quitan. La partida termina
          por bancarrota o al llegar al límite de rondas; entonces gana el mayor patrimonio.
        </p>
      </>
    ),
    tagline: "Construye la ciudad. Cobra al rival. Mantén liquidez.",
    difficultyDescription: {
      easy: "Compra y mejora con poca planificación, a menudo quedándose sin caja.",
      medium: "Mantiene una reserva y solo invierte cuando el retorno es claro.",
      hard: "Valora alquiler, control de grupos y liquidez antes de cada inversión.",
    },
    shortGame: "Corta · 12 rondas",
    standardGame: "Estándar · 20 rondas",
    playFriend: "Jugar con un amigo",
    cash: (name, money) => `${name}: ${money}$`,
    round: (round, max) => `Ronda ${Math.min(round, max)}/${max}`,
    netWorthLine: (you, them) => `Patrimonio: ${you}$ · ${them}$`,
    rollPrompt: "Tira los dados y decide tu próxima inversión.",
    decisionPrompt: (tile) => `Decisión en ${tile}: compra, mejora o pasa.`,
    aiTurn: "La IA está revisando el flujo de caja…",
    rollDice: "Tirar dados",
    dice: (a, b) => `${a}+${b}`,
    buy: "Comprar",
    upgrade: "Mejorar",
    pass: "Pasar",
    logTitle: "Historial de movimientos",
    logFinalAudit: "Auditoría final: gana el patrimonio más alto.",
    logHoldingFineReason: "Multa de retención",
    logCharge: (reason, from, amount, to) =>
      `${reason}: ${from} paga ${amount}$${to ? ` a ${to}` : ""}.`,
    logLeaveHolding: (actor) => `${actor} paga para salir de la retención.`,
    logRoll: (actor, a, b, tile) => `${actor} tira ${a}+${b} y cae en ${tile}.`,
    logPassStart: (actor, amount) => `${actor} pasa por Start y cobra ${amount}$.`,
    logBonus: (actor, amount) => `${actor} cobra un bonus de ${amount}$.`,
    logMarket: (actor, amount) => `${actor} gana ${amount}$ con el movimiento del mercado.`,
    logBuy: (actor, tile, price) => `${actor} compra ${tile} por ${price}$.`,
    logUpgrade: (actor, tile, level) => `${actor} mejora ${tile} al nivel ${level}.`,
    logPass: (actor) => `${actor} pasa.`,
  },
  parchis: {
    rules: (
      <>
        <p>
          Lleva todas tus fichas desde <strong>casa hasta la meta central</strong>. Tira el dado
          y elige una de las fichas iluminadas. Un <strong>5 natural obliga a sacar ficha</strong>{" "}
          siempre que haya sitio en tu salida.
        </p>
        <p>
          Un <strong>6 permite volver a tirar</strong>; cuando todas tus fichas están fuera, el
          6 mueve siete casillas. Tres seises consecutivos devuelven a casa tu última ficha
          movida. Para entrar en meta necesitas el <strong>número exacto</strong>.
        </p>
        <p>
          Las casillas con punto son <strong>seguros</strong>: allí no se puede comer. Si caes
          sobre una ficha rival expuesta, vuelve a su casa y tú eliges una ficha válida para
          avanzar <strong>20 casillas adicionales</strong>. Llegar a meta concede un bonus de 10.
        </p>
        <p>
          Dos fichas del mismo color en una casilla forman un <strong>puente</strong> que nadie
          puede atravesar. Con un 6 debes abrir uno de tus puentes si es posible. El modo rápido
          usa dos fichas y el clásico cuatro. Las salas mantienen las mismas reglas de movimiento,
          capturas y puentes.
        </p>
      </>
    ),
    tagline: "Corre, bloquea, captura… y cuenta cada casilla.",
    difficultyDescription: {
      easy: "Mueve una ficha válida al azar.",
      medium: "Prioriza salidas, capturas, seguros y llegadas a meta.",
      hard: "También calcula amenazas, puentes y el mejor destino para cada bonus.",
    },
    gameLength: "Formato de partida",
    quickGame: "Rápida · 2 fichas",
    classicGame: "Clásica · 4 fichas",
    playFriend: "Jugar con un amigo",
    finishedCount: (count) => `${count} fichas llegaron a meta`,
    yourRoll: "Tu turno — tira el dado.",
    choosePiece: "Elige una de las fichas iluminadas.",
    aiTurn: "La IA está contando casillas…",
    chooseBonus: (steps) => `Movimiento de bonus: elige una ficha para avanzar ${steps} casillas.`,
    captured: (actor) => `${actor}: ficha rival comida — elige una ficha para el bonus.`,
    reachedGoal: (actor) => `${actor}: ficha en meta — elige una ficha para el bonus de 10.`,
    tripleSix: (actor) => `${actor}: tercer seis; la última ficha vuelve a casa.`,
    noMove: (actor) => `Sin movimiento válido para ${actor}.`,
    pieceStatus: (home, goal) => `${home} en casa · ${goal} en meta`,
    boardLabel: "Tablero de parchís",
    pieceStatuses: { home: "en casa", track: "en el circuito", lane: "en el pasillo final", goal: "en meta" },
    pieceLabel: (actor, piece, status) => `${actor}, ficha ${piece}, ${status}`,
    rollDice: "Tirar dado",
    moveSteps: (steps) => `Avanza ${steps} casillas`,
    rollPrompt: "Tira para comenzar tu movimiento",
    waitPrompt: "Espera al rival",
    safeLegend: "Casilla segura",
    bridgeLegend: "El puente bloquea el paso",
  },
  gooseGame: {
    rules: (
      <>
        <p>
          Llega antes que tu rival a la <strong>casilla 63</strong>. Tira el dado y avanza esa
          cantidad. Necesitas el número exacto: si te pasas de 63, la ficha{" "}
          <strong>rebota hacia atrás</strong>.
        </p>
        <p>
          Al caer en una <strong>oca</strong>, saltas hasta la siguiente y vuelves a tirar. El
          puente (6→12) y los dados (26↔53) también conceden otra tirada. Si terminas sobre tu
          rival, ambas fichas <strong>intercambian sus posiciones</strong>.
        </p>
        <p>
          Se mantienen las trampas clásicas: la posada pierde 1 turno, el pozo 2, el laberinto
          vuelve a la 30, la cárcel pierde 3 y la muerte devuelve al inicio. El tablero identifica
          cada casilla especial con un icono.
        </p>
        <p>
          Cada jugador dispone de <strong>tres Plumas de Fortuna</strong>. Tras ver una tirada,
          gasta una para repetirla una sola vez antes de mover. La IA fácil las usa casi al azar;
          la difícil compara todos los destinos posibles. Las salas usan las mismas reglas.
        </p>
      </>
    ),
    tagline: "De oca a oca… si la fortuna te toca.",
    difficultyDescription: {
      easy: "Casi nunca repite y decide sin demasiado criterio.",
      medium: "Usa las plumas para evitar las peores trampas.",
      hard: "Compara la llegada actual con el valor esperado de las seis tiradas.",
    },
    playFriend: "Jugar con un amigo",
    goalReached: "Casilla 63 alcanzada",
    yourRoll: "Tu turno — tira el dado.",
    chooseRoll: (roll) => `Has sacado ${roll}. Mueve o gasta una Pluma de Fortuna.`,
    aiTurn: "La IA está consultando a la fortuna…",
    rerolled: (actor, roll) => `${actor}: Pluma de Fortuna gastada — nueva tirada ${roll}.`,
    specialNames: {
      goose: "Oca",
      bridge: "Puente",
      inn: "Posada",
      dice: "Dados",
      well: "Pozo",
      maze: "Laberinto",
      prison: "Cárcel",
      death: "Muerte",
      goal: "Meta",
    },
    specialFeedback: {
      goose: (actor, destination) => `${actor}: de oca a oca hasta la ${destination} — ¡vuelve a tirar!`,
      bridge: (actor) => `${actor}: de puente a puente hasta la 12 — ¡vuelve a tirar!`,
      inn: (actor) => `${actor}: la posada cuesta un turno.`,
      dice: (actor, destination) => `${actor}: de dados a dados hasta la ${destination} — ¡vuelve a tirar!`,
      well: (actor) => `${actor}: atrapado en el pozo durante dos turnos.`,
      maze: (actor) => `${actor}: perdido en el laberinto, vuelve a la 30.`,
      prison: (actor) => `${actor}: la cárcel cuesta tres turnos.`,
      death: (actor) => `${actor}: la muerte devuelve la ficha al inicio.`,
      goal: (actor) => `${actor}: casilla 63 — ¡victoria!`,
    },
    moved: (actor, destination) => `${actor}: avanza a la casilla ${destination}.`,
    swapped: (actor) => `${actor} cayó sobre el rival: intercambian posiciones.`,
    skippedTurns: (count) => `Se ${count === 1 ? "saltó" : "saltaron"} ${count} turnos pendientes.`,
    squareStatus: (square) => (square === 0 ? "Inicio" : `Casilla ${square}`),
    feathers: (count) => `${count} ${count === 1 ? "pluma" : "plumas"}`,
    boardLabel: "Tablero del Juego de la Oca, casillas 1 a 63",
    squareLabel: (square, special) => `Casilla ${square}${special ? `, ${special}` : ""}`,
    tokenLabel: (actor, square) => `${actor} en ${square === 0 ? "el inicio" : `la casilla ${square}`}`,
    dieResult: (roll) => `Resultado del dado: ${roll}`,
    dieReady: "Dado listo para tirar",
    rollDice: "Tirar dado",
    moveButton: (roll) => `Avanzar ${roll}`,
    move: "Avanzar",
    useFeather: "Repetir",
  },
  tileRummy: {
    rules: (
      <>
        <p>
          Cada jugador empieza con <strong>14 fichas</strong>. En tu turno, selecciona fichas del
          atril y baja una combinación válida a la mesa, o roba una ficha si no tienes ninguna
          jugada legal. Gana quien vacíe antes su atril.
        </p>
        <p>
          Un <strong>grupo</strong> son 3 o 4 fichas del mismo número y colores distintos. Una{" "}
          <strong>escalera</strong> son 3 o más números consecutivos del mismo color. Los comodines
          sustituyen cualquier ficha que falte.
        </p>
        <p>
          Antes de jugar combinaciones normales debes <strong>abrir con al menos 30 puntos</strong>{" "}
          en una sola combinación. Después vale cualquier combinación válida. Cada ficha suma su
          valor; el comodín suma el valor que representa.
        </p>
        <p>
          Esta versión mantiene los turnos limpios para jugar online: creas nuevas combinaciones
          desde tu atril, sin reorganizar toda la mesa. Las salas usan exactamente las mismas reglas.
        </p>
      </>
    ),
    tagline: "Lee el atril, guarda el comodín y baja en el momento justo.",
    difficultyDescription: {
      easy: "Juega una combinación legal al azar y suele malgastar comodines.",
      medium: "Normalmente elige la combinación con más puntos, con algún fallo ocasional.",
      hard: "Prioriza abrir, usar bien las escaleras y presionar en el final.",
    },
    playFriend: "Jugar con un amigo",
    colors: { ruby: "rojo", sun: "amarillo", leaf: "verde", sky: "azul" },
    meldKinds: { group: "Grupo", run: "Escalera" },
    invalidReasons: {
      tooFew: "Selecciona al menos tres fichas.",
      mixed: "Eso no es un grupo ni una escalera válidos.",
      duplicateColor: "Un grupo no puede repetir color.",
      gap: "La escalera tiene un hueco que los comodines no cubren.",
      opening: "Tu primera combinación debe valer al menos 30 puntos.",
    },
    emptyRack: "Atril vacío",
    yourTurn: "Tu turno — forma un grupo o una escalera.",
    aiTurn: "La IA está revisando su atril…",
    drew: (actor) => `${actor} roba una ficha.`,
    played: (actor, count, score) => `${actor} baja ${count} fichas por ${score} puntos.`,
    won: (actor) => `${actor} ha vaciado el atril.`,
    tilesLeft: (count) => `${count} ${count === 1 ? "ficha" : "fichas"}`,
    opened: "Abierto",
    needsOpening: "Necesita 30",
    pool: "Pozo",
    openingRule: "Abrir con 30",
    tableLabel: "Mesa de Rummy de Fichas",
    emptyTable: "Aún no hay combinaciones en la mesa.",
    points: (score) => `${score} pts`,
    playMeld: (score) => `Bajar combinación · ${score}`,
    playSelection: "Bajar selección",
    drawTile: "Robar ficha",
    selectedCount: (count) => `${count} seleccionadas`,
    yourRack: "Tu atril",
    drawHint: "No tienes jugada legal: roba una ficha.",
    playHint: "Selecciona tres o más fichas que formen un grupo o una escalera.",
    jokerTile: "Comodín",
    tileLabel: (color, value) => `${color} ${value}`,
  },
  domino: {
    rules: (
      <>
        <p>
          Cada jugador empieza con <strong>7 fichas de dominó doble-seis</strong>. En tu turno,
          juega una ficha en el extremo izquierdo o derecho de la cadena. Los puntos que se tocan
          deben coincidir.
        </p>
        <p>
          Si no puedes jugar, roba del pozo. Cuando el pozo está vacío, puedes pasar. Gana quien
          vacíe antes la mano.
        </p>
        <p>
          Si ambos jugadores pasan sin pozo, la partida queda bloqueada. Gana quien tenga menos
          puntos en la mano; si hay igualdad, cuenta como empate.
        </p>
      </>
    ),
    tagline: "Controla los extremos, cuenta los puntos y bloquea en el momento justo.",
    difficultyDescription: {
      easy: "Juega una ficha legal al azar y no planifica los extremos.",
      medium: "Normalmente se quita fichas de alto valor y conserva algo de flexibilidad.",
      hard: "Prioriza dobles, control de extremos y presión de bloqueo al final.",
    },
    playFriend: "Jugar con un amigo",
    blockedTie: "Mesa bloqueada — empate a puntos.",
    endScore: (you, them) => `Puntos restantes: ${you} / ${them}`,
    yourTurn: "Tu turno — elige una ficha y un extremo.",
    aiTurn: "La IA está contando los extremos abiertos…",
    played: (actor, tile) => `${actor} juega ${tile}.`,
    drew: (actor) => `${actor} roba una ficha.`,
    passed: (actor) => `${actor} pasa.`,
    won: (actor) => `${actor} ha vaciado la mano.`,
    notPlayable: "Esa ficha no encaja en ningún extremo.",
    pool: "Pozo",
    tilesLeft: (count) => `${count} ${count === 1 ? "ficha" : "fichas"}`,
    emptyBoard: "Juega cualquier ficha para iniciar la cadena.",
    boardLabel: "Mesa de dominó",
    playLeft: "Izquierda",
    playRight: "Derecha",
    drawTile: "Robar",
    pass: "Pasar",
    yourHand: "Tu mano",
    drawHint: "No tienes una ficha que encaje: roba del pozo.",
    playHint: "Selecciona una ficha y luego elige el extremo izquierdo o derecho.",
    tileLabel: (a, b) => `Ficha ${a}-${b}`,
  },
  slidingPuzzle: {
    rules: (
      <>
        <p>
          Desliza fichas hacia el espacio vacío hasta que todos los números queden ordenados de
          izquierda a derecha y de arriba abajo. El hueco debe terminar en la esquina inferior
          derecha.
        </p>
        <p>
          Cada tablero se mezcla con movimientos legales desde la solución, así que siempre se
          puede resolver. Los tableros grandes exigen planificar más y mover menos por impulso.
        </p>
      </>
    ),
    tagline: "Lee el hueco, planifica la fila y devuelve cada ficha a su sitio.",
    boardSize: "Tamaño del tablero",
    sizeLabels: { 3: "3 × 3", 4: "4 × 4", 5: "5 × 5" },
    sizeDescription: {
      3: "Puzzle rápido de ocho fichas.",
      4: "El clásico quince-puzzle equilibrado.",
      5: "Tablero grande para una partida más larga.",
    },
    solvedTitle: "Rompecabezas resuelto",
    result: (moves, seconds) => `${moves} movimientos · ${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}`,
    moves: "Movimientos",
    time: "Tiempo",
    size: "Tamaño",
    playingHint: "Desliza una ficha adyacente al hueco.",
    boardLabel: "Tablero del rompecabezas",
    emptyTile: "Espacio vacío",
    tileLabel: (tile) => `Ficha ${tile}`,
    moveHint: "Solo las fichas resaltadas junto al hueco pueden moverse.",
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
          Lanza <strong>cinco penaltis</strong> y marca al menos tres. Elige
          cualquier punto de la portería, una técnica y su potencia.
        </p>
        <p>
          El tiro <strong>Colocado</strong> es preciso, el{" "}
          <strong>Potente</strong> supera el alcance del portero a cambio de
          control y la <strong>Vaselina</strong> castiga una estirada lejos del
          centro.
        </p>
        <p>
          El portero decide antes de calcularse la trayectoria final. Varía
          tus objetivos: la IA avanzada aprende patrones, pero nunca conoce el
          desvío final del balón.
        </p>
      </>
    ),
    difficultyTipLabel: "Cómo piensa el portero",
    difficultyTip: (
      <>
        En <strong>Fácil</strong> casi siempre adivina y tiene poco alcance. En{" "}
        <strong>Media</strong> a veces lee tu gesto y empieza a detectar
        objetivos repetidos. En <strong>Difícil</strong> aprende patrones con
        mayor intensidad, lee algunos golpeos y cubre más portería, pero
        siempre decide antes de conocer el desvío aleatorio.
      </>
    ),
    setupSummary:
      "Cinco tiros. Tres goles para ganar. Cada técnica exige una decisión real.",
    goals: "Goles",
    saves: "Paradas",
    conversion: "Conversión",
    bestQuality: "Mejor ejecución",
    goalsCount: (count) => `${count} goles`,
    stopsCount: (count) => `${count} sin gol`,
    kickCount: (current, total) => `Tiro ${Math.min(current, total)} de ${total}`,
    pendingKick: (kick) => `Tiro ${kick} pendiente`,
    onTargetCount: (count) => `${count} a puerta`,
    missCount: (count) => `${count} fuera`,
    aimPrompt: (target) => `Apuntando ${target} — elige la técnica`,
    shooting: "El balón está en el aire…",
    resultName: {
      goal: "¡GOL! Definición impecable.",
      saved: "¡Parada! El portero llegó.",
      post: "¡Al palo! Faltó muy poco.",
      miss: "¡Fuera! El tiro no encontró portería.",
    },
    shotStyle: "Técnica",
    styles: {
      placed: "Colocado",
      power: "Potente",
      chip: "Vaselina",
    },
    styleDescriptions: {
      placed: "Preciso y controlado",
      power: "Rápido, pero exigente",
      chip: "Supera una estirada",
    },
    quality: "Ejecución",
    speed: "Velocidad",
    keeperDecision: "Portero",
    keeperStrategies: {
      guess: "Adivinó",
      learn: "Siguió tu patrón",
      read: "Leyó el golpeo",
    },
    power: "Potencia",
    powerHint: (power, ideal) =>
      Math.abs(power - ideal) <= 7
        ? `Punto dulce · ideal ${ideal}%`
        : power < ideal
          ? `Falta fuerza · ideal ${ideal}%`
          : `Demasiada fuerza · ideal ${ideal}%`,
    target: "Objetivo",
    targetName: (horizontal, vertical) => {
      const h = { left: "izquierda", center: "centro", right: "derecha" }[
        horizontal
      ];
      const v = { high: "arriba", middle: "media altura", low: "abajo" }[
        vertical
      ];
      return `${v}, ${h}`;
    },
    estimatedAccuracy: "Control",
    estimatedSpeed: "Velocidad",
    shoot: "Disparar",
    goalLabel: (target) =>
      `Portería. Objetivo actual: ${target}. Pulsa para apuntar; usa las flechas para ajustar.`,
    keyboardHint:
      "Teclado: flechas para apuntar · Mayús + flechas mueve más · Intro dispara",
    kickHistory: "Historial de penaltis",
    endWin: "¡Ganas la tanda de penaltis!",
    endLoss: "El portero gana la tanda.",
    endRating: (goals) =>
      goals === 5
        ? "Perfecto · Clase mundial"
        : goals === 4
          ? "Definidor clínico"
          : goals === 3
            ? "Sangre fría bajo presión"
            : goals === 2
              ? "Prometedor, pero detenido"
              : "El portero dominó la noche",
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
          <strong>Disparar</strong> en la zona verde para sumar el valor
          completo del tiro. La zona amarilla suma un punto y cualquier otro
          color es fallo.
        </p>
        <p>Quien tenga más puntos tras cinco rondas gana.</p>
      </>
    ),
    difficultyTipLabel: "Cómo cambia el desafío con la dificultad",
    difficultyTip: (
      <>
        Al subir la dificultad, el medidor se mueve más rápido y aumenta el
        porcentaje de acierto de la IA. Tu resultado es determinista: verde
        suma el valor completo, amarillo suma un punto y los demás colores
        fallan.
      </>
    ),
    yourPoints: "Tus puntos",
    aiPoints: "Puntos de la IA",
    tallyYou: (score) => `Tú ${score}`,
    tallyAi: (score) => `${score} IA`,
    roundLabel: (round, total, points) =>
      `Ronda ${round}/${total} · ${points}PT`,
    pointValue: (points) => `Hasta ${points} puntos`,
    releasePrompt: "Verde: puntos completos · Amarillo: 1 punto",
    yourShot: "Tu tiro está en el aire…",
    madeShot: (points) => `¡Dentro! Sumas ${points} puntos.`,
    yellowShot: "¡Canasta! La zona amarilla suma 1 punto.",
    missedShot: "¡Fuera! Ese color no suma puntos.",
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
  shadowProtocol: {
    rules: (
      <>
        <p>
          Muévete una casilla por turno, roba el núcleo de datos 💾 y llega a la
          salida 🚪. Los guardias patrullan y las cámaras rotan tras cada acción
          tuya: las casillas teñidas muestran exactamente lo que ve la
          seguridad.
        </p>
        <p>
          Esprintar avanza dos casillas pero hace ruido, la baliza de un solo
          uso atrae a los guardias hacia su sonido, y hackear alterna una puerta
          o cámara adyacente durante tres turnos. Si te ven, empieza una alarma
          de tres turnos: rompe la línea de visión antes de que acabe o la
          misión fracasa.
        </p>
      </>
    ),
    difficultyTipLabel: "Cómo cambia la IA de seguridad",
    difficultyTip: (
      <>
        <p>En Fácil, los guardias avanzan con avidez hacia la evidencia y la olvidan tras un turno.</p>
        <p>En Medio usan búsqueda A*, recuerdan tres turnos y un perseguidor corta la salida.</p>
        <p>
          En Difícil interceptan: calculan cada casilla que podrías haber
          alcanzado desde que te vieron y cubren la ruta hacia tu objetivo.
          Nunca leen tu posición oculta real.
        </p>
      </>
    ),
    turnLabel: (turn) => `Turno ${turn}`,
    coreCollected: "💾 Núcleo asegurado",
    coreMissing: "💾 Núcleo pendiente",
    alarmLabel: (remaining, total) => `🚨 Alarma ${remaining}/${total}`,
    boardLabel: "Mapa de la instalación",
    dpadLabel: "Controles de movimiento",
    statusSneak: "Planifica tu movimiento: la seguridad actúa después de ti.",
    statusSpotted: (remaining) =>
      `¡Te han visto! Rompe la línea de visión — queda${remaining === 1 ? "" : "n"} ${remaining} turno${remaining === 1 ? "" : "s"} de alarma.`,
    statusCore: "Núcleo asegurado — ¡ahora llega a la salida!",
    statusHeard: "Un guardia ha oído algo y está investigando…",
    statusAimBeacon: "Toca una casilla resaltada para lanzar la baliza de ruido.",
    statusSprintArmed: "Esprint preparado: tu próximo movimiento avanza dos casillas pero hace ruido.",
    actionWait: "⏳ Esperar",
    actionHack: "🔧 Hackear",
    actionSprint: "💨 Esprintar",
    actionBeacon: "📡 Baliza",
    legend:
      "🥷 tú · 💂 guardia · 📷 cámara · 💾 núcleo · 🚪 salida · las casillas teñidas están vigiladas · los anillos son ruido",
    endWin: "¡Extracción completada!",
    endLoss: "La seguridad de la instalación te ha atrapado.",
    lossHint: "Observa los conos: los guardias ven 5 casillas en un arco de 90°, las cámaras 7.",
    scoreTotal: "Puntuación",
    scoreStealth: "Sin detección",
    scoreAlarm: "Alarma sin usar",
    scoreTurns: "Turnos vs par",
    cellLabel: (x, y, tile, player, guard, camera, seen) => {
      const tileNames: Record<string, string> = {
        floor: "suelo",
        wall: "muro",
        cover: "cobertura",
        "door-open": "puerta abierta",
        "door-closed": "puerta cerrada",
        terminal: "terminal",
        core: "núcleo",
        exit: "salida",
      };
      const parts = [`Casilla ${x + 1}, ${y + 1}: ${tileNames[tile] ?? tile}`];
      if (player) parts.push("estás aquí");
      if (guard) parts.push("guardia");
      if (camera) parts.push("cámara");
      if (seen) parts.push("vigilada por seguridad");
      return parts.join(", ");
    },
  },
  fleetCommand: {
    rules: (
      <>
        <p>
          Coloca cuatro barcos (4, 3, 2 y 2 casillas) en tu tablero de 8×8: no
          pueden superponerse ni tocarse, ni siquiera en diagonal. Después tú y
          la IA alternáis disparos; hunde toda la flota enemiga para ganar.
        </p>
        <p>
          Una vez por partida puedes lanzar un pulso de sónar en lugar de
          disparar a ciegas: revela cuántas casillas ocupadas hay en una región
          de 3×3, pero no dónde. La IA también tiene un pulso de sónar.
        </p>
      </>
    ),
    difficultyTipLabel: "Cómo cambia la IA de tiro",
    difficultyTip: (
      <>
        <p>Fácil dispara al azar y tantea alrededor de sus impactos.</p>
        <p>Medio caza en damero y extiende las líneas de impactos según su orientación.</p>
        <p>
          Difícil enumera cada colocación legal de cada barco superviviente
          compatible con sus fallos, impactos y sónar, y dispara a la casilla
          más probable. Nunca lee tu tablero real.
        </p>
      </>
    ),
    placementTitle: "Despliega tu flota",
    placeShipHint: (length) =>
      `Toca una casilla para colocar tu barco de ${length} casillas (toca un barco para quitarlo).`,
    fleetReady: "Flota desplegada — lista para empezar. Toca un barco para recolocarlo.",
    rotateToVertical: "↕ Vertical",
    rotateToHorizontal: "↔ Horizontal",
    randomPlacement: "🎲 Aleatorio",
    clearPlacement: "Borrar",
    placementCellLabel: (x, y, ship) => `Casilla ${x}, ${y}${ship ? ": tu barco" : ""}`,
    yourTurn: "Tu turno: dispara al tablero enemigo.",
    aiThinking: "El enemigo está apuntando",
    sonarButton: "📡 Pulso de sónar",
    sonarSpent: "📡 Sónar usado",
    sonarPrompt: "Toca una casilla enemiga: el sónar cuenta barcos en esa región de 3×3.",
    enemyWaters: "Aguas enemigas",
    yourFleet: "Tu flota",
    enemyBoardLabel: "Tablero enemigo — toca para disparar",
    yourBoardLabel: "Tu tablero",
    enemyCellLabel: (x, y, mark) =>
      `Casilla enemiga ${x}, ${y}: ${
        mark === "none" ? "sin disparar" : mark === "miss" ? "agua" : mark === "hit" ? "tocado" : "hundido"
      }`,
    ownCellLabel: (x, y, ship, mark) =>
      `Tu casilla ${x}, ${y}: ${ship ? "barco" : "agua"}${
        mark === "none" ? "" : mark === "miss" ? ", fallo" : mark === "hit" ? ", tocado" : ", hundido"
      }`,
    enemyFleetStatus: (remaining, total) => `Barcos enemigos a flote: ${remaining}/${total}`,
    yourShots: "Tus disparos",
    aiShots: "Disparos de la IA",
    endWin: "Flota enemiga destruida — ¡has ganado!",
    endLoss: "Tu flota ha sido hundida.",
  },
  windlineArchery: {
    rules: (
      <>
        <p>
          Cinco tandas, una flecha por tanda cada uno. Ajusta la elevación, la
          deriva y la potencia y detén el medidor de estabilidad lo más cerca
          posible del centro: cuanto más lejos, más se desvía tu suelta.
        </p>
        <p>
          El viento cruzado cambia antes de cada tanda y empuja tu flecha en
          vuelo. Los anillos puntúan 10/8/6/4/2. Los empates se resuelven por
          dieces exactos y después por precisión total.
        </p>
      </>
    ),
    difficultyTipLabel: "Cómo cambia la IA arquera",
    difficultyTip: (
      <>
        <p>Fácil malinterpreta el viento hasta ±35% y tiene una suelta temblorosa.</p>
        <p>Medio lo malinterpreta hasta ±15% con pulso más firme.</p>
        <p>
          Difícil lee el viento exacto pero mantiene una pequeña variación
          humana en la suelta. Todos los niveles obedecen tu misma física, y la
          flecha de la IA queda fijada antes de que dispares.
        </p>
      </>
    ),
    endLabel: (current, total) => `Tanda ${current}/${total}`,
    tallyYou: (score) => `Tú ${score}`,
    tallyAi: (score) => `IA ${score}`,
    windLabel: "Viento",
    windDetail: (horizontal, vertical) =>
      `${Math.abs(horizontal).toFixed(1)} ${horizontal >= 0 ? "→" : "←"} · ${Math.abs(vertical).toFixed(1)} ${vertical >= 0 ? "↑" : "↓"}`,
    targetLabel: "Diana de tiro con impactos de flechas",
    aimPrompt: "Ajusta ángulo y potencia, luego tensa el arco.",
    releasePrompt: "¡Suelta cuando la aguja cruce el centro!",
    yourResult: (score) => `Tu flecha puntúa ${score}. La IA está disparando…`,
    bothResult: (you, ai) => `Has puntuado ${you} — la IA ha puntuado ${ai}.`,
    angleLabel: (deg) => `Elevación: ${deg.toFixed(1)}°`,
    windageLabel: (deg) =>
      `Deriva: ${deg === 0 ? "centrada" : `${Math.abs(deg).toFixed(1)}° ${deg > 0 ? "derecha" : "izquierda"}`}`,
    powerLabel: (power) => `Potencia: ${power}`,
    drawButton: "🏹 Tensar",
    releaseButton: "¡Soltar!",
    meterLabel: "Medidor de estabilidad de la suelta",
    yourCenters: "Tus dieces",
    aiCenters: "Dieces de la IA",
    yourPrecision: "Tu desviación",
    aiPrecision: "Desviación de la IA",
    endTitle: (winner) =>
      winner === "player"
        ? "¡Ganas el duelo de tiro!"
        : winner === "ai"
          ? "La IA gana el duelo de tiro."
          : "Empate perfecto, ¡incluso tras los desempates!",
  },
  beatReactor: {
    rules: (
      <>
        <p>
          Cuatro carriles envían notas generadas hacia la línea de juicio. Pulsa
          D, F, J, K (o toca los pads) justo cuando una nota la cruce: todo se
          mide contra el reloj de audio, no contra la animación.
        </p>
        <p>
          Perfecto ≤35 ms, Genial ≤75 ms, Bien ≤120 ms; si no, fallo. La
          combinación multiplica tu puntuación base: ×1.1 en 10, ×1.2 en 25,
          ×1.3 en 50.
        </p>
      </>
    ),
    difficultyTipLabel: "Cómo cambia la IA rival",
    difficultyTip: (
      <>
        <p>Cada error de la IA se genera para toda la canción antes de empezar y nunca cambia.</p>
        <p>Fácil se desvía 48 ms de media con 12% de fallo.</p>
        <p>Medio se desvía 20 ms de media con 5% de fallo.</p>
        <p>Difícil se desvía 4 ms de media con 1.5% de fallo — sigue sin ser perfecta.</p>
      </>
    ),
    bpmLabel: "Tempo",
    lengthLabel: "Duración de la canción",
    barsShort: "Corta",
    barsMedium: "Media",
    barsLong: "Larga",
    densityLabel: "Densidad de notas",
    densityLight: "Ligera",
    densityNormal: "Normal",
    densityDense: "Densa",
    silentMode: "Modo silencioso (solo visual)",
    calibrationLabel: (ms) => `Calibración de audio: ${ms > 0 ? "+" : ""}${ms} ms`,
    tallyYou: (score) => `Tú ${score}`,
    tallyAi: (score) => `IA ${score}`,
    lanesLabel: "Cuatro carriles de notas",
    laneButtonLabel: (n) => `Carril ${n}`,
    judgementLabel: { perfect: "PERFECTO", great: "GENIAL", good: "BIEN", miss: "FALLO" },
    comboYou: (combo) => `Tu combo: ${combo}`,
    comboAi: (combo) => `Combo IA: ${combo}`,
    yourBestCombo: "Tu mejor combo",
    aiBestCombo: "Mejor combo IA",
    accuracy: "Precisión",
    endTitle: (winner) =>
      winner === "player"
        ? "¡Reactor estabilizado — ganas!"
        : winner === "ai"
          ? "La IA te ha superado en puntos."
          : "¡Empate total!",
  },
  circuitBreaker: {
    rules: (
      <>
        <p>
          Ambas motos de luz se mueven a la vez en cada instante. Gira a la
          izquierda, a la derecha o sigue recto: dejas un muro permanente
          detrás de ti. Chocar contra un muro, el borde o la otra moto te
          elimina.
        </p>
        <p>
          Ambos movimientos se recogen antes de aplicarse, así que nadie tiene
          ventaja de salida. El primero en ganar 3 rondas se lleva la partida;
          una colisión frontal empata la ronda.
        </p>
      </>
    ),
    difficultyTipLabel: "Cómo cambia la moto rival",
    difficultyTip: (
      <>
        <p>Fácil elige un giro al azar, solo evitando un choque inmediato.</p>
        <p>Medio inunda el espacio desde cada opción y elige la que deja más sitio libre.</p>
        <p>
          Difícil ejecuta una búsqueda de movimiento simultáneo varias rondas
          por delante (acotada en tiempo para no exceder el presupuesto),
          valorando espacio alcanzable y presión de contención. Nunca lee tu
          movimiento pendiente antes de decidir el suyo.
        </p>
      </>
    ),
    tallyYou: (score) => `Tú ${score}`,
    tallyGoal: (target) => `Primero a ${target}`,
    tallyAi: (score) => `IA ${score}`,
    steer: "Gira a la izquierda, a la derecha o sigue recto.",
    winRound: "¡Has atrapado a la IA!",
    loseRound: "Has chocado.",
    tieRound: "Colisión frontal — ronda empatada.",
    arenaLabel: "Arena de motos de luz",
    turnLeft: "Izquierda",
    straight: "Recto",
    turnRight: "Derecha",
    yourWins: "Tus rondas ganadas",
    aiWins: "Rondas ganadas por la IA",
    ties: "Empates",
  },
  diceforgeArena: {
    rules: (
      <>
        <p>Ambos luchadores tiran tres dados personalizados. Bloquea uno, vuelve a tirar los otros dos y resuelve a la vez daño, escudo y energía.</p>
        <p>Tres caras de daño suman un 50%; tres escudos obtienen una bonificación persistente. Daño + escudo + energía concede descuento. El comodín copia la mejor cara no comodín. Tras combatir puedes reemplazar una cara en la tienda sembrada.</p>
      </>
    ),
    difficultyTipLabel: "Cómo cambia el rival de la forja",
    difficultyTip: (
      <>
        <p>Fácil bloquea y compra al azar entre opciones legales.</p>
        <p>Medio enumera todos los resultados de la segunda tirada y valora la próxima mejora.</p>
        <p>Difícil usa la misma búsqueda exacta con sinergia de construcción y tienda. No recibe información oculta.</p>
      </>
    ),
    youLabel: "TÚ", aiLabel: "IA", roundLabel: (round, total) => `Ronda ${round}/${total}`,
    yourRoll: "Tus dados", aiRoll: "Dados IA", lockPrompt: "Bloquea un dado. Los otros dos se vuelven a tirar.",
    lockDie: die => `Bloquear dado ${die}`, resultLine: (you, ai) => `Daño: tú ${you} · IA ${ai}.`,
    shopPrompt: "Forja una cara o ahorra tus monedas.", costLabel: cost => `${cost} monedas`,
    replaceLabel: (die, face) => `Reemplazar cara ${face} del dado ${die}`, skipShop: "Ahorrar monedas",
    healthResult: (you, ai) => `Salud: tú ${you} · IA ${ai}`,
    endTitle: winner => winner === "player" ? "¡Dominas la forja!" : winner === "ai" ? "El rival conquista la arena." : "La forja termina en empate.",
  },
  hexDominion: {
    rules: (
      <>
        <p>Coloca una piedra por turno en el tablero hexagonal de 7×7. Tus piedras azules deben conectar oeste y este; las rosas de la IA conectan norte y sur.</p>
        <p>Las conexiones usan los seis hexágonos vecinos. Los caminos pueden girar y formar puentes. No hay capturas ni reglas ocultas: gana el primer camino completo.</p>
      </>
    ),
    difficultyTipLabel: "Cómo cambia la IA territorial",
    difficultyTip: (
      <>
        <p>Fácil elige casillas legales con ligera preferencia por los bordes.</p>
        <p>Medio bloquea victorias inmediatas y puntúa centro, bordes y puentes.</p>
        <p>Difícil comprueba jugadas forzadas y ejecuta 350 simulaciones UCT deterministas con sesgo al centro y los puentes.</p>
      </>
    ),
    yourTurn: "Tu turno: conecta el azul de izquierda a derecha.", aiThinking: "La IA está trazando una ruta…",
    yourGoal: "Tu camino", aiGoal: "Camino IA", boardLabel: "Tablero de Dominio Hex de siete por siete",
    emptyCell: (row, col) => `Casilla vacía, fila ${row}, columna ${col}`,
    ownedCell: (row, col, owner) => `Casilla de ${owner === "player" ? "jugador" : "IA"}, fila ${row}, columna ${col}`,
    youLegend: "Tú: oeste → este", aiLegend: "IA: norte → sur",
    movesLabel: moves => `${moves} piedras colocadas`,
    endTitle: winner => winner === "player" ? "¡Tu camino cruza el dominio!" : "La IA ha completado su camino.",
  },
  neonDrift: {
    rules: (
      <>
        <p>
          Tres vueltas contra una IA rival. El acelerador se mantiene solo: tú
          giras, frenas en las curvas y gastas un turbo limitado en las rectas.
          Salirte de la pista reduce agarre y aceleración, así que mantén una
          trazada limpia.
        </p>
        <p>
          Gira con ◀ ▶ (o flechas / A-D), frena con el pad de freno (o Abajo/S)
          y activa el turbo con su pad (o Espacio). Cruza los seis puntos de
          control de cada vuelta en orden. Gana el mejor tiempo total.
        </p>
      </>
    ),
    difficultyTipLabel: "Cómo cambia el piloto rival",
    difficultyTip: (
      <>
        <p>El rival obedece tu mismo agarre, aceleración, turbo y reglas fuera de pista — sin trampas de goma.</p>
        <p>Fácil usa poca anticipación, va al 82% de la velocidad de trazada y falla un frenado por vuelta.</p>
        <p>Medio anticipa más y lleva el 94% de la velocidad de trazada.</p>
        <p>Difícil anticipa según la curvatura, va a velocidad completa y no comete errores guionizados.</p>
      </>
    ),
    trackLabel: "Circuito",
    trackNames: { circuit: "Circuito", serpent: "Serpiente", speedway: "Óvalo" },
    lapLabel: (lap, total) => `Vuelta ${lap}/${total}`,
    leading: "En cabeza",
    chasing: "Persiguiendo",
    trackAria: "Circuito de carreras, vista cenital",
    boostLabel: "Medidor de turbo",
    steerLeft: "Girar a la izquierda",
    steerRight: "Girar a la derecha",
    brake: "Frenar",
    brakeShort: "FRENO",
    boost: "Turbo",
    boostShort: "TURBO",
    endTitle: (outcome) =>
      outcome === "player"
        ? "¡Te llevas la bandera a cuadros!"
        : outcome === "ai"
          ? "La IA cruza la meta primero."
          : "¡Final de foto — empate técnico!",
    finishTimes: (you, ai) => `Tú ${you} · IA ${ai}`,
    bestLap: "Mejor vuelta",
    offTrack: "Fuera de pista",
    boostEff: "Conducción limpia",
    personalBest: "Récord del circuito",
  },
  signalBreaker: {
    rules: (
      <>
        <p>
          Tú y la IA ocultáis un código secreto de 4 símbolos y competís por
          descifrar el del otro en 8 intentos como máximo. Toca una casilla para
          cambiar el símbolo (o elige de la paleta) y confirma.
        </p>
        <p>
          Tras cada intento: un punto relleno significa símbolo correcto en la
          posición correcta; un punto hueco, símbolo correcto en posición
          equivocada. Gana quien use menos intentos; a igualdad, decide el tiempo.
        </p>
      </>
    ),
    difficultyTipLabel: "Cómo descifra la IA",
    difficultyTip: (
      <>
        <p>La IA solo ve la respuesta a sus propios intentos, nunca tu código.</p>
        <p>Fácil prueba un código al azar todavía compatible con sus pistas.</p>
        <p>Medio aplica eliminación minimax sobre una muestra de candidatos.</p>
        <p>
          Difícil usa minimax exacto de peor caso sobre todos los candidatos
          restantes, y su generador elige un secreto que resiste tus aperturas
          habituales.
        </p>
      </>
    ),
    allowRepeats: "Permitir símbolos repetidos",
    yourAttack: "Tu ataque",
    aiAttack: "Ataque de la IA",
    guessCount: (used, max) => `Intento ${used}/${max}`,
    slotLabel: (n) => `Casilla ${n} — toca para cambiar`,
    submit: "Confirmar intento",
    clear: "Borrar",
    waitingForAi: "Código descifrado — esperando a que la IA termine…",
    legend: "● relleno = símbolo y posición correctos · ○ hueco = símbolo correcto, posición incorrecta",
    endTitle: (outcome) =>
      outcome === "player"
        ? "¡Lo has descifrado primero!"
        : outcome === "ai"
          ? "La IA ha descifrado tu código primero."
          : "¡Empate técnico — mismos intentos y mismo tiempo!",
    yourGuesses: "Tus intentos",
    aiGuesses: "Intentos de la IA",
    codeWas: "El código de la IA era",
  },
  spellstorm: {
    rules: (
      <>
        <p>
          Escribe correctamente cada palabra para ganar tanta energía como letras
          tenga. Un error queda visible y reinicia el combo; corrígelo con
          Retroceso. El duelo dura 75 segundos o termina cuando un mago llega a cero.
        </p>
        <p>
          Con 20 de energía lanza Fuego para causar 18 de daño, Hielo para
          retrasar la siguiente palabra rival o Escudo para absorber 15 de daño.
          El daño consume escudo antes que salud. Al acabar el tiempo gana quien tenga más salud.
        </p>
      </>
    ),
    difficultyTipLabel: "Cómo cambia el rival mecanógrafo",
    difficultyTip: (
      <>
        <p>Fácil escribe a 120–180 PPM, corrige un 8% de errores y elige hechizos al azar.</p>
        <p>Medio escribe a 180–240 PPM, corrige un 3% de errores y se protege con poca salud.</p>
        <p>Difícil escribe a 260–330 PPM, corrige un 0,8% de errores y maximiza la utilidad de cada hechizo. Cada tiempo queda fijado antes de empezar la palabra.</p>
      </>
    ),
    you: "TÚ",
    ai: "IA",
    timeLabel: (seconds) => `Quedan ${seconds} segundos`,
    elementLabels: { fire: "Palabra de fuego", ice: "Palabra de hielo", shield: "Palabra de escudo" },
    spellLabels: { fire: "Fuego", ice: "Hielo", shield: "Escudo" },
    spellEffects: { fire: "18 de daño", ice: "Ralentiza una palabra", shield: "Absorbe 15" },
    typeLabel: "Escribe la palabra mágica actual",
    typePrompt: "Escribe la palabra exacta",
    frozen: "Congelado: la siguiente palabra se retrasa",
    aiTyping: "La IA está escribiendo",
    aiCorrecting: "La IA ha corregido un error",
    energyHint: (cost) => `Las palabras correctas cargan energía. Lanza un hechizo con ${cost}.`,
    castFeedback: (actor, spell) =>
      `${actor === "player" ? "Lanzas" : "La IA lanza"} ${spell === "fire" ? "Fuego" : spell === "ice" ? "Hielo" : "Escudo"}!`,
    endTitle: (outcome) =>
      outcome === "player" ? "¡Dominas la tormenta!" : outcome === "ai" ? "El mago rival vence." : "La tormenta termina en empate.",
    healthResult: (you, ai) => `Salud: tú ${you} · IA ${ai}`,
    yourWords: "Tus palabras",
    aiWords: "Palabras de la IA",
  },
  rooms: {
    navLink: "Jugar con amigos",
    title: "Jugar con amigos",
    tagline: "Crea una sala, comparte el código y juega en directo contra un amigo en vez de la IA.",
    yourNameLabel: "Tu nombre",
    namePlaceholder: "p. ej. Joan",
    createTab: "Crear sala",
    joinTab: "Unirse a una sala",
    chooseGameLabel: "Juego",
    currentGameLabel: "Juego actual",
    roomSettingsTitle: "Juego y ajustes de la sala",
    hostSettingsHint: "Controles del anfitrión: cambiar juego o ajustes reinicia la sala para ambos manteniendo el mismo código.",
    guestSettingsHint: "El anfitrión puede cambiar aquí el juego o los ajustes sin crear otra sala.",
    applyRoomSettings: "Aplicar a la sala",
    changingGame: "Cambiando sala…",
    settingLabels: {
      size: "Tamaño del tablero",
      pieceCount: "Fichas",
      rule: "Reglas",
      target: "Duración",
      aceHigh: "Valor del as",
      maxRounds: "Duración",
      bpm: "BPM",
      bars: "Duración",
      density: "Densidad",
    },
    settingOptionLabels: {
      size: { "4": "4 × 4", "6": "6 × 6" },
      pieceCount: { "2": "Rápida · 2 fichas", "4": "Clásica · 4 fichas" },
      rule: { normal: "Normal", misere: "Misère" },
      target: { "1": "Una victoria", "2": "Mejor de 3", "3": "Primero a 3", "5": "Primero a 5", "10": "Primero a 10" },
      aceHigh: { true: "As alto", false: "As bajo" },
      maxRounds: { "12": "Corta · 12 rondas", "20": "Estándar · 20 rondas" },
      bpm: { "90": "90", "110": "110", "130": "130" },
      bars: { "8": "8 compases", "12": "12 compases", "16": "16 compases" },
      density: { light: "Ligera", normal: "Normal", dense: "Densa" },
    },
    createButton: "Crear sala",
    roomCodeLabel: "Código de sala",
    codePlaceholder: "p. ej. K7RXPQ",
    joinButton: "Unirse",
    nameRequired: "Escribe tu nombre primero.",
    codeRequired: "Escribe el código de la sala.",
    connecting: "Conectando…",
    waitingTitle: "Esperando a tu amigo",
    shareCode: (code) => `Comparte este código: ${code}`,
    waitingHint: "La partida empieza en cuanto se una con este código.",
    leaveButton: "Salir de la sala",
    backToRooms: "Volver a salas",
    roomNotFound: "Esa sala no existe. Revisa el código e inténtalo de nuevo.",
    roomGone: "Esta sala ha terminado.",
    roomExpired: "Esta sala ha caducado (las salas duran 24 horas). Crea una nueva.",
    errorGeneric: "Algo ha ido mal. Inténtalo de nuevo.",
    opponentJoined: (name) => `¡${name} se ha unido!`,
    submittedWaiting: "Esperando a tu rival…",
    roundResultWin: "¡Ganas la ronda!",
    roundResultLose: "Pierdes la ronda.",
    roundResultTie: "Ronda empatada.",
    matchWinYou: "¡Ganas la partida! 🏆",
    matchWinOpponent: (name) => `${name} gana la partida.`,
    rematchButton: "Jugar otra vez",
    rematchWaiting: "Esperando a que tu rival acepte la revancha…",
    turnYours: "Tu turno",
    turnOpponent: (name) => `Turno de ${name}`,
  },
  penaltyRoom: {
    youShoot: "⚽ Tú lanzas",
    youKeep: "🧤 Estás en la portería",
    shootPrompt: "Elige una escuadra — a ciegas.",
    keepPrompt: "Elige hacia dónde te lanzas — a ciegas.",
    zones: {
      HL: "Arriba izquierda",
      HC: "Arriba centro",
      HR: "Arriba derecha",
      LL: "Abajo izquierda",
      LC: "Abajo centro",
      LR: "Abajo derecha",
    },
    resultYouScored: "⚽ ¡GOL! Has marcado.",
    resultConceded: "😖 Gol encajado.",
    resultYouMissed: "🧤 ¡Parada! El portero acertó.",
    resultYouSaved: "🧤 ¡Paradón!",
    tallyYou: (score) => `Tú: ${score}`,
    tallyGoal: (target) => `Primero a ${target} goles`,
    historyLabel: "Historial de lanzamientos",
    youWord: "Tú",
    goalWord: "Gol",
    saveWord: "Parada",
  },
  basketRoom: {
    youShoot: "🏀 Tú tiras",
    youDefend: "🛡️ Tú defiendes",
    shootPrompt: "Elige tu tiro — a ciegas. Los tiros lejanos valen más.",
    defendPrompt: "Elige la zona a defender — a ciegas.",
    spots: {
      layup: "Bandeja",
      mid: "Media distancia",
      three: "Triple",
    },
    pts: (points) => `${points} pt${points === 1 ? "" : "s"}`,
    resultYouScored: (points) => `🏀 ¡Canasta! +${points}.`,
    resultConceded: (points) => `😖 Canasta encajada (+${points}).`,
    resultYouBlocked: "🛡️ ¡Tapón! Sin puntos.",
    resultYouStopped: "🛡️ ¡Gran defensa!",
    tallyYou: (score) => `Tú: ${score}`,
    tallyGoal: (target) => `Primero a ${target} puntos`,
    historyLabel: "Historial de tiros",
    youWord: "Tú",
    plusPts: (points) => `+${points}`,
    blockedWord: "Tapón",
  },
  guessRoom: {
    yourTurn: "Tu turno — adivina",
    opponentTurn: (name) => `${name} está adivinando…`,
    rangePrompt: (low, high) => `El número está entre ${low} y ${high}.`,
    guessButton: "Adivinar",
    inputPlaceholder: "Número",
    tallyYou: (score) => `Tú: ${score}`,
    tallyGoal: (target) => `Primero a ${target} rondas`,
    verdicts: { high: "Demasiado alto", low: "Demasiado bajo" },
    correctWord: "¡Acertaste! 🎯",
    logTitle: "Esta ronda",
    youWord: "Tú",
  },
  holRoom: {
    yourTurn: "Tu turno — ¿mayor o menor?",
    opponentTurn: (name) => `${name} está decidiendo…`,
    callPrompt: "¿La siguiente carta será mayor o menor?",
    calls: { higher: "Mayor", lower: "Menor" },
    currentLabel: "Carta actual",
    tallyYou: (score) => `Tú: ${score}`,
    tallyGoal: (target) => `Primero a ${target} puntos`,
    lastCall: (name, call, correct) =>
      `${name} dijo ${call} — ${correct ? "¡correcto! ✓" : "falló ✗"}`,
    correctWord: "Correcto",
    missWord: "Fallo",
    tieTitle: "¡Empate! 🤝",
    logTitle: "Historial de tiradas",
    youWord: "Tú",
  },
  memoryRoom: {
    yourTurn: "Tu turno — voltea dos fichas",
    opponentTurn: (name) => `${name} está volteando…`,
    matchBy: (name) => `¡${name} encontró una pareja! 🎉`,
    missBy: (name) => `${name} falló.`,
    tallyYou: (score) => `Tú: ${score}`,
    pairsLeft: (count) => `${count} pareja${count === 1 ? "" : "s"} restante${count === 1 ? "" : "s"}`,
    tieTitle: "¡Empate! 🤝",
    youWord: "Tú",
  },
  reactionRoom: {
    getReady: "Prepárate…",
    waitGreen: "Espera al verde…",
    tapNow: "¡PULSA!",
    falseStart: "¡Demasiado pronto!",
    roundWon: "¡Ganaste la ronda! ⚡",
    roundLost: "Tu rival fue más rápido.",
    roundTied: "¡Empate técnico!",
    ms: (value) => `${value} ms`,
    tallyYou: (score) => `Tú: ${score}`,
    tallyGoal: (target) => `Primero a ${target} rondas`,
    youWord: "Tú",
  },
  fleetRoom: {
    placingTitle: "Coloca tu flota",
    placingHint: "Baraja hasta que te guste la disposición y confirma.",
    shuffle: "Barajar",
    ready: "Listo",
    readyWaiting: "Esperando a que tu rival esté listo…",
    yourFleet: "Tu flota",
    enemyWaters: "Aguas enemigas",
    shotResult: (name, result) =>
      result === "sunk" ? `¡${name} hundió un barco! 💥` : result === "hit" ? `¡${name} acertó!` : `${name} falló.`,
    cellLabel: (index) => `Disparar a la casilla ${index + 1}`,
    youWord: "Tú",
  },
  shadowRoom: {
    waitingOpponent: "Esperando a que tu rival termine su infiltración…",
    youEscaped: (score) => `¡Escapaste! Puntuación ${score}.`,
    youCaught: "Te atraparon.",
    tieTitle: "¡Empate! 🤝",
    scoreLine: (you, them) => `Tu puntuación ${you} · Rival ${them}`,
  },
};

export const dictionaries: Record<Locale, Dictionary> = { en, es };
