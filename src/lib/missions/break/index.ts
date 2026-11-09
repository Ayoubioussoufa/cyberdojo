/** "Try to break in": attack a simulated vulnerable app, one ladder per attack class. */
import type { RangeSet } from "../kit";
import { SQLI } from "./sqli";
import { XSS } from "./xss";
import { TRAVERSAL } from "./traversal";
import { CMDI } from "./cmdi";
import { AUTH } from "./auth";
import { SSRF } from "./ssrf";

export const MISSIONS_BREAK: Record<string, RangeSet> = {
  "break-sqli": { title: "SQL injection", missions: SQLI },
  "break-xss": { title: "Cross-site scripting", missions: XSS },
  "break-traversal": { title: "Path traversal", missions: TRAVERSAL },
  "break-cmdi": { title: "Command injection", missions: CMDI },
  "break-auth": { title: "Broken access control", missions: AUTH },
  "break-ssrf": { title: "Server-side request forgery", missions: SSRF },
};
