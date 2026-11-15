---
title: Repérer les attaques web et rédiger des constats
summary: À quoi ressemblent les attaques web dans les journaux, ce qu'un WAF peut et ne peut pas faire, la notation avec CVSS 4.0, et la rédaction d'un constat sur lequel un développeur peut agir.
builds: cinq constats professionnels, chacun avec un test de non-régression
source: OWASP Web Security Testing Guide (en anglais) | https://owasp.org/www-project-web-security-testing-guide/
words: WAF, CVSS, test de non-régression
---
Trouver une faille, c'est la moitié du travail. L'autre moitié est de la voir dans vos journaux et de l'écrire de façon que quelqu'un la corrige. Un constat que personne ne comprend est un constat qui reste ouvert.

@term CVSS = Le *Common Vulnerability Scoring System*, une façon normalisée de noter la gravité technique d'une faille.
@term test de non-régression = Un test qui empêche un bug corrigé de revenir en silence.
@term constat = Le rapport écrit d'un problème de sécurité, avec des preuves et un correctif.

## À quoi ressemblent les attaques dans les journaux

Les journaux disent rarement « attaque ». Ils montrent des motifs, et le contexte leur donne un sens.

| Motif dans le journal d'accès | Peut signifier |
|---|---|
| Beaucoup de `404` pour des chemins qui n'existent pas | Un outil qui devine du contenu |
| Une IP qui parcourt des identifiants qui se suivent | Un test d'IDOR, ou une aspiration de données |
| Des caractères étranges dans les chaînes de requête, puis un `500` | Une recherche d'injection |
| Des centaines de `POST /login`, un seul `200` | Une devinette de mot de passe qui a abouti |
| Un nouveau fichier `.php`, puis des requêtes avec des paramètres | Un web shell |
| Une rafale soudaine de `429` | Votre limite de débit qui fait son travail |

Vous n'avez pas besoin d'un SIEM pour voir ces motifs. Dans le format de journal d'accès de la leçon 35, l'adresse est le premier champ de chaque ligne, le chemin est le septième et le code d'état est le neuvième, donc le pipeline du mois 1 répond à la plupart des premières questions :

```
awk '{print $9}' access.log | sort | uniq -c | sort -rn                      combien de chaque code ?
awk '$9 == 404 {print $1}' access.log | sort | uniq -c | sort -rn | head     qui cause le plus de 404 ?
grep 'POST /login' access.log | awk '{print $1, $9}' | sort | uniq -c        connexions par adresse et par résultat
awk '$9 == 500 {print $7}' access.log | sort | uniq -c | sort -rn | head     quels chemins font échouer le serveur ?
```

Lancez la première sur n'importe quel vrai journal et vous verrez une forme : surtout des `200`, quelques `304` et `404`. Cette forme est votre état de référence, et une enquête commence en général par l'heure où elle a changé.

Les requêtes arrivent encodées en pourcentage, et vous ne pouvez pas juger ce que vous ne pouvez pas lire. Décodez avant de décider :

```
python3 -c "import sys, urllib.parse; print(urllib.parse.unquote(sys.argv[1]))" '/search?q=%27%20OR%201%3D1--'
```

Le même comptage fonctionne en Python, où il est plus facile à conserver et à tester.

@code status-by-ip

La quatrième ligne du tableau, des échecs puis une réussite, est le motif qui mérite le plus d'être automatisé, car c'est celui où l'attaquant a gagné.

@code guessed-logins

Les codes d'état comptent. Un tas de `404` et de `403` montre surtout une tentative ratée. Un `200` ou un `500` dans le même motif mérite un regard bien plus attentif.

Les journaux applicatifs comptent aussi. Consignez les connexions, les échecs, les refus de permission et les actions d'administration, avec un identifiant d'utilisateur. Le risque A09 de l'OWASP existe parce que beaucoup d'intrusions sont passées inaperçues pendant des mois.

?? Une IP envoie 300 requêtes pour des pages qui n'existent pas, toutes en 404. Quelle est l'urgence ?
+ Faible, un balayage automatique, sauf réussite par la suite
- Critique, car le serveur a certainement été entièrement compromis
- Critique, vous devriez appeler la police tout de suite
- Nulle, une erreur 404 n'apparaît jamais dans les journaux
=> Le balayage est un bruit de fond permanent sur Internet. Guettez ce qui change le tableau : une réussite.

## Ce qu'un WAF peut et ne peut pas faire

Un **WAF** se place devant une application et bloque les requêtes qui correspondent à des motifs connus. Il est utile pour gagner du temps, par exemple pendant le déploiement du correctif d'une nouvelle faille. Il ne remplace pas un correctif, cependant. Il ne peut pas savoir que la facture 1044 n'est pas la vôtre, et les attaquants réécrivent leurs requêtes pour passer entre les motifs.

