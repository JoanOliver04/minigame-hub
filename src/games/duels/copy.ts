export const duelCopy = {
  en: {
    solo: "Play against the AI", tie: "Draw",
    rules: {
      "mini-reversi": "Put a disc on a marked square. All opposing discs trapped in a straight line between yours flip, even diagonally. If one player has no move, the other plays again. When neither can move, the player with more discs wins.",
      "dice-race": "Reach 30 banked points first. Roll as many times as you like. A 2–6 adds to this turn’s pot. Bank it to end your turn safely. Roll a 1 and the whole pot goes to zero. Points already banked are safe.",
    },
    dark: "Dark", light: "Light", empty: "Empty", board: "Reversi board",
    flips: (n: number) => `Flip ${n}`, preview: "Each number shows how many discs that move flips.", pass: "No legal move for the other player. Same player goes again.",
    bank: "Bank points", roll: "Roll die", target: "First to 30", pot: "At risk this turn",
    banked: (name: string, n: number) => `${name} banked ${n}.`,
    rolled: (name: string, n: number) => `${name} rolled a ${n}.`,
    bust: (name: string, n: number) => `${name} rolled a 1 and lost ${n} this turn.`,
  },
  es: {
    solo: "Jugar contra la IA", tie: "Empate",
    rules: {
      "mini-reversi": "Coloca una ficha en una casilla marcada. Se dan la vuelta todas las fichas rivales que encierres en línea recta, también en diagonal. Si un jugador no puede mover, repite el otro. Cuando ninguno puede mover, gana quien tenga más fichas.",
      "dice-race": "Gana quien guarde 30 puntos primero. Puedes tirar varias veces. Del 2 al 6, sumas lo que salga a los puntos en juego. Plántate para guardarlos y pasar el turno. Si sacas un 1, pierdes los puntos de ese turno. Los que ya guardaste están a salvo.",
    },
    dark: "Negras", light: "Blancas", empty: "Vacía", board: "Tablero de Reversi",
    flips: (n: number) => `Voltear ${n}`, preview: "Cada número indica cuántas fichas voltea esa jugada.", pass: "El rival no tiene jugada. Repite quien acaba de mover.",
    bank: "Plantarse", roll: "Tirar el dado", target: "Primero en llegar a 30", pot: "Puntos en juego",
    banked: (name: string, n: number) => `${name} · +${n} al marcador.`,
    rolled: (name: string, n: number) => `${name} · ha salido un ${n}.`,
    bust: (name: string, n: number) => `${name} · ha salido un 1. Se pierden ${n} puntos del turno.`,
  },
};
