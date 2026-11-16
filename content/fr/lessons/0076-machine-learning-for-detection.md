---
title: L'apprentissage automatique pour la détection
summary: Construire un classifieur d'URL d'hameçonnage depuis zéro en Python pur, puis comprendre pourquoi les bons scores mentent : le piège du taux de base, la fuite, la dérive, et les attaques contre les modèles.
builds: un classifieur qui fonctionne, et le jugement pour se méfier de son score
source: NIST AI 100-2, Adversarial Machine Learning (en anglais) | https://csrc.nist.gov/pubs/ai/100/2/e2025/final
words: caractéristique, surapprentissage, dérive conceptuelle
---
Avant les modèles de langage, la sécurité utilisait déjà l'apprentissage automatique depuis des années : filtres antispam, classifieurs de logiciels malveillants et détection d'anomalies. Il est toujours partout, et cela vaut la peine d'en construire un une fois. Après cela, aucun fournisseur ne pourra vous impressionner avec une « IA précise à 99 % ».

@term apprentissage automatique = Un logiciel qui apprend des motifs à partir d'exemples au lieu de suivre des règles écrites.
@term caractéristique = Une propriété mesurable d'un exemple, utilisée comme entrée d'un modèle.
@term étiquette = La bonne réponse attachée à un exemple d'entraînement.
@term apprentissage supervisé = Apprendre à partir d'exemples qui ont des étiquettes.
@term apprentissage non supervisé = Trouver une structure dans des données sans étiquettes.
@term surapprentissage = Quand un modèle mémorise ses données d'entraînement et se trompe sur de nouvelles données.
@term fuite de données (ML) = Quand une information sur la réponse se glisse dans les entrées d'un modèle, ce qui gonfle son score.
@term dérive conceptuelle = Quand le monde réel change, si bien que la précision d'un modèle baisse avec le temps.
@term détection d'anomalies = Signaler ce qui est inhabituel par rapport au comportement normal.
@term empoisonnement des données = Corrompre les données d'entraînement pour qu'un modèle apprenne la mauvaise chose.

## Des règles ou des exemples

Une règle de détection est écrite par une personne : « si le parent est Word et l'enfant PowerShell ». L'**apprentissage automatique** fonctionne à l'envers : montrez-lui des milliers d'exemples avec les bonnes réponses, et laissez-le trouver le motif.

| Mot | Dans un filtre antispam |
|---|---|
| **Exemple** | Un courriel |
| **Caractéristique** | Les mots qu'il contient |
| **Étiquette** | « Spam » ou « pas spam » |
| **Modèle** | Les nombres qu'il a appris |
| **Prédiction** | Sa supposition pour un nouveau courriel |

Avec des étiquettes, c'est de l'**apprentissage supervisé**. Sans étiquettes, il est **non supervisé** : trouver des groupes, ou repérer ce qui ne colle pas, ce qu'on appelle la **détection d'anomalies**. Cela convient à la sécurité, parce que les attaques sont rares et souvent sans étiquette, mais « inhabituel » n'est pas la même chose que « malveillant ».

?? Vous avez une année de données de connexion sans aucune étiquette. Quelle approche convient ?
+ La détection d'anomalies, qui signale les connexions vraiment anormales
- L'apprentissage supervisé, car les étiquettes ne servent à rien
- Une règle qui bloque toutes les connexions de partout
- On ne peut rien apprendre de données sans étiquettes
=> Sans étiquettes, vous modélisez le comportement normal et cherchez les écarts. Attendez-vous à beaucoup de bizarreries inoffensives.

## Construisez-en un

Voici un classifieur **Naive Bayes** complet, l'idée derrière les premiers filtres antispam. Il compte combien de fois chaque mot apparaît dans chaque classe, puis se demande quelle classe rend une nouvelle URL plus probable. Il n'utilise aucune bibliothèque, et les données sont générées, donc chaque domaine est un faux inoffensif.

@flow Exemples étiquetés > Séparer en entraînement et test > Entraîner > Mesurer sur le jeu de test > Décider

