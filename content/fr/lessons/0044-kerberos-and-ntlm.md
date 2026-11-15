---
title: Kerberos et NTLM
summary: Comment fonctionnent réellement les ouvertures de session Windows, ticket par ticket, et les identifiants d'événement qui consignent chaque étape.
builds: un schéma de Kerberos dessiné à la main et annoté avec les identifiants d'événement
source: adsecurity.org, la référence de Sean Metcalf sur la sécurité d'AD (en anglais) | https://adsecurity.org/
words: Kerberos, TGT, NTLM
---
« Comment fonctionne Kerberos ? » est une question d'entretien classique et la base de la moitié des attaques contre Active Directory. Cela paraît intimidant, mais c'est une suite de trois échanges, comme entrer dans un parc d'attractions.

@term Kerberos = Le protocole d'authentification par tickets utilisé par défaut dans Active Directory.
@term KDC (centre de distribution de clés) = Le service d'un contrôleur de domaine qui délivre les tickets Kerberos.
@term TGT (ticket d'octroi de tickets) = Le ticket qui prouve que vous êtes connecté, utilisé pour demander d'autres tickets.
@term ticket de service (TGS) = Un ticket qui donne accès à un service précis.
@term krbtgt = Le compte AD caché dont la clé chiffre tous les TGT.
@term NTLM = Un protocole d'authentification Windows plus ancien, par défi et réponse.
@term empreinte NT = L'empreinte d'un mot de passe Windows, utilisée directement par NTLM.
@term pré-authentification = Une étape de Kerberos qui prouve que le client connaît le mot de passe avant qu'un TGT soit délivré.
@term Kerberoasting = Demander un ticket de service et le casser hors ligne pour obtenir le mot de passe d'un compte de service.
@term AS-REP roasting = Casser des données venues de comptes qui n'exigent pas la pré-authentification Kerberos.
@term pass-the-hash = S'authentifier avec une empreinte NT volée, sans connaître le mot de passe.

## Le parc d'attractions

1. À l'entrée, vous montrez une pièce d'identité et recevez un **bracelet** : c'est le TGT.
2. À chaque attraction, vous montrez le bracelet à un guichet et recevez un **ticket d'attraction** : c'est le ticket de service.
3. Vous remettez le ticket à l'opérateur de l'attraction, qui vous laisse monter sans jamais voir votre pièce d'identité.

Votre mot de passe ne sert qu'à l'étape 1. Ensuite, les tickets font le travail.

Votre bracelet et vos tickets d'attraction sont de vrais objets que vous pouvez lister. Sur une machine Windows jointe au domaine, après avoir ouvert un dossier partagé sur le DC, lancez `klist` :

```
> klist
Cached Tickets: (2)

#0>  Client: ana @ CORP.LAB
     Server: krbtgt/CORP.LAB @ CORP.LAB
     KerbTicket Encryption Type: AES-256-CTS-HMAC-SHA1-96
     Start Time: 11/15/2026 9:02:11 (local)
     End Time:   11/15/2026 19:02:11 (local)

#1>  Client: ana @ CORP.LAB
     Server: cifs/dc1.corp.lab @ CORP.LAB
     KerbTicket Encryption Type: AES-256-CTS-HMAC-SHA1-96
```

| Ligne | Signification |
|---|---|
| `Server: krbtgt/CORP.LAB` | Celui-ci est le TGT. Son « service » est le service de tickets lui-même |
| `Server: cifs/dc1.corp.lab` | Un ticket de service pour le partage de fichiers sur `dc1`. Ce texte est un SPN |
| `Encryption Type` | Comment le ticket est protégé. AES-256 est ce que vous voulez voir |
| `Start Time`, `End Time` | Dix heures par défaut. Après, le bracelet est renouvelé ou vous vous reconnectez |

`klist purge` jette les tickets, et la prochaine chose que vous ouvrez en redemande de nouveaux sans rien dire. Les tickets dépendent aussi de l'horloge. Chacun porte des horodatages, et une machine dont l'heure s'écarte de plus de cinq minutes de celle du contrôleur de domaine voit ses demandes refusées, donc « Kerberos est cassé » veut très souvent dire « l'horloge est fausse ».

?? Quand votre mot de passe sert-il dans Kerberos ?
+ Seulement au début, pour le TGT
- À chaque service, pour chaque ticket
- Jamais, car Kerberos s'en passe complètement
- Chaque heure, pour renouveler le ticket
=> Après le premier échange, les tickets font le travail.

## Les trois échanges

| Étape | Message | Ce qui se passe | Événement sur le DC |
|---|---|---|---|
| 1 | **AS-REQ / AS-REP** | Le client prouve qu'il connaît le mot de passe, en chiffrant un horodatage. Le KDC renvoie un **TGT**, chiffré avec la clé de `krbtgt` | **4768** (TGT demandé), **4771** (échec de la pré-authentification) |
| 2 | **TGS-REQ / TGS-REP** | Le client présente le TGT et nomme un service par son SPN. Le KDC renvoie un **ticket de service**, chiffré avec **la clé du compte de service** | **4769** (ticket de service demandé) |
| 3 | **AP-REQ** | Le client présente le ticket au service | Ouverture de session sur le serveur : **4624** |

@seq Client | KDC | Service
Client > KDC: AS-REQ : je connais mon mot de passe
KDC > Client: AS-REP : voici un TGT
Client > KDC: TGS-REQ : le TGT, et je veux ce service
KDC > Client: TGS-REP : voici un ticket de service
Client > Service: AP-REQ : voici mon ticket

Deux détails comptent pour la suite :

- **Quiconque a un TGT valide peut demander un ticket pour n'importe quel service.** Le KDC ne vérifie pas si vous avez le droit de l'utiliser : le service le fait plus tard.
- Un ticket de service est chiffré avec **la clé dérivée du mot de passe du compte de service**.

Chaque échange laisse un événement dont vous pouvez lire les champs. Voici un 4769, raccourci :

```
Event 4769: A Kerberos service ticket was requested.
    Account Name:            ana@CORP.LAB
    Service Name:            svc_sql
    Client Address:          ::ffff:192.168.56.20
    Ticket Encryption Type:  0x12
    Failure Code:            0x0
```

Qui a demandé, pour quel compte de service, depuis quelle machine, comment le ticket a été chiffré, et si cela a fonctionné. Le type de chiffrement est le champ à apprendre :

| Valeur | Algorithme |
|---|---|
| `0x11` | AES-128 |
| `0x12` | AES-256 |
| `0x17` | RC4-HMAC, ancien et faible |

?? Quelle clé chiffre un ticket de service Kerberos ?
+ La clé du compte de service visé
- La propre clé de l'utilisateur qui demande
- La clé du compte de service `krbtgt`
- La clé machine du contrôleur de domaine
=> Seul le service a besoin de le lire. Et puisque le demandeur peut l'obtenir, il peut essayer de le casser hors ligne : c'est le Kerberoasting.

## NTLM

**NTLM** est plus ancien. Le serveur envoie un défi, et le client répond en utilisant son **empreinte NT**. Aucun tiers ne délivre de tickets. Il survit pour la compatibilité, et quand vous vous connectez par adresse IP plutôt que par nom, Windows se rabat en général sur lui.

La grande faiblesse : l'empreinte elle-même suffit. Volez-la et vous pouvez vous authentifier sans jamais connaître le mot de passe. C'est le **pass-the-hash**.

Vous pouvez regarder Windows choisir entre les deux. Depuis un poste du domaine, listez un partage du DC deux fois, une fois par nom et une fois par adresse, puis lisez les deux événements 4624 sur le DC :

```
dir \\dc1.corp.lab\SYSVOL          par nom : Kerberos peut trouver le SPN du service
dir \\192.168.56.10\SYSVOL         par adresse : aucun SPN à chercher, donc NTLM
```

Dans chaque événement, le champ `Authentication Package` indique `Kerberos` ou `NTLM`. Sur un réseau sain, NTLM entre machines du domaine devrait être rare, et c'est ce qui justifie un second regard quand il apparaît.

?? Pourquoi le pass-the-hash est-il possible avec NTLM ?
+ L'empreinte seule suffit pour se connecter
- L'empreinte peut être inversée en secret
- NTLM envoie le secret en clair
- NTLM n'a aucune forme d'authentification réelle
=> Le client répond au défi avec l'empreinte, donc celui qui la détient peut répondre aussi.

## Les attaques, dans leur principe

| Attaque | Idée | Indice de détection |
|---|---|---|
| **Pulvérisation de mots de passe** | Un mot de passe courant, beaucoup de comptes | Beaucoup de 4625 ou de 4771 répartis sur des comptes |
| **Kerberoasting** | Demander des tickets de service, les casser hors ligne | 4769 avec un chiffrement RC4 (type 0x17), beaucoup de services, un seul utilisateur |
| **AS-REP roasting** | Les comptes sans pré-authentification livrent des données cassables | 4768 avec un type de pré-authentification 0 |
| **Pass-the-hash** | Utiliser directement une empreinte NT | Des ouvertures de session NTLM (4624, type 3) là où vous attendiez Kerberos |
| **Golden ticket** | La clé `krbtgt` volée permet de forger n'importe quel TGT | Difficile : des tickets qui ne sont jamais passés par le KDC |

Chaque ligne de ce tableau a une défense qui supprime la faiblesse, et un défenseur est censé connaître les deux colonnes :

| Attaque | Ce qui l'arrête |
|---|---|
| Pulvérisation de mots de passe | Des mots de passe longs comparés aux listes de mots de passe compromis, la MFA, un verrouillage réglé pour ralentir les essais |
| Kerberoasting | Des comptes de service gérés de groupe, ou des mots de passe aléatoires de 25 caractères et plus, et un chiffrement AES seulement |
| AS-REP roasting | Laisser la pré-authentification activée pour chaque compte, et auditer les exceptions |
| Pass-the-hash | Le modèle en niveaux, aucun mot de passe d'administrateur local partagé, la restriction de NTLM |
| Golden ticket | Protéger les DC avant tout le reste, et changer deux fois le mot de passe de `krbtgt` après une compromission |

Détecter, c'est compter. L'indice du Kerberoasting est un compte qui demande beaucoup de services différents en peu de temps, et vous pouvez écrire cette règle vous-même.

@code kerberoast-suspects

La pulvérisation retourne l'image habituelle de la force brute : au lieu de nombreux mots de passe contre un compte, c'est un seul mot de passe contre de nombreux comptes, donc aucun compte n'échoue assez souvent pour se verrouiller. Compter les comptes distincts par source la révèle.

@code spray-suspects

Pourquoi RC4 ? Le type de chiffrement [`0x17` désigne RC4-HMAC](https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-10/security/threat-protection/auditing/event-4769) (en anglais), bien plus rapide à casser qu'AES. Microsoft éloigne peu à peu Kerberos de RC4, donc vérifiez ce qui est en vigueur sur votre version de Windows.

@term golden ticket = Un TGT falsifié, fabriqué avec la clé krbtgt volée, qui donne accès à tout dans le domaine.

?? Pourquoi le Kerberoasting est-il difficile à empêcher avec le verrouillage de compte ?
+ Le cassage se fait hors ligne, loin du domaine
- Les comptes de service sont exclus de toute stratégie
- Les tickets Kerberos ne peuvent absolument jamais être journalisés
- Le verrouillage ne s'applique jamais qu'au seul compte Administrateur
=> Après avoir obtenu le ticket, l'attaquant ne parle plus jamais au domaine, il n'y a donc aucun échec d'ouverture de session à verrouiller. Des mots de passe longs et aléatoires, ou des comptes de service gérés, sont le vrai correctif.

::: try Dans votre labo
Activez l'audit, puis ouvrez une session et un partage de fichiers sur le DC. Trouvez 4768, 4769 et 4624 dans le journal Sécurité, et associez-les aux étapes ci-dessus. Dessinez ensuite le schéma complet à la main, avec les identifiants d'événement. C'est votre livrable de fin de mois.
:::

@drill event-ids

## Lire le journal du contrôleur de domaine

Trois éléments du journal Sécurité d'une matinée. Décidez ce que chacun signifie avant de lire les choix.

?? En une minute, le compte `tom` produit quarante événements 4769, chacun pour un compte de service différent, tous avec le type de chiffrement `0x17`. À quoi cela ressemble-t-il ?
+ Du Kerberoasting, des tickets à casser hors ligne
- Une connexion normale, un ticket pour chaque service
- Un problème d'horloge, les demandes étant toujours refusées
- Un golden ticket, forgé directement sur le DC
=> Une personne utilise une poignée de services. Demander tous les comptes de service d'un coup, avec le chiffrement le plus faible, c'est collecter de quoi deviner des mots de passe.

?? Les utilisateurs d'un poste ne peuvent soudain plus ouvrir aucun partage réseau, et son horloge avance de douze minutes. Pourquoi cela casserait-il les ouvertures de session ?
+ Kerberos rejette les heures décalées de cinq minutes
- NTLM rejette toute horloge qui est en avance
- Le DNS rejette les noms si l'horloge dérive
- Les stratégies de groupe s'arrêtent toujours après midi
=> Les tickets et les demandes portent des horodatages pour ne pas pouvoir être rejoués plus tard. Au-delà des cinq minutes permises, le DC les rejette.

?? Un 4624 sur un serveur de fichiers montre une ouverture de session réseau depuis une autre machine du domaine avec `Authentication Package: NTLM`. Quelle est la lecture raisonnable ?
+ À vérifier, car Kerberos était attendu ici
- La preuve d'un mot de passe cassé
- Normal, car NTLM est choisi par défaut
- Une erreur, car NTLM n'existe plus aujourd'hui
=> Il peut s'agir d'une connexion faite par adresse IP, ce qui est sans gravité. C'est aussi à cela que ressemble le pass-the-hash, donc vous vérifiez la source et ce qu'elle a fait ensuite.

?! Expliquez Kerberos avec votre propre analogie, puis dites exactement où le Kerberoasting l'attaque.

### Pour aller plus loin

Les sources primaires et le meilleur matériel gratuit sur ce sujet, tous vérifiés en novembre 2026 :

- [RFC 4120 : The Kerberos Network Authentication Service (V5)](https://www.rfc-editor.org/rfc/rfc4120) (en anglais)
- [Microsoft Learn : vue d'ensemble de l'authentification Kerberos](https://learn.microsoft.com/fr-fr/windows-server/security/kerberos/kerberos-authentication-overview)
- [Microsoft Learn : vue d'ensemble de NTLM](https://learn.microsoft.com/fr-fr/windows-server/security/kerberos/ntlm-overview)
