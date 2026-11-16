---
title: Comment fonctionnent les modèles de langage
summary: Depuis zéro : ce que fait vraiment un LLM, les tokens, l'entraînement, les fenêtres de contexte, les embeddings, le RAG, l'appel d'outils et les agents, et pourquoi chacun compte pour la sécurité.
builds: expliquer les rouages d'un LLM, et calculer une similarité vous-même
source: OWASP GenAI Security Project (en anglais) | https://genai.owasp.org/
words: token, embedding, hallucination
---
On ne peut pas sécuriser ce qu'on ne comprend pas, et la plupart des conseils de sécurité sur l'IA sautent les bases. Nous partons donc du bas. Aucune mathématique n'est nécessaire au-delà de la multiplication, et tout ce qui suit se rattache à une décision de sécurité que vous prendrez plus tard.

@term token = Un petit morceau de texte, souvent une partie de mot, qu'un modèle lit et écrit.
@term entraînement = Ajuster les nombres internes d'un modèle, à l'aide d'énormes quantités de texte, pour que ses prédictions s'améliorent.
@term inférence = Utiliser un modèle entraîné pour produire une réponse.
@term température = Un réglage qui contrôle la part de hasard dans les choix d'un modèle.
@term embedding = Une liste de nombres qui représente le sens d'un texte.
@term base de données vectorielle = Un stockage qui retrouve du texte par proximité de sens, à l'aide d'embeddings.
@term poids = Les nombres à l'intérieur d'un modèle, fixés pendant l'entraînement.

## Un très bon devineur

Un modèle de langage fait une seule chose : **il prédit le morceau de texte suivant**. Tapez « La capitale de la France est », et il donne une forte probabilité à « Paris ». Il en choisit un, l'ajoute, et prédit de nouveau. Tout le reste, des dissertations au code, n'est que cette étape répétée.

Il n'a pas de base de faits dans laquelle il cherche. Pendant l'**entraînement**, un programme lui a fourni des quantités énormes de texte et a ajusté des milliards de nombres, appelés **poids**, pour que ses suppositions s'améliorent. L'utiliser ensuite s'appelle l'**inférence**.

Cela explique l'**hallucination**. Le modèle produit ce qui a des chances de venir ensuite, pas ce qui est vrai. Un faux numéro de CVE ressemble exactement à un vrai, parce que le motif est juste.

?? Pourquoi un modèle peut-il inventer un numéro de CVE convaincant mais faux ?
+ Il prédit un texte probable, sans jamais vérifier les faits
- Il lit en secret une vieille base de fausses CVE
- Un employé du fournisseur a tapé lui-même toute cette réponse
- Son disque dur s'est en partie corrompu, d'une façon inconnue
=> Le motif d'un numéro de CVE est facile à prédire. Rien dans cette étape ne vérifie qu'il existe, donc vous devez vérifier.

## Les tokens et le contexte

Les modèles ne lisent pas des lettres. Ils lisent des **tokens**, des morceaux qui sont souvent des parties de mots. En règle approximative pour l'anglais, 100 tokens font environ 75 mots. Vous payez au token, ce qui fait de la longueur un coût, et un coût que les attaquants peuvent faire grimper.

La **fenêtre de contexte** est tout ce que le modèle peut voir à la fois : vos instructions, la conversation, les documents récupérés et les résultats des outils. Quand elle est pleine, il faut retirer quelque chose.

Voici le point crucial. **Le modèle ne garde aucune mémoire d'une requête à l'autre.** Une application envoie toute la conversation à chaque fois. La « mémoire » n'est donc que du texte qu'une application a choisi d'inclure, et tout ce qui peut placer du texte là peut influencer le modèle.

Chaque application doit donc décider de ce qu'elle garde quand la conversation dépasse la fenêtre. Un choix courant garde les instructions, puis autant de messages récents que possible, et retire les plus anciens. Écrivez-le vous-même, avec la règle approximative qu'un mot coûte quatre tiers de token :

@code fit-context

Remarquez ce que ce choix implique. Ce qui se trouve dans la fenêtre est ce sur quoi le modèle travaille, et un attaquant qui peut remplir la fenêtre d'un long texte peut en chasser vos messages précédents, ou un rappel de sécurité placé parmi eux.

?? Un chatbot « se souvient » de ce que vous avez dit plus tôt. Comment cela fonctionne-t-il vraiment ?
+ L'application renvoie le texte précédent à chaque requête
- Le modèle apprend pour toujours de chaque utilisateur
- Un opérateur humain prend note de la conversation
- Les cookies stockent toutes les pensées du modèle
=> Le modèle lui-même est sans état pendant l'inférence. La mémoire est une fonction de l'application, ce qui en fait quelque chose qu'un attaquant peut empoisonner.

## Pourquoi la même question reçoit des réponses différentes

