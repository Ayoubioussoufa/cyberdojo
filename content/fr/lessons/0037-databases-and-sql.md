---
title: Bases de données et SQL
summary: Tables, requêtes, jointures et agrégats, plus les requêtes paramétrées qui arrêtent l'injection SQL.
builds: écrire de mémoire des jointures et des agrégats
source: SQLBolt, leçons SQL interactives (en anglais) | https://sqlbolt.com/
words: SQL, jointure, requête paramétrée
---
SQL apparaît trois fois dans votre carrière : dans les applications que vous sécuriserez, dans les bases de données que vous défendrez, et dans les requêtes de SIEM qui lui ressemblent beaucoup. Apprenez-le une fois et vous vous en servirez tous les jours.

@term base de données = Un stock organisé de données que de nombreux programmes peuvent interroger.
@term SQL = *Structured Query Language* : le langage pour interroger les bases de données relationnelles.
@term table = Un ensemble de lignes et de colonnes dans une base de données relationnelle.
@term clé primaire = Une colonne qui identifie chaque ligne de façon unique.
@term clé étrangère = Une colonne qui renvoie à une ligne d'une autre table.
@term jointure = Combiner les lignes de deux tables selon une colonne liée.
@term agrégat = Un calcul sur de nombreuses lignes, comme COUNT ou SUM.
@term index = Une structure de base de données qui rend les recherches rapides.
@term transaction = Un groupe d'opérations sur une base qui réussissent ou échouent ensemble.
@term requête paramétrée = Une requête où les valeurs sont envoyées séparément du SQL, pour qu'elles ne puissent pas en changer le sens.
@term ORM = *Object-relational mapper* : une bibliothèque qui écrit le SQL à la place de votre code.
@term injection SQL (SQLi) = Faire interpréter une entrée comme une partie d'une requête SQL.

## Les tables

```
users                              orders
id | name  | role                  id | user_id | total
1  | ana   | admin                 10 | 1       | 40
2  | sam   | user                  11 | 2       | 15
3  | tom   | user                  12 | 2       | 70
```

`id` est la **clé primaire** de chaque table. `orders.user_id` est une **clé étrangère**, qui pointe vers un utilisateur.

Ne vous contentez pas de lire les tables : construisez-les. SQLite est une base de données SQL complète dans un seul fichier, sans rien à configurer, ce qui la rend idéale pour apprendre. Sous Ubuntu, installez son outil en ligne de commande avec `sudo apt install sqlite3`, puis ouvrez une nouvelle base :

```
sqlite3 shop.db
```

Vous êtes maintenant devant une invite `sqlite>`. Tapez ces instructions. Chacune se termine par un point-virgule, et rien ne s'exécute tant que vous ne l'avez pas tapé :

```sql
CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, role TEXT);
CREATE TABLE orders (id INTEGER PRIMARY KEY, user_id INTEGER, total INTEGER);

INSERT INTO users VALUES (1, 'ana', 'admin'), (2, 'sam', 'user'), (3, 'tom', 'user');
INSERT INTO orders VALUES (10, 1, 40), (11, 2, 15), (12, 2, 70);
```

`CREATE TABLE` nomme les colonnes et dit quel type de valeur chacune contient. `INSERT INTO` ajoute des lignes, une paire de parenthèses par ligne. Quatre commandes qui commencent par un point appartiennent à l'outil, pas à SQL, et le rendent agréable à utiliser :

| Commande | Effet |
|---|---|
| `.tables` | Liste les tables |
| `.schema users` | Montre l'instruction qui a créé une table |
| `.headers on` puis `.mode column` | Affiche les résultats en tableau propre, avec les noms de colonnes |
| `.quit` | Quitte |

Lancez `SELECT * FROM users;` et vous devriez voir les trois lignes ci-dessus. Gardez cette fenêtre ouverte pour le reste de la leçon et essayez chaque requête au moment où vous la rencontrez.

### Pourquoi une base de données, et pas un fichier ?

Vous pourriez garder les utilisateurs dans un tableur ou un fichier CSV, et pour une seule personne, cela marche. Une base de données devient utile dès que plusieurs programmes se servent des données en même temps. Elle laisse de nombreux lecteurs et rédacteurs travailler ensemble sans rien corrompre, elle impose des règles à chaque ligne (cette colonne est un nombre, cet identifiant est unique), elle répond aux questions dans un seul langage sans que vous écriviez la boucle de recherche, et elle peut regrouper des modifications pour qu'elles aient toutes lieu, ou aucune. C'est pourquoi presque toutes les applications que vous évaluerez rangent leurs données dans une base.

### SQLite, et les serveurs de bases de données

