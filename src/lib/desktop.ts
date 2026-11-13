/**
 * True only in the desktop build (`pnpm desktop:build` sets the variable). The
 * website is built without it, so everything behind this flag stays out of the
 * way there: no local profile, no tutor routes, no tutor tables.
 */
export const DESKTOP = process.env.NEXT_PUBLIC_CYBERDOJO_DESKTOP === "1";