| Bon pour | Pas bon pour |
|---|---|
| Bloquer les balayages automatiques courants | Les failles de contrôle d'accès |
| Un correctif virtuel pendant une courte durée | Les problèmes de logique métier |
| Vous donner un signal à surveiller | Remplacer du code sûr |

Un WAF se trompe aussi dans l'autre sens. Un client qui s'appelle O'Brien, ou un message de forum qui cite du SQL, peut correspondre à un motif et être bloqué. C'est pourquoi les équipes activent d'abord une nouvelle règle en **mode détection** : la règle journalise ce qu'elle aurait bloqué, quelqu'un lit une semaine de ces journaux, et alors seulement elle commence à refuser des requêtes. C'est la même idée que le mode rapport seul de l'accès conditionnel, et pour la même raison.

?? Votre équipe veut se passer de corriger une injection SQL parce qu'un WAF est déployé. Que dites-vous ?
+ C'est une couche temporaire, corrigez donc le code
- C'est très bien, un WAF bloque toute attaque
- Retirez le WAF, car il aggrave les attaques
- Déplacez la base vers une autre région cloud
=> Un WAF réduit l'exposition et ne supprime pas la faille. Le correctif a sa place dans le code.

## La gravité : CVSS 4.0

[CVSS](https://www.first.org/cvss/v4.0/specification-document) (en anglais) donne un score de 0 à 10. La version 4.0 a quatre groupes de métriques : Base, Threat, Environmental et Supplemental.

| Niveau | Score |
|---|---|
| None | 0.0 |
| Low | 0.1–3.9 |
| Medium | 4.0–6.9 |
| High | 7.0–8.9 |
| Critical | 9.0–10.0 |

Le nom vous dit ce qui a été pris en compte : `CVSS-B` est la base seule, et `CVSS-BTE` inclut les métriques de menace et d'environnement. Une CVE publiée donne en général un score de base, qui ne sait rien de votre environnement. Une gravité vous dit à quel point une faille pourrait être grave, pas à quel point elle est urgente pour vous. La [leçon 55](/courses/0055-vulnerability-management/) traite de cette différence.

À côté de chaque score, il y a un **vecteur**, un relevé compact des réponses qui l'ont produit. Apprenez à en lire un, car le vecteur vous dit pourquoi :

```
CVSS:4.0/AV:N/AC:L/AT:N/PR:L/UI:N/VC:H/VI:N/VA:N/SC:N/SI:N/SA:N
```

| Partie | Question | Ici |
|---|---|---|
| `AV` | Vecteur d'attaque : depuis où ? | `N`, par le réseau |
| `AC` | Complexité de l'attaque | `L`, faible |
| `AT` | Prérequis de l'attaque : des conditions particulières ? | `N`, aucune |
| `PR` | Privilèges requis | `L`, un compte ordinaire |
| `UI` | Interaction d'un utilisateur : une victime doit-elle faire quelque chose ? | `N`, non |
| `VC`, `VI`, `VA` | Impact sur la confidentialité, l'intégrité et la disponibilité du système vulnérable | Élevé, aucun, aucun |
| `SC`, `SI`, `SA` | Les trois mêmes pour les autres systèmes atteints à travers lui | Aucun |

Lu comme une phrase : quiconque a un compte ordinaire peut, par le réseau et sans condition particulière, lire des données qu'il ne devrait pas lire, sans rien modifier ni arrêter. C'est la faille des factures de la leçon 48. FIRST publie un [calculateur](https://www.first.org/cvss/calculator/4.0) (en anglais) qui transforme les réponses en score.

@code cvss-rating

@drill cvss-band

?? Une CVE indique `CVSS-B 9.1`. Qu'est-ce que ce score ne vous dit pas ?
+ S'il est exploité, ou s'il compte pour vous
- La gravité de la faille en termes techniques
- Qu'il se situe bien dans la tranche Critical
- Qu'un score chiffré a bien été calculé ici
=> Les scores de base décrivent la faille elle-même, et ils restent constants. La menace et l'environnement sont des questions distinctes.

## Rédiger un constat

Utilisez une structure fixe. Les développeurs doivent pouvoir le lire, le reproduire et le corriger sans rien vous demander.

```
Title:     Any customer can read other customers' invoices
Severity:  High (CVSS-B 7.1). Exposes billing data of all customers.
Impact:    A logged-in customer can read every invoice in the system.
Steps:     1. Log in as test user A.
           2. Request /invoices/1044, which belongs to test user B.
           3. The server returns B's invoice with status 200.
Evidence:  Request and response attached, with test accounts only.
Fix:       Limit the lookup to the current user:
           Invoice.get(id=invoice_id, owner_id=current_user.id)
Retest:    Added test_customer_cannot_read_other_invoice.
```

Commencez par l'impact pour l'entreprise. « N'importe quel client peut lire toutes les factures » est corrigé. « IDOR sur /invoices » attend dans une file.

Comparez avec la version à laquelle ressemblent la plupart des premiers constats :

```
Title:     IDOR
Severity:  Critical!!
Details:   The invoices endpoint is vulnerable. Fix ASAP.
```

Un développeur qui lit cela ne sait pas quelle requête, quel compte, ce que « vulnérable » veut dire ici, ni comment il saurait que c'est corrigé. Chaque partie de la structure ci-dessus existe pour répondre à une question que quelqu'un devrait sinon venir vous poser. Un constat est terminé quand il ne demande aucune réunion.

Une liste de contrôle ne peut pas juger si un constat est bien écrit, mais elle peut au moins attraper un constat incomplet avant son envoi.

@code finding-gaps

?? Quel titre fera corriger un constat le plus vite ?
+ Tout client peut lire les factures de chaque client
- Référence d'objet incorrecte dans la route des factures clients
- Possible faiblesse d'autorisation détectée par un outil entièrement automatique
- Problème de sécurité numéro 14 dans le rapport final
=> Dites ce qui peut arriver, en mots simples. La gravité vient de l'impact, donc énoncez l'impact en premier.

## Prouver que le correctif tient

Un correctif sans test peut disparaître dans un changement ultérieur. Un **test de non-régression** échoue sur le code cassé et réussit sur le code corrigé.

```python
def test_customer_cannot_read_other_invoice(client, user_a, user_b):
    invoice = make_invoice(owner=user_b)
    client.login(user_a)
    assert client.get(f"/invoices/{invoice.id}").status_code in (403, 404)
```

Lancez-le avant le correctif, et regardez-le échouer. Corrigez ensuite le code, et regardez-le réussir. Cet ordre prouve que le test teste vraiment le bug.

?? Pourquoi devez-vous voir un test de non-régression échouer avant de corriger le bug ?
+ Cela prouve que le test détecte le vrai bug
- Les tests en échec accélèrent le code final livré
- Les frameworks de test refusent tout test qui réussit
- Cela laisse à l'attaquant une vraie chance de s'arrêter
=> Un test qui réussit sur du code cassé ne prouve rien. Rouge, puis vert, montre qu'il fonctionne.

::: try Votre livrable du mois 8
Résolvez les labos de PortSwigger à leur rythme, avec des notes par faille dans vos propres mots. Rédigez cinq constats dans le format ci-dessus. Ajoutez trois failles à votre application du mois 6 sur une branche, corrigez chacune, et laissez un test de non-régression derrière vous. Voir le [plan du mois 8](/roadmap/8/).
:::

## Trier le journal d'une nuit

C'est lundi matin. Voici une partie du journal d'accès de la nuit dernière pour le portail client. Les deux lignes du milieu en représentent 212 autres semblables à la première.

```
198.51.100.23 - - [15/Nov/2026:02:11:04 +0000] "POST /login HTTP/1.1" 401 512
198.51.100.23 - - [15/Nov/2026:02:11:05 +0000] "POST /login HTTP/1.1" 401 512
198.51.100.23 - - [15/Nov/2026:02:14:50 +0000] "POST /login HTTP/1.1" 401 512
198.51.100.23 - - [15/Nov/2026:02:14:51 +0000] "POST /login HTTP/1.1" 200 1840
198.51.100.23 - - [15/Nov/2026:02:15:03 +0000] "GET /account/export HTTP/1.1" 200 48211
```

?? Que montre cette séquence ?
+ Un mot de passe deviné, puis des données exportées
- Un client a oublié son secret, puis a renoncé
- Un scanner bloqué par la limite de débit active
- Une erreur du serveur a fait échouer les connexions
=> Des centaines de refus, une réussite, puis un gros téléchargement depuis la même adresse douze secondes plus tard. Le `200` sur la connexion est le moment où l'attaque a réussi.

?? Que faites-vous en premier ?
+ Verrouiller ce compte et fermer ses sessions
- Bloquer toute connexion pour absolument chaque client
- Attendre une semaine pour voir une récidive
- Supprimer ces lignes pour libérer la place
=> Arrêtez l'accès encore ouvert, puis enquêtez. La session créée à 02:14:51 est peut-être toujours valide, donc changer le mot de passe seul ne suffit pas.

?? Quel nombre vous dit à peu près combien de données sont sorties ?
+ Le 48211 à la fin de la ligne d'export
- Le 512 à la fin des échecs de connexion
- Le 200 affiché dans la colonne des codes d'état
- Le 23 tout à la fin de l'adresse IP
=> Le dernier champ est la taille de la réponse en octets. Environ 48 Ko sont sortis, et c'est ce que vous comparez à la taille d'un export normal quand vous rédigez l'impact.

?! Rédigez un constat pour une faille que vous avez étudiée ce mois-ci, en utilisant la structure ci-dessus.

### Pour aller plus loin

Les sources primaires et le meilleur matériel gratuit sur ce sujet, tous vérifiés en novembre 2026 (en anglais) :

- [Aide-mémoire de l'OWASP sur la journalisation](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)
