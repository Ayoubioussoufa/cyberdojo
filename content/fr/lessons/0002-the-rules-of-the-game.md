---
title: Les règles qui vous gardent en sécurité et dans la légalité
summary: Ce que vous avez le droit de toucher ou non, comment un lab sûr vous protège, et comment utiliser l'IA sans abîmer votre propre apprentissage.
builds: rédiger votre propre contrat d'apprentissage
source: Les règles d'OverTheWire, un court exemple de ce qu'une communauté d'entraînement attend de vous | https://overthewire.org/rules/
words: autorisation, périmètre, lab
---
La cybersécurité vous apprend comment fonctionnent les attaques. Le même geste, par exemple se connecter à un système avec un mot de passe deviné, est une prestation professionnelle sur une machine et un délit sur une autre. **La seule différence, c'est la permission.** Apprenez-le avant tout le reste.

@term périmètre (scope) = La liste exacte des systèmes et des actions qu'un test de sécurité a le droit de couvrir.
@term lab = Un environnement d'entraînement privé qui vous appartient, où rien de réel ne peut être abîmé.

## La seule règle

::: law
Ne testez que des systèmes qui vous appartiennent, ou des systèmes que vous avez l'autorisation **écrite** de tester. La curiosité n'est pas une défense. « Je n'ai rien modifié » n'est pas une défense. « Je ne faisais que regarder » n'est pas une défense.
:::

L'accès non autorisé à un système informatique est un délit presque partout, même quand rien n'est endommagé :

