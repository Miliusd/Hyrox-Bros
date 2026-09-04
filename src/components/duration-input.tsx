const PRESETS = [30, 45, 60, 90];

export function DurationInput({
  value,
  onChange,
  label = "Duration",
  className = "",
}: {
  value: number;
  onChange: (seconds: number) => void;
  label?: string;
  className?: string;
}) {
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const seconds = value % 60;

  function numberPart(raw: string, max?: number) {
    const parsed = Math.max(0, Math.trunc(Number(raw) || 0));
    return max === undefined ? parsed : Math.min(max, parsed);
  }

  return (
    <fieldset className={className}>
      <legend className="label">{label}</legend>
      <div className="grid grid-cols-3 gap-2">
        <label>
          <span className="mb-1 block text-center text-sm text-ink-400">Hours</span>
          <input
            className="input text-center text-lg font-black tabular-nums"
            type="number"
            inputMode="numeric"
            min="0"
            max="99"
            value={hours || ""}
            placeholder="0"
            onChange={(event) => onChange(numberPart(event.target.value, 99) * 3600 + minutes * 60 + seconds)}
            aria-label={`${label} hours`}
          />
        </label>
        <label>
          <span className="mb-1 block text-center text-sm text-ink-400">Minutes</span>
          <input
            className="input text-center text-lg font-black tabular-nums"
            type="number"
            inputMode="numeric"
            min="0"
            max="59"
            value={minutes || ""}
            placeholder="00"
            onChange={(event) => onChange(hours * 3600 + numberPart(event.target.value, 59) * 60 + seconds)}
            aria-label={`${label} minutes`}
          />
        </label>
        <label>
          <span className="mb-1 block text-center text-sm text-ink-400">Seconds</span>
          <input
            className="input text-center text-lg font-black tabular-nums"
            type="number"
            inputMode="numeric"
            min="0"
            max="59"
            value={seconds || ""}
            placeholder="00"
            onChange={(event) => onChange(hours * 3600 + minutes * 60 + numberPart(event.target.value, 59))}
            aria-label={`${label} seconds`}
          />
        </label>
      </div>
      <div className="mt-2 flex flex-wrap gap-2" aria-label="Duration presets">
        {PRESETS.map((preset) => {
          const presetSeconds = preset * 60;
          const active = value === presetSeconds;
          return (
            <button
              type="button"
              key={preset}
              className={`chip min-w-14 justify-center ${active ? "border-brand-400 bg-brand-400 text-ink-950" : ""}`}
              aria-pressed={active}
              onClick={() => onChange(presetSeconds)}
            >
              {preset}m
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
