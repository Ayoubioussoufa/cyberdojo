---
title: Le vocabulaire du risque
summary: Menace, vulnérabilité, risque, surface d'attaque, défense en profondeur : les mots sur lesquels repose toute conversation de sécurité.
builds: employer correctement le vocabulaire de base dans n'importe quelle réunion ou entretien
source: Glossaire du NIST (en anglais) | https://csrc.nist.gov/glossary
words: menace, vulnérabilité, risque, surface d'attaque
---
Vous savez maintenant comment fonctionne une machine. Cette leçon vous donne les mots que les professionnels utilisent pour raisonner sur ce qui pourrait mal tourner. Ceux qui confondent ces mots ont l'air d'amateurs, et ils prennent de mauvaises décisions.

@term menace = Tout ce qui pourrait causer un dommage : une personne, un groupe, ou un événement comme une inondation.
@term vulnérabilité = Une faiblesse qu'une menace pourrait exploiter.
@term risque = La probabilité d'un dommage combinée à sa gravité.
@term exploit = Une technique ou un bout de code qui tire parti d'une vulnérabilité.
@term actif = Tout ce qui a de la valeur et que vous protégez : données, systèmes, personnes, réputation.
@term mesure (contrôle) = Une protection qui réduit le risque, comme la MFA ou les sauvegardes.
@term surface d'attaque = Tous les points par lesquels un attaquant pourrait tenter d'entrer ou de faire sortir des données.
@term défense en profondeur = Utiliser plusieurs couches de protection indépendantes, pour qu'une seule défaillance ne soit pas fatale.
@term MFA (authentification multifacteur) = Exiger une seconde preuve d'identité en plus du mot de passe.
@term hameçonnage (phishing) = Tromper quelqu'un par message pour lui soutirer ses identifiants ou lui faire lancer quelque chose de nuisible.

## Menace, vulnérabilité, risque

Imaginez votre maison.

- L'**actif** est ce que vous voulez garder : votre ordinateur, votre famille.
- Une **menace** est ce qui pourrait causer un dommage : un cambrioleur, ou une inondation.
- Une **vulnérabilité** est une faiblesse : une serrure de fenêtre cassée.
- Le **risque** est la combinaison : quelle est la probabilité d'un cambriolage, et sa gravité ?
- Une **mesure** est ce que vous faites : réparer la serrure, prendre une assurance.

Le NIST définit une [vulnérabilité](https://csrc.nist.gov/glossary/term/vulnerability) comme une « faiblesse dans un système d'information, dans ses procédures de sécurité, dans ses contrôles internes ou dans sa mise en œuvre, qu'une source de menace pourrait exploiter ou déclencher », et le [risque](https://csrc.nist.gov/glossary/term/risk) comme une fonction du dommage et de sa probabilité.

::: key
**Risque ≈ probabilité × impact.** Une faille sans menace est un risque faible. Une menace sans rien de précieux à atteindre est un risque faible. Le risque a besoin de toutes les pièces. C'est pourquoi on ne peut pas tout corriger : on corrige ce qui compte le plus.
:::

?? Un serveur, dans une pièce fermée à clé et sans réseau, a une faille non corrigée. Quel énoncé est le plus juste ?
+ La vulnérabilité existe bel et bien, mais le risque reste faible
- Le risque est élevé, car toute faille connue est forcément dangereuse
- Il n'y a pas de vulnérabilité, car personne ne peut l'atteindre
- La menace est élevée, car le correctif n'a pas été posé
=> La faiblesse est réelle, mais la probabilité est très faible. Séparer ces deux idées est ce qui vous permet de hiérarchiser.

@drill tvr

## La surface d'attaque

Votre **surface d'attaque**, c'est tout ce qu'un attaquant peut toucher : chaque port réseau ouvert, chaque page de connexion, chaque boîte mail, chaque employé. Le NIST l'appelle [l'ensemble des points de la frontière](https://csrc.nist.gov/glossary/term/attack_surface) où un attaquant peut tenter d'entrer, de produire un effet ou d'extraire des données.

La réduire est souvent la sécurité la moins chère que vous puissiez acheter. Coupez le service que personne n'utilise, et chaque bug futur de ce service cesse de compter.

?? Quelle action réduit le plus directement une surface d'attaque ?
+ Couper un service dont plus personne ne se sert
- Acheter un serveur plus grand et plus puissant encore
- Écrire une politique de mot de passe plus longue
- Ajouter encore plus de stockage de journaux au SIEM
=> Un service qui ne tourne pas ne peut pas être attaqué, et tous ses bugs futurs cessent de compter.

## La défense en profondeur

Aucune mesure n'est parfaite à elle seule, alors on les superpose. Un château médiéval avait des douves, des murs, un donjon et des gardes, et franchir l'un d'eux ne gagnait pas la bataille.

@flow Filtre antispam > Sensibilisation > MFA > Moindre privilège > Surveillance > Sauvegardes

Prenez l'hameçonnage. Le filtre laisse passer le courriel. La sensibilisation échoue et un utilisateur clique. La MFA empêche le mot de passe volé de fonctionner. Si elle échoue aussi, le moindre privilège limite ce que l'attaquant atteint, la surveillance lève une alerte, et les sauvegardes rendent la reprise possible. Chaque couche suppose que la précédente a échoué.

?? Pourquoi avoir à la fois la MFA et la surveillance, si la MFA stoppe la plupart des mots de passe volés ?
+ Chaque couche couvre les cas où une autre échoue
- Les régulateurs exigent exactement deux mesures par compte utilisateur
- La surveillance rend les codes MFA durs à deviner
- La MFA ne fonctionne que si un outil surveille
=> C'est la défense en profondeur. Supposez que chaque mesure peut échouer, et demandez ce qui prend le relais quand elle échoue.

## Mettre tout ensemble

Voici comment un professionnel pense face à une seule trouvaille :

> « La page de connexion n'a pas de limite de débit (**vulnérabilité**). Des robots qui devinent les mots de passe frappent tous les sites publics (**menace**), donc la probabilité est élevée. Elle protège des données clients (**actif**), donc l'impact est élevé. C'est un **risque** élevé. Nous ajouterons une limite de débit et la MFA (**mesures**). »

Cette phrase, au mois 12, devient une entrée de registre des risques. Au mois 8, c'est une trouvaille de test d'intrusion. La structure ne change jamais.

?! Prenez quelque chose de votre vie, comme votre téléphone ou votre courriel. Nommez un actif, une menace, une vulnérabilité et une mesure, puis énoncez le risque en une phrase.

## Ce que vous savez faire maintenant

Vous savez raisonner sur la sécurité à voix haute, avec les bons mots. Ensuite, les deux cartes qui organisent tout le domaine.
