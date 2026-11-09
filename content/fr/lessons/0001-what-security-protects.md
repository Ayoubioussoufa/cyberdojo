---
title: Ce que la sécurité protège vraiment
summary: Trois promesses que tient chaque système, et comment nommer celle qui a été rompue dans n'importe quel incident dont vous lisez le récit.
builds: classer de vrais incidents comme le fait un professionnel
source: Glossaire du NIST, les définitions officielles de la confidentialité, de l'intégrité et de la disponibilité | https://csrc.nist.gov/glossary/term/confidentiality
words: confidentialité, intégrité, disponibilité
---
Avant les outils, avant le piratage, avant la moindre commande, il y a une question : **qu'essaie-t-on de protéger ?** Tout ce cursus de 24 mois repose sur la réponse, alors on commence ici.

@term sécurité de l'information (cybersécurité) = Protéger l'information, et les systèmes qui la traitent, contre l'accès, la modification ou la perturbation non autorisés.
@term confidentialité = La promesse que l'information n'est vue que par les personnes autorisées à la voir.
@term intégrité = La promesse que l'information n'a pas été modifiée sans autorisation, et qu'on peut s'y fier.
@term disponibilité = La promesse que l'information et les services fonctionnent quand les bonnes personnes en ont besoin.
@term triade CIA (CIA, DIC) = Les trois promesses de base de la sécurité : confidentialité, intégrité et disponibilité. Rien à voir avec l'agence américaine. En français, on dit aussi DIC.

## Pensez à un compte en banque

Oubliez les ordinateurs une minute. Vous faites confiance à votre banque pour trois choses :

1. **Personne d'autre ne voit votre solde.** Si un inconnu peut le lire, la banque a échoué.
2. **Le montant est juste.** Si quelqu'un a discrètement changé 1 000 € en 10 €, la banque a échoué, même si personne n'a « vu » quoi que ce soit de secret.
3. **Vous pouvez retirer votre argent quand vous en avez besoin.** Si l'appli est en panne le jour du loyer, la banque a échoué, même si votre argent est en sécurité et le montant juste.

Ce sont trois échecs différents, avec trois remèdes différents. Les professionnels de la sécurité leur donnent un nom :

| Promesse | Sens courant | Rompue quand… |
|---|---|---|
| **Confidentialité** | Seules les bonnes personnes peuvent la **voir** | Des dossiers médicaux fuitent en ligne |
| **Intégrité** | Personne ne peut la **modifier** indûment | Les coordonnées bancaires d'une facture sont changées |
| **Disponibilité** | Elle **fonctionne** quand on en a besoin | Un rançongiciel bloque les fichiers d'un hôpital |

