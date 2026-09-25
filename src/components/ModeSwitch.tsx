"use client";

import { useLayoutEffect } from "react";
import { MODES, type Mode } from "@/lib/modes";
import { applyMode, modesShowing, readMode, setMode } from "@/lib/mode-client";

/** If the URL points at a section hidden in the current mode, switch to the first mode that shows it. */
function revealHashTarget() {
  const id = decodeURIComponent(location.hash.slice(1));
  if (!id) return;
  const target = document.getElementById(id);
  if (!target) return;
  const allowed = modesShowing(target);
  if (!allowed || allowed.includes(readMode())) return;
  if (allowed.length === 0) return;
  setMode(allowed[0]);
  requestAnimationFrame(() => target.scrollIntoView());
}

export function ModeSwitch() {
  // Re-apply after React's dev-mode remount clears <html> attributes; a no-op in production.
  useLayoutEffect(() => {
    applyMode(readMode());
    revealHashTarget();
    window.addEventListener("hashchange", revealHashTarget);
    return () => window.removeEventListener("hashchange", revealHashTarget);
  }, []);

  return (
    <div className="mode-switch" role="radiogroup" aria-label="Reading level">
      {MODES.map((m) => (
        <button
          key={m.id}
          type="button"
          data-value={m.id}
          title={`${m.label}: ${m.audience}`}
          onClick={() => setMode(m.id as Mode)}
        >
          <span className="hidden sm:inline">{m.label}</span>
          <span className="sm:hidden" aria-hidden="true">
            {m.label[0]}
          </span>
        </button>
      ))}
    </div>
  );
}