SQLite est une base de données dans un seul fichier, ouverte directement par le programme qui l'utilise : pas de serveur, pas de mot de passe, rien qui écoute sur le réseau. Les bases qui tournent derrière la plupart des sites fonctionnent autrement. **MySQL** (et sa cousine MariaDB) et **PostgreSQL** tournent comme des serveurs, à l'écoute sur les ports 3306 et 5432, et les programmes s'y connectent par le réseau avec un nom d'utilisateur et un mot de passe :

```
mysql -h db.lab -u app -p shop
psql -h db.lab -U app shop
```

Le SQL que vous tapez est presque le même partout ; les différences tiennent à la connexion et aux extras de chaque produit. Pour un défenseur, le modèle serveur amène ses propres questions : qui peut joindre ce port, quel compte l'application utilise, et ce que ce compte a le droit de faire. Le constat « MySQL joignable depuis le réseau du personnel » de la leçon sur Nmap, c'est exactement cela.

?? Qu'est-ce qu'une clé étrangère ?
+ Une colonne qui pointe vers une autre table
- Un mot de passe venu d'un serveur étranger
- Une clé qui chiffre la table tout entière
- Une colonne que l'on laisse toujours bien vide
=> `orders.user_id` pointe vers une ligne de `users`.

## Les requêtes dont vous avez besoin

```sql
SELECT name, role FROM users WHERE role = 'user';
SELECT * FROM orders WHERE total > 20 ORDER BY total DESC LIMIT 5;
```

Lisez une requête comme une phrase qui commence par le milieu. `FROM users` choisit la table, `WHERE role = 'user'` ne garde que les lignes qui passent le test, et `SELECT name, role` choisit quelles colonnes de ces lignes montrer. Dans la seconde requête, `*` signifie toutes les colonnes, `ORDER BY total DESC` trie du plus grand total au plus petit, et `LIMIT 5` s'arrête après cinq lignes.

Les valeurs textuelles vont entre apostrophes, pas les nombres. Cette petite règle est l'endroit où vit l'injection SQL, comme vous le verrez plus bas.

Dans une application, la valeur que vous cherchez vient d'un utilisateur. Les défis de cette leçon vous donnent une petite base, construite par une fonction `make_db()` que vous laissez telle quelle, et vous demandent de l'interroger depuis Python. `db.execute(sql, valeurs)` lance une requête et `.fetchall()` renvoie les lignes sous forme de liste de tuples. Mettez un `?` dans le SQL partout où va une valeur, et passez les valeurs séparément.

@code users-with-role

### Joindre des tables

```sql
SELECT users.name, orders.total
FROM orders
JOIN users ON orders.user_id = users.id;
```

`JOIN` associe les lignes pour lesquelles la condition est vraie. `LEFT JOIN` garde toutes les lignes de la table de gauche, même sans correspondance.

Sur les tables ci-dessus, cette jointure produit une ligne par commande, avec le nom de l'utilisateur correspondant :

| name | total |
|---|---|
| ana | 40 |
| sam | 15 |
| sam | 70 |

`tom` n'a aucune commande, donc aucune ligne ne lui correspond et il disparaît du résultat. Partez de `users` et écrivez `LEFT JOIN orders` si vous voulez le garder : il apparaît alors une fois, avec un total vide. Oublier cela est la façon classique dont un rapport perd en silence les comptes qui n'ont rien fait, et ce sont parfois ceux que vous cherchiez.

@code orders-with-names

### Les agrégats

```sql
SELECT user_id, COUNT(*) AS orders, SUM(total) AS spent
FROM orders
GROUP BY user_id
HAVING SUM(total) > 50;
```

`WHERE` filtre les lignes avant le regroupement, et `HAVING` filtre les groupes après. C'est le même raisonnement que votre pipeline `sort | uniq -c`, et les langages de SIEM fonctionnent de la même façon.

Les clauses s'écrivent dans un ordre et s'exécutent dans un autre. Connaître l'ordre réel lève l'essentiel de la confusion :

| Étape | Clause | Ce qui se passe |
|---|---|---|
| 1 | `FROM` et `JOIN` | Rassembler les lignes |
| 2 | `WHERE` | Écarter les lignes qui échouent au test |
| 3 | `GROUP BY` | Ranger les lignes restantes en groupes |
| 4 | `HAVING` | Écarter les groupes qui échouent au test |
| 5 | `SELECT` | Calculer les colonnes à montrer |
| 6 | `ORDER BY`, puis `LIMIT` | Trier, puis couper |

Sur l'exemple, l'étape 3 forme deux groupes : l'utilisateur 1 avec une commande de 40, et l'utilisateur 2 avec deux commandes qui totalisent 85. L'étape 4 ne garde que l'utilisateur 2, car 40 n'est pas supérieur à 50.

