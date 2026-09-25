export type Mode = "beginner" | "intermediate" | "expert";

export type ModeInfo = {
  id: Mode;
  label: string;
  /** Who the mode is for, shown on the picker. */
  audience: string;
  /** What the reader gets, shown on the picker. */
  description: string;
};

// Order matters: `<!-- level: X -->` in the markdown means "X and every mode after it".
export const MODES: ModeInfo[] = [
  {
    id: "beginner",
    label: "Beginner",
    audience: "New to trading or to Solana",
    description:
      "A plain-language version of each explainer: what the strategy is, who wins, who pays, and what goes wrong. No formulas, jargon defined as it appears.",
  },
  {
    id: "intermediate",
    label: "Intermediate",
    audience: "Comfortable with DeFi, wants the mechanism",
    description:
      "The full mechanism, worked numbers, the Solana specifics and the data, with the derivations and research literature folded away.",
  },
  {
    id: "expert",
    label: "Expert",
    audience: "Building or running a strategy",
    description:
      "Everything: the math, the infrastructure minutiae, the papers, and every source. The original research notes, unabridged.",
  },
];

export const MODE_IDS = MODES.map((m) => m.id);
export const DEFAULT_MODE: Mode = "beginner";
export const MODE_STORAGE_KEY = "mev-handbook-mode";

export function isMode(value: unknown): value is Mode {
  return typeof value === "string" && (MODE_IDS as string[]).includes(value);
}

/** Modes that see a block marked `level: X`: X itself and every deeper mode. */
export function modesFromLevel(level: Mode): Mode[] {
  return MODE_IDS.slice(MODE_IDS.indexOf(level));
}

/** Runs in <head> before paint so the stored mode applies without a flash. */
export const MODE_BOOT_SCRIPT = `(function(){try{var m=localStorage.getItem(${JSON.stringify(
  MODE_STORAGE_KEY,
)});if(${JSON.stringify(MODE_IDS)}.indexOf(m)>=0)document.documentElement.setAttribute("data-mode",m)}catch(e){}})()`;
