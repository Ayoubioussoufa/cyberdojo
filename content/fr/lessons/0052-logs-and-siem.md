---
title: Les sources de journaux et le SIEM
summary: Ce que prouve chaque journal, comment un SIEM transforme les journaux en données interrogeables, ce que cela coûte, et comment écrire des requêtes qui répondent à des questions.
builds: écrire de mémoire les trois requêtes du livrable
source: Must Learn KQL, série gratuite (en anglais) | https://github.com/rod-trent/MustLearnKQL
words: SIEM, normalisation, corrélation
---
Aucun journal ne raconte seul toute l'histoire. Votre compétence est de savoir quel journal peut répondre à quelle question, et d'obtenir la réponse vite. Un **journal** est simplement un fichier ou un flux de lignes qu'un système écrit sur ce qu'il a fait. Toute cette leçon consiste à transformer des millions de ces lignes en une réponse claire.

@term SIEM = *Security information and event management* : un système qui collecte les journaux de partout pour que vous puissiez y chercher et y poser des alertes.
@term normalisation = Convertir des formats de journaux différents en un ensemble commun de champs.
@term corrélation = Relier des événements de sources différentes en une seule histoire.
@term KQL = *Kusto Query Language*, utilisé par Microsoft Sentinel et Defender.
@term SPL = *Search Processing Language*, utilisé par Splunk.
@term ES|QL = Le langage de requête à pipes d'Elasticsearch.
@term rétention = La durée pendant laquelle les journaux sont conservés.
@term Wazuh = Une plateforme de surveillance de sécurité gratuite et open source.
@term auditd = Le système d'audit de Linux, qui enregistre les événements liés à la sécurité.
@term ingestion = Le fait de recevoir des journaux dans un système. Les SIEM facturent souvent selon le volume.

## Ce que prouve chaque journal

Chaque source voit une partie du tableau, et chacune a un angle mort.

| Source | Répond à | Ne peut pas vous dire |
|---|---|---|
| Sécurité Windows | Qui s'est connecté, ce qui a changé (4624, 4720) | Quelle commande a été lancée |
| Sysmon | Ce qui a tourné, avec quelle ligne de commande et quel parent (ID 1) | Qui était au clavier |
| auditd, auth.log sous Linux | Les connexions, sudo, les fichiers surveillés | Quoi que ce soit sur d'autres machines |
| EDR | Une activité riche des processus et des fichiers | Les appareils sans l'agent |
| Pare-feu | Les connexions autorisées ou bloquées | Ce qu'elles contenaient |
| Proxy | Les destinations web | Le trafic qui a évité le proxy |
| DNS | Quel hôte a recherché quel nom | S'il s'y est ensuite connecté |
| Passerelle de messagerie | Qui a reçu quoi | Ce qu'il en a fait ensuite |
| Journaux d'audit du cloud | Qui a appelé quelle API (CloudTrail) | Ce qui s'est passé dans un serveur |

Cette dernière colonne est la raison pour laquelle vous combinez les sources. Un pare-feu montre qu'un portable s'est connecté à une adresse. Le DNS montre le nom qu'il a recherché. Sysmon montre quel programme l'a fait. Ensemble, cela fait une histoire.

@drill log-source

?? Vous voulez savoir quel programme d'un portable s'est connecté à une adresse suspecte. Quel journal répond à cela ?
+ Les événements réseau de Sysmon, avec l'image du processus
- Le journal du pare-feu, qui montre seulement deux adresses
- La passerelle de messagerie, qui montre les derniers messages
- Le journal DNS, qui montre le nom résolu demandé
=> Les pare-feu voient des adresses et des ports, pas des programmes. La télémétrie de l'hôte, comme Sysmon ID 3, relie une connexion au processus qui l'a faite.

## Ce que fait un SIEM

@flow Collecter > Analyser > Normaliser > Stocker > Corréler et alerter > Chercher

Suivez un échec de connexion à travers lui :

```
Raw:   Oct 27 09:14:02 web1 sshd[811]: Failed password for root from 203.0.113.7 port 44210 ssh2
Parsed: time=09:14:02 host=web1 program=sshd outcome=failure user=root src_ip=203.0.113.7
```

L'**analyseur** a transformé une phrase en champs nommés. La **normalisation** rend ensuite les noms cohérents : si une source dit `src_ip` et une autre `client`, vous ne pouvez pas les joindre, donc les deux deviennent un seul nom commun. C'est la clé sans gloire. Quand l'analyse casse en silence, un tableau de bord n'affiche rien et paraît rassurant, donc vérifiez de vrais événements avant de lui faire confiance.

