"use client";

import { DEFAULT_MODE, MODE_STORAGE_KEY, isMode, type Mode } from "./modes";

export function readMode(): Mode {
  try {
    const stored = localStorage.getItem(MODE_STORAGE_KEY);
    return isMode(stored) ? stored : DEFAULT_MODE;
  } catch {
    return DEFAULT_MODE;
  }
}

/** The <html data-mode> attribute is the single source of truth; CSS does the showing and hiding. */
export function applyMode(mode: Mode) {
  document.documentElement.setAttribute("data-mode", mode);
}

export function setMode(mode: Mode) {
  try {
    localStorage.setItem(MODE_STORAGE_KEY, mode);
  } catch {
    // Private browsing or blocked storage: the choice still applies for this page view.
  }
  applyMode(mode);
}

/** Every mode block wrapping `el`; the element is visible only in the intersection of them. */
export function modesShowing(el: Element): Mode[] | null {
  let allowed: Mode[] | null = null;
  for (let node = el.closest("[data-modes]"); node; node = node.parentElement?.closest("[data-modes]") ?? null) {
    const modes = (node.getAttribute("data-modes") ?? "").split(" ").filter(isMode);
    allowed = allowed ? allowed.filter((m) => modes.includes(m)) : modes;
  }
  return allowed;
}
