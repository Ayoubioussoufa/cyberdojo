---
title: Attaques sur l'identité et Entra ID
summary: Les chemins d'attaque de BloodHound, l'identité dans le cloud avec Entra ID, l'accès conditionnel, et la revue de la surface d'attaque d'identité de votre labo.
builds: trois chemins BloodHound expliqués, et un locataire Entra avec la MFA imposée, ce qui termine P04
source: Documentation de BloodHound Community Edition (en anglais) | https://bloodhound.specterops.io/
words: chemin d'attaque, Entra ID, accès conditionnel
---
Les attaquants pensent en graphes. Un utilisateur ordinaire n'est peut-être pas administrateur, mais il peut appartenir à un groupe qui peut réinitialiser le mot de passe d'un compte qui est administrateur d'un serveur où un Admin du domaine a une session ouverte. Chaque étape est une petite permission. Ensemble, elles forment un chemin jusqu'au domaine.

@term chemin d'attaque = Une chaîne de permissions et de relations qui mène d'un compte peu privilégié à une cible de valeur.
@term BloodHound = Un outil qui cartographie les relations d'Active Directory sous forme de graphe pour révéler les chemins d'attaque.
@term abus d'ACL = Utiliser des permissions posées sur un objet AD, comme le droit de réinitialiser un mot de passe, pour en prendre le contrôle.
@term Entra ID = Le service d'identité cloud de Microsoft, autrefois appelé Azure AD.
@term locataire = L'instance séparée d'une organisation dans un service cloud comme Entra ID.
@term principal de service = L'identité qu'utilise une application dans Entra ID.
@term accès conditionnel = Des stratégies Entra qui décident de l'accès selon qui, d'où, avec quel appareil et quel risque.

## BloodHound : voir le graphe