Vous avez écrit un analyseur de ce genre au mois 4, et il vaut la peine d'écrire exactement celui-ci, car il montre ce qu'un SIEM fait des millions de fois par seconde et où cela tourne mal : une ligne qui ne correspond pas au motif ne produit rien du tout.

@code parse-sshd-line

Pour les noms communs, beaucoup d'équipes utilisent un schéma publié, afin que personne n'ait à en inventer un. Dans l'[Elastic Common Schema](https://www.elastic.co/guide/en/ecs/current/index.html) (en anglais), l'adresse source est toujours `source.ip`, le compte est `user.name` et le résultat est `event.outcome`, quel que soit le produit qui a écrit la ligne d'origine. Normaliser, c'est alors une table de renommage par source.

@code normalize-event

La **corrélation** relie des événements : « cinq échecs, puis une réussite, depuis la même IP, en dix minutes ».

Relier des sources entre elles est ce qui transforme des journaux en histoire, et cela fonctionne en trouvant un champ que deux sources partagent. Le pare-feu sait quel portable s'est connecté à quelle adresse. Le DNS sait quel nom ce portable a recherché et quelle adresse est revenue. L'adresse est le champ commun, donc une jointure sur elle met un nom sur chaque connexion.

@code join-dns-firewall

?? Un tableau de bord montre zéro échec de connexion depuis une semaine, sur un serveur public très actif. Que devez-vous soupçonner en premier ?
+ L'analyse ou la collecte des journaux s'est cassée
- Les attaquants ont fini par y renoncer complètement
- Le serveur est devenu parfaitement sûr à présent
- Les échecs de connexion n'existent plus sur serveur
=> Un serveur public sans échecs est très improbable. Un graphique vide signifie souvent une chaîne cassée, donc vérifiez les événements bruts.

## Rétention et coût

Les journaux coûtent de l'argent à stocker et à interroger, et les SIEM facturent souvent selon le volume ingéré. Les équipes choisissent donc :

| Niveau | Usage typique | Compromis |
|---|---|---|
| Chaud | Interrogeable tout de suite, pendant des jours ou des semaines | Cher |
| Froid | Archivé, pendant des mois | Bon marché, lent à interroger |
| Écarté | Les journaux de débogage bruyants | Gratuit, perdu pour de bon |

Une intrusion est souvent découverte longtemps après son début, donc si la **rétention** est de 30 jours et que l'attaquant est arrivé il y a 60 jours, les preuves ont disparu. Décider quoi garder est une décision de sécurité, et parfois une décision juridique.

?? Un attaquant est entré il y a 90 jours, et votre SIEM garde 30 jours de journaux. Quelle est la conséquence ?
+ Les preuves les plus anciennes ont peut-être disparu
- Le SIEM restaurera tous ces journaux de lui-même
- Ces événements anciens n'ont été écrits nulle part
- L'activité de cet attaquant devient alors légalement permise
=> Si les anciens journaux n'ont pas été archivés quelque part, vous ne pouvez pas reconstituer le début. La rétention se décide avant un incident, pas pendant.

## Des requêtes qui répondent à des questions

Une requête est une question. Celles-ci se lisent comme votre pipeline du mois 1, et elles ont toutes une seule forme : **filtrer, puis regrouper et compter, puis trier**.

**Les échecs d'ouverture de session par source, en KQL :**

```
SecurityEvent
| where EventID == 4625
| summarize Failures = count() by IpAddress
| sort by Failures desc
```

Lisez-la ligne par ligne : prendre la table, garder les échecs d'ouverture de session, compter par IP, les plus gros d'abord.

**Nouveau service installé :**

```
Event
| where EventLog == "System" and EventID == 7045
| project TimeGenerated, Computer, RenderedDescription
```

**Les paires rares de processus parent et enfant**, à partir des données de Sysmon :

```
SysmonEvent
| where EventID == 1
| summarize Count = count() by ParentImage, Image
| sort by Count asc
```

Six opérateurs couvrent presque toutes les requêtes que vous écrirez pendant votre première année :

| Opérateur | Effet | Équivalent du mois 1 |
|---|---|---|
| `where` | Garde les lignes qui passent un test | `grep` |
| `project` | Ne garde que les colonnes nommées | `awk '{print $1, $9}'` |
| `summarize … by` | Regroupe les lignes et calcule un compte, une somme ou un autre agrégat | `sort \| uniq -c` |
| `sort by` | Ordonne le résultat | `sort -rn` |
| `take 10` | Garde les premières lignes | `head` |
| `extend` | Ajoute une colonne calculée | |

