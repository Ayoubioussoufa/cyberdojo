---
title: Stocker les mots de passe et construire l'application
summary: Sels, hachages lents et Argon2id, puis une petite application de connexion construite correctement, et l'audit d'une autre écrite par une IA.
builds: l'application de référence de P05, avec une connexion sûre et vérifiée
source: Aide-mémoire de l'OWASP sur le stockage des mots de passe (en anglais) | https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
words: sel, Argon2id, bourrage d'identifiants
---
Les bases de données se font voler. Quand la vôtre le sera, ce qui se trouve dans la colonne des mots de passe décidera si c'est une mauvaise journée ou une catastrophe. Cette leçon clôt la phase 1 : vous allez construire l'application que vous testerez et corrigerez au mois 8.

@term sel = Une donnée aléatoire ajoutée à chaque mot de passe avant le hachage, pour que des mots de passe identiques donnent des empreintes différentes.
@term Argon2id = L'algorithme recommandé pour hacher les mots de passe : volontairement lent et gourmand en mémoire.
@term bcrypt = Un hachage de mots de passe plus ancien, encore acceptable, volontairement lent.
@term facteur de coût = Un réglage qui rend un hachage de mot de passe plus lent à calculer.
@term table arc-en-ciel = Une table d'empreintes précalculées, utilisée pour les inverser.
@term bourrage d'identifiants = Essayer sur d'autres sites des couples identifiant et mot de passe volés sur un site.
@term pulvérisation de mots de passe = Essayer quelques mots de passe courants sur de nombreux comptes.

## Pourquoi un simple hachage échoue

Depuis la leçon 38 : une empreinte ne peut pas être inversée, mais elle peut être devinée. Une carte graphique calcule des milliards d'empreintes SHA-256 par seconde. La plupart des mots de passe humains tombent vite.

Deux défenses :

**Le sel.** Ajoutez une valeur aléatoire par utilisateur avant de hacher. Deux personnes qui ont le même mot de passe obtiennent des empreintes différentes, et les **tables arc-en-ciel** précalculées deviennent inutiles. Le sel n'est pas secret : il est rangé à côté de l'empreinte.

**La lenteur.** Utilisez une fonction conçue pour coûter cher. Si chaque essai coûte 100 ms et beaucoup de mémoire, les milliards par seconde d'un attaquant deviennent une poignée.

@flow Mot de passe > Ajouter un sel aléatoire > Hachage lent : Argon2id > Stocker le sel et l'empreinte

Mesurez sur votre propre machine la différence entre un hachage rapide et un hachage lent. PBKDF2 est dans la bibliothèque standard de Python, et il fonctionne en répétant un hachage un nombre de fois fixé :

```python
import hashlib, time

start = time.perf_counter()
hashlib.sha256(b"hunter2").hexdigest()
print("sha256:", time.perf_counter() - start)

start = time.perf_counter()
hashlib.pbkdf2_hmac("sha256", b"hunter2", b"per-user-salt", 600_000)
print("pbkdf2:", time.perf_counter() - start)
```

Le premier prend quelques millionièmes de seconde et le second une fraction de seconde perceptible, des dizaines de milliers de fois plus. Un utilisateur attend ce temps une fois par connexion et ne le remarque jamais. Un attaquant qui a volé la table le paie à chaque essai, pour chaque utilisateur.

Voyez maintenant ce que fait le sel. Le même mot de passe, haché avec deux sels différents :

```
salt-a   f681163bbdaa9270a5c685ee22d3be6c24577bcccc63df0f10b2b67f465ff9d4
salt-b   26f91e2a1e5652c5ee66799bfe41d6c3c5d6dc95eafb1068e8582801e205ee3e
```

Rien dans les valeurs stockées ne révèle que les deux utilisateurs ont choisi le même mot de passe, et un essai doit être recalculé séparément pour chacun d'eux. Écrivez les deux fonctions que tout système de connexion a en son centre. Les tests utilisent un petit nombre d'itérations pour s'exécuter vite : les vrais systèmes utilisent les nombres du tableau ci-dessous.

