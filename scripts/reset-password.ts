/**
 * Accounts have no email, so a forgotten password is reset here by whoever runs
 * the server:  pnpm user:reset <username>
 * Prints a one-time password and signs that user out everywhere.
 */
import { randomBytes } from "node:crypto";
import { db } from "../src/server/db";
import { hashPassword } from "../src/server/password";

const username = process.argv[2];
if (!username) {
  console.error("usage: pnpm user:reset <username>");
  process.exit(2);
}
const user = db().prepare("SELECT id FROM users WHERE username = ?").get(username) as { id: string } | undefined;
if (!user) {
  console.error(`No user called ${username}.`);
  process.exit(1);
}
const { id } = user;
const temporary = randomBytes(15).toString("base64url");
void hashPassword(temporary).then((hash) => {
  db().prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hash, id);
  db().prepare("DELETE FROM sessions WHERE user_id = ?").run(id);
  console.log(`Temporary password for ${username}: ${temporary}\nHave them change it on /account straight away.`);
});
