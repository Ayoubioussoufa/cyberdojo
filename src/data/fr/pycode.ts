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
};