@code password-hash

?? Pourquoi une simple empreinte SHA-256 du mot de passe ne suffit-elle pas ?
+ Deviner coûte peu, à des milliards par seconde
- SHA-256 peut être inversé à l'aide d'une clé
- Les empreintes deviennent toujours trop longues à stocker
- Hacher deux fois un même secret est impossible
=> Une empreinte ne peut pas être défaite, mais elle peut être devinée à une vitesse énorme. Le sel et la lenteur sont la réponse.

## Quoi utiliser

L'[aide-mémoire de l'OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) (en anglais) dit :

| Algorithme | Recommandation |
|---|---|
| **Argon2id** | Premier choix. Au minimum 19 Mio de mémoire, 2 itérations, 1 degré de parallélisme |
| **scrypt** | Au minimum N=2^17, r=8, p=1 |
| **bcrypt** | Pour les systèmes anciens. Facteur de coût d'au moins 10. La plupart des implémentations s'arrêtent à 72 octets d'entrée |
| **PBKDF2** | Quand la conformité FIPS l'exige. 600 000 itérations avec HMAC-SHA256 |

```python
from argon2 import PasswordHasher

ph = PasswordHasher()
stored = ph.hash("correct horse battery staple")   # le sel est inclus
ph.verify(stored, "correct horse battery staple")  # lève une exception si c'est faux
```

Installez-la avec `pip install argon2-cffi`. La valeur de `stored` est une seule chaîne qui transporte tout ce qu'il faut pour vérifier un mot de passe plus tard :

```
$argon2id$v=19$m=65536,t=3,p=4$c2FsdHNhbHRzYWx0c2FsdA$Zk3J1x…
```

| Partie | Signification |
|---|---|
| `argon2id` | L'algorithme |
| `v=19` | La version de l'algorithme |
| `m=65536` | Le coût en mémoire, en Kio : 64 Mio pour chaque empreinte |
| `t=3` | Le coût en temps : trois passes sur cette mémoire |
| `p=4` | Le parallélisme : quatre voies |
| La partie suivante | Le sel, en Base64 |
| La dernière partie | L'empreinte elle-même |

Puisque les réglages voyagent avec chaque empreinte, vous pouvez les augmenter plus tard sans casser les anciens comptes : `ph.check_needs_rehash(stored)` vous dit à la connexion qu'une empreinte stockée utilise des réglages plus faibles que ceux d'aujourd'hui, et c'est le moment de hacher de nouveau le mot de passe. Une valeur bcrypt reprend la même idée sous une forme plus courte, `$2b$12$…`, où 12 est le facteur de coût. Reconnaître ces préfixes compte quand vous examinez une base : une colonne de 32 ou 64 caractères hexadécimaux sans préfixe est un simple hachage rapide.

Les bonnes bibliothèques gèrent le sel à votre place. Vérifiez dans l'aide-mémoire que vous utilisez des réglages par défaut récents.

?? Deux utilisateurs ont le même mot de passe. Avec un hachage salé, qu'est-ce qui est stocké ?
+ Deux empreintes différentes, grâce à leurs sels
- Une empreinte partagée par ces deux utilisateurs
- Le mot de passe chiffré par utilisateur
- Deux empreintes identiques avec deux noms différents
=> Le sel aléatoire de chaque utilisateur change l'entrée du hachage. Cela empêche un attaquant de casser tout le monde d'un coup.

?? Pourquoi un hachage *lent* est-il une bonne chose ici ?
+ Chaque essai coûte bien plus cher à l'attaquant
- Cela laisse aux utilisateurs le temps de retaper
- Cela empêche les bases d'être volées un jour
- Cela rend le sel plus difficile à lire
=> Une connexion normale le fait une fois, et un attaquant a besoin de milliards d'essais. La lenteur ne gêne que l'attaquant.