```python
import math
import random
from collections import Counter

SAFE = ["mail", "docs", "shop", "news", "portal", "blog", "cdn", "api", "www", "learn"]
BAIT = ["login", "verify", "secure", "account", "update", "confirm", "paypa1", "reset"]
TLDS = ["example", "test", "invalid"]

def make(label, rng):
    if label == "phish":
        parts = rng.sample(BAIT, 2) + [str(rng.randint(10, 999))]
        rng.shuffle(parts)
        return "-".join(parts) + "." + rng.choice(TLDS)
    return rng.choice(SAFE) + "." + rng.choice(["oasis", "atlas", "north"]) + "." + rng.choice(TLDS)

def words(url):
    """Les caractéristiques : les morceaux de l'adresse."""
    return url.replace("-", ".").split(".")

def train(rows):
    counts = {"phish": Counter(), "safe": Counter()}
    docs = Counter()
    for url, label in rows:
        docs[label] += 1
        counts[label].update(words(url))
    return counts, docs

def score(url, label, counts, docs):
    total = sum(counts[label].values())
    vocab = len(set(counts["phish"]) | set(counts["safe"]))
    s = math.log(docs[label] / sum(docs.values()))
    for w in words(url):
        s += math.log((counts[label][w] + 1) / (total + vocab))
    return s

def predict(url, counts, docs):
    return max(("phish", "safe"), key=lambda c: score(url, c, counts, docs))

rng = random.Random(7)
data = [(make(l, rng), l) for l in ["phish", "safe"] * 200]
rng.shuffle(data)
cut = int(len(data) * 0.7)
train_set, test_set = data[:cut], data[cut:]
counts, docs = train(train_set)

tp = fp = fn = tn = 0
for url, truth in test_set:
    said = predict(url, counts, docs)
    if said == "phish" and truth == "phish": tp += 1
    elif said == "phish": fp += 1
    elif truth == "phish": fn += 1
    else: tn += 1
print(f"precision {tp / max(tp + fp, 1):.2f}  recall {tp / max(tp + fn, 1):.2f}")
print(predict("verify-login-204.example", counts, docs))
print(predict("docs.oasis.example", counts, docs))
print(predict("invoice-payment-77.example", counts, docs))
```

Enregistrez-le sous `classify.py`, et lancez `python3 classify.py`. Voici la vraie sortie :

```
precision 1.00  recall 1.00
phish
safe
safe
```

Le modèle ci-dessus ne voit que des mots. La plupart des vrais classifieurs ajoutent des **caractéristiques** qui décrivent la forme de l'adresse, parce que la forme survit quand les attaquants changent les mots. Chacune est un nombre qu'une personne pourrait calculer à la main :

| Caractéristique | Pourquoi elle pourrait aider |
|---|---|
| La longueur du nom d'hôte | Les hôtes d'hameçonnage sont souvent longs |
| Le nombre de chiffres | Des nombres au hasard remplissent les domaines jetables |
| Le nombre de tirets | `verify-login-204` est fait de morceaux collés |
| Le nombre de points | Des sous-domaines profonds imitent une vraie marque |
| L'hôte est-il une adresse IP ? | Les vrais services vous envoient rarement vers une adresse nue |
| La présence de mots appâts | `login`, `verify`, `secure` et leurs fautes volontaires |

@code url-features

Remarquez la séparation. Le modèle a appris sur 70 % des données, et il a été testé sur les 30 % qu'il n'avait jamais vus. Tester sur ses données d'entraînement, c'est comme donner l'examen aux élèves à l'avance.

Une séparation ne fonctionne que si rien ne la traverse. Si la même adresse apparaît dans les deux moitiés, le modèle est noté sur une question qu'il a déjà vue, et le score monte sans bonne raison. Avec de vraies données, il y a une seconde règle : séparez par **le temps**. Entraînez de janvier à juin et testez sur juillet, parce que c'est la situation à laquelle le modèle fera face, jugé sur les attaques de demain.

@code split-overlap

?? Pourquoi garder une partie des données hors de l'entraînement ?
+ Pour mesurer la performance sur des exemples encore jamais vus
- Pour que l'entraînement consomme un peu moins d'électricité chaque jour
- Parce qu'un modèle ne lit que 70 % des fichiers
- Pour que les attaquants ne puissent pas atteindre le reste
=> Un modèle peut mémoriser ce qu'il a vu. Seules des données inédites montrent s'il a appris quelque chose de général.

## Maintenant, méfiez-vous

Des scores parfaits ! Et regardez la dernière ligne. `invoice-payment-77.example` a clairement l'allure d'un hameçonnage, et le modèle l'a déclaré sûr. Pourquoi ? Ses mots appâts n'étaient pas dans l'entraînement, donc il n'avait rien sur quoi s'appuyer. Notre score n'était parfait que parce que les données de test venaient du même générateur étroit que les données d'entraînement.

