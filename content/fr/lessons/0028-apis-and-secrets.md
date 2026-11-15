---
title: API de sécurité et hygiène des secrets
summary: Appeler correctement des API de renseignement sur les menaces, avec authentification, limites de débit et nouvelles tentatives, sans jamais laisser fuir une clé.
builds: enrich, un outil en ligne de commande qui recherche des IP et des empreintes, avec un cache
source: Documentation de Requests (en anglais) | https://requests.readthedocs.io/
words: API, limite de débit, IOC
---
Un analyste qui recherche 200 adresses IP à la main perd une journée. Un script le fait en une minute. Le travail de sécurité tourne sur des API, et savoir les utiliser sans risque est une compétence professionnelle de base.

@term API = Une façon définie pour un programme de parler à un autre.
@term clé d'API = Une chaîne secrète qui vous identifie auprès d'une API.
@term API REST = Un style courant d'API web qui utilise les méthodes HTTP et JSON.
@term limite de débit = Un plafond sur le nombre de requêtes que vous pouvez envoyer sur une période.
@term IOC (indicateur de compromission) = Un indice technique laissé par une attaque, comme une IP, un domaine ou l'empreinte d'un fichier.
@term enrichissement = Ajouter du contexte à un indicateur, comme sa réputation ou son propriétaire.
@term empreinte (hash de fichier) = Une courte signature de taille fixe calculée sur des données. Changez un octet et elle change complètement.
@term pagination = Découper une longue réponse d'API en plusieurs requêtes.

## Ce qu'est un appel d'API

Quand vous ouvrez une page web, votre navigateur envoie une requête et un serveur renvoie du HTML destiné à une personne. Un appel d'API est le même échange, sauf qu'un programme envoie la requête et que la réponse est une donnée destinée à un programme, presque toujours en JSON. Chaque appel a les cinq mêmes parties :

| Partie | Dans l'exemple ci-dessous | À quoi elle sert |
|---|---|---|
| Méthode | `GET` | Ce que vous voulez faire. `GET` lit, `POST` envoie quelque chose |
| URL | `https://api.abuseipdb.com/api/v2/check` | Quel service, et quelle question |
| Paramètres | `ipAddress=203.0.113.7` | Les détails de votre question |
| En-têtes | `Key: …` | Des informations sur la requête elle-même, dont votre identité |
| Réponse | Un code d'état et un corps en JSON | Si cela a fonctionné, et la réponse |

Vous pouvez faire un appel sans aucun Python. `curl` en envoie un depuis le terminal, ce qui est le moyen le plus rapide de voir ce qu'un service renvoie vraiment :

```
curl -G https://api.abuseipdb.com/api/v2/check \
  --data-urlencode "ipAddress=203.0.113.7" \
  -H "Key: $ABUSEIPDB_KEY" -H "Accept: application/json"
```

La réponse revient en JSON, que Python lit comme des dicts et des listes imbriqués les uns dans les autres :

```json
{
  "data": {
    "ipAddress": "203.0.113.7",
    "abuseConfidenceScore": 87,
    "countryCode": "NL",
    "totalReports": 41
  }
}
```

