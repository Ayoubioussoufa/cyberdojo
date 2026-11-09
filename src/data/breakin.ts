/**
 * "Try to break in": the attack classes of the offensive practice section. Each
 * one is a simulated vulnerable app you attack in the browser terminal, the same
 * way the Dojo works, but from the attacker's chair. Nothing here can touch the
 * real site. Every challenge ends by teaching the fix, so breaking in is how you
 * learn to defend. This mirrors src/data/dojo.ts.
 */
export interface BreakClass {
  id: string;
  /** The range id in src/lib/missions/break, e.g. "break-sqli". */
  range: string;
  title: string;
  /** One line for the card. */
  tagline: string;
  /** Where it sits on OWASP-style thinking, for the badge. */
  owasp: string;
  /** Taught from scratch, above the terminal. */
  intro: string[];
  /** The defence, shown after the challenges. */
  defence: string;
  /** A lesson and a module that go deeper. */
  learn: { href: string; title: string }[];
}

export const BREAK_IN: BreakClass[] = [
  {
    id: "sqli",
    range: "break-sqli",
    title: "SQL injection",
    tagline: "turn a login box into a question the database answers for you",
    owasp: "Injection",
    intro: [
      "An app builds a database query out of text, and some of that text is yours. When the app pastes your input straight into the query, a single quote lets you end the value the app opened and write SQL of your own. The database can't tell your code from the app's.",
      "You'll bypass a login, log in as the admin by name, and empty a table that was meant to stay hidden. Everything runs against a real simulated SQLite, so the injections behave as they would for real.",
    ],
    defence:
      "The one fix is parameterised queries: `WHERE user = ?`, with your input sent as a value the database never parses as code. Escaping quotes by hand, or blocking words like `OR`, both fail. Add least-privilege database accounts so a successful injection reaches as little as possible.",
    learn: [
      { href: "/courses/0037-databases-and-sql/", title: "Databases and SQL" },
      { href: "/modules/04-02-sql-injection-in-depth/", title: "SQL injection in depth" },
    ],
  },
  {
    id: "xss",
    range: "break-xss",
    title: "Cross-site scripting",
    tagline: "get your script running in someone else's browser",
    owasp: "Injection",
    intro: [
      "A page takes your input and writes it back into the HTML. If it doesn't encode it first, HTML you send becomes part of the page, and a `<script>` you send runs in the browser of whoever views it. In these labs a stand-in admin views the page, and when your script runs, their session token leaks to you.",
      "You'll find an unescaped reflection, then defeat a naive filter that only strips `<script>`.",
    ],
    defence:
      "Encode output for its context (`<` becomes `&lt;` in HTML), so input can only ever show up as text. Add a Content-Security-Policy that forbids inline script, and mark session cookies `HttpOnly` so a script that does run still can't read them. Filtering by removing bad words is not a defence.",
    learn: [
      { href: "/courses/0047-keeping-input-out-of-the-code/", title: "Keeping input out of the code" },
      { href: "/modules/04-04-xss-in-depth/", title: "XSS in depth" },
    ],
  },
  {
    id: "traversal",
    range: "break-traversal",
    title: "Path traversal",
    tagline: "walk out of the folder the server meant to share",
    owasp: "Broken access control",
    intro: [
      "A server builds a file path by joining a base folder onto a name you give it, then opens the result. `../` means 'up one folder', so a name full of them climbs out of the folder the server meant to serve and reaches anything the process can read.",
      "You'll read `/etc/passwd` from outside the web root, then reach a secret config file holding a database password.",
    ],
    defence:
      "Resolve the final path, then confirm it still sits inside the allowed directory before opening it; reject it otherwise. An allowlist of exact names is stronger. And keep secrets out of any file the web process can open at all, so traversal reaches nothing worth having.",
    learn: [
      { href: "/courses/0035-how-the-web-works/", title: "How the web works" },
      { href: "/modules/04-08-files-traversal-and-uploads/", title: "Files, traversal and uploads" },
    ],
  },
  {
    id: "cmdi",
    range: "break-cmdi",
    title: "Command injection",
    tagline: "slip your own command into one the server runs",
    owasp: "Injection",
    intro: [
      "A server builds a shell command out of text and runs it, and some of that text is yours. A shell treats `;`, `|` and `$(...)` as instructions, so your input stops being an argument and becomes a command of its own.",
      "You'll append a command after a host to ping, then defeat a filter that blocks `;` but forgets `$(...)`.",
    ],
    defence:
      "Don't build a shell string from input at all. Call the program directly with an argument list (`execFile('ping', ['-c1', host])`): with no shell, metacharacters are just characters in an argument, and the whole class of bug is gone. Filtering shell characters is a losing game.",
    learn: [
      { href: "/courses/0035-how-the-web-works/", title: "How the web works" },
      { href: "/modules/04-03-injection-beyond-sql/", title: "Injection beyond SQL" },
    ],
  },
  {
    id: "auth",
    range: "break-auth",
    title: "Broken access control",
    tagline: "reach what should be someone else's, or an admin's",
    owasp: "Broken access control",
    intro: [
      "An app checks that you're logged in, then forgets to check that the thing you asked for is actually yours, or it trusts something the client fully controls. These are the most common serious flaws on the web, and the simplest to try.",
      "You'll read another user's record by changing an id, promote yourself by editing a cookie, and walk into an 'internal only' panel by faking a header.",
    ],
    defence:
      "Decide access from the server's own session, never from a value the client sends. Check ownership on every object (`WHERE id = ? AND owner = <session user>`), keep roles server-side or in a signed token, and never trust a header like `X-Forwarded-For` for authorisation.",
    learn: [
      { href: "/courses/0041-identity-and-access/", title: "Identity and access" },
      { href: "/modules/04-06-authentication-and-jwt-attacks/", title: "Authentication and JWT attacks" },
    ],
  },
  {
    id: "ssrf",
    range: "break-ssrf",
    title: "Server-side request forgery",
    tagline: "make the server reach somewhere you can't",
    owasp: "SSRF",
    intro: [
      "A feature fetches a URL you give it, server-side, and shows you the result. The catch: the server sits somewhere you don't, and can reach internal addresses you can't, like a cloud metadata service that hands out credentials.",
      "You'll make a link-preview feature fetch the metadata service and bring back a token.",
    ],
    defence:
      "Allowlist the exact hosts the feature may reach, resolve the name and block link-local (`169.254.0.0/16`) and private ranges, and require the metadata service's hardened mode. Treat any server-side fetch of a user-supplied URL as dangerous by default. More on this in Month 13.",
    learn: [
      { href: "/modules/04-07-ssrf-in-depth/", title: "SSRF in depth" },
      { href: "/modules/10-01-aws-attack-paths/", title: "AWS attack paths" },
    ],
  },
];