Ensemble, on les appelle la **triade CIA** (pour *Confidentiality, Integrity, Availability* ; en français, on parle aussi de DIC). Les définitions officielles américaines disent presque exactement cela : la [confidentialité](https://csrc.nist.gov/glossary/term/confidentiality) consiste à « préserver les restrictions autorisées sur l'accès à l'information et sa divulgation », l'[intégrité](https://csrc.nist.gov/glossary/term/integrity) à « se prémunir contre la modification ou la destruction indue de l'information », et la [disponibilité](https://csrc.nist.gov/glossary/term/availability) à « garantir un accès et une utilisation de l'information fiables et en temps voulu ».

::: key
Chaque incident de sécurité rompt au moins une de ces trois promesses. Quand vous lisez le récit d'une attaque, votre première question est toujours : **quelle promesse a été rompue ?**
:::

?? Un étudiant modifie sa note d'examen dans la base de données de l'université. Quelle promesse est rompue ?
+ L'intégrité, car la note a été modifiée
- La confidentialité, car la note était visible
- La disponibilité, car la note a disparu
- Aucune, car personne n'a perdu un centime
=> La note a été changée sans autorisation, donc on ne peut plus se fier à la donnée. L'étudiant l'a sans doute vue aussi, mais le dommage, c'est la modification.

## Un incident peut en rompre plusieurs

Les vraies attaques restent rarement dans une seule case. Prenez le rançongiciel, un programme qui bloque vos fichiers et exige un paiement pour les débloquer. Au premier coup d'œil, c'est une attaque contre la disponibilité : plus personne ne peut ouvrir ses fichiers. Mais les gangs de rançongiciels modernes copient généralement les données d'abord, puis menacent de les publier. C'est aussi une atteinte à la confidentialité.

Ne cherchez donc pas « la » réponse. Cherchez le **dommage principal**, et nommez aussi les autres. C'est cette habitude qui rendra vos rapports d'incident précis plus tard.

@term rançongiciel (ransomware) = Un logiciel malveillant qui bloque les fichiers ou les systèmes d'une victime et exige un paiement, souvent après avoir aussi volé les données.

::: trap
La disponibilité n'a pas besoin d'un attaquant. Une coupure de courant, un disque qui lâche ou une mauvaise mise à jour logicielle rompent tous la disponibilité. La sécurité ne parle pas que de malfaiteurs : elle parle de promesses tenues.
:::

@drill cia

?? Le système de prise de rendez-vous d'un hôpital est inondé de faux trafic et personne ne peut réserver. Aucune donnée n'a été lue ni modifiée. Qu'est-ce qui est rompu ?
+ La disponibilité, car personne n'a pu utiliser le service
- L'intégrité, car le trafic reçu par l'hôpital était faux
- La confidentialité, car les attaquants ont atteint le système
- L'intégrité, car les réservations sont devenues fausses d'un coup
=> Les données sont intactes et privées, mais le service ne fonctionne pas quand on en a besoin. Ce genre d'inondation s'appelle une attaque par déni de service.

@term déni de service (DoS) = Une attaque qui rend un service inutilisable, par exemple en l'inondant de trafic.

## Trois autres mots dont vous aurez besoin

Savoir *quoi* protéger mène tout droit au *comment*. Quand vous vous connectez à quoi que ce soit, trois choses distinctes se produisent :

- **L'authentification** : prouver qui vous êtes. « Je suis Ana, voici mon mot de passe. »
- **L'autorisation** : décider ce que vous avez le droit de faire. « Ana peut lire ce fichier, mais pas le supprimer. »
- **La traçabilité** (*accounting* en anglais) : enregistrer ce que vous avez fait. « Ana a ouvert ce fichier à 09 h 14. »

@term authentification (authN) = Prouver qui l'on est, par exemple avec un mot de passe ou une clé de sécurité.
@term autorisation (authZ) = Décider ce qu'une personne authentifiée a le droit de faire.
@term traçabilité (accounting) = Enregistrer qui a fait quoi et quand, généralement dans des journaux.

Pensez à un hôtel. Montrer votre passeport à l'accueil, c'est l'authentification. Votre carte qui n'ouvre que votre propre chambre, c'est l'autorisation. Le registre de la porte qui note quand elle a été ouverte, c'est la traçabilité.

::: why
Confondre ces trois notions cause de vraies fuites. Beaucoup d'applications web vérifient que vous êtes connecté (authentification) et oublient de vérifier que la facture demandée est bien la vôtre (autorisation). Au mois 8, vous apprendrez à trouver et corriger exactement cette erreur, appelée IDOR.
:::

?? Un site web laisse n'importe quel utilisateur connecté ouvrir la facture d'un autre en changeant un nombre dans l'URL. Que manque-t-il ?
+ L'autorisation, car on ne vérifie jamais l'appartenance
- L'authentification, car la connexion semble trop faible
- La traçabilité, car personne n'enregistre les visites
- La disponibilité, car d'autres factures peuvent s'afficher
=> L'utilisateur a prouvé qui il est, donc l'authentification a fonctionné. Le site ne s'est jamais demandé « cette facture est-elle à vous ? », et c'est un échec d'autorisation.

?! Avec vos propres mots : pourquoi un système peut-il être parfaitement disponible et confidentiel, et pourtant gravement défaillant ?

## Ce que vous savez faire maintenant

Vous pouvez lire n'importe quel titre d'actualité sur la sécurité et dire quelle promesse a été rompue. Essayez sur le prochain article que vous verrez. Cette seule habitude vous place devant la plupart des gens qui parlent de sécurité.

Ensuite, avant de toucher à quoi que ce soit de technique, on voit les règles qui vous gardent hors de prison.