Pour atteindre la note, vous descendez une clé à la fois : `body["data"]` est le dict intérieur, et `body["data"]["abuseConfidenceScore"]` est le nombre 87. Les noms de champs sont ici ceux de la [documentation d'AbuseIPDB](https://docs.abuseipdb.com/) (en anglais) ; chaque API publie les siens, et lire cette page d'abord vous épargne une heure de tâtonnements.

?? Dans un appel d'API, à quoi sert un en-tête ?
+ Des informations sur la requête, comme votre identité
- Les données que le serveur vous renvoie ensuite
- L'adresse du service que vous voulez appeler ici
- Le nombre qui dit si l'appel a réussi
=> Les en-têtes voyagent avec la requête et la décrivent. La clé d'API y va pour rester hors de l'URL, que les serveurs et les proxys écrivent dans leurs journaux.

## Une première requête

```python
import os
import requests

key = os.environ["ABUSEIPDB_KEY"]
r = requests.get(
    "https://api.abuseipdb.com/api/v2/check",
    headers={"Key": key, "Accept": "application/json"},
    params={"ipAddress": "203.0.113.7", "maxAgeInDays": 90},
    timeout=10,
)
r.raise_for_status()
print(r.json()["data"]["abuseConfidenceScore"])
```

Trois choses sont ici des habitudes professionnelles :

- **`timeout=10`.** Sans lui, un serveur bloqué fige votre outil pour toujours.
- **`raise_for_status()`.** Il transforme les erreurs HTTP en exceptions au lieu d'utiliser en silence de mauvaises données.
- **La clé vient de l'environnement,** jamais du code.

Le code d'état est la première chose à lire dans toute réponse, avant le corps :

| Code | Signification | Ce que votre outil doit faire |
|---|---|---|
| `200` | Cela a fonctionné | Lire le JSON |
| `401` ou `403` | Votre clé est absente, fausse ou non autorisée | S'arrêter et le dire. Réessayer ne sert à rien |
| `404` | Le service n'a rien à cette adresse | Vérifier l'URL |
| `429` | Trop de requêtes | Attendre, puis réessayer |
| `500` à `599` | Le service lui-même a un problème | Attendre, puis réessayer quelques fois |

La clé de l'exemple vient de `os.environ`, un dict des variables que votre terminal transmet à chaque programme qu'il lance. Définissez-en une pour le terminal en cours avec `export ABUSEIPDB_KEY=votre-clé`. Si la variable manque, `os.environ["ABUSEIPDB_KEY"]` arrête aussitôt le programme avec une `KeyError`, et c'est ce que vous voulez : un outil sans clé doit échouer à la première ligne, pas au milieu de 200 recherches.

?? Pourquoi ajouter `timeout=10` à une requête ?
+ Un serveur bloqué ne peut pas le figer
- Il limite le nombre d'utilisateurs à dix seulement
- Il relance la requête dix fois de suite
- Il chiffre les requêtes pendant dix secondes entières
=> Sans délai d'attente, votre outil peut attendre pour toujours.

## Les secrets : la règle sans exception

::: law Ne commitez jamais une clé
Des robots balaient les dépôts publics en permanence. Une clé poussée doit être considérée comme volée. La [documentation de GitHub](https://docs.github.com/en/code-security/secret-scanning/about-secret-scanning) (en anglais) explique comment il les recherche.
:::

Rangez les secrets dans un fichier `.env` qui figure dans `.gitignore` :

```
# .env
ABUSEIPDB_KEY=your-key
```

Commitez un `.env.example` avec des valeurs vides, pour que les autres sachent ce qu'il faut. Installez [gitleaks](https://github.com/gitleaks/gitleaks) comme hook de pre-commit dès le premier jour : il bloque les commits qui contiennent des choses ressemblant à des secrets, et votre livrable de fin de mois exige un historique propre.

Pour charger ce fichier en Python, installez `python-dotenv` dans votre environnement virtuel et appelez-le une fois en haut de votre outil :

```python
from dotenv import load_dotenv
load_dotenv()          # lit .env et ajoute ses lignes à os.environ
```

Une clé peut aussi fuir par votre propre sortie. Les messages d'erreur, les affichages de débogage et les fichiers journaux sont collés dans des tickets et des discussions, donc n'affichez jamais une clé entière. Montrez-en juste assez pour distinguer deux clés.

@code mask-key

?? Où votre clé d'API doit-elle se trouver ?
+ Dans une variable d'environnement ou un fichier ignoré par git
- Dans une constante placée tout en haut de vos scripts
- Dans un commentaire encodé en base64 dans le code source
- Dans votre README pour que vos collègues la trouvent vite
=> Le code est commité et partagé. Base64 ne cache rien, comme vous l'avez vu au mois 2.

## Être un bon citoyen des API

Les API se protègent avec des **limites de débit**. Dépassez-en une et vous recevez le code HTTP `429 Too Many Requests`. Les offres gratuites peuvent être strictes : consultez par exemple les limites actuelles de [VirusTotal](https://docs.virustotal.com/reference/public-vs-premium-api) (en anglais).

```python
import time

def get_with_retry(url: str, **kw) -> requests.Response:
    for attempt in range(5):
        r = requests.get(url, timeout=10, **kw)
        if r.status_code != 429:
            r.raise_for_status()
            return r
        time.sleep(2 ** attempt)     # attente croissante : 1, 2, 4, 8, 16 secondes
    raise RuntimeError("rate limited too many times")
```

L'**attente exponentielle** patiente plus longtemps après chaque échec. Et mettez les résultats **en cache** : si vous avez déjà recherché une IP aujourd'hui, ne redemandez pas. Un fichier JSON ou SQLite suffit largement.

Écrivez vous-même les temps d'attente. C'est la liste des pauses que fait la boucle ci-dessus.

@code backoff-delays

Un cache est un dict avec une seule règle : regarder là d'abord. La fonction ci-dessous reçoit le cache et la recherche lente en arguments, et c'est ce qui vous permet de la tester sans toucher au réseau.

```python
def lookup(ip, cache, fetch):
    if ip in cache:
        return cache[ip]
    result = fetch(ip)
    cache[ip] = result
    return result
```

Tapez-la au lieu de la copier, puis lancez les tests. Ils passent un faux `fetch` qui compte combien de fois il est appelé.

@code cached-lookup

Certaines réponses sont trop longues pour tenir en une fois. Avec la **pagination**, le service envoie une page et vous dit s'il y en a d'autres, et vous redemandez la page suivante jusqu'à ce qu'il n'y en ait plus. Cherchez dans la documentation de chaque API le nom de son paramètre de page, et comptez chaque page comme une requête dans votre limite de débit.

?? Votre outil reçoit un code HTTP 429. Quelle est la bonne réaction ?
+ Attendre, réessayer en espaçant, et mettre en cache
- Envoyer plus de requêtes jusqu'à ce qu'une passe
- Créer plusieurs nouveaux comptes pour contourner la limite
- Considérer l'indicateur comme sain, puis passer au suivant
=> 429 signifie ralentir. Insister aggrave les choses, les comptes multiples enfreignent en général les conditions d'utilisation, et supposer que tout est sain est un faux négatif.

## Quoi envoyer, et quoi ne pas envoyer

::: trap Une recherche peut alerter un attaquant
Rechercher l'**empreinte** d'un fichier est en général sans risque : elle ne révèle rien du fichier. Mais **envoyer** un fichier à un scanner public le partage avec la communauté. Il peut contenir des données de l'entreprise, et les attaquants surveillent ces services pour voir quand ils ont été repérés. Par défaut, recherchez des empreintes.
:::

Calculez une empreinte avec la bibliothèque standard :

```python
import hashlib
print(hashlib.sha256(open("sample.bin", "rb").read()).hexdigest())
```

`hashlib.sha256(data)` prend des octets, pas du texte, et c'est pourquoi le fichier est ouvert avec `"rb"` : lecture, binaire. `.hexdigest()` donne le résultat sous forme de 64 caractères hexadécimaux, la forme qu'attendent tous les services de renseignement sur les menaces.

@code sha256-hex

?? Que faire de plus sûr avec un fichier suspect de l'entreprise ?
+ Chercher l'empreinte du fichier
- L'envoyer aux scanners publics
- L'envoyer à chaque collègue
- L'ouvrir sur votre portable
=> Une empreinte ne révèle rien du contenu. Un envoi peut le partager avec le monde entier.

## Ne faites pas confiance à la réponse

Une API est le serveur de quelqu'un d'autre. Il peut être en panne, il peut changer, et il peut renvoyer quelque chose que vous n'attendiez pas. Un outil qui suppose que chaque réponse est bien formée plantera sur la seule recherche qui comptait. Lisez donc une réponse comme vous lisez une ligne de journal : vérifiez avant d'utiliser.

```python
body = r.json()
data = body.get("data")
if not isinstance(data, dict):
    return None                      # aucune donnée : signaler « inconnu », pas « sain »
return data.get("abuseConfidenceScore")
```

`dict.get` renvoie `None` quand une clé manque, là où les crochets lèveraient une `KeyError`. Le commentaire est le point de sécurité : quand une recherche échoue, le résultat honnête est « inconnu ». Signaler « sain » parce que vous n'avez pas pu obtenir de réponse, c'est ainsi qu'une vraie menace passe sans encombre.

@code read-score

?? Une recherche renvoie le code HTTP 401. Que doit faire votre outil ?
+ S'arrêter et signaler que la clé est refusée
- Attendre quelques secondes, puis réessayer encore cinq fois
- Marquer l'indicateur comme sain et continuer le travail
- Renvoyer la même requête, mais sans la clé
=> 401 signifie que le service n'accepte pas vos identifiants. Attendre ne change rien, et deviner un verdict est pire que de ne pas en avoir.

?? La réponse n'a aucun champ `data`. Que doit signaler l'outil pour cette IP ?
+ Inconnu, car il n'a reçu aucune réponse
- Sain, car rien de mauvais n'est revenu
- Malveillant, car la recherche a mal tourné
- Zéro, car c'est la note par défaut
=> Une absence de réponse n'est pas un verdict. Dites « inconnu », gardez l'erreur, et laissez une personne décider.

## Construisez enrich

::: try Une partie de P03
Un outil en ligne de commande qui prend des IP, des empreintes ou des domaines et renvoie des données de réputation, avec un mode `--offline`, un cache, une limitation de débit et `--json`. Inscrivez-vous pour obtenir des clés gratuites sur [AbuseIPDB](https://www.abuseipdb.com/) et [VirusTotal](https://www.virustotal.com/). Ne testez qu'avec des indicateurs publics connus.
:::

?! Pourquoi envoyer un fichier à un scanner public est-il plus risqué que de rechercher son empreinte ?