À chaque étape, un modèle dispose d'un éventail de tokens suivants probables. La **température** contrôle à quel point son choix est aventureux : basse, elle reste près du mot le plus probable, haute, elle prend plus de risques. Même avec des réglages bas, les résultats peuvent varier d'une exécution à l'autre. C'est pourquoi un seul test prouve peu, et pourquoi la règle du Mois 18 existe : un constat n'en est pas un tant qu'il ne se reproduit pas.

Sous le capot, le modèle donne un score à chaque token candidat. La fonction **softmax** transforme les scores en probabilités : élevez *e* à la puissance de chaque score divisé par la température, puis divisez chaque résultat par leur total, pour que tout fasse 1. Diviser par une petite température étire les écarts entre les scores, si bien que le premier token prend presque tout. Une grande température les resserre, et le choix s'étale.

@code softmax-temperature

?? Une attaque fonctionne une fois, puis échoue au second essai. Quelle est la meilleure explication ?
+ La sortie varie, donc mesurez sur plusieurs essais
- L'attaque a été définitivement bloquée par le fournisseur
- Le premier résultat était forcément une erreur d'affichage
- Le modèle a remarqué l'attaque et s'est fâché
=> La variation est normale. Vous mesurez donc un taux sur de nombreux essais, au lieu de juger sur une seule tentative.

## Le sens sous forme de nombres

Un **embedding** transforme un texte en liste de nombres, de façon que des sens proches reçoivent des nombres proches. Des mots comme « remboursement » et « argent rendu » atterrissent près l'un de l'autre, et « pare-feu » atterrit loin. La proximité se mesure, et voici du vrai Python qui fonctionne :

```python
import math

def cosine(a, b):
    dot = sum(x * y for x, y in zip(a, b))
    size = lambda v: math.sqrt(sum(x * x for x in v))
    return dot / (size(a) * size(b))

refund = [0.9, 0.1, 0.0]
money_back = [0.8, 0.2, 0.1]
firewall = [0.0, 0.1, 0.9]
print(round(cosine(refund, money_back), 2))   # 0.98
print(round(cosine(refund, firewall), 2))     # 0.01
```

Les vrais embeddings ont des centaines de nombres, mais l'idée est la même. Une **base de données vectorielle** les stocke, et retrouve ce qui est le plus proche d'une question.

La recherche par le sens est alors un tri : notez chaque vecteur stocké par rapport à la question, et gardez les premiers. Ces quelques-uns forment le **top k**, et ce sont eux qui sont collés dans le prompt.

@code top-k

?? Deux textes ont une similarité cosinus de 0.98. Qu'est-ce que cela suggère ?
+ Leurs deux sens sont très proches l'un de l'autre
- L'un a été copié sur l'autre mot pour mot
- Le premier est 98 % plus long que l'autre
- L'un d'eux a forcément été écrit par une IA
=> Des vecteurs proches veulent dire un sens proche, même sans mot en commun. C'est ce qui fait fonctionner la recherche par le sens.

## Le RAG : donner vos documents au modèle

Les modèles ne savent rien de votre entreprise. Le **RAG**, la génération augmentée par récupération, corrige cela sans aucun réentraînement :

@flow Question > La transformer en embedding > Trouver les documents les plus proches > Les coller dans le prompt > Le modèle répond

Lisez ce flux en défenseur. La quatrième étape **colle du texte extérieur dans le prompt**. Si un document stocké contient des instructions, elles arrivent dans le même flot que les vôtres. C'est ainsi qu'une page de wiki empoisonnée ou un ticket devient une attaque. Et si la récupération ignore les permissions, la question d'un utilisateur peut faire remonter les documents d'un autre.

La correction du second problème a sa place dans votre code, pas dans le prompt. Filtrez les documents selon ce que cet utilisateur peut lire **avant** de les classer, pour qu'un document interdit ne puisse jamais figurer dans le top k. « N'utilise que les documents que cet utilisateur peut voir », écrit dans le prompt, est une demande faite à un devineur, et elle sera parfois ignorée.

@code rag-permissions

?? Pourquoi le RAG est-il une question de sécurité autant qu'une fonctionnalité ?
+ Le texte récupéré entre dans le prompt comme des instructions
- La récupération modifie les poids du modèle à chaque fois
- Une base vectorielle ne peut être stockée sur aucun serveur
- Les embeddings révèlent toujours le mot de passe de l'utilisateur
=> Le modèle ne sait pas distinguer les données récupérées des instructions. Les documents font donc partie de votre surface d'attaque.

## Les outils et les agents

Un modèle seul ne produit que du texte. L'**appel d'outils** lui permet de demander des actions.

@flow Le modèle dit : appelle lookup_customer avec l'id 42 > Votre code décide s'il l'exécute > Le résultat retourne au modèle > Le modèle continue

