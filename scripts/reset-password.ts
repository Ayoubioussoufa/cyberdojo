/**
 * Accounts have no email, so a forgotten password is reset here by whoever runs
 * the server:  pnpm user:reset <username>
 * Prints a one-time password and signs that user out everywhere.
 * With TURSO_DATABASE_URL and TURSO_AUTH_TOKEN set, it acts on the hosted database.
 */
import { randomBytes } from "node:crypto";
import { get, many } from "../src/server/db";
import { hashPassword } from "../src/server/password";

const username = process.argv[2];
if (!username) {
  console.error("usage: pnpm user:reset <username>");
  process.exit(2);
}
async function main(name: string) {
  const user = await get<{ id: string }>("SELECT id FROM users WHERE username = ?", name);
  if (!user) {
    console.error(`No user called ${name}.`);
    process.exit(1);
  }
  const temporary = randomBytes(15).toString("base64url");
  await many([
    ["UPDATE users SET password_hash = ? WHERE id = ?", await hashPassword(temporary), user.id],
    ["DELETE FROM sessions WHERE user_id = ?", user.id],
  ]);
  console.log(`Temporary password for ${name}: ${temporary}\nHave them change it on /account straight away.`);
}

void main(username);