::: key Trop beau veut dire vérifier plus fort
Un score parfait en sécurité signale presque toujours un problème dans votre test, pas un miracle. Les vraies données sont désordonnées, et les attaquants ne suivent pas votre jeu de données.
:::

Voici les façons classiques dont les scores mentent.

| Problème | Ce qui se passe | Vérification |
|---|---|---|
| **Surapprentissage** | Il mémorise les données d'entraînement | Comparer les scores d'entraînement et de test |
| **Fuite de données** | La réponse se glisse dans les caractéristiques | Demander si cette caractéristique existe au moment de la prédiction |
| **Dérive conceptuelle** | Le monde change | Mesurer de nouveau au fil du temps |
| L'oubli du taux de base | Les attaques rares sont noyées dans le score | Calculer la précision au taux réel |

@drill ml-problem

?? Un modèle obtient 100 % sur les données de test, puis échoue sur le vrai trafic. Que soupçonner d'abord ?
+ Les données de test ne ressemblent pas au vrai trafic
- Le vrai trafic doit forcément être cassé d'une façon inconnue
- Le modèle a sûrement besoin d'un prix bien plus élevé
- L'horloge du système d'exploitation a dérivé par un simple accident
=> Un test ne vous renseigne que sur des données qui lui ressemblent. Rassemblez des données réalistes, prises plus tard dans le temps, avant de faire confiance à un nombre.

## Le piège du taux de base

C'est l'idée la plus importante de la leçon. Supposons qu'un détecteur attrape 100 % des attaques et ne signale à tort que 1 % des événements normaux. Cela paraît excellent. Utilisez-le maintenant sur 100 000 événements, dont 10 sont des attaques.

| | Nombre |
|---|---|
| Vraies attaques attrapées | 10 |
| Fausses alertes (1 % de 99 990) | 1 000 |
| Part des alertes qui sont réelles | **moins de 1 %** |

Quatre-vingt-dix-neuf alertes sur cent sont fausses. Quand les attaques sont rares, un petit taux de faux positifs les écrase. C'est pourquoi « précis à 99 % » veut dire peu en sécurité, et pourquoi la précision au taux réel est le chiffre à demander.

Le calcul est assez court pour être gardé sous forme de fonction, pour essayer les chiffres d'un fournisseur sur votre propre trafic :

@code base-rate-calc

@drill base-rate

?? Un fournisseur annonce « 99 % de précision ». Que devriez-vous demander ensuite ?
+ Quelle est la précision à notre taux d'attaque réel ?
- Quelle couleur est utilisée sur le tableau de bord ?
- Combien d'autres clients utilisent aussi le même logo exactement ?
- La page marketing a-t-elle été écrite par un ingénieur ?
=> Une exactitude mesurée sur des données de test équilibrées dit peu de chose. Demandez combien d'alertes vous recevriez par jour, et combien seraient réelles.

## Des anomalies sans étiquettes

