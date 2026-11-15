---
title: API, envois de fichiers et requêtes sortantes
summary: Protéger le reste d'une application moderne : l'OWASP API Top 10, la limitation de débit, les envois de fichiers sûrs, la falsification de requête côté serveur, et les formats de données non fiables.
builds: une liste de contrôle pour durcir une API
source: OWASP API Security Top 10 2023 (en anglais) | https://owasp.org/API-Security/editions/2023/en/0x11-t10/
words: limitation de débit, SSRF, désérialisation
---
Les applications modernes sont surtout des API : un navigateur ou une application mobile qui parle à un serveur par des requêtes structurées. Une API n'a pas de pages derrière lesquelles se cacher, ce qui rend chaque faille des deux dernières leçons plus facile à atteindre.

@term limitation de débit = Limiter le nombre de requêtes qu'un client peut faire sur une période.
@term SSRF (falsification de requête côté serveur) = Faire envoyer par un serveur une requête pour le compte de l'attaquant, souvent vers des systèmes internes.
@term désérialisation = Retransformer des données stockées en objets vivants dans un programme.
@term filtrage en sortie = Contrôler quelles connexions sortantes un système peut établir.
@term type MIME = Une étiquette qui dit quel genre de contenu un fichier prétend être.

## Le Top 10 des API