/** French for the attack classes. The challenges themselves are in English for now. */
const BREAK_IN_FR: Record<string, { title: string; tagline: string; owasp: string; intro: string[]; defence: string; learnTitles: string[] }> = {
  sqli: {
    title: "Injection SQL",
    tagline: "transformer un champ de connexion en une question à laquelle la base répond pour vous",
    owasp: "Injection",
    intro: [
      "Une application construit une requête de base de données à partir de texte, et une partie de ce texte est le vôtre. Quand l'application colle votre saisie telle quelle dans la requête, une simple apostrophe vous permet de fermer la valeur ouverte par l'application et d'écrire votre propre SQL. La base ne distingue pas votre code du sien.",
      "Vous contournerez une connexion, vous connecterez en tant qu'admin par son nom, et viderez une table censée rester cachée. Tout tourne contre un vrai SQLite simulé, donc les injections se comportent comme pour de vrai.",
    ],
    defence:
      "Le seul vrai remède est la requête paramétrée : `WHERE user = ?`, votre saisie étant envoyée comme une valeur que la base ne lit jamais comme du code. Échapper les apostrophes à la main, ou bloquer des mots comme `OR`, échouent tous deux. Ajoutez des comptes de base à moindre privilège pour qu'une injection réussie atteigne le moins possible.",
    learnTitles: ["Bases de données et SQL", "L'injection SQL en profondeur"],
  },
  xss: {
    title: "Cross-site scripting",
    tagline: "faire tourner votre script dans le navigateur de quelqu'un d'autre",
    owasp: "Injection",
    intro: [
      "Une page reprend votre saisie et la réécrit dans le HTML. Si elle ne l'encode pas d'abord, le HTML que vous envoyez devient une partie de la page, et un `<script>` que vous envoyez s'exécute dans le navigateur de quiconque la consulte. Dans ces labs, un admin fictif consulte la page, et quand votre script tourne, son jeton de session fuit vers vous.",
      "Vous trouverez une réflexion non échappée, puis déjouerez un filtre naïf qui ne retire que `<script>`.",
    ],
    defence:
      "Encodez la sortie selon son contexte (`<` devient `&lt;` en HTML), pour que la saisie ne puisse jamais apparaître qu'en texte. Ajoutez une Content-Security-Policy qui interdit le script en ligne, et marquez les cookies de session `HttpOnly` pour qu'un script qui s'exécute quand même ne puisse pas les lire. Filtrer en retirant des mots n'est pas une défense.",
    learnTitles: ["Garder la saisie hors du code", "Le XSS en profondeur"],
  },
  traversal: {
    title: "Traversée de chemin",
    tagline: "sortir du dossier que le serveur voulait partager",
    owasp: "Contrôle d'accès rompu",
    intro: [
      "Un serveur construit un chemin de fichier en collant un dossier de base à un nom que vous donnez, puis ouvre le résultat. `../` veut dire « un dossier au-dessus », donc un nom plein de `../` remonte hors du dossier que le serveur voulait servir et atteint tout ce que le processus peut lire.",
      "Vous lirez `/etc/passwd` hors de la racine web, puis atteindrez un fichier de configuration secret qui contient un mot de passe de base de données.",
    ],
    defence:
      "Résolvez le chemin final, puis vérifiez qu'il reste dans le dossier autorisé avant de l'ouvrir ; refusez-le sinon. Une liste blanche de noms exacts est plus solide. Et gardez les secrets hors de tout fichier que le processus web peut ouvrir, pour que la traversée n'atteigne rien d'intéressant.",
    learnTitles: ["Comment fonctionne le web", "Fichiers, traversée et envois"],
  },
  cmdi: {
    title: "Injection de commande",
    tagline: "glisser votre propre commande dans celle que le serveur exécute",
    owasp: "Injection",
    intro: [
      "Un serveur construit une commande shell à partir de texte et l'exécute, et une partie de ce texte est le vôtre. Un shell traite `;`, `|` et `$(...)` comme des instructions, donc votre saisie cesse d'être un argument et devient une commande à part entière.",
      "Vous ajouterez une commande après un hôte à pinger, puis déjouerez un filtre qui bloque `;` mais oublie `$(...)`.",
    ],
    defence:
      "Ne construisez pas du tout une chaîne shell à partir de la saisie. Appelez le programme directement avec une liste d'arguments (`execFile('ping', ['-c1', host])`) : sans shell, les métacaractères ne sont que des caractères dans un argument, et toute la classe de bug disparaît. Filtrer les caractères shell est un combat perdu d'avance.",
    learnTitles: ["Comment fonctionne le web", "L'injection au-delà du SQL"],
  },
  auth: {
    title: "Contrôle d'accès rompu",
    tagline: "atteindre ce qui devrait être à un autre, ou à un admin",
    owasp: "Contrôle d'accès rompu",
    intro: [
      "Une application vérifie que vous êtes connecté, puis oublie de vérifier que la chose demandée est bien la vôtre, ou fait confiance à quelque chose que le client contrôle entièrement. Ce sont les failles graves les plus courantes du web, et les plus simples à essayer.",
      "Vous lirez l'enregistrement d'un autre utilisateur en changeant un identifiant, vous promouvrez en modifiant un cookie, et entrerez dans un panneau « interne » en falsifiant un en-tête.",
    ],
    defence:
      "Décidez de l'accès à partir de la session du serveur, jamais d'une valeur envoyée par le client. Vérifiez l'appartenance sur chaque objet (`WHERE id = ? AND owner = <utilisateur de la session>`), gardez les rôles côté serveur ou dans un jeton signé, et ne faites jamais confiance à un en-tête comme `X-Forwarded-For` pour l'autorisation.",
    learnTitles: ["Identité et accès", "Authentification et attaques JWT"],
  },
  ssrf: {
    title: "Falsification de requête côté serveur",
    tagline: "faire atteindre au serveur un endroit que vous ne pouvez pas joindre",
    owasp: "SSRF",
    intro: [
      "Une fonction va chercher une URL que vous donnez, côté serveur, et vous en montre le résultat. Le piège : le serveur se trouve là où vous n'êtes pas, et peut joindre des adresses internes que vous ne pouvez pas, comme un service de métadonnées cloud qui distribue des identifiants.",
      "Vous ferez pointer un aperçu de lien vers le service de métadonnées et en rapporterez un jeton.",
    ],
    defence:
      "Mettez en liste blanche les hôtes exacts que la fonction peut joindre, résolvez le nom et bloquez le lien-local (`169.254.0.0/16`) et les plages privées, et exigez le mode durci du service de métadonnées. Traitez toute requête côté serveur vers une URL fournie par l'utilisateur comme dangereuse par défaut. Plus de détails au mois 13.",
    learnTitles: ["La SSRF en profondeur", "Chemins d'attaque AWS"],
  },
};

/** The attack classes in the page's language. */
export function breakClasses(lang: "en" | "fr"): BreakClass[] {
  if (lang === "en") return BREAK_IN;
  return BREAK_IN.map((c) => {
    const fr = BREAK_IN_FR[c.id];
    if (!fr) return c;
    return {
      ...c,
      title: fr.title,
      tagline: fr.tagline,
      owasp: fr.owasp,
      intro: fr.intro,
      defence: fr.defence,
      learn: c.learn.map((l, i) => ({ ...l, title: fr.learnTitles[i] ?? l.title })),
    };
  });
}