Retenez ceci pour toujours : **le modèle n'exécute rien. Il demande, et c'est votre code qui exécute.** Cet écart est l'endroit où vit la sécurité, parce que votre code peut dire non.

Un **agent** place cela dans une boucle : décider, agir, regarder le résultat, recommencer. Les agents sont puissants et difficiles à prévoir, parce que la sortie de chaque étape alimente la suivante. **MCP**, le Model Context Protocol, est un standard pour connecter ces outils. Vous construirez une boucle sûre à la [leçon 72](/courses/0072-building-an-agent-safely/).

?? Dans l'appel d'outils, qui exécute réellement l'action ?
+ Le code de l'application, qui peut la refuser
- Le modèle, sur les serveurs du fournisseur lui-même
- Le navigateur de l'utilisateur, sans la moindre intervention
- Personne, car les appels d'outils sont du théâtre
=> Le modèle demande, et votre programme agit. C'est à ce point que l'autorisation doit être appliquée.

::: try Faites-en tourner un vous-même
Vous pouvez faire tourner un petit modèle sur votre propre portable avec [Ollama](https://ollama.com/), gratuitement et hors ligne. Posez la même question cinq fois, et comparez les réponses. Demandez-lui ensuite trois CVE d'un produit, et vérifiez si elles existent. Notez ce que vous trouvez.
:::

## Où chaque pièce peut mal tourner

| Pièce | Question de sécurité |
|---|---|
| Données d'entraînement | Ont-elles pu être empoisonnées ? |
| Fenêtre de contexte | Qui peut y placer du texte ? |
| Mémoire | Le texte d'hier pourrait-il attaquer la session d'aujourd'hui ? |
| Récupération | Respecte-t-elle les permissions de chaque utilisateur ? |
| Outils | Quelle est la pire chose qu'ils pourraient faire ? |
| Sortie | Est-elle traitée comme non fiable quand on l'affiche ou l'utilise ? |

?? Quelle question correspond à la ligne des outils dans ce tableau ?
+ Quelle est la pire chose qu'ils pourraient faire ?
- Les données d'entraînement ont-elles bien pu être empoisonnées ?
- Qui peut placer du texte dans la fenêtre ?
- La récupération vérifie-t-elle bien les droits de chacun ?
=> Un outil transforme des mots en actions, donc son pire cas est ce pour quoi vous concevez : quels comptes, quelles données, quel argent il peut toucher.

## Relire une conception

Une équipe décrit son nouvel assistant de support client en trois lignes.

```
1. Mémoire : toutes les conversations sont stockées dans une mémoire partagée, pour que le bot devienne plus malin pour tous.
2. Récupération : cherche dans tous les tickets ; le prompt dit au modèle de n'utiliser que ceux du client.
3. Affichage : la réponse du modèle est insérée dans la page en HTML, pour que les liens fonctionnent.
```

?? Qu'est-ce qui peut mal tourner avec la ligne 1 ?
+ Le texte d'un client atteint la session d'un autre
- La mémoire partagée ralentit l'arrivée de chaque nouvelle réponse
- Le modèle oublie tout après chaque conversation déjà terminée
- Les clients ne peuvent pas taper plus d'une question
=> La mémoire est du texte remis dans le prompt. Si elle est partagée, les mots d'une personne, y compris des instructions délibérées, finissent dans la conversation de quelqu'un d'autre.

?? Pourquoi l'instruction de la ligne 2 ne suffit-elle pas ?
+ Un prompt est une demande, pas une vraie règle
- Aucun ticket ne peut jamais devenir un embedding utilisable
- Le modèle ne sait pas lire le mot client
- La récupération ne marche que sur les documents publics
=> Les permissions ont leur place dans le code de récupération, avant le classement. Un modèle à qui l'on demande poliment d'ignorer les tickets des autres clients s'en servira parfois.

?? Quel est le risque de la ligne 3 ?
+ La sortie d'un attaquant peut s'exécuter dans la page web
- Le HTML rend les réponses du modèle bien moins exactes
- Les liens ne marchent plus une fois insérés en HTML
- La page se charge trop lentement pour de vrais clients
=> Le texte d'un ticket récupéré peut amener le modèle à écrire une balise script ou un lien malveillant. Traitez la sortie comme non fiable : échappez-la, et n'autorisez que la mise en forme dont vous avez besoin.

?! Expliquez à un ami, avec vos propres mots, pourquoi un modèle de langage n'est pas une base de faits, et ce que cela signifie pour la confiance qu'on accorde à ses réponses.

### Pour aller plus loin

Les sources primaires et le meilleur matériel gratuit sur ce sujet, tous vérifiés en novembre 2026 (en anglais) :

- [3Blue1Brown : les réseaux de neurones et les transformers, en images](https://www.3blue1brown.com/topics/neural-networks)
- [Vaswani et al., Attention Is All You Need (2017)](https://arxiv.org/abs/1706.03762)
