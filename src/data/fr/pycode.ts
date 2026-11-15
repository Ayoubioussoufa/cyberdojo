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
};
