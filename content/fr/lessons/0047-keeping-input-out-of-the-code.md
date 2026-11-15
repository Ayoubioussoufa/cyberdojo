---
title: Garder les entrées hors du code
summary: Pourquoi l'injection se produit, et les correctifs qui y mettent fin : requêtes paramétrées, encodage en sortie, Content Security Policy, et traitement sûr des fichiers et des commandes.
builds: corriger la famille des injections, et expliquer chaque correctif à un développeur
source: Série d'aide-mémoire de l'OWASP (en anglais) | https://cheatsheetseries.owasp.org/
words: injection, requête paramétrée, encodage en sortie
---
L'injection est une seule idée sous de nombreux déguisements : **une donnée est traitée comme du code**. Apprenez l'idée une fois, et chaque faille de cette famille, et chaque correctif, prennent sens.

@term injection = Une faille où une entrée est traitée comme une partie d'une commande ou d'un code.
@term encodage en sortie = Convertir des caractères pour qu'un navigateur les traite comme du texte, pas comme du code.
@term CSP (Content Security Policy) = Un en-tête du navigateur qui limite d'où une page peut charger et exécuter du code.
@term injection de commande = Une entrée qui devient une partie d'une commande du système d'exploitation.
@term traversée de chemin = Une entrée qui atteint des fichiers hors du dossier prévu.
@term liste d'autorisation = Une liste de ce qui est permis, tout le reste étant refusé.

## Une seule cause profonde

Pensez à une lettre type : « Cher ___, votre solde est de ___. » Si quelqu'un écrit une phrase entière dans le blanc, et que l'imprimante la traite comme une partie du modèle, la lettre dit quelque chose que vous n'avez jamais écrit.

Un logiciel fait cela chaque fois qu'il colle un texte d'utilisateur dans quelque chose qui est ensuite interprété : une requête, une page web, une commande shell.

@flow Votre code + entrée de l'utilisateur > Une seule chaîne > L'interpréteur exécute tout comme du code

Le correctif garde les deux séparés, quel que soit le contenu de l'entrée :

@flow Votre code > Entrée envoyée séparément > L'interpréteur traite l'entrée comme une donnée

| Ce qui est interprété | La faille | Le correctif |
|---|---|---|
| Une requête SQL | Injection SQL | Requêtes paramétrées |
| Une page web | Cross-site scripting | Encodage en sortie |
| Une commande shell | Injection de commande | Éviter le shell, et passer les arguments séparément |
| Un chemin de fichier | Traversée de chemin | Liste d'autorisation, puis contrôle du chemin résolu |

Chaque correctif fait la même chose : il garde les données dans une voie séparée de celle du code.

?? Qu'ont en commun l'injection SQL, le XSS et l'injection de commande ?
+ Une entrée est mêlée à quelque chose d'interprété
- Elles ne touchent que d'anciennes versions de Windows
- Elles exigent toutes un attaquant déjà bien authentifié
- Toutes trois se corrigent en cachant les erreurs
=> Des cibles différentes, la même erreur. C'est pourquoi le correctif consiste toujours à séparer le code et les données.

## SQL : les paramètres

Au mois 6, vous avez vu comment fonctionnent les requêtes. Voici l'erreur et le correctif.

```python
# Dangereux : la valeur devient une partie du texte SQL
cur.execute(f"SELECT * FROM users WHERE email = '{email}'")

# Sûr : le SQL est fixe, et la valeur voyage séparément
cur.execute("SELECT * FROM users WHERE email = %s", (email,))
```

Dans la version sûre, la base reçoit d'abord la structure de la requête, et la valeur ensuite comme une simple donnée. Quoi qu'ait tapé l'utilisateur, ce ne peut être qu'une valeur. Cela ne peut pas changer la structure. Un **ORM** le fait en général à votre place, sauf si quelqu'un construit du SQL brut à la main. Donnez aussi au compte de base de données de l'application les seuls droits dont elle a besoin, pour qu'une faille qui passerait à travers puisse faire moins de dégâts.

Vous avez observé cette différence vous-même dans la leçon sur SQL : la même entrée étrange renvoyait toutes les lignes avec la première forme et rien avec la seconde. Deux détails piègent ceux qui savent déjà cela.

**Les paramètres portent des valeurs, pas des noms.** Un marqueur peut tenir lieu de `'ana@corp.example'` ou de `42`. Il ne peut pas tenir lieu d'une table ou d'une colonne, donc « trier selon la colonne sur laquelle l'utilisateur a cliqué » ne peut pas être paramétré. Le schéma sûr consiste à traduire l'entrée au moyen d'une liste fixe que vous avez écrite, pour que le texte qui atteint la requête vienne toujours de votre code :

```python
SORT_COLUMNS = {"name": "name", "newest": "created_at", "total": "total"}

column = SORT_COLUMNS.get(request.args.get("sort"), "name")
cur.execute(f"SELECT name, total FROM orders ORDER BY {column}")
```