- Au **Maroc**, la [loi 07-03](https://ictpolicyafrica.org/en/entity/s8yr3njtjo7) a ajouté les infractions informatiques au Code pénal. Le Conseil de l'Europe [les recense comme les articles 607-3 à 607-11](https://www.coe.int/fr/web/octopus/-/morocco).
- En **France**, l'article 323-1 du Code pénal punit le fait d'accéder ou de se maintenir frauduleusement dans un système de traitement automatisé de données.

Nous ne citons pas les peines ici, car elles changent et ceci n'est pas un conseil juridique. Si vous avez un jour besoin d'une certitude, demandez au service juridique de votre université ou à un avocat. Ce qui compte, c'est le principe : **accéder sans permission, c'est l'infraction**. Rester dans un système atteint par accident peut aussi compter.

?? Vous trouvez une faille sur le site de votre université par hasard, en naviguant normalement. Que devez-vous faire ?
+ Vous arrêter et la signaler par un canal officiel
- Explorer un peu plus pour prouver sa gravité réelle
- Publier un avertissement pour protéger tous les autres étudiants
- La tester avec le compte d'un ami pour confirmer
=> Aller plus loin transforme un accident en accès non autorisé. Arrêtez-vous, notez ce que vous avez vu, et signalez-le au contact informatique ou sécurité de l'université.

## Là où vous avez le droit de jouer

Bonne nouvelle : il existe un immense terrain de jeu légal, et ce cursus s'en sert.

| Lieu | Pourquoi c'est autorisé |
|---|---|
| Le terminal de ce cursus | C'est une simulation dans votre propre navigateur |
| Vos propres machines virtuelles | Elles vous appartiennent |
| Les plateformes d'entraînement comme [OverTheWire](https://overthewire.org/wargames/) et [TryHackMe](https://tryhackme.com/) | Elles existent pour être attaquées, selon leurs règles |
| Les programmes de bug bounty, quand vous serez prêt | L'entreprise donne une autorisation écrite, dans un **périmètre** défini |

Chacun a ses règles. Les [règles d'OverTheWire](https://overthewire.org/rules/) vous demandent de ne pas gâcher le jeu des autres et de ne pas publier d'identifiants. [Hack The Box](https://www.hackthebox.com/) interdit les comptes rendus publics des machines actives. Enfreindre les règles d'une plateforme peut vous faire bannir, et dans un bug bounty, sortir du périmètre signifie que vous n'êtes plus autorisé.

@term bug bounty (prime aux bogues) = Un programme où une entreprise invite le public à chercher des failles dans des systèmes précisés, selon des règles écrites, souvent contre une récompense.

?? Un bug bounty indique que seul `shop.example` est dans le périmètre. Vous remarquez une faille sur `admin.example`. Où en êtes-vous ?
+ Vous n'êtes pas autorisé ici, il faut arrêter
- C'est permis, puisqu'ils ont un programme de primes
- C'est permis, du moment que vous la signalez
- Vous êtes couvert, les deux appartiennent à l'entreprise
=> La permission ne couvre que ce que le périmètre nomme. En dehors, vous êtes dans la même situation que n'importe qui.

## Quatre habitudes de sécurité

Elles viennent directement des règles de base du parcours. Prenez-les dès maintenant pour qu'elles deviennent automatiques :

1. **L'autorisation d'abord.** Avant tout test, demandez-vous : est-ce à moi, ou l'ai-je par écrit ?
2. **Les malwares restent enfermés.** À partir du mois 16, les échantillons restent dans un lab isolé : pas de dossiers partagés, pas d'internet, pas de comptes personnels.
3. **Pas de vraies données.** N'utilisez pas de vraies données personnelles ou de votre employeur dans les labs, dans les comptes rendus ou dans les outils d'IA publics. Utilisez des données inventées.
4. **Respectez la plateforme.** Ne partagez jamais le contenu d'un examen et ne dévoilez pas les défis actifs.

?? Vous voulez vous entraîner aux attaques sur les mots de passe ce soir. Quelle cible est acceptable ?
+ Une machine virtuelle que vous avez construite vous-même
- L'ordinateur d'un ami qui a répondu *peu importe*
- Le site d'une boutique qui semble à l'abandon
- La page de connexion de l'université, la nuit
=> Seuls vos propres systèmes, ou une autorisation écrite, comptent. Un « peu importe » lancé en passant n'est pas une autorisation écrite avec un périmètre défini, et il ne protégerait aucun de vous deux.

## Les règles pour utiliser l'IA

Vous aurez un tuteur IA tout au long de ce cursus, et chaque page a un bouton pour lui envoyer votre travail. L'IA accélère l'apprentissage si vous l'utilisez bien, et le vide discrètement de sa substance sinon. Le parcours fixe des règles strictes, et ce sont l'habitude la plus précieuse de cette leçon.

| Règle | Pourquoi |
|---|---|
| **Essayez d'abord.** Donnez-vous 20 minutes honnêtes avant de demander | C'est dans l'effort que l'on apprend |
| **Réexpliquez.** Ne gardez jamais une réponse que vous ne savez pas expliquer | Les entretiens et les incidents testent la compréhension |
| **Vérifiez.** Confrontez les affirmations à la source primaire | L'IA invente des options, des identifiants et des faits avec un aplomb total |
| **Notez.** Consignez chaque affirmation vérifiée, et si elle était juste | Au bout d'un an, vous saurez exactement où l'IA se trompe |
| **Protégez les données.** Ne collez jamais de secrets ni de données personnelles | C'est une fuite de données, et c'est un motif de licenciement |

@term hallucination = Quand une IA affirme avec assurance quelque chose de faux, comme une option de commande ou une loi qui n'existe pas.
@term source primaire = L'autorité d'origine sur un fait : le manuel, la norme, la spécification ou le code lui-même.

::: ai Comment utiliser le bouton de copie
Utilisez **Tout copier pour mon tuteur IA** *après* avoir répondu, pas avant. Vous vous faites alors corriger, et c'est ce qui construit la mémoire. Demander d'abord semble plus rapide, mais vous n'aurez rien appris.
:::

?? Une IA vous donne une commande avec une option que vous n'avez jamais vue. Quelle est l'étape professionnelle suivante ?
+ Vérifier l'option dans le manuel de l'outil lui-même
- La lancer tout de suite sur votre ordinateur
- Demander à l'IA si elle en est sûre
- Chercher la même affirmation sur les réseaux sociaux
=> L'IA ne peut pas se vérifier elle-même. Un manuel est une source primaire. Testez tout ce qui ne vous est pas familier dans un lab, jamais sur une machine à laquelle vous tenez.

## Votre contrat d'apprentissage

Le parcours vous demande d'écrire un contrat d'une page avec vous-même. Ça paraît idiot, et ça marche, parce que vous décidez *maintenant* de ce que vous ferez un mauvais jour.

?! Rédigez votre contrat : votre objectif, combien d'heures par semaine vous étudierez, quand, et comment vous vous récompenserez. Le parcours suggère 12 à 15 heures en plus de votre master, ou 5 en période d'examens.

Ensuite, on ouvre l'ordinateur lui-même.
