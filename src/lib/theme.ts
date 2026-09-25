export type Theme = "dark" | "light";

export const THEME_STORAGE_KEY = "mev-handbook-theme";

/** Runs in <head> before paint: stored theme wins, otherwise the OS preference. */
export const THEME_BOOT_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});if(t!=="dark"&&t!=="light")t=matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;
