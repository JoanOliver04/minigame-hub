import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { BaronActor, BaronLogEntry } from "./types";

type PropertyBaronCopy = Dictionary["propertyBaron"];

function labelActor(actor: BaronActor, names: Record<string, string>): string {
  return names[actor] ?? actor;
}

function labelReason(reason: string, t: PropertyBaronCopy): string {
  if (reason === "Holding fine") return t.logHoldingFineReason;
  return reason;
}

export function formatBaronLogEntry(
  entry: BaronLogEntry,
  t: PropertyBaronCopy,
  names: Record<string, string>,
): string {
  if ("text" in entry) return entry.text;
  switch (entry.kind) {
    case "finalAudit":
      return t.logFinalAudit;
    case "charge": {
      const reason = labelReason(entry.reason, t);
      return t.logCharge(
        reason,
        labelActor(entry.from, names),
        entry.amount,
        entry.to ? labelActor(entry.to, names) : null,
      );
    }
    case "leaveHolding":
      return t.logLeaveHolding(labelActor(entry.actor, names));
    case "roll":
      return t.logRoll(labelActor(entry.actor, names), entry.a, entry.b, entry.tile);
    case "passStart":
      return t.logPassStart(labelActor(entry.actor, names), entry.amount);
    case "bonus":
      return t.logBonus(labelActor(entry.actor, names), entry.amount);
    case "market":
      return t.logMarket(labelActor(entry.actor, names), entry.amount);
    case "buy":
      return t.logBuy(labelActor(entry.actor, names), entry.tile, entry.price);
    case "upgrade":
      return t.logUpgrade(labelActor(entry.actor, names), entry.tile, entry.level);
    case "pass":
      return t.logPass(labelActor(entry.actor, names));
  }
}
