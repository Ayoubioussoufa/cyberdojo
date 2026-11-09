/** "Try to break in": attack a simulated vulnerable app, one ladder per attack class. */
import type { RangeSet } from "../kit";
import { SQLI } from "./sqli";
import { XSS } from "./xss";
import { TRAVERSAL } from "./traversal";
import { CMDI } from "./cmdi";
import { AUTH } from "./auth";
import { SSRF } from "./ssrf";
import { XXE } from "./xxe";
import { SSTI } from "./ssti";
import { NOSQL } from "./nosql";
import { DESER } from "./deser";
import { JWT } from "./jwt";
import { REDIRECT } from "./redirect";
import { UPLOAD } from "./upload";
import { MASSASSIGN } from "./massassign";

export const MISSIONS_BREAK: Record<string, RangeSet> = {
  "break-sqli": { title: "SQL injection", missions: SQLI },
  "break-nosql": { title: "NoSQL injection", missions: NOSQL },
  "break-xss": { title: "Cross-site scripting", missions: XSS },
  "break-cmdi": { title: "Command injection", missions: CMDI },
  "break-ssti": { title: "Template injection", missions: SSTI },
  "break-xxe": { title: "XML external entity", missions: XXE },
  "break-traversal": { title: "Path traversal", missions: TRAVERSAL },
  "break-upload": { title: "Insecure file upload", missions: UPLOAD },
  "break-auth": { title: "Broken access control", missions: AUTH },
  "break-massassign": { title: "Mass assignment", missions: MASSASSIGN },
  "break-jwt": { title: "JWT forgery", missions: JWT },
  "break-deser": { title: "Insecure deserialization", missions: DESER },
  "break-redirect": { title: "Open redirect", missions: REDIRECT },
  "break-ssrf": { title: "Server-side request forgery", missions: SSRF },
};