Le temps est le filtre que vous ajouterez à presque tout, car chercher dans un an de journaux est lent et cher. `ago()` compte à rebours depuis maintenant, et `bin()` arrondit les heures en tranches pour que vous puissiez compter par période :

```
SecurityEvent
| where TimeGenerated > ago(1h) and EventID == 4625
| summarize Failures = count() by IpAddress, bin(TimeGenerated, 10m)
| where Failures >= 5
```

En mots : les échecs d'ouverture de session de la dernière heure, comptés par adresse dans des tranches de dix minutes, en ne gardant que les tranches qui en ont cinq ou plus. C'est une détection de force brute en quatre lignes.

La même question dans les deux autres langages que vous rencontrerez, pour que vous voyiez que c'est une seule idée :

| Langage | Échecs d'ouverture de session par source |
|---|---|
| KQL | `SecurityEvent \| where EventID == 4625 \| summarize count() by IpAddress` |
| SPL | `index=wineventlog EventCode=4625 \| stats count by src_ip` |
| ES\|QL | `FROM logs-* \| WHERE event.code == "4625" \| STATS failures = COUNT(*) BY source.ip` |

Derrière chacune d'elles, il y a le même petit programme : regrouper les événements selon un champ, compter chaque groupe, et trier.

@code summarize-count

Les noms de tables varient selon l'environnement, donc traitez ces requêtes comme des formes. Le livrable vous demande d'écrire ces trois-là de mémoire. Le SPL de Splunk suit la même logique : `index=wineventlog EventCode=4625 | stats count by src_ip | sort -count`.

?? Vous voulez la première source d'échecs de connexion. Quel schéma est le bon ?
+ Filtrer, puis regrouper et compter, puis trier
- Trier, supprimer, puis chercher dans le texte
- Tout compter d'abord, puis filtrer le total
- Joindre chaque table, puis lire chaque ligne
=> C'est encore la forme de votre `grep | sort | uniq -c | sort -rn`, dans un autre langage.

## Lire une requête, et lire un silence

Deux choses que vous ferez chaque jour dans un SIEM : comprendre ce que demande la requête de quelqu'un d'autre, et remarquer quand les données ont cessé d'arriver.

```
SecurityEvent
| where EventID == 4624 and LogonType == 10
| summarize Logons = count() by Account, IpAddress
| sort by Logons desc
```

?? À quelle question cette requête répond-elle ?
+ Qui s'est connecté par Bureau à distance, et d'où
- Quels comptes ont échoué à se connecter, et combien
- Quels services ont été installés, et sur quels hôtes
- Quels programmes ont tourné, et avec quel processus parent
=> 4624 est une ouverture de session réussie, et le type 10 est le Bureau à distance. Regrouper par compte et par adresse donne une ligne par personne et par lieu.

```
Source          13:00   14:00   15:00   16:00
firewall        48210   47902   48377   47650
dc1-security     9120       0       0       0
```

?? Ce tableau compte les événements par source et par heure. Que vous dit la deuxième ligne ?
+ Les journaux du contrôleur de domaine n'arrivent plus
- Le contrôleur de domaine a été très calme
- Le pare-feu envoie vraiment beaucoup trop d'événements ici
- Les attaquants sont partis à deux heures précises
=> Un contrôleur de domaine ne produit jamais zéro événement. Depuis 14:00, vous êtes aveugle sur cette machine, et chaque détection qui en dépend est coupée en silence. La santé de la collecte est le premier tableau de bord à construire.

## Exercez-vous aux trois requêtes du livrable

Ces missions utilisent un shell, pour que vous puissiez travailler la logique avec des outils que vous connaissez déjà, sur un export réaliste.

@range siem

::: try Construisez le SIEM de votre labo
Déployez [Wazuh](https://documentation.wazuh.com/) et intégrez Windows avec Sysmon, Linux avec auditd, et votre pare-feu. Vérifiez l'analyse sur de vrais événements. C'est le début de [P06](/projects/P06/).
:::

?! Nommez le journal que vous consulteriez en premier pour chacun : une connexion suspecte, la recherche d'un domaine malveillant, un bucket cloud supprimé. Expliquez pourquoi.

### Pour aller plus loin

Les sources primaires et le meilleur matériel gratuit sur ce sujet, tous vérifiés en novembre 2026 (en anglais) :

- [NIST SP 800-92 : Guide to Computer Security Log Management](https://csrc.nist.gov/pubs/sp/800/92/final)
- [Sigma : un format commun pour les règles de détection](https://sigmahq.io/)
