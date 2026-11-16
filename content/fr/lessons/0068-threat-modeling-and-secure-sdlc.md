---
title: La modélisation des menaces et le code sûr
summary: Les quatre questions, les diagrammes de flux de données et STRIDE, les exigences de l'ASVS, la revue de code sécurisée, et la sécurité intégrée au développement.
builds: un modèle de menaces rattaché à des exigences de l'ASVS
source: Threat Modeling Manifesto (en anglais) | https://www.threatmodelingmanifesto.org/
words: modèle de menaces, frontière de confiance, STRIDE
---
Trouver les bugs un par un ne finit jamais. La modélisation des menaces et le développement sécurisé empêchent des classes entières de bugs, avant qu'une seule ligne ne parte en production. Changer une conception sur un tableau blanc coûte quelques minutes. La changer après le lancement peut coûter des mois.

@term modèle de menaces = Une analyse structurée de ce qui pourrait mal tourner dans un système, et de ce qu'il faut faire.
@term diagramme de flux de données (DFD) = Un diagramme qui montre comment les données circulent dans un système.
@term frontière de confiance = Une ligne où les données passent entre des niveaux de confiance différents.
@term STRIDE = Une liste de types de menaces : usurpation (spoofing), altération (tampering), répudiation, divulgation d'informations, déni de service, élévation de privilèges.
@term ASVS = L'Application Security Verification Standard de l'OWASP : une liste d'exigences de sécurité.
@term SAST = Les tests de sécurité statiques des applications : l'analyse du code source à la recherche de failles.
@term DAST = Les tests de sécurité dynamiques des applications : tester une application en fonctionnement.
@term SCA = L'analyse de la composition logicielle : vérifier les dépendances à la recherche de failles connues.
@term Semgrep = Un outil d'analyse de code avec des règles que vous pouvez écrire vous-même.
@term SDLC sécurisé = Intégrer la sécurité à chaque étape du développement logiciel.
@term puits = Un endroit du code où une entrée peut causer du tort, comme une requête de base de données.

## Quatre questions

