import { allQuestions } from "@/lib/content";

export const dynamic = "force-static";

/** Fetched by /review only once there is something to review. */
export const GET = () => Response.json(allQuestions().map((x) => ({ q: x.q, title: x.title, href: x.href })));
