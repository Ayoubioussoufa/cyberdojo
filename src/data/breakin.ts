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
  {
    id: "nosql",
    range: "break-nosql",
    title: "NoSQL injection",
    tagline: "send a query operator where the app expects a password",
    owasp: "Injection",
    intro: [
      "Document databases take queries as structured objects, not strings. When an app drops your JSON values straight into that query without checking their type, you can send an operator like `{\"$ne\": null}` where it wanted a string. The operator matches anything, so the check passes.",
      "You'll bypass a login by making the password 'not equal to null', which every real password is.",
    ],
    defence:
      "Force every field to the type you expect before it reaches the query (`String(pass)`), reject credentials that aren't strings, and validate the body against a schema. It's the same rule as SQL injection: never let input decide the shape of a query.",
    learn: [
      { href: "/courses/0046-how-web-applications-fail/", title: "How web applications fail" },
      { href: "/modules/04-03-injection-beyond-sql/", title: "Injection beyond SQL" },
    ],
  },
  {
    id: "ssti",
    range: "break-ssti",
    title: "Template injection",
    tagline: "land inside the template and let the engine run your expression",
    owasp: "Injection",
    intro: [
      "A page builds its template by pasting your input into the template source. So `{{ ... }}` you send is evaluated by the template engine instead of printed. `{{7*7}}` coming back as `49` is the classic sign that you're inside the template, not just filling it.",
      "You'll prove the injection with arithmetic, read a variable the template can see, then slip past a filter that blocks one word.",
    ],
    defence:
      "Pass user data as a value the engine escapes (`render(tpl, { name })`), never by building the template string from input. A sandboxed engine is a weak second line; real engines expose paths to objects, classes and the runtime, so keep input out of the template entirely.",
    learn: [
      { href: "/courses/0046-how-web-applications-fail/", title: "How web applications fail" },
      { href: "/modules/04-03-injection-beyond-sql/", title: "Injection beyond SQL" },
    ],
  },
  {
    id: "xxe",
    range: "break-xxe",
    title: "XML external entity",
    tagline: "declare an entity that is really a file, and let the parser fetch it",
    owasp: "Injection",
    intro: [
      "An XML parser with external entities switched on will resolve a `<!ENTITY ... SYSTEM \"file://...\">` declaration by reading that file and dropping it into the document. When a server parses XML you send, that lets you read files off its disk.",
      "You'll read `/etc/passwd`, then pull out the app's own secret key.",
    ],
    defence:
      "Turn off DOCTYPE processing and external entities in the XML parser; for most libraries that's one or two settings. Never parse untrusted XML with a default, entity-resolving parser. File permissions and folder layout won't save you once entities resolve.",
    learn: [
      { href: "/courses/0049-apis-uploads-and-outbound-requests/", title: "APIs, uploads and outbound requests" },
      { href: "/modules/04-03-injection-beyond-sql/", title: "Injection beyond SQL" },
    ],
  },
  {
    id: "upload",
    range: "break-upload",
    title: "Insecure file upload",
    tagline: "slip a file past the check that still runs as code",
    owasp: "Broken access control",
    intro: [
      "A server decides whether an upload is safe from its name, then serves it back and runs anything it treats as a script. When the check and the thing that executes disagree about what counts as a script, a file that passes the check can still run.",
      "You'll bypass an extension blocklist with a type it forgot, then hide a `.php` behind a second extension.",
    ],
    defence:
      "Allowlist the exact types you accept, generate your own filename, and serve uploads from a store that never executes them. Deciding safety by string-matching the extension is the wrong place to make the call; a blocklist always misses one the runtime still runs.",
    learn: [
      { href: "/courses/0049-apis-uploads-and-outbound-requests/", title: "APIs, uploads and outbound requests" },
      { href: "/modules/04-08-files-traversal-and-uploads/", title: "Files, traversal and uploads" },
    ],
  },
  {
    id: "massassign",
    range: "break-massassign",
    title: "Mass assignment",
    tagline: "send the field the form never showed you",
    owasp: "Broken access control",
    intro: [
      "A server builds an object by copying every field you post onto it, including fields the form never displayed, like a role or an account balance. So you set what you were never offered.",
      "You'll register an account and grant yourself the admin role the signup form doesn't mention.",
    ],
    defence:
      "Bind only an explicit allowlist of fields (`{ username, password }`), never the whole request. Set sensitive fields like `role` server-side, and keep the model that accepts input separate from the one that holds privileges.",
    learn: [
      { href: "/courses/0046-how-web-applications-fail/", title: "How web applications fail" },
      { href: "/modules/04-12-api-security-graphql-grpc/", title: "API security: GraphQL and gRPC" },
    ],
  },
  {
    id: "jwt",
    range: "break-jwt",
    title: "JWT forgery",
    tagline: "write your own token when the server accepts alg:none",
    owasp: "Broken access control",
    intro: [
      "A JSON Web Token is three base64url parts: a header saying how it's signed, a payload of claims, and a signature. A server that honours a header of `alg: none` trusts the payload with no signature at all, so you can write a token that says whatever you like.",
      "You'll forge an unsigned token that claims you're the admin.",
    ],
    defence:
      "Pin the expected algorithm in the verifier and reject `none` outright. Verify with a key the client never sees, and treat a token the client can rewrite as no authentication at all.",
    learn: [
      { href: "/courses/0045-attacking-and-defending-identity/", title: "Attacking and defending identity" },
      { href: "/modules/04-06-authentication-and-jwt-attacks/", title: "Authentication and JWT attacks" },
    ],
  },
  {
    id: "deser",
    range: "break-deser",
    title: "Insecure deserialization",
    tagline: "rebuild the trusted blob to say whatever you want",
    owasp: "Software integrity",
    intro: [
      "A server stores state as a blob it hands you, then trusts whatever it decodes back, with no signature. So you rebuild the blob: a higher role, or a field that makes the server's loader do something it shouldn't.",
      "You'll promote yourself by editing an unsigned session, then make a loader open a file by adding the fields it looks for.",
    ],
    defence:
      "Sign serialized state with a server-only key and verify it before trusting a byte, or keep the state server-side and hand the client an opaque id. Never let deserialized data choose a type, a class, a path or a callback.",
    learn: [
      { href: "/courses/0046-how-web-applications-fail/", title: "How web applications fail" },
      { href: "/modules/04-09-deserialization/", title: "Deserialization" },
    ],
  },
  {
    id: "redirect",
    range: "break-redirect",
    title: "Open redirect",
    tagline: "turn a trusted link into a springboard to anywhere",
    owasp: "Broken access control",
    intro: [
      "A server sends users wherever a `url` parameter says, with no check that the destination is one of its own pages. A link that looks like it goes to the trusted site can bounce a victim to a hostile one, carrying their trust, and sometimes a token, with them.",
      "You'll make a login redirect send a victim off-site, and read what leaks when it does.",
    ],
    defence:
      "Redirect only to a relative path on your own site, or match the destination against a strict allowlist of hosts. Never feed a user-supplied URL straight into the `Location` header; it is a gift to phishing.",
    learn: [
      { href: "/courses/0046-how-web-applications-fail/", title: "How web applications fail" },
      { href: "/modules/04-05-client-side-attacks/", title: "Client-side attacks" },
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
  nosql: {
    title: "Injection NoSQL",
    tagline: "envoyer un opérateur de requête là où l'app attend un mot de passe",
    owasp: "Injection",
    intro: [
      "Les bases de données documentaires reçoivent les requêtes sous forme d'objets structurés, pas de chaînes. Quand une app insère vos valeurs JSON dans cette requête sans vérifier leur type, vous pouvez envoyer un opérateur comme `{\"$ne\": null}` là où elle attendait une chaîne. L'opérateur correspond à n'importe quoi, donc la vérification passe.",
      "Vous contournerez une connexion en faisant que le mot de passe soit « différent de null », ce que tout vrai mot de passe est.",
    ],
    defence:
      "Forcez chaque champ au type attendu avant qu'il n'atteigne la requête (`String(pass)`), refusez les identifiants qui ne sont pas des chaînes, et validez le corps avec un schéma. C'est la même règle que l'injection SQL : ne laissez jamais la saisie décider de la forme d'une requête.",
    learnTitles: ["Comment les applications web échouent", "L'injection au-delà du SQL"],
  },
  ssti: {
    title: "Injection de template",
    tagline: "atterrir dans le template et laisser le moteur exécuter votre expression",
    owasp: "Injection",
    intro: [
      "Une page construit son template en collant votre saisie dans la source du template. Donc un `{{ ... }}` que vous envoyez est évalué par le moteur de template, pas affiché. `{{7*7}}` qui revient en `49` est le signe classique que vous êtes dans le template, pas en train de le remplir.",
      "Vous prouverez l'injection avec un calcul, lirez une variable que le template voit, puis déjouerez un filtre qui bloque un mot.",
    ],
    defence:
      "Passez les données utilisateur comme une valeur que le moteur échappe (`render(tpl, { name })`), jamais en construisant la chaîne du template à partir de la saisie. Un moteur en bac à sable est une faible seconde ligne ; les vrais moteurs exposent des chemins vers les objets, les classes et le runtime, alors gardez la saisie hors du template.",
    learnTitles: ["Comment les applications web échouent", "L'injection au-delà du SQL"],
  },
  xxe: {
    title: "Entité externe XML",
    tagline: "déclarer une entité qui est en fait un fichier, et laisser le parseur le chercher",
    owasp: "Injection",
    intro: [
      "Un parseur XML avec les entités externes activées résout une déclaration `<!ENTITY ... SYSTEM \"file://...\">` en lisant ce fichier et en le glissant dans le document. Quand un serveur parse du XML que vous envoyez, cela vous laisse lire des fichiers sur son disque.",
      "Vous lirez `/etc/passwd`, puis extrairez la clé secrète de l'application elle-même.",
    ],
    defence:
      "Désactivez le traitement des DOCTYPE et des entités externes dans le parseur XML ; pour la plupart des bibliothèques, c'est un ou deux réglages. Ne parsez jamais du XML non fiable avec un parseur par défaut qui résout les entités. Ni les permissions ni la structure des dossiers ne vous sauveront une fois les entités résolues.",
    learnTitles: ["APIs, envois et requêtes sortantes", "L'injection au-delà du SQL"],
  },
  upload: {
    title: "Envoi de fichier non sécurisé",
    tagline: "glisser un fichier qui passe la vérification mais s'exécute quand même",
    owasp: "Contrôle d'accès rompu",
    intro: [
      "Un serveur décide si un envoi est sûr d'après son nom, puis le ressert et exécute tout ce qu'il considère comme un script. Quand la vérification et ce qui exécute le fichier ne s'accordent pas sur ce qui compte comme un script, un fichier qui passe la vérification peut quand même s'exécuter.",
      "Vous contournerez une liste noire d'extensions avec un type qu'elle a oublié, puis cacherez un `.php` derrière une seconde extension.",
    ],
    defence:
      "Mettez en liste blanche les types exacts que vous acceptez, générez vous-même le nom de fichier, et servez les envois depuis un stockage qui ne les exécute jamais. Décider de la sûreté en comparant l'extension est le mauvais endroit pour trancher ; une liste noire en oublie toujours un que le runtime exécute.",
    learnTitles: ["APIs, envois et requêtes sortantes", "Fichiers, traversée et envois"],
  },
  massassign: {
    title: "Affectation de masse",
    tagline: "envoyer le champ que le formulaire ne vous a jamais montré",
    owasp: "Contrôle d'accès rompu",
    intro: [
      "Un serveur construit un objet en copiant dessus chaque champ que vous envoyez, y compris des champs que le formulaire n'a jamais affichés, comme un rôle ou un solde de compte. Vous définissez donc ce qu'on ne vous a jamais proposé.",
      "Vous créerez un compte et vous attribuerez le rôle admin que le formulaire d'inscription ne mentionne pas.",
    ],
    defence:
      "Ne liez qu'une liste blanche explicite de champs (`{ username, password }`), jamais toute la requête. Définissez les champs sensibles comme `role` côté serveur, et séparez le modèle qui reçoit la saisie de celui qui porte les privilèges.",
    learnTitles: ["Comment les applications web échouent", "Sécurité des API : GraphQL et gRPC"],
  },
  jwt: {
    title: "Forgeage de JWT",
    tagline: "écrire votre propre jeton quand le serveur accepte alg:none",
    owasp: "Contrôle d'accès rompu",
    intro: [
      "Un JSON Web Token est fait de trois parties en base64url : un en-tête qui dit comment il est signé, une charge utile de revendications, et une signature. Un serveur qui respecte un en-tête `alg: none` fait confiance à la charge utile sans aucune signature, donc vous pouvez écrire un jeton qui dit ce que vous voulez.",
      "Vous forgerez un jeton non signé qui prétend que vous êtes l'admin.",
    ],
    defence:
      "Fixez l'algorithme attendu dans le vérificateur et refusez `none` d'emblée. Vérifiez avec une clé que le client ne voit jamais, et considérez un jeton que le client peut réécrire comme une absence d'authentification.",
    learnTitles: ["Attaquer et défendre l'identité", "Authentification et attaques JWT"],
  },
  deser: {
    title: "Désérialisation non sécurisée",
    tagline: "reconstruire le blob de confiance pour qu'il dise ce que vous voulez",
    owasp: "Intégrité du logiciel",
    intro: [
      "Un serveur stocke un état sous forme de blob qu'il vous remet, puis fait confiance à tout ce qu'il redécode, sans signature. Vous reconstruisez donc le blob : un rôle plus élevé, ou un champ qui fait faire au chargeur du serveur quelque chose qu'il ne devrait pas.",
      "Vous vous promouvrez en modifiant une session non signée, puis ferez ouvrir un fichier à un chargeur en ajoutant les champs qu'il recherche.",
    ],
    defence:
      "Signez l'état sérialisé avec une clé réservée au serveur et vérifiez-le avant de faire confiance au moindre octet, ou gardez l'état côté serveur et ne remettez au client qu'un identifiant opaque. Ne laissez jamais des données désérialisées choisir un type, une classe, un chemin ou une fonction de rappel.",
    learnTitles: ["Comment les applications web échouent", "Désérialisation"],
  },
  redirect: {
    title: "Redirection ouverte",
    tagline: "transformer un lien de confiance en tremplin vers n'importe où",
    owasp: "Contrôle d'accès rompu",
    intro: [
      "Un serveur envoie les utilisateurs là où le dit un paramètre `url`, sans vérifier que la destination est l'une de ses propres pages. Un lien qui semble aller vers le site de confiance peut renvoyer une victime vers un site hostile, en emportant sa confiance, et parfois un jeton, avec elle.",
      "Vous ferez qu'une redirection de connexion envoie une victime hors du site, et lirez ce qui fuit alors.",
    ],
    defence:
      "Ne redirigez que vers un chemin relatif de votre propre site, ou comparez la destination à une liste blanche stricte d'hôtes. N'injectez jamais une URL fournie par l'utilisateur directement dans l'en-tête `Location` ; c'est un cadeau pour l'hameçonnage.",
    learnTitles: ["Comment les applications web échouent", "Attaques côté client"],
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
