export type ForgeDifficulty="easy"|"medium"|"hard"; export type FaceKind="damage"|"shield"|"energy"|"wild";
export interface Face{kind:FaceKind;value:1|2|3} export type Die=Face[];
export interface Fighter{health:number;shield:number;coins:number;discount:number;dice:Die[]}
export interface Offer{id:string;face:Face;cost:number}
export interface RollResult{faces:Face[];damage:number;shield:number;energy:number;discount:number}
export interface ForgeRound{number:number;playerRoll:number[];aiRoll:number[];locked:number|null;playerResult:RollResult|null;aiResult:RollResult|null;shop:Offer[]}