Le détecteur d'anomalies le plus simple n'a besoin d'aucun modèle. Prenez l'historique de chaque utilisateur, calculez la moyenne et l'**écart type**, qui dit à quel point les nombres varient d'habitude, et signalez un jour qui se situe bien au-dessus de l'habitude. Cette distance se mesure en écarts types, et s'appelle un **score z** : (aujourd'hui − moyenne) ÷ écart type. Un score z supérieur à 3 est un seuil de départ courant.

| Utilisateur | Les cinq derniers jours | Moyenne | Aujourd'hui | Score z |
|---|---|---|---|---|
| ana | 12, 15, 11, 14, 13 | 13 | 16 | 2.1 |
| ana | 12, 15, 11, 14, 13 | 13 | 30 | 12.0 |

Deux cas demandent une décision. Un utilisateur sans historique n'a pas de moyenne, donc considérez qu'il mérite un coup d'œil. Et un compte qui fait exactement la même chose chaque jour, comme une tâche de sauvegarde, a un écart type de zéro, donc le moindre changement est inhabituel.

@code zscore-anomaly

?? La première journée de connexions d'un nouvel employé est signalée comme anormale. Qu'est-ce que cela montre ?
+ Inhabituel n'est pas la même chose que malveillant
- Le nouvel employé est forcément un attaquant caché
- La détection d'anomalies ne marche jamais en vrai
- Le seuil devrait être fixé à zéro désormais
=> Il n'a pas d'historique, donc tout ce qu'il fait est nouveau. La détection d'anomalies trouve ce qui est différent, et une personne décide encore si cela compte.

## Les attaques contre les modèles

Les modèles sont des logiciels, et ils peuvent être attaqués. La [taxonomie de l'apprentissage automatique adverse](https://csrc.nist.gov/pubs/ai/100/2/e2025/final) du NIST nomme les grandes familles.

| Attaque | Quand | Exemple |
|---|---|---|
| **Évasion** | Au moment de la prédiction | Modifier un échantillon jusqu'à ce qu'il soit jugé sûr |
| **Empoisonnement** | Au moment de l'entraînement | Glisser de mauvais exemples dans les données |
| Attaques sur la vie privée | Après le déploiement | Extraire des données d'entraînement d'un modèle |
| Abus | Par un usage normal | Utiliser la puissance d'un modèle pour nuire |

Les défenses relèvent surtout de l'ingénierie. Contrôlez vos données d'entraînement, réentraînez et mesurez de nouveau, surveillez la dérive, et ne laissez jamais un seul modèle être votre unique ligne de défense.

?? Un attaquant remplit un fichier malveillant jusqu'à ce qu'un classifieur le déclare bénin. Comment cela s'appelle-t-il ?
+ L'évasion, qui ne change que l'entrée à la prédiction
- L'empoisonnement, qui corrompt les données qui servent à l'entraînement
- La dérive conceptuelle, un changement naturel avec les années
- Le surapprentissage, qui mémorise chaque fichier du jeu d'entraînement
=> Le modèle n'a pas changé, l'entrée oui. L'évasion explique pourquoi les classifieurs ont besoin du renfort d'une détection fondée sur le comportement.

## Relire l'annonce d'un fournisseur

Un fournisseur présente son détecteur d'URL d'hameçonnage.

```
- 99,9 % d'exactitude sur notre banc d'essai
- Entraîné et testé sur le même flux public d'hameçonnage, mélangé puis séparé en 80/20
- Entièrement autonome : bloque sans relecture
```

?? Qu'est-ce qui ne va pas avec le banc d'essai ?
+ Des URL semblables se trouvent sans doute des deux côtés
- Un flux public ne contient jamais la moindre URL d'hameçonnage
- Une séparation 80/20 est toujours interdite en apprentissage automatique classique
- On ne peut tout simplement pas mesurer l'exactitude des URL
=> Les kits d'hameçonnage produisent des adresses presque identiques. Mélangées au hasard, beaucoup d'entre elles tombent dans les deux moitiés, et le modèle est noté sur ce qu'il a déjà vu. Une séparation par le temps est le test honnête.

?? Quel chiffre demanderiez-vous à la place de l'exactitude ?
+ La précision au taux d'attaque réel de notre trafic
- La taille de toute l'équipe de développement du fournisseur
- L'exactitude, mesurée cette fois aussi sur les données d'entraînement
- La vitesse à laquelle le modèle a été entraîné
=> À un taux d'attaque réel, même un tout petit taux de faux positifs peut vouloir dire que la plupart des blocages sont des erreurs. Demandez à quoi ressemblerait une journée de votre trafic.

?? Pourquoi contester « entièrement autonome » ?
+ Ses erreurs bloquent l'activité réelle sans que personne ne vérifie
- Les systèmes autonomes coûtent toujours plus cher à faire tourner
- Un modèle ne peut rien bloquer sans une personne présente
- Bloquer l'hameçonnage n'est jamais vraiment une bonne idée en soi
=> Un détecteur au taux de faux positifs modeste bloquera chaque jour des sites légitimes. Commencez par des alertes, mesurez, et n'automatisez que ce qui l'a mérité.

?! Améliorez le classifieur : ajoutez une caractéristique, comme la longueur de l'URL ou son nombre de chiffres, ou de meilleures données d'entraînement. Qu'est-ce qui a changé, et comment sauriez-vous que cela a aidé dans le monde réel ?

### Pour aller plus loin

Les sources primaires et le meilleur matériel gratuit sur ce sujet, tous vérifiés en novembre 2026 (en anglais) :

- [Google Machine Learning Crash Course](https://developers.google.com/machine-learning/crash-course)
- [Axelsson, The base-rate fallacy and the difficulty of intrusion detection (2000)](https://doi.org/10.1145/357830.357849)
