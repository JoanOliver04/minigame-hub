import { useLocale } from "@/context/LocaleContext";
import { timedPress } from "@/lib/press-timing";
import { LANE_KEYS, type BeatEvent, type Judgement, type Lane } from "./types";

interface LaneProps {
  events: BeatEvent[];
  time: number;
  disabled?: boolean;
  flash: { lane: Lane; judgement: Judgement; key: number } | null;
  hitLane: (lane: Lane) => void;
}

const approachSeconds = 2.2;

export function ReactorLanes({ events, time, flash, disabled, hitLane }: LaneProps) {
  const { t } = useLocale();
  const visible = events.filter(note => note.hitTime - time <= approachSeconds && note.hitTime - time >= -0.15);
  return (
    <div className="reactor-lanes" role="group" aria-label={t.beatReactor.lanesLabel}>
      {LANE_KEYS.map((key, lane) => (
        <div className="reactor-lane" key={key}>
          <div className="reactor-lane-track" aria-hidden="true">
            {visible.filter(note => note.lane === lane).map(note => (
              <div key={note.id} className={`reactor-note${note.accent ? " accent" : ""}`}
                style={{ top: `calc(var(--reactor-line) * ${1 - (note.hitTime - time) / approachSeconds})` }} />
            ))}
            {flash?.lane === lane && <div key={flash.key} className={`reactor-flash j-${flash.judgement}`}>
              {t.beatReactor.judgementLabel[flash.judgement]}
            </div>}
          </div>
          <button type="button" className="btn reactor-pad" disabled={disabled}
            {...timedPress(() => hitLane(lane as Lane))}
            aria-label={`${t.beatReactor.laneButtonLabel(lane + 1)} · ${key.toUpperCase()}`}>
            {key.toUpperCase()}
          </button>
        </div>
      ))}
    </div>
  );
}