## Des réglages sûrs par défaut pour l'application

Vous en aurez besoin pendant la construction :

- **Mots de passe :** Argon2id ou bcrypt.
- **Requêtes :** toujours paramétrées.
- **Cookies :** `HttpOnly`, `Secure`, `SameSite`.
- **Sessions :** nouvel identifiant à la connexion, expiration, vraie déconnexion.
- **Autorisation :** vérifier la propriété **sur le serveur, à chaque requête**.
- **Erreurs :** génériques pour les utilisateurs (« identifiant ou mot de passe invalide »), détaillées dans vos journaux.
- **Limitation de débit** sur la connexion, pour ralentir le **bourrage d'identifiants** et la **pulvérisation de mots de passe**.

Voici à quoi ressemblent ces lignes dans un gestionnaire de connexion. C'est du Flask, mais la forme est la même dans n'importe quel framework :

```python
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

ph = PasswordHasher()
app.config.update(SESSION_COOKIE_HTTPONLY=True, SESSION_COOKIE_SECURE=True, SESSION_COOKIE_SAMESITE="Lax")

@app.post("/login")
def login():
    name = request.form["username"]
    row = db.execute("SELECT id, pw_hash FROM users WHERE name = %s", (name,)).fetchone()
    try:
        if row is None:
            raise VerifyMismatchError
        ph.verify(row.pw_hash, request.form["password"])
    except VerifyMismatchError:
        log.warning("failed login for %s from %s", name, request.remote_addr)
        return "Invalid username or password", 401
    session.clear()
    session["user_id"] = row.id
    return redirect("/notes")
```

Lisez-le en regard de la liste. La requête est paramétrée. Le mot de passe est vérifié par la bibliothèque, jamais comparé à la main. Un utilisateur inconnu et un mauvais mot de passe suivent le même chemin et donnent le même message, tandis que le journal garde le détail. `session.clear()` jette la session qui existait avant la connexion, donc l'utilisateur repart avec une session neuve. Les attributs du cookie sont réglés une fois pour toute l'application.

Deux pièces ne sont pas dans ce gestionnaire, et les deux sont assez petites pour être écrites maintenant. La première est la limitation de débit.

@code login-rate-limit

La seconde est le contrôle qui manque le plus souvent dans les vraies applications. Se connecter prouve qui vous êtes. Cela ne décide pas de ce que vous pouvez ouvrir, et chaque route qui renvoie une note doit poser cette question elle-même.

@code can-read-note

