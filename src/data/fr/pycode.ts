/**
 * French for the interactive Python challenges (src/data/pycode.ts): the prompt
 * and the name of each test, in the same order as the English tests. The code,
 * the function names and the test expressions stay as they are, so a solution
 * written on the English page passes on the French one. check-pycode.ts keeps
 * this file in step with the English data.
 */
export interface PyChallengeFr {
  prompt: string;
  /** One name per English test, in the same order. */
  tests: string[];
}

export const PY_FR: Record<string, PyChallengeFr> = {
  "is-valid-ip": {
    prompt: "Écrivez is_valid_ip(s) : renvoyez True quand s est formé de quatre nombres entiers de 0 à 255 reliés par des points (comme 127.0.0.1), et False sinon.",
    tests: [
      "127.0.0.1 est valide",
      "0.0.0.0 est valide",
      "255.255.255.255 est valide",
      "256.0.0.1 est trop grand",
      "trois parties ne suffisent pas",
      "la chaîne vide n'est pas valide",
      "des mots ne sont pas des nombres",
    ],
  },
  "count-failed-logins": {
    prompt: "Écrivez count_failed_logins(lines) : à partir d'une liste de lignes de journal, renvoyez combien contiennent le mot FAILED.",
    tests: ["compte les lignes FAILED", "aucun échec", "une liste vide donne zéro", "tout a échoué"],
  },
  "greet-user": {
    prompt: "Écrivez greet(name, attempts) : renvoyez le texte « Hello NAME, you have N attempts left. » avec les deux valeurs à leur place. Utilisez une f-string.",
    tests: ["salue Ana avec 3", "salue root avec 0", "renvoie du texte, pas None"],
  },
  "count-hits": {
    prompt: "Écrivez count_hits(ips) : à partir d'une liste d'adresses IP, renvoyez un dict qui associe chaque adresse au nombre de fois où elle apparaît.",
    tests: ["compte les répétitions", "une adresse, trois fois", "une liste vide donne un dict vide", "chaque adresse est une clé"],
  },
  "classify-attempts": {
    prompt: "Écrivez classify(n) : renvoyez 'brute force' quand n vaut 5 ou plus, 'worth a look' quand n est supérieur à 1, et 'fine' sinon.",
    tests: [
      "9 tentatives, c'est de la force brute",
      "exactement 5, c'est de la force brute",
      "4 mérite un coup d'œil",
      "2 mérite un coup d'œil",
      "1 ne pose pas de problème",
      "0 ne pose pas de problème",
    ],
  },
  "is-weak-password": {
    prompt: "Écrivez is_weak(password) : renvoyez True quand le mot de passe fait moins de 12 caractères ou ne contient aucun chiffre, et False sinon.",
    tests: [
      "un mot de passe court est faible",
      "long mais sans chiffre, c'est faible",
      "long avec un chiffre, ce n'est pas faible",
      "exactement 12 avec un chiffre, ce n'est pas faible",
      "11 caractères, c'est faible",
      "le mot de passe vide est faible",
    ],
  },
  "parse-port": {
    prompt: "Écrivez parse_port(text) : renvoyez le port sous forme de nombre entier quand text est un nombre de 1 à 65535, et None pour tout le reste. int() lève une ValueError sur un texte qui n'est pas un nombre : interceptez-la.",
    tests: [
      "'22' devient 22",
      "'65535' est le port le plus élevé",
      "'ssh' n'est pas un nombre",
      "la chaîne vide n'est pas un nombre",
      "'0' est hors limites",
      "'70000' est hors limites",
    ],
  },
  "extract-ip": {
    prompt: "Écrivez extract_ip(line) : renvoyez la première adresse en forme d'IPv4 de la ligne (quatre groupes de chiffres reliés par des points), ou None quand il n'y en a pas. Utilisez le module re.",
    tests: [
      "trouve l'adresse dans une ligne sshd",
      "trouve une adresse en début de ligne",
      "renvoie la première des deux",
      "pas d'adresse donne None",
      "trois groupes ne font pas une adresse",
    ],
  },
  "failures-by-ip": {
    prompt: "Écrivez failures_by_ip(lines) : ne regardez que les lignes qui contiennent « Failed password ». Renvoyez deux choses, (counts, skipped) : counts est un dict qui associe chaque IP source (l'adresse après « from ») à son nombre d'échecs, et skipped est le nombre de lignes « Failed password » sans adresse lisible.",
    tests: [
      "compte les échecs par adresse",
      "ignore les lignes qui ne sont pas des échecs",
      "compte comme sauté un échec illisible",
      "entrée vide",
    ],
  },
  "json-report": {
    prompt: "Écrivez report(counts, skipped) : renvoyez une chaîne JSON pour un objet à deux clés : « top », une liste de paires [ip, compteur] rangées du compteur le plus élevé au plus bas, et « skipped », le nombre reçu.",
    tests: [
      "la sortie est du JSON valide avec les deux clés",
      "top est rangé par compteur, le plus élevé d'abord",
      "skipped est transmis tel quel",
      "la fonction renvoie une chaîne",
    ],
  },
  "mask-key": {
    prompt: "Écrivez mask_key(key) : renvoyez la clé avec chaque caractère remplacé par * sauf les quatre derniers. Une clé de quatre caractères ou moins est masquée entièrement.",
    tests: [
      "ne garde que les quatre derniers",
      "la longueur reste la même",
      "une clé de quatre caractères est entièrement masquée",
      "une clé de deux caractères est entièrement masquée",
      "la clé vide reste vide",
    ],
  },
  "backoff-delays": {
    prompt: "Écrivez backoff_delays(attempts) : renvoyez la liste des temps d'attente, en secondes, pour ce nombre de tentatives avec une attente exponentielle : 1, puis 2, puis 4, en doublant à chaque fois.",
    tests: ["cinq tentatives", "une tentative", "aucune tentative donne une liste vide", "huit tentatives finissent à 128"],
  },
  "cached-lookup": {
    prompt: "Écrivez lookup(ip, cache, fetch) : si ip est déjà une clé du dict cache, renvoyez la valeur rangée. Sinon appelez fetch(ip), rangez ce qu'il renvoie dans cache sous ip, et renvoyez-le.",
    tests: [
      "renvoie ce que fetch renvoie",
      "range la réponse dans le cache",
      "utilise le cache quand la réponse y est",
      "ne demande qu'une fois pour la même adresse",
      "redemande pour une autre adresse",
    ],
  },
  "sha256-hex": {
    prompt: "Écrivez sha256_hex(data) : à partir d'octets, renvoyez leur empreinte SHA-256 sous forme de 64 caractères hexadécimaux. Utilisez le module hashlib.",
    tests: ["l'empreinte de b'abc'", "l'empreinte d'aucun octet", "toujours 64 caractères", "un octet changé change l'empreinte"],
  },
  "read-score": {
    prompt: "Écrivez read_score(body) : body est le JSON analysé d'une réponse. Renvoyez body['data']['abuseConfidenceScore'] quand il est présent, et None quand body n'est pas un dict, n'a pas de dict 'data', ou n'a pas de note. La fonction ne doit jamais lever d'exception.",
    tests: [
      "lit la note",
      "une note de 0 reste une note",
      "pas de champ data donne None",
      "data sans note donne None",
      "data qui n'est pas un dict donne None",
      "un corps qui est une liste donne None",
    ],
  },
  "spot-the-bugs": {
    prompt: "parse_port(text) doit renvoyer le port sous forme de nombre entier pour '1' à '65535', et None pour tout le reste. Écrivez spots_bugs(parse_port) : vous recevez une version de cette fonction. Appelez-la sur les entrées de votre choix et renvoyez True si chaque réponse est juste, False dès qu'une réponse est fausse. Les tests vous donnent une version correcte et quatre versions boguées.",
    tests: [
      "accepte un parse_port correct",
      "repère une version qui accepte le port 0",
      "repère une version qui refuse le port 65535",
      "repère une version qui refuse le port 1",
      "repère une version qui renvoie 0 pour du texte",
    ],
  },
  "decode-enc": {
    prompt: "Écrivez decode_enc(b64) : à partir du texte qui suit -enc sur une ligne de commande PowerShell, renvoyez la commande qu'il cache. C'est du Base64 d'un texte en UTF-16LE. Utilisez le module base64.",
    tests: [
      "décode Get-Date",
      "décode une commande avec des espaces et des apostrophes",
      "le résultat ne contient plus aucun caractère nul",
      "une chaîne vide se décode en chaîne vide",
    ],
  },
  "ps-flags": {
    prompt: "Écrivez ps_flags(cmdline) : renvoyez la liste des signaux d'alerte trouvés sur une ligne de commande PowerShell, dans cet ordre : 'encoded' si elle contient -enc, 'hidden' si elle contient -w hidden, 'noprofile' si elle contient -nop. Ignorez les majuscules et les minuscules. Renvoyez une liste vide quand il n'y en a aucun.",
    tests: [
      "les trois signaux",
      "une commande ordinaire n'en a aucun",
      "les majuscules comptent aussi",
      "seulement le signal d'encodage",
      "la forme longue -EncodedCommand compte comme encodée",
    ],
  },
  "query-params": {
    prompt: "Écrivez query_params(url) : renvoyez un dict des paramètres de la chaîne de requête de l'URL, avec l'encodage en pourcentage décodé. Une URL sans chaîne de requête donne un dict vide. Utilisez urllib.parse : urlsplit(url).query donne la chaîne de requête, et parse_qsl la transforme en paires.",
    tests: [
      "deux paramètres",
      "%20 devient une espace",
      "pas de chaîne de requête donne un dict vide",
      "le fragment n'est pas un paramètre",
      "une barre oblique encodée est décodée",
    ],
  },
  "parse-request": {
    prompt: "Écrivez parse_request(text) : text est une requête HTTP brute dont les lignes sont séparées par \\n. Renvoyez (method, path, headers) : les deux premiers mots de la première ligne, et un dict des lignes d'en-tête jusqu'à la première ligne vide. Les noms d'en-tête passent en minuscules, et les valeurs perdent les espaces qui les entourent.",
    tests: [
      "lit la méthode",
      "lit le chemin, chaîne de requête comprise",
      "lit les en-têtes",
      "les noms d'en-tête sont en minuscules",
      "le corps n'est pas lu comme un en-tête",
      "une valeur peut contenir un deux-points",
    ],
  },
  "status-class": {
    prompt: "Écrivez status_class(code) : à partir d'un code d'état HTTP sous forme de nombre entier, renvoyez 'success' de 200 à 299, 'redirect' de 300 à 399, 'client error' de 400 à 499, 'server error' de 500 à 599, et 'other' pour tout le reste.",
    tests: [
      "200 est un succès",
      "201 est un succès",
      "302 est une redirection",
      "404 est une erreur du client",
      "429 est une erreur du client",
      "503 est une erreur du serveur",
      "599 reste une erreur du serveur",
      "100 et 600 sont autre chose",
    ],
  },
  "missing-cookie-flags": {
    prompt: "Écrivez missing_flags(set_cookie) : à partir de la valeur d'un en-tête Set-Cookie, renvoyez la liste des protections qui lui manquent, dans cet ordre : 'HttpOnly', 'Secure', 'SameSite'. Les attributs sont séparés par des points-virgules et peuvent être écrits en majuscules ou en minuscules. Un cookie qui a les trois donne une liste vide.",
    tests: [
      "un cookie entièrement protégé",
      "un cookie nu n'a aucun des trois",
      "seul Secure manque",
      "les attributs en minuscules comptent",
      "une valeur qui contient le mot secure n'est pas l'attribut",
    ],
  },
  "jwt-payload": {
    prompt: "Écrivez jwt_payload(token) : un JWT est fait de trois parties reliées par des points. Renvoyez la partie du milieu décodée en dict. C'est du Base64URL sans remplissage, donc ajoutez des caractères '=' jusqu'à ce que sa longueur soit un multiple de 4, puis utilisez base64.urlsafe_b64decode et json.loads.",
    tests: ["lit le sujet et le rôle", "fonctionne quand il faut du remplissage", "aucune clé n'a été nécessaire"],
  },
  "same-origin": {
    prompt: "Écrivez same_origin(a, b) : renvoyez True quand les deux URL ont le même schéma, le même hôte et le même port. Une URL sans port utilise 443 pour https et 80 pour http. urlsplit(url) donne .scheme, .hostname et .port (None quand aucun port n'est écrit).",
    tests: [
      "un chemin différent reste la même origine",
      "un schéma différent, non",
      "un hôte différent, non",
      "un port différent, non",
      "le port https par défaut est la même origine",
      "le port http par défaut est la même origine",
    ],
  },
  "users-with-role": {
    prompt: "Écrivez users_with_role(db, role) : renvoyez la liste des noms des utilisateurs qui ont ce rôle, par ordre alphabétique. Passez role en paramètre avec un ? à sa place : un test envoie un rôle qui tente de réécrire la requête.",
    tests: ["les deux utilisateurs ordinaires", "le seul administrateur", "un rôle que personne n'a donne une liste vide", "une tentative d'injection ne trouve personne"],
  },
  "orders-with-names": {
    prompt: "Écrivez orders_with_names(db) : renvoyez une paire (name, total) pour chaque commande, en joignant orders à users, triée du total le plus élevé au plus bas.",
    tests: ["des noms, pas des identifiants", "chaque commande, le total le plus élevé d'abord", "un utilisateur sans commande n'apparaît pas"],
  },
  "big-spenders": {
    prompt: "Écrivez big_spenders(db, minimum) : renvoyez (name, spent) pour chaque utilisateur dont les commandes dépassent minimum au total, où spent est la somme de ses totaux, le plus élevé d'abord. Utilisez GROUP BY et HAVING, et passez minimum en paramètre.",
    tests: ["plus de 50", "plus de 10 garde les deux acheteurs, le plus élevé d'abord", "plus de 100 ne garde personne", "exactement 40 n'est pas plus que 40"],
  },
  "hash-kind": {
    prompt: "Écrivez hash_kind(value) : renvoyez 'MD5' pour 32 caractères hexadécimaux, 'SHA-1' pour 40, 'SHA-256' pour 64, et 'unknown' pour tout le reste. Les caractères hexadécimaux sont 0-9 et a-f, en majuscules ou en minuscules.",
    tests: ["un MD5", "un SHA-1", "un SHA-256", "les majuscules restent de l'hexadécimal", "32 caractères qui ne sont pas de l'hexadécimal", "la mauvaise longueur"],
  },
  "matches-hash": {
    prompt: "Écrivez matches_hash(data, expected) : data est une suite d'octets et expected un SHA-256 écrit en hexadécimal. Renvoyez True quand l'empreinte de data est égale à expected. Ignorez les majuscules et les minuscules, ainsi que les espaces autour de expected.",
    tests: [
      "la bonne empreinte correspond",
      "une lettre changée ne correspond pas",
      "les majuscules correspondent aussi",
      "les espaces autour de l'empreinte sont ignorées",
      "une empreinte attendue vide ne correspond jamais",
    ],
  },
  "verify-hmac": {
    prompt: "Écrivez verify(key, message, tag) : key et message sont des octets, tag est un texte hexadécimal. Renvoyez True quand tag est le HMAC-SHA256 de message avec la clé key. Comparez avec hmac.compare_digest.",
    tests: [
      "un message authentique",
      "un message modifié avec l'ancien code",
      "le bon message avec la mauvaise clé",
      "un simple SHA-256 n'est pas un HMAC",
      "un code vide",
    ],
  },
  "dh-shared": {
    prompt: "Écrivez deux fonctions pour un échange Diffie-Hellman de base g et de module p. public_value(g, secret, p) renvoie le nombre qu'un côté envoie en clair. shared_secret(their_public, my_secret, p) renvoie le secret que ce côté calcule. Chacune est un seul appel à pow avec trois arguments.",
    tests: ["Ana envoie 8", "Bo envoie 19", "Ana calcule 2", "Bo calcule 2", "les deux côtés sont toujours d'accord"],
  },
  "cert-name-matches": {
    prompt: "Écrivez name_matches(host, pattern) : renvoyez True quand un nom de certificat couvre l'hôte. Un nom ordinaire doit être égal à l'hôte. Un nom qui commence par *. ne couvre l'hôte que si l'hôte est exactement un label suivi du reste du nom. Ignorez les majuscules et les minuscules.",
    tests: [
      "un nom exact",
      "un nom différent",
      "un joker couvre un label",
      "un joker ne couvre pas le domaine nu",
      "un joker ne couvre pas deux labels",
      "la casse est ignorée",
      "une fin ressemblante ne correspond pas",
    ],
  },
  "password-hash": {
    prompt: "Écrivez deux fonctions. hash_password(password, salt, iterations) renvoie le PBKDF2-HMAC-SHA256 du mot de passe sous forme de texte hexadécimal : password est du texte, encodez-le donc d'abord en octets, et salt est déjà en octets. verify_password(password, salt, iterations, stored) renvoie True quand hacher de nouveau le mot de passe donne stored. Comparez avec hmac.compare_digest.",
    tests: [
      "la valeur connue pour hunter2 avec salt-a",
      "un autre sel donne une autre empreinte",
      "plus d'itérations donnent une autre empreinte",
      "le bon mot de passe est accepté",
      "le mauvais mot de passe est refusé",
      "le bon mot de passe avec le mauvais sel est refusé",
    ],
  },
  "login-rate-limit": {
    prompt: "Écrivez allow_attempt(failures, now, limit, window) : failures est la liste des instants, en secondes, des échecs de connexion précédents d'un compte. Renvoyez True quand moins de limit d'entre eux ont eu lieu dans les window dernières secondes avant now, pour qu'une nouvelle tentative puisse avoir lieu.",
    tests: [
      "aucun échec pour l'instant",
      "quatre échecs récents, limite de cinq",
      "cinq échecs récents, limite de cinq",
      "les vieux échecs ne comptent plus",
      "un mélange d'anciens et de récents",
      "un échec vieux d'exactement une fenêtre a expiré",
    ],
  },
  "can-read-note": {
    prompt: "Écrivez can_read(user, note) : user est un dict avec 'id' et 'role', et note est un dict avec 'owner_id'. Renvoyez True quand l'utilisateur possède la note ou a le rôle 'admin'. Quand user vaut None, personne n'est connecté : renvoyez False.",
    tests: [
      "le propriétaire peut lire",
      "un autre utilisateur ne peut pas",
      "un administrateur peut lire toute note",
      "sans personne de connecté, non",
      "un rôle qui ressemble seulement à admin ne compte pas",
    ],
  },
  "extra-access": {
    prompt: "Écrivez extra_access(users, allowed) : users est une liste de dicts avec 'name', 'department' et 'groups'. allowed associe chaque service aux groupes que ses membres peuvent avoir. Renvoyez une liste de paires (name, group) pour chaque groupe qu'un utilisateur possède et que son service n'autorise pas, dans l'ordre où vous les rencontrez.",
    tests: [
      "une personne mutée qui a gardé l'ancien groupe",
      "un compte propre ne donne rien",
      "deux utilisateurs, constats dans l'ordre",
      "un service inconnu n'autorise rien",
      "pas d'utilisateur, pas de constat",
    ],
  },
  "stale-accounts": {
    prompt: "Écrivez stale_accounts(accounts, today, days) : accounts est une liste de dicts avec 'name' et 'last_login', une date sous la forme 'AAAA-MM-JJ' ou None si le compte ne s'est jamais connecté. today est une date sous la même forme. Renvoyez les noms dont la dernière connexion remonte à plus de days jours avant today, ou qui ne se sont jamais connectés. date.fromisoformat(texte) transforme le texte en date, et soustraire deux dates donne une valeur qui a un nombre .days.",
    tests: [
      "une vieille connexion est périmée",
      "une connexion récente ne l'est pas",
      "ne jamais s'être connecté compte comme périmé",
      "il y a exactement 90 jours, ce n'est pas plus de 90",
      "il y a 91 jours, si",
      "une liste mélangée garde son ordre",
    ],
  },
  "hotp-code": {
    prompt: "Écrivez hotp(secret, counter) : renvoyez le code à usage unique de six chiffres pour un secret (des octets) et un compteur (un nombre entier), sous forme de texte en gardant les zéros de tête. Le HMAC est calculé pour vous. Prenez les 4 derniers bits du condensat comme position, lisez 4 octets à partir de là comme un nombre gros-boutiste, effacez son bit de poids fort avec & 0x7fffffff, et gardez les six derniers chiffres décimaux.",
    tests: [
      "le premier code du secret de test de la RFC 4226",
      "le deuxième",
      "le troisième",
      "un zéro de tête est conservé",
      "un autre secret donne un autre code",
    ],
  },
  "pkce-challenge": {
    prompt: "Écrivez pkce_challenge(verifier) : renvoyez le défi PKCE (code challenge) d'un vérificateur donné sous forme de texte. C'est le SHA-256 du vérificateur, encodé avec base64.urlsafe_b64encode, sans le remplissage =, sous forme de texte.",
    tests: ["l'exemple de la RFC 7636", "un autre vérificateur", "il ne reste aucun remplissage", "toujours 43 caractères"],
  },
  "redirect-allowed": {
    prompt: "Écrivez redirect_allowed(uri, registered) : renvoyez True seulement quand uri est exactement l'une des adresses de la liste registered. Le code de départ accepte tout ce qui commence comme une adresse enregistrée, et les tests montrent pourquoi cela ne suffit pas.",
    tests: [
      "une adresse enregistrée",
      "la seconde adresse enregistrée",
      "un site inconnu",
      "un hôte plus long qui commence pareil",
      "du chemin en plus après l'adresse enregistrée",
      "la même adresse en http",
    ],
  },
  "id-token-problems": {
    prompt: "Écrivez id_token_problems(claims, issuer, client_id, now) : claims est la charge utile décodée d'un jeton d'identité, un dict avec 'iss', 'aud' et 'exp'. Renvoyez la liste de ce qui ne va pas, dans cet ordre : 'wrong issuer' si iss n'est pas issuer, 'wrong audience' si aud n'est pas client_id, 'expired' si exp n'est pas postérieur à now. Un bon jeton donne une liste vide.",
    tests: [
      "un bon jeton",
      "délivré à une autre application",
      "venu d'un autre fournisseur",
      "expiré",
      "expirer à la seconde même compte comme expiré",
      "tout est faux, dans l'ordre",
    ],
  },
  "parse-dn": {
    prompt: "Écrivez parse_dn(dn) : à partir d'un nom distinctif tel que 'CN=Ana Diaz,OU=Finance,OU=Staff,DC=corp,DC=lab', renvoyez un dict à trois clés : 'cn' est le nom commun, 'ous' est la liste des noms d'OU dans l'ordre écrit, et 'domain' est l'ensemble des parties DC reliées par des points. Les parties sont séparées par des virgules, et chaque partie est un type, un signe égal et une valeur.",
    tests: ["un utilisateur dans deux OU", "un objet sans OU", "un domaine en trois parties", "les types en minuscules sont acceptés"],
  },
  "risky-service-accounts": {
    prompt: "Écrivez risky_service_accounts(accounts, today, max_age) : accounts est une liste de dicts avec 'name', 'spn' (du texte, ou None quand le compte n'a pas de SPN), 'password_set' (une date sous la forme 'AAAA-MM-JJ') et 'groups'. Ne regardez que les comptes qui ont un SPN. Renvoyez une liste de paires (name, reason), dans l'ordre : reason vaut 'old password' quand le mot de passe a été défini plus de max_age jours avant today, et 'domain admin' quand 'Domain Admins' figure dans groups. Un compte peut donner les deux, 'old password' d'abord.",
    tests: [
      "la revue complète",
      "une personne sans SPN n'est pas un compte de service",
      "un mot de passe récent sans groupe puissant est propre",
      "une limite plus stricte en attrape davantage",
      "pas de compte, pas de constat",
    ],
  },
  "kerberoast-suspects": {
    prompt: "Écrivez kerberoast_suspects(events, threshold) : events est une liste d'événements 4769, chacun étant un dict avec 'user', 'service' et 'etype'. Comptez, pour chaque utilisateur, combien de services différents il a demandés avec l'etype '0x17'. Renvoyez la liste triée des utilisateurs dont le compte atteint au moins threshold.",
    tests: [
      "trois services différents en RC4",
      "le même service trois fois ne fait pas trois services",
      "les demandes en AES ne sont pas comptées",
      "un seuil de un liste tous ceux qui utilisent RC4, triés",
      "pas d'événement, pas de suspect",
    ],
  },
  "spray-suspects": {
    prompt: "Écrivez spray_suspects(failures, min_accounts) : failures est une liste d'échecs d'ouverture de session, chacun étant un dict avec 'source' et 'account'. Renvoyez un dict qui associe chaque source au nombre de comptes différents contre lesquels elle a échoué, en ne gardant que les sources où ce nombre atteint au moins min_accounts.",
    tests: [
      "une source, quatre comptes",
      "cinq échecs sur un seul compte ne font pas une pulvérisation",
      "un seuil de un garde les deux sources",
      "un seuil que personne n'atteint",
      "aucun échec",
    ],
  },
  "find-path": {
    prompt: "Écrivez find_path(edges, start, target) : edges est une liste de paires (départ, arrivée). Renvoyez un plus court chemin de start à target sous forme de liste de nœuds, start et target compris, ou None quand il n'y a pas de chemin. Les arêtes ne vont que dans un sens. Gardez une liste de chemins à prolonger et un ensemble de nœuds déjà vus, et prolongez toujours le chemin le plus ancien d'abord.",
    tests: [
      "le chemin de la leçon",
      "un utilisateur sans aucun accès",
      "les arêtes ne vont que dans un sens",
      "un nœud s'atteint lui-même",
      "la plus courte de deux routes a quatre nœuds",
      "une boucle ne bloque pas la recherche",
    ],
  },
  "choke-points": {
    prompt: "Écrivez choke_points(edges, start, target) : renvoyez la liste des arêtes, dans leur ordre d'origine, dont le seul retrait ne laisse aucun chemin de start à target. Un find_path qui fonctionne est fourni. S'il n'y a pas de chemin au départ, renvoyez une liste vide.",
    tests: [
      "sur une chaîne unique, chaque arête du chemin en est une",
      "avec deux routes, seule l'arête commune en est une",
      "les arêtes hors du chemin ne sont jamais listées",
      "pas de chemin au départ ne donne rien",
    ],
  },
  "access-decision": {
    prompt: "Écrivez decide(signin) : signin est un dict avec 'is_admin', 'compliant_device' et 'mfa_done' (chacun True ou False) et 'risk' ('low', 'medium' ou 'high'). Appliquez ces règles dans l'ordre et renvoyez la première qui convient : 'block' quand risk vaut 'high' ; 'block' quand un administrateur est sur un appareil non conforme ; 'require mfa' quand la MFA n'a pas été faite ; sinon 'allow'.",
    tests: [
      "une connexion ordinaire avec la MFA faite",
      "la MFA pas encore faite",
      "un risque élevé est bloqué même avec la MFA",
      "un administrateur sur un appareil non géré est bloqué",
      "un utilisateur sur un appareil non géré reçoit seulement une demande de MFA",
      "un administrateur sur un appareil conforme avec la MFA est autorisé",
    ],
  },
  "server-side-price": {
    prompt: "Écrivez order_total(cart, catalog) : cart est ce que le navigateur a envoyé, une liste de dicts avec 'item', 'quantity' et 'price'. catalog est le dict du serveur, qui associe chaque article à son prix. Renvoyez le total en n'utilisant que les prix du catalogue. Renvoyez None quand un article n'est pas dans le catalogue. Le code de départ fait confiance au prix envoyé par le navigateur.",
    tests: [
      "un panier honnête",
      "un ordinateur envoyé avec un prix de 1",
      "un prix négatif est ignoré lui aussi",
      "un article que la boutique ne vend pas",
      "un panier vide ne coûte rien",
    ],
  },
  "valid-quantity": {
    prompt: "Écrivez valid_quantity(text) : text est ce qui est arrivé dans un champ de formulaire. Renvoyez la quantité sous forme de nombre entier quand text n'est fait que des chiffres 0 à 9 et que sa valeur va de 1 à 99. Renvoyez None pour tout le reste. Utilisez text.isascii() et text.isdigit() ensemble : isdigit seul accepte aussi des caractères comme '²'.",
    tests: [
      "une quantité ordinaire",
      "la plus grande autorisée",
      "zéro est refusé",
      "cent est refusé",
      "un nombre négatif est refusé",
      "du texte est refusé",
      "le champ vide est refusé",
      "un deux en exposant est refusé, sans erreur",
      "les espaces sont refusées",
    ],
  },
  "sequential-ids": {
    prompt: "Écrivez longest_run(paths) : paths est la liste des chemins qu'un utilisateur a demandés, dans l'ordre, comme '/invoices/1043'. Renvoyez la longueur de la plus longue série de requêtes où chaque numéro vaut exactement un de plus que le précédent. Une seule requête est une série de 1, et une liste vide donne 0. Le numéro est la dernière partie du chemin.",
    tests: ["cinq à la suite", "une navigation ordinaire", "une série au milieu", "la même facture deux fois n'est pas une série", "une seule requête", "aucune requête"],
  },
  "escape-html": {
    prompt: "Écrivez escape_html(text) : renvoyez le texte avec les cinq caractères spéciaux du HTML remplacés : & par &amp;, < par &lt;, > par &gt;, \" par &quot; et ' par &#x27;. Remplacez & en premier, sinon vous encoderez les esperluettes que vous venez d'écrire.",
    tests: [
      "les balises deviennent du texte",
      "une esperluette",
      "des guillemets doubles",
      "une apostrophe",
      "les esperluettes ne sont pas encodées deux fois",
      "un texte simple est inchangé",
      "le même résultat que la bibliothèque standard",
    ],
  },
  "safe-filename": {
    prompt: "Écrivez safe_filename(name) : renvoyez True seulement quand name fait de 1 à 100 caractères, n'utilise que des lettres ASCII, des chiffres, des points, des tirets et des tirets bas, et ne commence ni par un point ni par un tiret. Tout le reste est refusé.",
    tests: [
      "un nom ordinaire",
      "une barre oblique est refusée",
      "un dossier parent est refusé",
      "un nom qui commence par un tiret est refusé",
      "un fichier caché est refusé",
      "une espace est refusée",
      "un point-virgule est refusé",
      "le nom vide est refusé",
      "101 caractères, c'est trop long",
      "une lettre accentuée est refusée",
    ],
  },
  "safe-path": {
    prompt: "Écrivez safe_path(base, name) : joignez name au dossier base et nettoyez le résultat avec posixpath.normpath, qui résout les parties '..'. Renvoyez le chemin nettoyé quand il est à l'intérieur de base, et None sinon. À l'intérieur veut dire qu'il commence par base suivi d'une barre oblique. base est un chemin absolu sans barre oblique finale.",
    tests: [
      "un simple fichier",
      "un sous-dossier",
      "des points qui restent à l'intérieur sont nettoyés",
      "sortir du dossier est refusé",
      "un chemin absolu est refusé",
      "un voisin dont le nom commence pareil est refusé",
      "le dossier lui-même n'est pas un fichier qu'il contient",
    ],
  },
  "authorize-request": {
    prompt: "Écrivez authorize(user, action, record) : user vaut None quand personne n'est connecté, sinon c'est un dict avec 'id' et 'role' ('customer' ou 'admin'). action vaut 'read', 'update' ou 'export'. record est un dict avec 'owner_id', ou None pour les actions qui ne portent sur aucun enregistrement précis. Renvoyez 401 quand personne n'est connecté. Un administrateur reçoit 200 pour tout. Un client reçoit 200 pour 'read' et 'update' sur un enregistrement qui lui appartient, et 403 pour tout le reste. Tout autre rôle reçoit 403.",
    tests: [
      "personne n'est connecté",
      "un client lit sa propre facture",
      "un client lit la facture d'un autre client",
      "un client modifie son propre enregistrement",
      "un client appelle l'export",
      "un administrateur appelle l'export",
      "un administrateur lit n'importe quelle facture",
      "une action que personne n'a définie est refusée",
      "un rôle que personne n'a défini est refusé",
    ],
  },
  "csrf-check": {
    prompt: "Écrivez csrf_ok(session_token, form_token) : renvoyez True seulement quand les deux sont des textes non vides et qu'ils sont égaux. L'un ou l'autre peut valoir None quand il manque. Comparez avec hmac.compare_digest.",
    tests: [
      "des jetons identiques",
      "un mauvais jeton",
      "le formulaire n'a envoyé aucun jeton",
      "aucun jeton des deux côtés n'est pas une correspondance",
      "deux jetons vides ne sont pas une correspondance",
    ],
  },
  "allowed-fields": {
    prompt: "Écrivez allowed_fields(data, allowed) : data est le dict qu'un client a envoyé, et allowed est la liste des noms de champs qu'un client peut définir. Renvoyez un nouveau dict qui ne contient que les champs autorisés présents dans data. Ne modifiez pas data.",
    tests: [
      "les champs ordinaires passent",
      "un champ role en trop est écarté",
      "plusieurs champs en trop sont écartés",
      "rien d'envoyé, rien d'enregistré",
      "le dict d'origine reste intact",
    ],
  },
  "access-failures": {
    prompt: "Écrivez access_failures(expected, actual) : les deux sont des dicts qui associent une paire (action, rôle) à un code d'état. expected est le tableau que vous avez conçu, et actual est ce que l'application a répondu. Renvoyez la liste triée des paires où actual diffère de expected ou n'a aucune réponse.",
    tests: [
      "une application conforme au tableau",
      "un IDOR apparaît comme une seule case en échec",
      "deux échecs reviennent triés",
      "une case jamais testée compte comme un échec",
    ],
  },
  "token-bucket": {
    prompt: "Écrivez allow(bucket, now, rate, capacity) : bucket est un dict avec 'tokens' (un nombre) et 'time' (le moment de sa dernière mise à jour, en secondes). Ajoutez d'abord (now - bucket['time']) * rate jetons, sans dépasser capacity, et mettez bucket['time'] à now. Ensuite, s'il y a au moins 1 jeton, retirez-en un et renvoyez True. Sinon renvoyez False. Le seau est modifié sur place.",
    tests: [
      "un seau plein laisse passer une requête",
      "une rafale de cinq passe et la sixième est refusée",
      "après deux secondes, deux requêtes de plus passent",
      "une longue attente ne remplit jamais au-delà de la capacité",
      "un demi-jeton ne suffit pas",
      "le seau se souvient du moment de sa mise à jour",
    ],
  },
  "clamp-limit": {
    prompt: "Écrivez clamp_limit(text, default, maximum) : text est la valeur d'un paramètre ?limit=, ou None quand il n'a pas été envoyé. Renvoyez default quand text vaut None, n'est pas fait seulement des chiffres 0 à 9, ou vaut 0. Renvoyez maximum quand le nombre dépasse maximum. Sinon renvoyez le nombre.",
    tests: [
      "une valeur ordinaire",
      "non envoyé donne la valeur par défaut",
      "une valeur énorme est ramenée au maximum",
      "exactement le maximum est gardé",
      "zéro donne la valeur par défaut",
      "un nombre négatif donne la valeur par défaut",
      "du texte donne la valeur par défaut",
      "la valeur vide donne la valeur par défaut",
    ],
  },
  "file-kind": {
    prompt: "Écrivez file_kind(data) : data contient les premiers octets d'un fichier envoyé. Renvoyez 'png' quand il commence par b'\\x89PNG\\r\\n\\x1a\\n', 'jpeg' pour b'\\xff\\xd8\\xff', 'gif' pour b'GIF87a' ou b'GIF89a', 'pdf' pour b'%PDF-', et 'unknown' pour tout le reste. data.startswith(préfixe) fonctionne sur des octets.",
    tests: [
      "un PNG",
      "un JPEG",
      "un GIF",
      "un GIF plus ancien",
      "un PDF",
      "un script n'est pas une image",
      "les lettres PNG seules ne suffisent pas",
      "un fichier vide",
    ],
  },
  "public-address": {
    prompt: "Écrivez is_public_address(text) : renvoyez True quand text est une adresse IP qu'un serveur peut interroger sans risque : ni privée, ni de bouclage, ni de lien local. Renvoyez False pour celles-là, et pour un texte qui n'est pas du tout une adresse IP. ipaddress.ip_address(text) lève ValueError sur un mauvais texte, et le résultat a .is_private, .is_loopback et .is_link_local.",
    tests: [
      "une adresse publique",
      "une adresse privée en 10.x",
      "une adresse privée en 192.168.x",
      "une adresse privée en 172.16.x",
      "le serveur lui-même",
      "l'adresse des métadonnées du cloud",
      "la boucle locale en IPv6",
      "un nom n'est pas une adresse",
      "le texte vide",
    ],
  },
  "parse-order": {
    prompt: "Écrivez parse_order(body) : body est le texte d'une requête. Renvoyez la commande sous forme de dict quand body est le JSON d'un objet qui a exactement deux clés, 'item' (du texte, non vide) et 'quantity' (un nombre entier de 1 à 99, et ni True ni False). Renvoyez None pour tout le reste, et ne levez jamais d'exception. json.loads lève ValueError sur du mauvais JSON.",
    tests: [
      "une commande correcte",
      "du mauvais JSON",
      "une liste n'est pas une commande",
      "un champ en trop est refusé",
      "un champ manquant est refusé",
      "une quantité envoyée sous forme de texte est refusée",
      "une quantité qui vaut true est refusée",
      "une quantité hors limites est refusée",
      "un article vide est refusé",
    ],
  },
};
