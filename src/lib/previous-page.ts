/**
 * The page the learner was on before this one, kept for the tab's lifetime.
 * The desktop app has no browser toolbar, so pages such as the tutor's settings
 * offer their own way back, and need to know where "back" is.
 */
const PREV = "cyberdojo-prev-page";
const CUR = "cyberdojo-cur-page";

const read = (k: string) => {
  try {
    return sessionStorage.getItem(k);
  } catch {
    return null;
  }
};

/** Called on every page, including moves without a reload. */
export function notePage(path: string) {
  const cur = read(CUR);
  if (cur === path) return;
  try {
    if (cur) sessionStorage.setItem(PREV, cur);
    sessionStorage.setItem(CUR, path);
  } catch {
    // No storage: the back button falls back to the home page.
  }
}

/** Where "back" goes from `path`, or null when nothing came before it. Only this site's own paths. */
export function previousPage(path: string): string | null {
  const cur = read(CUR);
  // Effects may run here before the layout has noted this page: then the last page noted is the one before it.
  const prev = cur === path ? read(PREV) : cur;
  return prev && prev !== path && /^\/(?![/\\])/.test(prev) ? prev : null;
}