Ce que vous demandez aux utilisateurs compte aussi. Le [NIST SP 800-63B](https://pages.nist.gov/800-63-4/sp800-63b.html) (en anglais) a changé les anciens conseils : autoriser les mots de passe longs et les gestionnaires de mots de passe, comparer les nouveaux mots de passe à des listes de mots de passe compromis, et ne pas imposer de changement tous les quelques mois, car cela ne produit que `Summer2026!` suivi de `Autumn2026!`.

::: try Construisez la base de P05
Une petite application de notes avec inscription, connexion, rôles et notes appartenant à un utilisateur. Utilisez Flask, Express ou Next.js avec PostgreSQL. Voir le [projet P05](/projects/P05/). Rédigez une courte note de conception sur la raison de chaque choix.

**Vérifiez, ne supposez pas.** Inspectez l'empreinte stockée dans `psql`. Vérifiez l'en-tête `Set-Cookie` dans les outils de développement. Essayez de lire la note d'un autre utilisateur en changeant un identifiant.
:::

::: ai Exercice de la feuille de route : auditer une connexion écrite par une IA
Demandez à un LLM de générer une implémentation de connexion. Auditez-la ligne par ligne avec les aide-mémoire de l'OWASP sur le stockage des mots de passe, la gestion des sessions et l'authentification. Listez chaque défaut et comparez avec la vôtre. Attendez-vous à des limitations de débit absentes et à des réglages par défaut faibles.
:::

?? Pourquoi dire « identifiant ou mot de passe invalide » plutôt que lequel des deux a échoué ?
+ Cela ne révèle pas quels noms d'utilisateur existent
- Cela accélère nettement la page de connexion elle-même
- Cela empêche toute devinette de mot de passe
- C'est une exigence stricte du protocole HTTP lui-même
=> Une erreur précise permet à un attaquant de lister les comptes valides. Gardez le détail dans vos journaux.

## Relire un système de connexion

On vous confie l'application de quelqu'un d'autre à relire. Voici trois choses que vous trouvez :

```
id | name | password
1  | ana  | 5f4dcc3b5aa765d61d8327deb882cf99
2  | sam  | 5f4dcc3b5aa765d61d8327deb882cf99
```

?? Que vous apprend cette table ?
+ Un hachage rapide sans sel, même mot de passe
- Un hachage lent et salé, les deux bien protégés
- Une colonne chiffrée, dont la clé est rangée ailleurs
- Une table de sessions, les deux utilisateurs étant connectés
=> 32 caractères hexadécimaux sans préfixe, c'est MD5, et deux valeurs identiques signifient qu'il n'y a pas de sel. Celle-ci est l'empreinte de `password`, ce que n'importe quel moteur de recherche vous dira.

?? Une valeur stockée commence par `$argon2id$v=19$m=65536,t=3,p=4$`. Que représente `m=65536` ?
+ La mémoire qu'exige chaque empreinte, en Kio
- Le nombre d'utilisateurs présents dans la table
- La longueur maximale d'un mot de passe
- Le port sur lequel écoute la base
=> 65536 Kio font 64 Mio. Avoir besoin d'autant de mémoire par essai est ce qui empêche les attaquants de lancer des millions d'essais côte à côte sur des cartes graphiques.

?? Connecté sous le compte sam, vous demandez `/notes/7` et recevez une note qui appartient à ana. Que manque-t-il ?
+ Un contrôle de propriété sur le serveur
- Un mot de passe bien plus long
- Un attribut `Secure` posé sur le cookie
- Un hachage de mots de passe ralenti
=> La connexion a fonctionné comme prévu. La route a renvoyé une note sans demander si cet utilisateur a le droit de la lire, ce qui est le défaut grave le plus courant dans les applications web.

## Le point d'étape de la phase 1

Vous avez atteint la fin de la phase Fondations. Le livrable du mois 6 :

- L'application utilise Argon2id ou bcrypt, des requêtes paramétrées et des cookies sûrs : vérifié, pas supposé.
- Vous savez expliquer la poignée de main TLS 1.3 et ce que prouve une chaîne de certificats.
- CryptoHack ≥ 30, et les jointures et agrégats SQL sans rien chercher.
- Auto-évaluation des fondations ≥ 80 %, avec les lacunes planifiées dans les jours de réserve.

::: tip Fenêtre de certification
Si les employeurs que vous visez filtrent sur un certificat de base, les mois 6 à 8 sont le moment pour Security+. Consultez d'abord [le guide des certifications](/guides/g1-certifications/), et passez votre chemin si votre marché ne le demande pas.
:::

Utilisez [la page de révision](/review/) comme auto-évaluation de 50 questions. Notez-vous de nouveau sur la [matrice de compétences](/skills/).

?! Un développeur dit « nous hachons les mots de passe avec SHA-256, donc tout va bien ». Rédigez votre réponse : qu'est-ce qui ne va pas, et que devrait-il faire exactement ?

### Pour aller plus loin

Les sources primaires et le meilleur matériel gratuit sur ce sujet, tous vérifiés en novembre 2026 (en anglais) :

- [NIST SP 800-63B : les règles d'authentification et de mots de passe](https://pages.nist.gov/800-63-4/sp800-63b.html)
- [RFC 9106 : Argon2](https://www.rfc-editor.org/rfc/rfc9106)