Quoi qu'il arrive, la requête ne peut contenir que l'une des trois chaînes que vous avez choisies. Tout ce qui est inattendu devient discrètement la valeur par défaut.

**Une donnée stockée reste une entrée.** Une valeur enregistrée sans risque la semaine dernière n'est pas sûre à coller dans une nouvelle requête aujourd'hui. Utilisez des paramètres chaque fois qu'une valeur rencontre du SQL, d'où qu'elle vienne.

?? Un développeur dit « j'ai retiré tous les guillemets, donc la requête est sûre ». Que répondez-vous ?
+ Le filtrage est fragile, utilisez plutôt des paramètres
- C'est exact, les guillemets sont le seul risque
- Ajoutez un second filtre qui retire les espaces
- Seul le formulaire de connexion mérite cette protection
=> Les filtres essaient de deviner chaque entrée dangereuse, et l'histoire montre qu'ils en manquent. Les paramètres suppriment le problème par conception.

## XSS : l'encodage en sortie

Le XSS est une injection dans une page. Si un commentaire est stocké puis montré à d'autres sans précaution, un navigateur peut le traiter comme du code, exécuté avec la session de la victime.

Le correctif a lieu **en sortie**, dans le contexte où la donnée arrive.

```html
<!-- Encodé par le gabarit, donc le navigateur l'affiche comme du texte -->
<p>{{ comment }}</p>
```

Les gabarits modernes comme Jinja2, et les frameworks comme React, encodent par défaut. Le danger revient quand quelqu'un désactive cela, avec des fonctions comme `|safe` ou `dangerouslySetInnerHTML`. Ce sont les premières choses à chercher lors d'une relecture.

« Encodage » paraît abstrait tant que vous n'avez pas vu à quel point c'est peu de chose. Cinq caractères ont un sens pour un analyseur HTML, et chacun a une forme écrite inoffensive :

| Caractère | Encodé en | Pourquoi il compte |
|---|---|---|
| `&` | `&amp;` | Commence un caractère encodé |
| `<` | `&lt;` | Commence une balise |
| `>` | `&gt;` | Termine une balise |
| `"` | `&quot;` | Termine la valeur d'un attribut |
| `'` | `&#x27;` | Termine la valeur d'un attribut |

Un commentaire `I <b>love</b> this` est envoyé au navigateur sous la forme `I &lt;b&gt;love&lt;/b&gt; this`. Le navigateur dessine les chevrons à l'écran comme des caractères, et rien dans le commentaire ne peut devenir une balise. Écrivez la fonction une fois pour voir qu'il n'y a là aucune magie, puis utilisez celle de votre framework, ou `html.escape` en Python, pour le vrai travail.

@code escape-html

En seconde couche, un en-tête **CSP** dit au navigateur quels scripts peuvent s'exécuter. Marquez les cookies de session `HttpOnly`, pour que les scripts ne puissent pas les lire. Si vous devez accepter du texte enrichi, utilisez un nettoyeur éprouvé comme DOMPurify, jamais votre propre expression régulière.

Une politique est une liste de règles, chacune nommant un type de contenu et d'où il peut venir :

```http
Content-Security-Policy: default-src 'self'; script-src 'self'; img-src 'self' https://images.example
```

Lisez-la ainsi : par défaut, ne charger que depuis ce site lui-même ; les scripts seulement depuis ce site ; les images depuis ce site ou un hôte nommé. Un script écrit dans la page par un attaquant n'est pas un fichier de ce site, donc le navigateur refuse de l'exécuter. La CSP ne corrige pas la faille. Elle rend une faille oubliée bien plus difficile à utiliser.

@drill web-fix

?? Pourquoi l'encodage en sortie se fait-il à l'affichage, plutôt que seulement à l'arrivée de l'entrée ?
+ La forme sûre dépend de l'endroit d'arrivée
- Encoder à l'arrivée ralentit beaucoup la base
- Un navigateur refuse tout double encodage reçu
- Seules les pages de connexion sont concernées
=> Le HTML, les attributs, les URL et JavaScript demandent chacun un traitement différent. Seule l'étape de sortie connaît le contexte.

## Commandes et fichiers

L'**injection de commande** vient du passage d'une entrée d'utilisateur à un shell. Préférez une bibliothèque à une commande shell. Si vous devez lancer un programme, passez les arguments sous forme de liste, pour qu'aucun shell ne les analyse jamais.

```python
# Dangereux : le shell analyse toute la chaîne
os.system(f"convert {name} out.png")

# Sûr : pas de shell, et chaque argument reste un seul argument
subprocess.run(["convert", "--", name, "out.png"], check=True)
```

La raison est qu'un shell lit sa ligne de commande comme un petit programme. Des caractères comme `;`, `|`, `&` et `$( )` sont des instructions pour lui, donc une entrée qui en contient change ce qui s'exécute. Avec une liste d'arguments, il n'y a ni shell ni programme à modifier : chaque élément arrive à l'outil exactement comme il est écrit. Le `--` de la liste est une convention que suivent la plupart des outils, qui signifie « tout ce qui suit est un nom, pas une option », pour qu'un fichier appelé `-delete` ne puisse pas être lu comme une option.