@code big-spenders

### NULL, la valeur qui n'est pas là

Une valeur manquante en SQL s'appelle `NULL`, ce qui veut dire « inconnu », ni zéro ni chaîne vide, et elle se comporte bizarrement. Ne donnez aucun rôle à `tom` et demandez :

```sql
SELECT name FROM users WHERE role = NULL;      -- ne renvoie rien du tout
SELECT name FROM users WHERE role IS NULL;     -- tom
SELECT name, role FROM users WHERE role != 'admin';
```

```
name  role
----  ----
sam   user
```

Toute comparaison avec `NULL` n'est ni vraie ni fausse, mais inconnue, et `WHERE` ne garde que les lignes où le test est vrai. Donc `= NULL` ne correspond jamais, `IS NULL` est la bonne façon de demander, et la dernière requête laisse discrètement `tom` de côté : il n'est pas admin, mais « inconnu n'est pas admin » n'est pas vrai non plus. Des contrôles d'accès écrits ainsi peuvent oublier des comptes.

### Quand SQLite proteste

Voici de vrais messages de `sqlite3`, et chacun dit où chercher :

| Vous voyez | Cela veut dire |
|---|---|
| `no such table: user` | Le nom de table est faux ; `.tables` liste les vrais |
| `no such column: nmae` | Un nom de colonne est mal écrit ; `.schema users` les montre |
| `near "SELEC": syntax error` | SQLite s'est arrêté sur le mot qu'il n'a pas compris ; l'erreur est là ou juste avant |
| `UNIQUE constraint failed: users.id` | Cette clé primaire existe déjà, donc la ligne est refusée |
| L'invite devient `...>` | Vous n'avez pas encore tapé le `;` final, donc SQLite attend la suite |

Les versions récentes de `sqlite3` montrent même l'endroit exact, avec `^--- error here` sous la ligne.

?? Vous voulez le nombre d'échecs de chaque IP, seulement pour les IP qui en ont plus de 10. Quelle clause filtre sur le compte ?
+ `HAVING`, car il filtre après le regroupement
- `WHERE`, car il filtre après le regroupement
- `ORDER BY`, car il retire des lignes
- `JOIN`, car il associe selon le compte
=> `WHERE` s'applique aux lignes individuelles, avant que le compte existe. `HAVING` s'applique aux groupes.

## Index et transactions

Un **index** ressemble à l'index d'un livre : il rend les recherches rapides. Sans lui, la base parcourt toute la table.

Une **transaction** regroupe des changements pour qu'ils aient tous lieu ou qu'aucun n'ait lieu : déplacer de l'argent de A vers B, sans jamais le perdre en route.

### Modifier des données, sans risque

`UPDATE` et `DELETE` modifient des lignes, et la clause `WHERE` décide lesquelles. Oubliez-la, et la modification touche toutes les lignes. Essayez dans une transaction, que l'on peut annuler :

```sql
BEGIN;
UPDATE users SET role = 'admin';
SELECT name, role FROM users;
ROLLBACK;
```

```
name  role
----  -----
ana   admin
sam   admin
tom   admin
```

Tout le monde est devenu admin, parce que le `WHERE id = 2` a été oublié. `ROLLBACK` annule toute la transaction, et un `SELECT` ensuite montre à nouveau les rôles d'origine ; `COMMIT` aurait rendu la modification définitive. Le vrai travail sur une base suit la même habitude : lancez d'abord le `SELECT` avec le même `WHERE`, vérifiez qu'il ne renvoie que les lignes voulues, puis transformez-le en `UPDATE`.

?? Que garantit une transaction ?
+ Tous les changements ont lieu, ou aucun
- Les changements vont bien plus vite qu'avant
- Les données sont chiffrées sur le disque
- Les requêtes n'ont plus jamais besoin d'index
=> L'argent ne peut pas disparaître au milieu d'un virement.

## Les requêtes paramétrées : le point le plus important ici

Voici le code qui crée l'injection SQL :

```python
# FAUX : l'entrée devient une partie du SQL
query = f"SELECT * FROM users WHERE name = '{name}' AND pw = '{pw}'"
```

Si `name` vaut `' OR 1=1 --`, la requête devient :

```sql
SELECT * FROM users WHERE name = '' OR 1=1 --' AND pw = ''
```

`OR 1=1` est toujours vrai, et `--` met le reste en commentaire. L'attaquant se connecte sans mot de passe.

Le correctif est une **requête paramétrée** : le SQL et les valeurs voyagent séparément, donc une entrée ne peut jamais devenir du code.

