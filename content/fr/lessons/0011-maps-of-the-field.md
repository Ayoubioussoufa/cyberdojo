---
title: Les deux cartes du domaine
summary: Le NIST CSF pour la façon dont les organisations se défendent, et MITRE ATT&CK pour la façon dont les attaquants opèrent. Chaque mois suivant s'y rattache.
builds: dessiner les deux cartes de mémoire, une tâche de première semaine sur le parcours
source: Les tactiques Enterprise de MITRE ATT&CK (en anglais) | https://attack.mitre.org/tactics/enterprise/
words: tactique, technique, référentiel
---
La cybersécurité est immense, et il est facile de s'y perdre. Deux cartes publiques et gratuites en organisent presque tout. L'une montre le côté du défenseur, l'autre celui de l'attaquant. À la fin de cette leçon, vous saurez placer presque tout ce que vous lisez sur l'une d'elles.

@term référentiel (framework) = Une structure publiée pour organiser la façon de penser ou de faire quelque chose.
@term NIST = Le *National Institute of Standards and Technology* américain, qui publie des guides de sécurité largement utilisés.
@term NIST CSF (Cybersecurity Framework) = La carte du NIST de ce qu'une organisation devrait faire en sécurité, en six fonctions.
@term MITRE ATT&CK (ATT&CK) = Une base de connaissances publique du comportement réel des attaquants, organisée par objectif.
@term tactique = Dans ATT&CK, l'objectif de l'attaquant à une étape : le pourquoi.
@term technique = Dans ATT&CK, la façon dont un attaquant atteint une tactique : le comment.

## La carte du défenseur : NIST CSF 2.0

Le [NIST Cybersecurity Framework 2.0](https://www.nist.gov/cyberframework) regroupe tout ce que fait une organisation en [six fonctions](https://www.nist.gov/cyberframework/faqs). Le NIST les décrit comme simultanées et continues : elles tournent toutes à la fois, tout le temps.

| Fonction | La question à laquelle elle répond | Exemple |
|---|---|---|
| **Govern** (gouverner) | Quelle est notre stratégie, et qui est responsable ? | Politique, rôles, risque de la chaîne d'approvisionnement |
| **Identify** (identifier) | Qu'avons-nous, et quels sont les risques ? | Inventaire des actifs, évaluation des risques |
| **Protect** (protéger) | Comment prévenir le dommage ? | MFA, correctifs, sensibilisation, sauvegardes |
| **Detect** (détecter) | Comment remarquer une attaque ? | Surveillance, alertes, revue des journaux |
| **Respond** (répondre) | Que faire quand elle survient ? | Contenir, communiquer, analyser |
| **Recover** (rétablir) | Comment revenir à la normale ? | Restaurer les systèmes, en tirer les leçons |

Un moyen utile de les retenir : **Govern** est au-dessus des cinq autres, qui suivent l'histoire d'un incident, d'avant jusqu'à après.

?? Une entreprise teste ses sauvegardes en restaurant un serveur après une panne. De quelle fonction s'agit-il ?
+ Recover, car elle rétablit les opérations normales de l'entreprise
- Protect, car les sauvegardes elles-mêmes comptent comme une protection
- Detect, car la panne avait été remarquée plus tôt
- Govern, car la direction interne doit d'abord forcément l'approuver
=> Avoir des sauvegardes fait partie de Protect. Les utiliser pour revenir à la normale après un incident, c'est Recover.

@drill csf

## La carte de l'attaquant : MITRE ATT&CK

[MITRE ATT&CK](https://attack.mitre.org/) est construit à partir d'attaques réelles observées. Ses colonnes sont les **tactiques**, les objectifs de l'attaquant. Sous chacune se trouvent des **techniques**, les façons d'atteindre cet objectif.

@term TTP = Tactiques, techniques et procédures : la façon dont se comporte un attaquant.

La matrice Enterprise compte actuellement [15 tactiques](https://attack.mitre.org/tactics/enterprise/) :

| # | Tactique | L'attaquant essaie de… |
|---|---|---|
| 1 | Reconnaissance | Rassembler des informations pour planifier |
| 2 | Resource Development | Préparer des outils et une infrastructure |
| 3 | Initial Access | Entrer |
| 4 | Execution | Exécuter son code |
| 5 | Persistence | Rester, même après un redémarrage |
| 6 | Privilege Escalation | Obtenir des droits plus élevés |
| 7 | Stealth | Éviter d'être remarqué |
| 8 | Defense Impairment | Affaiblir ou désactiver vos défenses |
| 9 | Credential Access | Voler des noms d'utilisateur et des mots de passe |
| 10 | Discovery | Comprendre l'environnement |
| 11 | Lateral Movement | Passer à d'autres systèmes |
| 12 | Collection | Rassembler les données voulues |
| 13 | Command and Control | Parler à ses outils à distance |
| 14 | Exfiltration | Voler les données |
| 15 | Impact | Perturber, détruire ou extorquer |

::: trap Les sources plus anciennes disent 14
Jusqu'en 2026, il existait une tactique appelée Defense Evasion. MITRE l'a [scindée](https://attack.mitre.org/resources/updates/updates-april-2026/) en Stealth et Defense Impairment. Beaucoup de cours, d'articles et de réponses d'IA disent encore 14. Vérifiez toujours la page actuelle, et regardez le numéro de version en bas.
:::

Les attaquants ne parcourent pas ces étapes dans l'ordre, et ils sautent de l'une à l'autre. Voyez-la comme un menu d'objectifs, pas une ligne droite.

Voici la différence entre une tactique et une technique. **Credential Access** est une tactique : l'objectif est de voler des identifiants. Extraire les empreintes de mots de passe depuis la mémoire est une technique : une façon de le faire. Chacune a un identifiant que vous verrez sur chaque détection et chaque rapport.

::: why Comment cela change la défense
Vous ne pouvez pas bloquer chaque outil, car les attaquants en changent facilement. Mais leur **comportement** change beaucoup plus lentement. Rattacher les détections à ATT&CK, c'est se défendre contre ce que font les attaquants, pas contre un seul fichier. Vous bâtirez sur cette idée au mois 9.
:::

?? Un attaquant utilise des identifiants volés pour se connecter à un deuxième serveur. Quelle tactique ?
+ Lateral Movement, puisqu'il s'est déplacé entre des systèmes
- Initial Access, puisqu'une connexion a bien eu lieu
- Persistence, puisqu'il est bien resté sur le réseau
- Discovery, puisqu'il a trouvé une autre machine proche
=> Il est déjà à l'intérieur et passe à un autre système. Voler ces identifiants était une étape distincte, sous Credential Access.

@drill tactic

## Comment les deux cartes s'assemblent

Elles regardent le même combat depuis des côtés opposés. ATT&CK dit ce que fait l'attaquant. Le CSF dit comment l'organisation est organisée pour y faire face. Une détection que vous écrirez au mois 11 est une activité de **Detect** visant une **technique** ATT&CK.

::: try Tâche du parcours
Fermez cette page et dessinez les deux cartes sur papier, de mémoire : six fonctions et autant de tactiques que possible. Puis corrigez-vous. C'est une tâche de première semaine, et elle marche parce que le rappel demande un effort.
:::

?! Un gang de rançongiciel hameçonne un employé, vole un mot de passe d'administrateur, se répand sur le réseau, copie les données et les chiffre. Nommez la tactique ATT&CK de chaque étape.

## Ce que vous savez faire maintenant

Vous avez la carte à laquelle chaque mois suivant se rattache. Il est temps de quitter le navigateur et de construire un vrai lab.