Le [Threat Modeling Manifesto](https://www.threatmodelingmanifesto.org/) le résume ainsi :

1. Sur quoi travaillons-nous ?
2. Qu'est-ce qui peut mal tourner ?
3. Qu'allons-nous faire à ce sujet ?
4. Avons-nous fait un travail suffisant ?

Aucun outil n'est nécessaire. Un tableau blanc et quatre personnes dans une salle suffisent. Cela se place tôt dans le **SDLC sécurisé**, tant que changer de cap coûte encore peu.

?? Quand la modélisation des menaces apporte-t-elle le plus de valeur ?
+ Pendant la conception, avant que le code coûteux n'existe
- Après qu'une violation a déjà été signalée par quelqu'un
- Seulement pendant la toute dernière semaine avant le lancement
- Une fois par an, quoi que l'on construise ensuite
=> Les défauts de conception sont bon marché à corriger sur le papier et coûteux en production. C'est une activité, pas un formulaire annuel à remplir.

## STRIDE sur un diagramme

Dessinez la circulation des données, marquez les endroits où elles traversent des **frontières de confiance**, puis parcourez STRIDE à chaque traversée. Voici une connexion, sous forme de **diagramme de flux de données** :

```
 Navigateur ──identifiants──▶ │ Appli web ──requête──▶ │ Base de données
 (non fiable)                 │ (fiable)               │ (plus fiable)
                        frontière 1             frontière 2
```

Un navigateur est contrôlé par l'utilisateur, donc rien de ce qui en vient ne peut être considéré comme fiable. Prenez maintenant la frontière 1 et posez chaque question de STRIDE :

| Menace | À cette traversée | Mesure |
|---|---|---|
| **S** (usurpation) | Quelqu'un se connecte en se faisant passer pour un autre | MFA, limitation du débit |
| **T** (altération) | La requête est modifiée en route | TLS |
| **R** (répudiation) | « Je ne me suis jamais connecté » | Journal d'audit des connexions |
| **I** (divulgation d'informations) | Une erreur révèle qu'un compte existe | Messages d'erreur génériques |
| **D** (déni de service) | Des avalanches de mots de passe épuisent le serveur | Limitation du débit |
| **E** (élévation de privilèges) | Un utilisateur ordinaire atteint des fonctions d'administration | Vérifier le rôle côté serveur |

Toutes les menaces ne s'appliquent pas à tous les éléments. **STRIDE par élément**, issu des travaux d'Adam Shostack chez Microsoft, dit quelles lettres examiner pour chaque type de boîte ou de flèche du diagramme :

| Élément | Dessiné comme | Menaces à examiner |
|---|---|---|
| Entité externe, comme un utilisateur ou un partenaire | Un rectangle | S, R |
| Processus, comme l'application web | Un cercle | S, T, R, I, D, E |
| Stockage de données, comme la base de données | Deux traits parallèles | T, I, D, et R quand il stocke des journaux |
| Flux de données | Une flèche | T, I, D |

Un stockage de données ne peut usurper personne, et une flèche ne peut pas élever ses privilèges, donc sauter ces questions n'est pas de la paresse. Cela laisse du temps pour celles qui comptent. Un stockage de journaux reçoit R parce qu'un journal modifiable ne peut pas trancher un désaccord sur qui a fait quoi.

@code stride-per-element

Les frontières peuvent aussi se trouver mécaniquement. Donnez un niveau de confiance à chaque élément, et chaque flux entre deux niveaux différents traverse une frontière. Les flux qui vont d'un niveau plus bas vers un niveau plus haut sont ceux où l'entrée doit être vérifiée.

@code boundary-crossings

@drill stride

Écrivez chaque menace comme une phrase sur laquelle quelqu'un peut agir : qui, faisant quoi, par quel moyen, avec quel dommage.

> Un attaquant sur internet pourrait se connecter en tant que client en essayant des mots de passe ayant fuité sur le formulaire de connexion, ce qui exposerait ses commandes et son adresse.

« Des pirates pourraient attaquer la connexion » ne peut être ni testé ni corrigé. La phrase ci-dessus désigne d'elle-même la mesure : limitation du débit, MFA, et vérification contre les mots de passe connus pour avoir fuité. Classez ensuite les menaces par probabilité et impact, comme à la leçon 60, pour que l'équipe corrige d'abord les pires.

?? Sur quoi vous concentrez-vous d'abord dans un diagramme de flux de données ?
+ Là où les données passent une frontière de confiance
- La seule boîte qui a le plus de fonctionnalités
- Les composants dont le code est le plus récent
- La partie dont le dessin est le plus joli
=> Les données qui passent d'un niveau moins fiable à un niveau plus fiable sont l'endroit où les validations et les vérifications doivent se trouver.

## Des exigences, pas des opinions

L'[ASVS 5.0](https://asvs.owasp.org/), publié en mai 2025, transforme « soyez sécurisé » en exigences testables. Rattachez chaque mesure à l'une d'elles. Ainsi, « est-ce sécurisé ? » devient « est-ce que cela respecte ces exigences listées ? », ce qu'un ingénieur peut tester et un relecteur vérifier.

?? Pourquoi rattacher une mesure à une exigence de l'ASVS ?
+ Cela transforme une opinion en quelque chose de testable
- Les exigences de l'ASVS rendent l'application bien plus rapide
- Cela supprime le besoin de toute autre revue ensuite
- La loi impose l'ASVS à toutes les applications web
=> Une exigence nommée et testable peut être vérifiée par n'importe qui, et elle met fin aux débats fondés sur les goûts.

## La revue de code sécurisée

Ne lisez pas le code de haut en bas. Suivez le danger :

- **Points d'entrée :** où arrive l'entrée venue de l'extérieur ?
- **Puits :** où une entrée pourrait-elle causer du tort, comme une requête, une commande shell ou une page ?
- **Authentification :** chaque route est-elle protégée ?
- **Autorisation :** est-elle vérifiée pour **chaque objet**, et pas seulement pour chaque page ?
- **Secrets :** y en a-t-il dans le code ?
- **Erreurs :** révèlent-elles des détails internes, ou laissent-elles passer en cas d'échec ?

La paire classique à reconnaître :

```python
# Dangereux : l'entrée devient une partie du texte de la requête
cur.execute(f"SELECT * FROM items WHERE name = '{value}'")

# Sûr : la requête et la valeur voyagent séparément
cur.execute("SELECT * FROM items WHERE name = %s", (value,))
```

Un scanner peut trouver ce premier type de faille par sa forme. Une requête construite avec une f-string, un `%` ou un `+` a la même allure dans chaque fichier :

@code sql-string-builds

Le second type, l'autorisation, n'a pas de forme. Chaque route qui reçoit l'identifiant d'un objet a besoin de sa propre vérification que cet utilisateur peut voir cet objet :

```python
@app.get("/invoices/<int:invoice_id>")
@login_required
def get_invoice(invoice_id):
    invoice = Invoice.query.get_or_404(invoice_id)
    if invoice.owner_id != current_user.id:
        abort(404)
    return render_invoice(invoice)
```

`@login_required` répond à « qui êtes-vous ? ». Le `if` répond à « cette facture est-elle à vous ? ». Sans lui, n'importe quel client connecté peut lire toutes les factures en changeant le numéro dans l'adresse. Renvoyer 404 plutôt que 403 évite aussi de confirmer que la facture existe. Une revue liste chaque route et pose les deux questions à chacune.

@code route-audit

Transformez les constats répétés en [règles Semgrep](https://semgrep.dev/docs/writing-rules/overview), pour qu'une personne n'ait à trouver chaque type qu'une fois :

```yaml
rules:
  - id: python-fstring-sql
    pattern: $CUR.execute(f"...")
    message: Pass values as parameters, not inside the query text.
    languages: [python]
    severity: ERROR
```

Lancer la règle demande une commande, et la même commande va dans la CI :

```
semgrep scan --config python-fstring-sql.yaml src/
```

Elle affiche chaque correspondance avec son fichier et sa ligne, et se termine avec un code d'erreur quand quelque chose correspond, ce qui permet à un pipeline de faire échouer la pull request.

@range appsec

?? Quel type de faille un relecteur humain a-t-il le plus de chances de repérer avant un scanner ?
+ Une vérification de permission absente sur une route
- Une clé écrite en dur, au format connu
- Une bibliothèque qui a une CVE déjà publiée
- Un appel bien évident à une fonction interdite
=> Les scanners cherchent des motifs qui existent. Une vérification absente n'a pas de motif, donc savoir ce que le code devrait faire est une compétence humaine.

## Le pipeline des contrôles

| Contrôle | Trouve | Quand |
|---|---|---|
| Recherche de secrets | Des clés dans le code | Avant le commit |
| SAST | Des motifs de code risqués | À chaque commit |
| SCA | Des dépendances vulnérables connues | À chaque commit |
| Analyse de l'IaC | Des réglages cloud et conteneurs dangereux | À chaque commit |
| DAST | Des problèmes dans l'application en fonctionnement | Avant la mise en production |

Aucun outil seul ne suffit. Le [duel de revue de code](/guides/d3-using-ai-well/) de la feuille de route le rend visible : vous contre un scanner contre un LLM.

@drill pipeline-check

?? Une équipe demande quel outil signalerait une version vulnérable d'une bibliothèque. Quelle est la réponse ?
+ La SCA, qui compare les dépendances aux failles connues
- Le DAST, qui lit directement votre propre code source
- Le SAST, qui n'analyse que la base de production
- Un formateur de code, qui corrige tout le style
=> La SCA est faite pour les composants vulnérables connus. Le SAST regarde votre code, et le DAST teste l'application en fonctionnement.

## Relire un modèle de menaces

Une équipe vous envoie son modèle de menaces pour un nouveau portail de factures. Trois lignes ressortent.

```
Périmètre : l'application web client (l'API d'administration est interne, donc hors périmètre)
Menace 4 :  des pirates pourraient attaquer le portail
Mesure :    un système d'IA détectera et bloquera les attaques
```

?? Quel est le problème du périmètre ?
+ Les services internes restent accessibles à des attaquants
- Les API d'administration ne méritent jamais de modèle
- Le périmètre devrait lister chaque développeur par nom
- Un modèle de menaces couvre une seule page
=> « Interne » n'est pas un niveau de confiance. Un attaquant qui atteint n'importe quelle machine interne, ou qui pousse l'application web à appeler l'API d'administration, est à l'intérieur. Dessinez-la, avec sa frontière.

?? Comment réécrire la menace 4 ?
+ Nommer l'acteur, le moyen et le dommage causé
- La raccourcir, pour qu'elle tienne sur une diapositive
- Ajouter le mot critique, pour qu'on la corrige
- La supprimer, puisque chaque système a des pirates
=> « Un attaquant pourrait lire les factures d'autres clients en changeant le numéro de facture dans l'adresse » peut être testé, corrigé et coché. « Des pirates pourraient attaquer » ne le peut pas.

?? Pourquoi contester la mesure ?
+ Elle ne se rattache à aucune exigence testable
- Les systèmes d'IA sont interdits en sécurité informatique
- La détection ne relève jamais de la sécurité
- Une mesure doit toujours être écrite en code
=> Une mesure répond à une menace nommée et peut être vérifiée. Ici, la vérification d'objet sur chaque route est le vrai correctif, et la détection n'est qu'un filet de secours.

?! Dessinez une fonction de connexion sous forme de flux de données. Marquez une frontière de confiance, et donnez une menace STRIDE pour elle.