Une liste d'autorisation pour les noms est courte à écrire et mérite d'être placée devant tout code qui touche à des fichiers :

@code safe-filename

La **traversée de chemin** se produit quand une entrée atteint un chemin de fichier. N'utilisez pas du tout l'entrée comme chemin si vous pouvez l'éviter : utilisez un identifiant, et cherchez le fichier. Sinon, résolvez le chemin complet, et vérifiez qu'il est toujours dans le dossier que vous vouliez.

```python
base = Path("/srv/uploads").resolve()
target = (base / name).resolve()
if not target.is_relative_to(base):
    abort(404)
```

Il y a un piège dans ce contrôle. Comparer du texte avec « le chemin commence-t-il par le nom du dossier ? » n'est pas la même chose que « le chemin est-il dans le dossier ? », car `/srv/uploads-private` commence aussi par `/srv/uploads`. `is_relative_to` fait cela correctement. Si vous comparez des chaînes vous-même, comparez avec le dossier suivi d'une barre oblique.

@code safe-path

Validez avec une **liste d'autorisation**, qui dit ce qui est permis, plutôt qu'avec une liste d'interdiction qui tente de nommer tout ce qui est mauvais.

?? Pourquoi une liste d'autorisation est-elle plus sûre qu'une liste d'interdiction ?
+ Ce que vous n'avez pas prévu reste refusé
- L'application utilise ainsi vraiment beaucoup moins de mémoire
- Les listes d'interdiction sont exclues des normes web
- Un attaquant ne peut jamais lire cette liste
=> Une liste d'interdiction échoue en mode ouvert sur ce qu'elle a oublié. Une liste d'autorisation échoue en mode fermé.

## Le trouver dans le code

Cherchez les points d'arrivée, puis remontez jusqu'à l'origine de l'entrée.

| À chercher | Risque |
|---|---|
| `execute(f`, concaténation de chaînes près du SQL | Injection SQL |
| `\|safe`, `dangerouslySetInnerHTML`, `innerHTML` | XSS |
| `os.system`, `shell=True`, `eval` | Injection de commande ou de code |
| `open(` avec des données de la requête | Traversée de chemin |

@range appsec

::: try Corrigez votre propre code
Utilisez votre application du mois 6. Ajoutez une requête vulnérable sur une branche, écrivez un test qui montre le problème, corrigez avec des paramètres, et regardez le test réussir. Un test qui reste dans la suite signifie que ce bug ne peut pas revenir en silence. C'est le livrable de ce mois.
:::

## Relire une pull request

Un collègue vous demande de relire cette nouvelle route. Lisez chaque ligne et posez la seule question du début de la leçon : quelque chose qui vient de l'utilisateur est-il collé dans quelque chose qui sera interprété ?

```python
@app.get("/export")
def export():
    sort = request.args["sort"]
    rows = db.execute(f"SELECT name, total FROM orders ORDER BY {sort}").fetchall()
    heading = "<h1>Export: " + request.args["title"] + "</h1>"
    return render_template_string(heading + TABLE_TEMPLATE, rows=rows)
```

?? La requête met `sort` directement dans le SQL. Pourquoi le correctif ne peut-il pas être un marqueur `%s` ?
+ Un marqueur porte une valeur, jamais une colonne
- Un marqueur ne fonctionne que dans un `INSERT`
- Un marqueur rend chaque requête beaucoup trop lente
- Un marqueur est refusé par beaucoup de bases
=> Un paramètre est toujours traité comme une valeur, donc la base trierait selon un texte fixe. Faites passer l'entrée par une liste d'autorisation de vrais noms de colonnes.

?? Le paramètre `title` est collé au texte du gabarit. Quel est le bon correctif ?
+ Le passer en variable, pour l'encoder automatiquement
- Retirer les chevrons avec une expression régulière
- Limiter le titre à vingt caractères seulement
- Convertir d'abord le titre en lettres majuscules
=> Un texte collé à un gabarit devient une partie du gabarit. Passé en variable et écrit `{{ title }}`, c'est une donnée, et le moteur de gabarits l'encode en sortie.

?! Expliquez à un développeur, en trois phrases, pourquoi les paramètres arrêtent l'injection SQL alors que le filtrage ne le fait pas.

### Pour aller plus loin

Les sources primaires et le meilleur matériel gratuit sur ce sujet, tous vérifiés en novembre 2026 (en anglais) :

- [Aide-mémoire de l'OWASP sur la prévention du cross-site scripting](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [Aide-mémoire de l'OWASP sur la défense contre l'injection de commandes](https://cheatsheetseries.owasp.org/cheatsheets/OS_Command_Injection_Defense_Cheat_Sheet.html)