```python
# JUSTE : la base traite name comme une donnée, quel que soit son contenu
cur.execute("SELECT * FROM users WHERE name = %s", (name,))
```

Observez la différence sur votre propre base. Le module `sqlite3` de Python utilise `?` comme marqueur, là où le pilote PostgreSQL ci-dessus utilise `%s` :

```python
import sqlite3
db = sqlite3.connect("shop.db")

name = "' OR 1=1 --"
print(db.execute(f"SELECT name FROM users WHERE name = '{name}'").fetchall())
print(db.execute("SELECT name FROM users WHERE name = ?", (name,)).fetchall())
```

La première ligne affiche les trois utilisateurs : l'entrée a réécrit la question. La seconde affiche une liste vide : la base a cherché un utilisateur dont le nom est littéralement `' OR 1=1 --`, et personne ne s'appelle ainsi. Même entrée, même base, et le seul changement est que la valeur a voyagé séparément.

Les paramètres sont le correctif, et deux autres couches limitent les dégâts si une requête a été oubliée. L'application devrait se connecter avec un compte de base de données qui ne peut faire que ce dont l'application a besoin, pour qu'une requête injectée ne puisse ni supprimer des tables ni lire d'autres bases. Et les erreurs montrées aux utilisateurs devraient dire « un problème est survenu », pas afficher le SQL qui a échoué.

Vous rencontrerez aussi l'injection du côté du défenseur, dans les journaux web. Les tentatives arrivent encodées en pourcentage, donc décodez avant de lire :

```
GET /item?id=7%27%20OR%201%3D1-- HTTP/1.1
```

`%27` est une apostrophe, `%20` une espace et `%3D` un signe égal, donc le paramètre vaut `7' OR 1=1--`. Quelqu'un vérifie si `id` est collé dans une requête.

::: key
La cause profonde de l'injection est le **mélange du code et des données dans une même chaîne**. Vous verrez la même erreur avec le HTML (XSS), les commandes shell et même les prompts de LLM. Corrigez le mélange et vous corrigez toute la classe.
:::

Un **ORM** utilise des paramètres à votre place, sauf si vous construisez des requêtes brutes par formatage de chaînes. Voir l'[aide-mémoire de l'OWASP sur la prévention de l'injection SQL](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html) (en anglais).

?? Pourquoi les requêtes paramétrées arrêtent-elles l'injection là où l'échappement des guillemets peut échouer ?
+ Les valeurs ne sont jamais lues comme du SQL
- Elles chiffrent chaque valeur avant de l'envoyer au serveur
- Elles rejettent toute entrée qui contient un seul guillemet
- Elles tournent sous un compte de base très restreint
=> La structure de la requête est fixée d'abord, et les valeurs sont liées ensuite. Une entrée qui contient des guillemets reste une simple donnée.

::: try Exercez-vous
Terminez [SQLBolt](https://sqlbolt.com/), toutes les leçons. Installez ensuite PostgreSQL dans votre VM et recréez les tables ci-dessus avec `psql`. Écrivez les requêtes de mémoire : c'est dans votre livrable du mois 6.
:::

## Prévoyez, puis lancez

Pour chaque question, trouvez la réponse sur papier à partir des deux tables du début de la leçon. Lancez ensuite la requête dans votre fenêtre `sqlite>` et comparez.

```sql
SELECT name FROM users WHERE role = 'user' ORDER BY name LIMIT 1;
```

?? Que renvoie cette requête ?
+ `sam`
- `tom`
- `ana`
- `user`
=> Deux lignes passent le `WHERE` : sam et tom. Triées par nom, sam vient en premier, et `LIMIT 1` ne garde que lui.

```sql
SELECT users.name, orders.total FROM users LEFT JOIN orders ON orders.user_id = users.id;
```

?? Combien de lignes cette requête renvoie-t-elle ?
+ `4`
- `3`
- `2`
- `6`
=> Une pour la commande d'ana, deux pour celles de sam, et une pour tom avec un total vide, car `LEFT JOIN` garde chaque utilisateur.

?? Un journal web montre `GET /item?id=7%27%20OR%201%3D1--`. Que fait l'expéditeur ?
+ Tester si le paramètre atteint une requête SQL
- Demander l'article numéro sept dans une langue étrangère
- Envoyer une requête normale, juste un peu longue
- Vérifier si le site utilise bien le HTTPS
=> Décodée, la valeur est `7' OR 1=1--` : une apostrophe pour fermer le texte, une condition toujours vraie, et un commentaire pour jeter le reste. Cela ne fonctionne que là où l'entrée est collée dans le SQL.

?! Avec vos propres mots, quelle est la cause profonde de l'injection SQL, et pourquoi la même idée s'applique-t-elle au XSS ?
