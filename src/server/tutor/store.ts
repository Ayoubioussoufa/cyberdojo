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
