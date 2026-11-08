/**
 * Short study and craft tips, one shown per day on the home page. Each links to
 * where it's explained properly. Keep them actionable: something a learner can
 * do today, in one or two sentences. Research claims are cited in the guides.
 */
export interface Tip {
  text: string;
  href: string;
  topic: "memory" | "practice" | "terminal" | "habits" | "career" | "craft";
}

export const TIPS: Tip[] = [
  { topic: "memory", text: "Before opening today's lesson, write down what you remember from the last one. Two minutes of recall beats ten of rereading.", href: "/guides/s1-how-memory-works/" },
  { topic: "memory", text: "If a page feels familiar, test yourself before moving on. Familiarity is not memory.", href: "/guides/s1-how-memory-works/" },
  { topic: "memory", text: "Answer each in-lesson question before scrolling. A wrong guess followed by the explanation is still learning.", href: "/guides/s1-how-memory-works/" },
  { topic: "memory", text: "Mix topics when you practise. Today's mix feels harder than a single-topic drill, and that's why it works.", href: "/practice/mix/" },
  { topic: "memory", text: "Predict a command's output before pressing Enter. Producing an answer yourself makes it stick.", href: "/guides/s1-how-memory-works/" },
  { topic: "memory", text: "One flashcard, one fact. 'Which port does SMB use?' beats 'Explain SMB'.", href: "/guides/s2-memorising-what-must-be-instant/" },
  { topic: "memory", text: "Keep confusing two similar facts? Write a card about the difference between them.", href: "/guides/s2-memorising-what-must-be-instant/" },
  { topic: "memory", text: "Ten to fifteen new flashcards a day is plenty. Reviews pile up faster than you think.", href: "/practice/flashcards/" },
  { topic: "memory", text: "Learn ports by family: mail, web, remote access, file sharing. A group is easier to hold than a list.", href: "/sheets/ports/" },
  { topic: "memory", text: "Study, sleep, then recall the next morning. Sleep is when the day's learning settles.", href: "/guides/s4-staying-in-it/" },
  { topic: "memory", text: "Understand first, memorise second. A card for something you don't understand is a card you'll fail.", href: "/guides/s2-memorising-what-must-be-instant/" },
  { topic: "practice", text: "Stuck for 30 minutes? Take the smallest hint. Stuck for 60? Read the solution, close it, and redo the task yourself.", href: "/guides/s3-studying-hands-on/" },
  { topic: "practice", text: "Leave walkthroughs off. A short, honest struggle before the answer makes the answer stick.", href: "/guides/s1-how-memory-works/" },
  { topic: "practice", text: "Redo a task from last month without notes. The time it takes now is your real progress.", href: "/guides/s4-staying-in-it/" },
  { topic: "practice", text: "After a tutorial, redo it alone with one change: another target, another tool or another log.", href: "/guides/s3-studying-hands-on/" },
  { topic: "practice", text: "Clear your mistakes list every week. Your own errors are the most valuable practice material you have.", href: "/practice/mistakes/" },
  { topic: "practice", text: "Practise the thing you keep failing at, not the thing you're already good at.", href: "/guides/s4-staying-in-it/" },
  { topic: "practice", text: "When reading a write-up, stop after each step and predict the next before reading on.", href: "/guides/s3-studying-hands-on/" },
  { topic: "practice", text: "Solved something as an attacker on a legal platform? Now find the logs it left and write the detection.", href: "/guides/s3-studying-hands-on/" },
  { topic: "terminal", text: "Ctrl+R searches your shell history as you type. It's the single most useful terminal habit.", href: "/guides/s3-studying-hands-on/" },
  { topic: "terminal", text: "Don't know a command's name? man -k followed by a keyword searches the manual pages.", href: "/guides/s3-studying-hands-on/" },
  { topic: "terminal", text: "'sudo !!' reruns your last command with sudo, after a 'permission denied'.", href: "/guides/s3-studying-hands-on/" },
  { topic: "terminal", text: "'cd -' takes you back to the directory you were just in.", href: "/guides/s3-studying-hands-on/" },
  { topic: "terminal", text: "Pipe into 'tee file.txt' to watch the output and save it at the same time.", href: "/guides/s3-studying-hands-on/" },
  { topic: "terminal", text: "Inside man or less, type /word to search and n for the next match.", href: "/guides/s3-studying-hands-on/" },
  { topic: "terminal", text: "Record a whole lab session with 'script lab.log'. Type exit to stop.", href: "/guides/s3-studying-hands-on/" },
  { topic: "terminal", text: "Met a long command online? Paste it into explainshell.com to see what each part does before running it.", href: "/guides/s3-studying-hands-on/" },
  { topic: "habits", text: "Write tomorrow's first task before you stop today. Starting is the hardest part, so make it obvious.", href: "/guides/s3-studying-hands-on/" },
  { topic: "habits", text: "Bad day? Do only your review and stop. The habit survives, and so does the schedule.", href: "/guides/s4-staying-in-it/" },
  { topic: "habits", text: "Short sessions most days beat one long session a week. Same hours, much better memory.", href: "/guides/s1-how-memory-works/" },
  { topic: "habits", text: "Phone in another room, one tab, one task. Forty focused minutes beat two distracted hours.", href: "/guides/s4-staying-in-it/" },
  { topic: "habits", text: "Keep the lab notebook open while you work. Notes written afterwards forget the dead ends, and the dead ends teach most.", href: "/guides/s3-studying-hands-on/" },
  { topic: "habits", text: "Name every note and log YYYY-MM-DD-topic. They sort themselves, and you'll find them in seconds.", href: "/guides/s3-studying-hands-on/" },
  { topic: "habits", text: "Two hours of doing for every hour of video. Watching isn't studying.", href: "/guides/j1-the-learning-system/" },
  { topic: "habits", text: "Compare yourself with you three months ago, not with strangers online.", href: "/guides/s4-staying-in-it/" },
  { topic: "craft", text: "Read the whole error message, then search for its exact text in quotes.", href: "/guides/s3-studying-hands-on/" },
  { topic: "craft", text: "Change one thing at a time. Two changes at once and you won't know which one mattered.", href: "/guides/s3-studying-hands-on/" },
  { topic: "craft", text: "Before each test, write the hypothesis: 'If DNS is the problem, this will work.' That's how analysts think.", href: "/guides/s3-studying-hands-on/" },
  { topic: "craft", text: "Snapshot your lab VM before a risky change. Rolling back takes a minute; rebuilding takes an evening.", href: "/guides/s3-studying-hands-on/" },
  { topic: "craft", text: "Check the boring layers first: is it running, is it listening, is the port open, does the name resolve?", href: "/sheets/ports/" },
  { topic: "craft", text: "Only test what you own, or what you have written permission to test. No exceptions, not even 'just a quick scan'.", href: "/modules/12-01-computer-crime-law/" },
  { topic: "craft", text: "Prefer primary sources: RFCs, man pages and vendor documentation beat blog posts.", href: "/guides/s3-studying-hands-on/" },
  { topic: "career", text: "Publish one short write-up a month, on retired challenges only. It's practice, and it's proof.", href: "/guides/h3-write-ups-and-reports/" },
  { topic: "career", text: "Ask questions the way people answer them: what you tried, the exact error, and what you expected.", href: "/guides/s4-staying-in-it/" },
  { topic: "career", text: "Go to a local OWASP chapter or BSides. One conversation there teaches what no course can.", href: "/guides/s4-staying-in-it/" },
  { topic: "career", text: "Explain this week's topic to someone, or to a five-minute recording. What you can't explain, you haven't learned yet.", href: "/guides/j1-the-learning-system/" },
];