[BloodHound CE](https://bloodhound.specterops.io/) collecte les utilisateurs, les groupes, les sessions et les permissions, puis montre les chemins. **SharpHound** est son collecteur.

::: law
SharpHound interroge lourdement votre domaine, et c'est un outil connu qui déclenchera la surveillance. Ne le lancez que dans votre propre labo.
:::

Lire un chemin, c'est lire des permissions :

@flow ana > MemberOf HelpDesk > ForceChangePassword svc_sql > AdminTo SRV1 > HasSession dadmin > MemberOf Domain Admins

En clair : Ana est dans HelpDesk, qui peut réinitialiser le mot de passe de `svc_sql`. Ce compte est administrateur de SRV1, où un Admin du domaine a une session ouverte, donc ses identifiants peuvent être pris dans la mémoire.

| Arête | Signification |
|---|---|
| `GenericAll` | Contrôle total de l'objet |
| `ForceChangePassword` | Peut réinitialiser le mot de passe |
| `WriteDacl` | Peut changer les permissions de l'objet |
| `AddMember` | Peut ajouter des personnes au groupe |
| `HasSession` | Cet utilisateur a une session ouverte sur cette machine |

Un graphe n'est fait que de deux sortes de choses : des **nœuds**, qui sont ici des utilisateurs, des groupes et des ordinateurs, et des **arêtes**, qui sont les relations entre eux. Écrivez le chemin ci-dessus comme une liste d'arêtes et il devient une donnée sur laquelle vous pouvez raisonner :

```python
edges = [
    ("ana", "HelpDesk"),          # MemberOf
    ("HelpDesk", "svc_sql"),      # ForceChangePassword
    ("svc_sql", "SRV1"),          # AdminTo
    ("SRV1", "dadmin"),           # HasSession
    ("dadmin", "Domain Admins"),  # MemberOf
]
```

Trouver un chemin, c'est partir d'un nœud et suivre des arêtes, encore et encore, jusqu'à atteindre la cible ou ne plus avoir de nouvel endroit où aller. C'est tout ce que fait l'outil, sur un graphe de centaines de milliers d'arêtes. Écrivez-le une fois sur un petit graphe et l'image cesse d'être mystérieuse.

@code find-path

Maintenant, la question du défenseur. Parmi toutes les arêtes du trajet, lesquelles, retirées seules, ne laissent plus aucun chemin ? Ce sont les correctifs à faire en premier, et vous les trouvez en retirant chaque arête tour à tour et en cherchant de nouveau.

@code choke-points

Vous n'avez pas besoin d'un outil de graphes pour voir les arêtes une par une. L'appartenance aux groupes, y compris les groupes dans les groupes, tient en une commande, et les permissions de n'importe quel objet sont dans son onglet **Sécurité** de `dsa.msc`, une fois activé **Affichage → Fonctionnalités avancées** :

```powershell
Get-ADGroupMember "Domain Admins" -Recursive | Select-Object Name, objectClass
```

`-Recursive` compte. Un groupe qui en contient un autre transmet son pouvoir vers le bas, et l'appartenance imbriquée est l'origine de la plupart des administrateurs surprises.

L'usage du défenseur est le même : corriger les arêtes. Retirez une permission ou une session, et le chemin tombe.

@term PingCastle = Un outil gratuit qui donne une note à la posture de sécurité d'un Active Directory.

?? BloodHound montre `HelpDesk → GenericAll → Domain Admins`. Quel est le meilleur correctif ?
+ Retirer toute cette permission au groupe HelpDesk
- Renommer autrement le groupe Admins du domaine
- Demander à HelpDesk de ne pas l'utiliser
- Cacher le groupe à l'outil de collecte
=> Le chemin existe à cause de la permission. Retirez l'arête, puis relancez l'outil pour prouver que le chemin a disparu.

## L'identité dans le cloud : Entra ID

**Entra ID**, qui s'appelait Azure AD, n'est pas AD dans le cloud. C'est un autre système, construit pour le web : OAuth et OIDC plutôt que Kerberos et LDAP, avec des utilisateurs et des groupes à plat plutôt que des OU.

| Concept | Signification |
|---|---|
| **Locataire** | L'instance de votre organisation |
| **Inscription d'application** | Définit une application |
| **Principal de service** | L'identité de cette application dans un locataire |
| **Accès conditionnel** | Des règles si-alors : si cet utilisateur, avec ce risque, sur cet appareil, alors exiger la MFA ou bloquer |
| **Journaux de connexion** | Chaque connexion, avec son résultat, son lieu, son appareil |
| **Journaux d'audit** | Les changements : rôles, utilisateurs, applications |

L'[accès conditionnel](https://learn.microsoft.com/fr-fr/entra/identity/conditional-access/overview) est de l'ABAC en action : « exiger un appareil conforme et une MFA résistante à l'hameçonnage pour les administrateurs ».

Beaucoup d'entreprises fonctionnent en **hybride** : un AD sur site synchronisé avec Entra. Une compromission peut donc passer de l'un à l'autre.

::: try Votre locataire
Créez un locataire [Microsoft Entra](https://www.microsoft.com/en-us/security/business/identity-access/microsoft-entra-id) gratuit. Ajoutez des utilisateurs et des groupes, imposez la MFA, connectez-vous, et lisez les journaux de connexion. Voyez à quoi ressemble une connexion échouée, et ce qu'enregistre une connexion réussie.
:::

Une stratégie d'accès conditionnel est une phrase en deux moitiés, et le portail la présente ainsi :

| Moitié | Réglage | Exemple |
|---|---|---|
| **Si** | Utilisateurs | Tous les membres du groupe Admins, sauf le compte de secours |
| **Si** | Ressources cibles | Toutes les applications cloud |
| **Si** | Conditions | Tout lieu, tout appareil |
| **Alors** | Accorder | Exiger une MFA résistante à l'hameçonnage et un appareil conforme |

Deux habitudes empêchent une nouvelle stratégie d'enfermer l'entreprise dehors. Activez-la d'abord en mode **rapport seul** : elle enregistre alors ce qu'elle aurait fait sans rien appliquer, et vous lisez le résultat dans les journaux de connexion. Et gardez un **compte d'accès d'urgence** hors de toute stratégie, avec un long mot de passe aléatoire conservé hors ligne, pour le jour où une stratégie ou le service de MFA lui-même tombera en panne.

Chaque ligne du journal de connexion est une tentative, et elle répond aux mêmes questions qu'un 4624 de Windows :

```
User: ana@corp.example     Application: Office 365 Exchange Online
IP address: 203.0.113.50   Location: Lyon, FR
Status: Success            Conditional Access: Success
Authentication requirement: Multifactor authentication
```

Qui, vers quoi, d'où, si cela a fonctionné, et quelle stratégie s'est appliquée. Le portail vous laisse filtrer sur chacun de ces champs, et « Status: Failure » regroupé par adresse IP est la première recherche qui mérite d'être enregistrée.

Un moteur de stratégies est une liste de règles vérifiées dans l'ordre. En écrire un tout petit montre pourquoi l'ordre compte.

@code access-decision

?? Entra ID est-il simplement Active Directory dans le cloud ?
+ Non, c'est un autre système, fait pour le web
- Oui, c'est la même base de données, simplement déplacée
- Oui, mais il ne sert qu'aux machines sous Windows
- Non, c'est un produit de pare-feu pour le cloud
=> Il utilise OAuth et OIDC plutôt que Kerberos et LDAP, et il n'a pas d'OU.

## Les attaques sur l'identité en un coup d'œil

| Attaque | Ce qui l'arrête |
|---|---|
| Pulvérisation de mots de passe | Mots de passe courants interdits, verrouillage intelligent, MFA |
| Bourrage d'identifiants | MFA, comparaison aux mots de passe compromis |
| Fatigue MFA | Correspondance de numéros, MFA résistante à l'hameçonnage |
| Vol de jeton | Durées de vie courtes, liaison à l'appareil, accès conditionnel |
| Hameçonnage par consentement | Restreindre le consentement des utilisateurs aux applications |
| Kerberoasting | Mots de passe longs et aléatoires, comptes de service gérés, AES |
| Pass-the-hash | Niveaux, Credential Guard, limitation des administrateurs locaux |
| Abus d'ACL | Audit avec BloodHound, moindre privilège |

?? Un attaquant pulvérise « Winter2026! » sur 500 comptes, un essai chacun. Pourquoi le verrouillage normal n'arrête-t-il pas cela ?
+ Chaque compte ne voit qu'une seule tentative ratée
- Le verrouillage ne vaut que pour les administrateurs
- La pulvérisation ne touche jamais le service d'authentification
- Les secrets à symboles échappent toujours au verrouillage
=> Elle reste sous le seuil pour chaque compte. Il faut une détection à travers les comptes, comme de nombreux 4625 depuis une seule source.

## Passer en revue la surface d'identité

Trois constats de la revue d'un environnement hybride. Décidez ce que chacun signifie avant de lire les choix.

```
ana → MemberOf → HelpDesk → ForceChangePassword → svc_sql → AdminTo → SRV1 → HasSession → dadmin
```

?? Quel changement supprime la dernière étape de ce chemin ?
+ Aucun Admin du domaine ne se connecte à SRV1
- Ana choisit un mot de passe beaucoup plus long
- SRV1 est renommé et reçoit un tout autre nom
- Le groupe HelpDesk reçoit une toute nouvelle description écrite
=> `HasSession` existe parce qu'un Admin du domaine ouvre une session sur un serveur ordinaire. Avec le modèle en niveaux, ce compte ne se connecte jamais qu'aux contrôleurs de domaine, et l'arête disparaît.

?? Le journal de connexion montre une adresse IP qui échoue une fois contre chacun de 60 comptes, puis réussit contre un seul. Que faites-vous en premier ?
+ Réinitialiser ce compte et examiner son activité
- Bloquer les 60 comptes qui ont tenu
- L'ignorer, puisque la plupart ont bien échoué
- Couper le journal pour réduire le bruit
=> C'est une pulvérisation qui a trouvé un mot de passe faible. Les 59 échecs sont les preuves, et l'unique réussite est l'incident.

?? Vous avez écrit une stratégie d'accès conditionnel qui exige un appareil conforme pour tous les utilisateurs. Comment l'activez-vous sans risque ?
+ En rapport seul d'abord, un compte de secours exclu
- Appliquée tout de suite, pour absolument tous les comptes
- Appliquée le vendredi soir, juste avant de tous partir
- En rapport seul pour toujours, pour ne rien casser
=> Le rapport seul montre qui aurait été bloqué avant que quiconque le soit. Le compte de secours exclu est le chemin de retour si la stratégie est fausse.

## Terminer P04

Le livrable : un domaine avec plus de 20 utilisateurs, 5 groupes, 3 GPO et un compte de service exposé au Kerberoasting, reconstruit à partir de votre propre script. Un schéma de Kerberos avec les identifiants d'événement. Trois chemins BloodHound expliqués par écrit. Le flux par code d'autorisation avec PKCE, sans notes. Un locataire Entra avec la MFA imposée. Voir le [mois 7](/roadmap/7/).

::: ai Exercice de la feuille de route
Demandez à un LLM comment le Kerberoasting apparaît dans les journaux. Vérifiez son affirmation (événement 4769 avec le type 0x17) dans la documentation de Microsoft et dans le journal Sécurité de votre labo. Tout ce qu'il a faux va dans le journal d'IA.
:::

?! Rédigez la revue de la « surface d'attaque d'identité » de votre labo en cinq points.
