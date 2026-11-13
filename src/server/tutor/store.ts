/** Chats and grades, kept per page in the local database. */
import { all, get, many, run } from "@/server/db";
import type { Grade, Mode, TutorMessage } from "@/lib/tutor-types";

const COLUMNS = "id, role, mode, content, created_at AS createdAt";

export const history = (page: string) => all<TutorMessage>(`SELECT ${COLUMNS} FROM tutor_messages WHERE page = ? ORDER BY id`, page);

export async function addMessage(page: string, role: TutorMessage["role"], mode: Mode, content: string): Promise<TutorMessage> {
  const [, rows] = await many([
    ["INSERT INTO tutor_messages (page, role, mode, content, created_at) VALUES (?, ?, ?, ?, ?)", page, role, mode, content, Date.now()],
    [`SELECT ${COLUMNS} FROM tutor_messages WHERE id = last_insert_rowid()`],
  ]);
  return rows?.[0] as unknown as TutorMessage;
}

export const clearHistory = (page: string) => run("DELETE FROM tutor_messages WHERE page = ?", page);

interface GradeRow extends Omit<Grade, "right" | "missing" | "feedback"> {
  feedback: string;
}

const toGrade = ({ feedback, ...row }: GradeRow): Grade => ({ ...row, ...(JSON.parse(feedback) as Pick<Grade, "right" | "missing" | "feedback">) });

export async function saveGrade(page: string, g: Grade) {
  const { right, missing, feedback } = g;
  await run(
    "INSERT INTO tutor_grades (page, question_id, answer, verdict, score, feedback, model, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    page, g.questionId, g.answer, g.verdict, g.score, JSON.stringify({ right, missing, feedback }), g.model, g.createdAt,
  );
}

/** The latest grade of one question, if it was ever graded. */
export async function lastGrade(questionId: string): Promise<Grade | null> {
  const row = await get<GradeRow>(
    "SELECT question_id AS questionId, answer, verdict, score, feedback, model, created_at AS createdAt FROM tutor_grades WHERE question_id = ? ORDER BY id DESC LIMIT 1",
    questionId,
  );
  return row ? toGrade(row) : null;
}

/** Conversations on the tutor's own page are saved under this prefix, so the chat route treats them like any page. */
export const THREAD_PREFIX = "/tutor/chat/";
export const isThread = (page: string) => /^\/tutor\/chat\/[a-z0-9]{6,32}\/$/.test(page);

interface ChatRow {
  page: string;
  first: string | null;
  updatedAt: number;
  count: number;
}

/**
 * Every chat that has messages, newest first: the tutor's own conversations
 * and the ones held beside lessons. A chat's title is its first question.
 */
export async function chats(): Promise<ChatRow[]> {
  return all<ChatRow>(
    `SELECT page, MAX(created_at) AS updatedAt, COUNT(*) AS count,
            (SELECT content FROM tutor_messages f WHERE f.page = m.page AND f.role = 'user' ORDER BY f.id LIMIT 1) AS first
       FROM tutor_messages m GROUP BY page ORDER BY updatedAt DESC LIMIT 200`,
  );
}