La [liste de l'OWASP pour les API (2023)](https://owasp.org/API-Security/editions/2023/en/0x11-t10/) a son propre vocabulaire. Voici ceux que vous entendrez le plus.

| Risque | Signification | Correctif |
|---|---|---|
| API1 Broken Object Level Authorization | Lire l'enregistrement de quelqu'un d'autre | Vérifier la propriété de chaque objet |
| API2 Broken Authentication | Des connexions et des jetons faibles | Bibliothèques éprouvées, MFA, durées de vie courtes |
| API3 Broken Object Property Level Authorization | Lire ou définir des champs qu'on ne devrait pas | Liste d'autorisation des champs en réponse et en requête |
| API4 Unrestricted Resource Consumption | Aucune limite d'usage | Limites de débit, quotas et délais d'attente |
| API5 Broken Function Level Authorization | Appeler des actions d'administration | Vérifier le rôle sur chaque route |

Remarquez qu'API1 et API5 sont les problèmes de contrôle d'accès de la leçon 48, sous de nouveaux noms.

Une API est facile à inspecter, car ses réponses sont du simple JSON. N'importe quelle API que vous avez le droit d'utiliser fera l'affaire pour s'exercer, et `jq` met la réponse en forme et en extrait des champs :

```
curl -s https://api.github.com/users/octocat | jq .
curl -s https://api.github.com/users/octocat | jq '{login, name, public_repos}'
```

La première commande montre tout ce que le serveur a choisi d'envoyer. C'est l'habitude du relecteur pour API3 : ne jugez jamais une API d'après ce que l'application affiche. Regardez la réponse brute et demandez-vous si chaque champ a besoin de quitter le serveur. Le correctif côté serveur est encore la liste d'autorisation, appliquée à la sortie : construisez la réponse à partir de champs nommés, et jamais en déversant toute la ligne de la base.

```python
def public_user(row):
    return {"id": row["id"], "name": row["name"], "bio": row["bio"]}
```

?? Une API renvoie l'enregistrement complet d'un utilisateur, empreinte du mot de passe comprise, et l'application n'affiche que le nom. Qu'est-ce qui ne va pas ?
+ L'API envoie plus que le nécessaire au client
- L'application devrait elle aussi afficher cette empreinte stockée
- JSON ne peut transporter aucun champ aussi sensible
- Le serveur devrait compresser bien davantage ses réponses
=> Filtrer dans l'application ne protège rien, car n'importe qui peut lire la réponse brute. Ne renvoyez que les champs nécessaires.

## Les limites

Sans limites, n'importe qui peut essayer un million de mots de passe, aspirer vos données, ou faire grimper votre facture. La **limitation de débit** plafonne les requêtes par utilisateur et par IP, et renvoie le code `429` en cas de dépassement.

| Où | Exemple de limite |
|---|---|
| Connexion | 5 tentatives par compte et par minute |
| Réinitialisation de mot de passe | 3 par heure |
| Recherche coûteuse | 30 par minute |
| Envoi de fichier | Une taille maximale, et un quota |

Fixez aussi des délais d'attente et des tailles de page maximales, pour qu'une seule requête ne puisse pas immobiliser le serveur. Pour tout ce qui appelle un LLM, les limites protègent aussi votre argent, comme vous le verrez au mois 18.

Le mécanisme habituel est un **seau à jetons**. Imaginez un seau qui contient, disons, cinq jetons. Chaque requête en prend un, et un seau vide signifie que la requête est refusée. Les jetons reviennent goutte à goutte à un rythme constant, donc une personne qui clique normalement n'en manque jamais, et un script qui envoie des centaines de requêtes est refusé presque aussitôt puis tenu au rythme du goutte-à-goutte. Une API bien élevée dit au client combien de temps attendre, dans un en-tête `Retry-After` à côté du `429`.

@code token-bucket

Les tailles de page demandent le même traitement. Une requête avec `?limit=1000000` ne devrait jamais faire construire un million de lignes au serveur. Le serveur décide du maximum, et tout ce qui est étrange retombe sur une valeur par défaut raisonnable.

@code clamp-limit

?? Où une limite de débit est-elle la plus précieuse ?
+ Sur les routes de connexion et de réinitialisation
- Sur la petite image statique du logo d'en-tête
- Sur le fichier public de l'icône du site
- Sur la page publique des conditions générales d'utilisation
=> Ce sont les points d'entrée contre lesquels les attaquants automatisent. Une limite à cet endroit bloque les essais alors que les vrais utilisateurs la remarquent à peine.

## Les envois de fichiers

Un envoi de fichier permet à un inconnu de poser un fichier sur votre système, donc traitez-le comme dangereux.

| Règle | Pourquoi |
|---|---|
| Vérifier le contenu, pas le nom ni le type annoncé | Le nom et le `type MIME` viennent tous deux du client |
| Générer votre propre nom de fichier | Les noms choisis par l'utilisateur permettent des ruses de chemin |
| Stocker hors de la racine web | Pour qu'il ne puisse jamais être exécuté comme du code |
| Servir depuis un domaine séparé | Un fichier malveillant ne peut pas atteindre les cookies de votre site |
| Fixer une taille maximale, et analyser le fichier | Empêche de saturer les disques, et attrape les malwares connus |

« Vérifier le contenu » a un sens concret. La plupart des formats de fichier commencent par quelques octets fixes, appelés **octets magiques**, et un fichier renommé garde ceux de sa naissance :

| Format | Premiers octets | En texte |
|---|---|---|
| PNG | `89 50 4E 47 0D 0A 1A 0A` | `.PNG....` |
| JPEG | `FF D8 FF` | |
| GIF | `47 49 46 38` | `GIF8` |
| PDF | `25 50 44 46 2D` | `%PDF-` |

La commande `file` les lit pour vous, et c'est le moyen le plus rapide de voir si un nom dit la vérité :

```
$ file holiday.png
holiday.png: PNG image data, 800 x 600, 8-bit/color RGB
$ file avatar.png
avatar.png: PHP script, ASCII text
```

Les octets magiques sont un premier filtre, pas une preuve : ils montrent qu'un fichier commence comme une image. C'est pourquoi les autres règles du tableau s'appliquent toujours. Pour le nom, ne nettoyez pas ce que l'utilisateur a envoyé. Jetez-le et fabriquez le vôtre, par exemple `uuid.uuid4().hex + ".png"`.

@code file-kind

Dans la [mission de triage](/courses/0051-how-a-soc-works/), vous avez vu un fichier `.php` dans un dossier d'envois, avec des commandes dans son URL. Voilà ce qui arrive quand ces règles sont ignorées.

?? Un serveur vérifie que le nom d'un fichier envoyé se termine par `.png`. Pourquoi cela ne suffit-il pas ?
+ Le nom et le type viennent du client
- Les fichiers PNG sont interdits sur tout serveur
- Le contrôle devrait bien plutôt chercher l'extension `.jpg`
- Un nom de fichier ne contient aucun point
=> Tout ce qu'envoie le client n'est pas fiable. Vérifiez le contenu, renommez le fichier, et stockez-le là où il ne peut pas s'exécuter.

## Les requêtes que fait votre serveur

Beaucoup d'applications récupèrent une URL pour le compte de l'utilisateur : un aperçu de lien, un webhook, une image à une adresse donnée. Si l'utilisateur choisit l'adresse, votre serveur devient son messager. Votre serveur peut atteindre des choses que lui ne peut pas atteindre, comme les panneaux d'administration internes et le service de métadonnées du cloud que vous verrez au mois 13. C'est le **SSRF**, que l'OWASP range désormais sous le contrôle d'accès défaillant.

@flow Quelqu'un fournit une URL > Votre serveur la récupère > Depuis l'intérieur de votre réseau > Il atteint ce que l'autre ne pouvait pas

| Défense | Pourquoi |
|---|---|
| Liste d'autorisation des destinations | Seuls des hôtes connus peuvent être atteints |
| Résoudre le nom, puis refuser les adresses privées et de lien local | Arrête les noms qui pointent vers l'intérieur |
| Ne pas suivre les redirections aveuglément | Une URL sûre peut rediriger vers une URL qui ne l'est pas |
| Exiger IMDSv2 | Bloque beaucoup de chemins vers les identifiants du cloud |
| **Filtrage en sortie** | Même si le code échoue, le réseau refuse |

La deuxième ligne de ce tableau mérite d'être vue en code. Un nom ne vous dit rien de l'endroit où ira une requête, car celui qui possède un domaine décide vers quelle adresse il pointe. Le contrôle se fait donc sur l'adresse vers laquelle le nom se résout, et le module `ipaddress` de Python sait quelles plages sont internes :

| Plage | Ce que c'est |
|---|---|
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16` | Les réseaux privés |
| `127.0.0.0/8` et `::1` | Le serveur lui-même |
| `169.254.0.0/16` | Le lien local, qui comprend l'adresse des métadonnées du cloud `169.254.169.254` |

```python
import ipaddress
ip = ipaddress.ip_address("169.254.169.254")
ip.is_private, ip.is_loopback, ip.is_link_local      # les trois propriétés à tester
```

Un détail garde le contrôle honnête : connectez-vous à l'adresse que vous avez vérifiée, pas de nouveau au nom, sinon le nom peut être amené à se résoudre autrement la seconde fois.

@code public-address

?? Une fonction d'aperçu récupère n'importe quelle URL que lui donne un utilisateur. Quel contrôle aide même si la vérification du code échoue ?
+ Des règles de sortie qui limitent les connexions
- Un message d'erreur plus long sur les adresses
- Une meilleure police pour la zone de l'aperçu
- Cacher le champ de l'URL aux utilisateurs mobiles
=> Les couches comptent. Si le serveur ne peut physiquement pas atteindre les adresses internes, contourner le code ne rapporte rien.

## Des données qui peuvent s'exécuter

Certains formats font plus que stocker des données. Une **désérialisation** non sûre peut construire des objets arbitraires, et dans certains langages cela exécute du code. Ne désérialisez donc jamais avec pickle des données non fiables en Python, et préférez des formats simples comme JSON, avec un schéma. Pour XML, désactivez les entités externes, ce que beaucoup d'analyseurs modernes font désormais par défaut.

La règle est la même que celle du début. Une donnée venue de l'extérieur reste une donnée.

```python
# Dangereux pour tout ce qui vient de l'extérieur
obj = pickle.loads(body)

# Sûr : de simples données, puis une validation de leur forme
obj = Order(**json.loads(body))
```

« Valider leur forme » signifie que le serveur dit exactement à quoi ressemble un message correct et refuse tout le reste : les bonnes clés, les bons types, les bonnes plages, et rien en plus. Des bibliothèques comme pydantic le font à partir d'une définition de classe. Écrire un contrôle à la main montre ce qu'elles font pour vous.

@code parse-order

?? Pourquoi `pickle.loads` est-il dangereux sur des données venues d'un utilisateur ?
+ Le chargement peut exécuter du code pendant la désérialisation
- Il rend toujours les données stockées beaucoup plus grosses
- Il ne fonctionne qu'avec des fichiers sur serveurs Windows
- JSON est plus ancien, donc bien mieux géré partout
=> La documentation de Python elle-même met en garde. Utilisez un format de simples données pour tout ce qui n'est pas fiable.

## Durcir un point d'entrée

Deux choses arrivent dans une application dont vous avez la charge. Décidez quoi faire de chacune avant de lire les choix.

```
$ file avatar.png
avatar.png: PHP script, ASCII text
```

?? Un utilisateur a envoyé ce fichier comme photo de profil. Qu'aurait dû faire le code d'envoi ?
+ Le refuser, car le contenu n'est pas une image
- L'accepter, car le nom se termine bien par `.png`
- Le renommer en `avatar.php` pour correspondre à son contenu
- L'envoyer par courriel à l'utilisateur, pour qu'il le confirme
=> Le nom a été choisi par l'expéditeur. Le contenu dit que c'est un script, et une photo de profil n'a aucune raison d'en être un.

?? Un client règle l'adresse de son webhook sur un nom qui se résout en `169.254.169.254`. Que doit faire le serveur ?
+ Refuser, car cette adresse est de lien local
- L'interroger, puisque le client l'a bien lui-même choisie
- L'interroger, mais uniquement par une connexion en HTTPS
- Refuser, car un webhook doit préciser un port
=> C'est l'adresse des métadonnées du cloud, joignable seulement depuis l'intérieur de votre propre infrastructure. Un client n'a aucune raison légitime d'y pointer votre serveur.

?! Rédigez une liste de contrôle de dix lignes pour durcir une API que vous pourriez construire.

### Pour aller plus loin

Les sources primaires et le meilleur matériel gratuit sur ce sujet, tous vérifiés en novembre 2026 (en anglais) :

- [Aide-mémoire de l'OWASP sur l'envoi de fichiers](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)
- [Aide-mémoire de l'OWASP sur la prévention du server-side request forgery](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html)
