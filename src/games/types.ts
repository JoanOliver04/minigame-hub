import type { ComponentType } from "react";

/**
 * Contract every mini-game must fulfil to plug into the hub.
 *
 * The vanilla-JS module interface maps onto React like this:
 *   init()               -> component mount (hooks wire events)
 *   render()             -> the component's JSX
 *   handlePlayerAction() -> event handlers inside the component
 *   reset()              -> unmount cleanup (timers cleared by effects)
 *   getResult()          -> scores read from the global ScoresContext
 */
export interface GameDefinition {
  /** Stable id: route segment (/games/<id>), ScoreStore key, and dictionary
   *  key under `t.gamesMeta` for the display name/description. */
  id: string;
  /** Emoji icon for the hub card. */
  icon: string;
  /** Whether this game can end in a tie (controls the hub table column). */
  hasTies: boolean;
  /** The client component implementing the whole game (setup/play/end). */
  Component: ComponentType;
}
