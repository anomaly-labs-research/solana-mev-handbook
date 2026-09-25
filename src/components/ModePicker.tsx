"use client";

import { MODES } from "@/lib/modes";
import { setMode } from "@/lib/mode-client";

/** Home-page cards explaining the three reading levels; the active one is lit by CSS. */
export function ModePicker() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {MODES.map((m, i) => (
        <button
          key={m.id}
          type="button"
          data-value={m.id}
          onClick={() => setMode(m.id)}
          className="mode-card card flex flex-col rounded-xl p-6 text-left"
        >
          <span className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-[0.14em] text-fg-faint">
              Level {i + 1}
            </span>
            <span className="mode-card-check rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-fg-faint">
              Selected
            </span>
          </span>
          <span className="mt-3 text-xl font-semibold tracking-tight">{m.label}</span>
          <span className="mt-1 text-sm text-fg-muted">{m.audience}</span>
          <span className="mt-4 text-sm leading-6 text-fg-muted">{m.description}</span>
        </button>
      ))}
    </div>
  );
}
