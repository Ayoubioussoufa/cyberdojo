/**
 * Mass assignment, simulated. The toy server builds a new user by copying every
 * field you post onto the object, including fields you were never meant to set,
 * like a role. So you grant yourself whatever the form didn't show. The object
 * lives in the closure. The fix, in the debrief: bind only an explicit allowlist
 * of fields, never the whole request.
 */
import { flagFrom, submitted, type Mission } from "../kit";
import { attackBox, ok, bad, notFound } from "./kit";
import type { Site } from "@/lib/shell/http";

export const MASSASSIGN: Mission[] = [
  {
    id: "break-massassign-1",
    title: "Give yourself the extra field",
    brief:
      "`signup.lab/register` creates an account from your form. The page only asks for `username` and `password`, but the server copies every field you send onto the new user, and the account has a `role` the form never shows. Register as an admin.",
    greeting: "Mass assignment: the server binds the whole form to the object, so a field the page omits is a field you can still send.",
    hints: [
      "Add the field the form left out: `role=admin`, alongside username and password.",
      "`curl -s -d 'username=eve&password=pw&role=admin' signup.lab/register`",
    ],
    build: (rng) => {
      const flag = flagFrom(rng);
      const site: Site = (r) => {
        if (r.path !== "/register" || r.method !== "POST") return notFound;
        if (!r.form.username || !r.form.password) return bad(400, "username and password are required.\n");
        // The bug: the whole form becomes the user, so an attacker-supplied role sticks.
        const user: Record<string, string> = { ...r.form, role: r.form.role ?? "user" };
        return user.role === "admin"
          ? ok(`Account created for ${user.username} with role admin. Admin welcome pack: ${flag}\n`)
          : ok(`Account created for ${user.username} with role ${user.role}.\n`);
      };
      return { shell: attackBox({ "signup.lab": site }), flag };
    },
    passed: submitted,
    solve: (w) => [`curl -s -d 'username=eve&password=pw&role=admin' signup.lab/register`, `submit ${w.flag}`],
    notEnough: () => [`curl -s -d 'username=eve&password=pw' signup.lab/register`],
    debrief:
      "The server trusted the shape of the request to match the form, so an extra field became an extra privilege. Bind only an explicit allowlist of fields (`{ username, password }`), and set sensitive fields like `role` server-side, never from the request.",
  },
];
