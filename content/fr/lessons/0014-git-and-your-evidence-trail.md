---
title: Git et votre trace de preuves
summary: Suivre votre travail avec Git, le publier sur GitHub sans fuiter de secrets, et écrire votre premier compte rendu public.
builds: un dépôt cyber-journey public avec de vrais commits et un premier compte rendu
source: Le livre Pro Git, gratuit en ligne (en anglais) | https://git-scm.com/book/en/v2
words: commit, dépôt, branche
---
Le recrutement en sécurité repose sur les preuves. N'importe qui peut dire « je connais Linux ». Un historique public de vrai travail, rédigé clairement, est difficile à inventer. **Git** est la façon de garder cet historique, et c'est aussi un outil que vous utiliserez chaque jour de travail.

@term Git = Un système de gestion de versions qui enregistre l'historique des modifications des fichiers.
@term dépôt (repo) = Un dossier de projet suivi par Git, avec tout son historique.
@term commit = Un instantané enregistré de vos modifications, avec un message qui dit pourquoi.
@term branche = Une ligne de travail séparée dans un dépôt.
@term GitHub = Un site qui héberge des dépôts Git et aide les gens à y travailler ensemble.
@term pull request (PR) = Une proposition de fusionner une branche dans une autre, avec une occasion de la relire.
@term README = Le document principal d'un dépôt, qui explique ce qu'il est et comment l'utiliser.
@term secret = Une donnée sensible comme un mot de passe, une clé d'API ou une clé privée.

## Comment pense Git

Git prend des **instantanés**. Chaque **commit** enregistre l'état de vos fichiers plus un message. Vous faites passer le travail par trois étapes :

@flow Modifier les fichiers > git add : choisir quoi enregistrer > git commit : enregistrer un instantané > git push : le publier

### Pourquoi gérer des versions

Sans gestion de versions, l'historique d'un projet est un tas de fichiers appelés `notes-final.txt`, `notes-final-2.txt` et `notes-final-VRAIMENT.txt`, et personne ne sait lequel contient quoi, ni pourquoi une ligne a changé. La gestion de versions remplace cela par un seul dossier et la liste complète et datée de chaque modification, de son auteur et de sa raison. Vous pouvez revoir n'importe quel état passé, en comparer deux, et annuler une erreur sans perdre le travail fait depuis. Git est l'outil de gestion de versions que presque tout le monde utilise, et GitHub est un site qui héberge des dépôts Git en ligne. Ce sont deux choses différentes : Git tourne sur votre ordinateur, avec ou sans GitHub.

### Les trois endroits où vivent vos fichiers

Tout Git devient clair dès qu'on voit qu'un fichier peut se trouver à trois endroits :

| Endroit | Ce que c'est | Comment un fichier y arrive |
|---|---|---|
| Dossier de travail | Les fichiers que vous voyez et modifiez, comme dans tout dossier | Vous les modifiez |
| Zone d'index | Une salle d'attente pour les changements que vous enregistrerez ensuite | `git add` |
| Dépôt | L'historique enregistré, rangé dans le dossier caché `.git` | `git commit` |

La zone d'index (*staging area*) est ce qui surprend les débutants. Elle vous laisse choisir : vous avez modifié cinq fichiers, mais seuls deux appartiennent à cet instantané, alors vous faites `git add` sur ces deux-là et vous les commitez avec un message qui leur correspond. Supprimez le dossier `.git` et l'historique disparaît, tandis que vos fichiers restent, comme un simple dossier.

### Votre premier dépôt, de zéro

Avant GitHub, faites-le une fois sur votre propre ordinateur, dans un dossier vide. `git init` transforme le dossier en dépôt :

```
git init -b main notes
cd notes
echo "# Lab notes" > README.md
git status
```

```
On branch main

No commits yet

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	README.md

nothing added to commit but untracked files present (use "git add" to track)
```

Lisez `git status` comme Git qui vous parle. *Untracked* veut dire que Git voit le fichier mais qu'on ne lui a jamais demandé de s'en occuper, et la ligne entre parenthèses vous donne même la commande suivante. Lancez `git add README.md` puis `git status` à nouveau : le fichier passe sous `Changes to be committed`, c'est-à-dire dans la zone d'index. Enregistrez maintenant l'instantané :

```
git commit -m "Add README"
```

```
[main (root-commit) 198c634] Add README
 1 file changed, 1 insertion(+)
 create mode 100644 README.md
```

`198c634` est le début de l'identifiant du commit, une empreinte de son contenu. Ajoutez une ligne au fichier, puis demandez ce qui a changé avec `git diff` :

```
@@ -1 +1,2 @@
 # Lab notes
+Day 1: installed Ubuntu
```

Les lignes qui commencent par `+` ont été ajoutées, celles qui commencent par `-` supprimées. Commitez à nouveau avec `git commit -am "Note day 1"` (`-a` indexe tous les fichiers que Git suit déjà), et `git log --oneline` liste votre historique, du plus récent au plus ancien :

```
b47ac32 Note day 1
198c634 Add README
```

### Annuler

Chaque sorte d'erreur a son annulation, et les plus sûres ne réécrivent jamais l'historique :

| Vous voulez | Commande |
|---|---|
| Jeter les modifications d'un fichier pas encore indexé | `git restore FICHIER` |
| Sortir un fichier de la zone d'index | `git restore --staged FICHIER` |
| Corriger le message du commit que vous venez de faire, avant de pousser | `git commit --amend` |
| Annuler un commit déjà poussé | `git revert EMPREINTE` |

`git revert` ne supprime rien : il ajoute un nouveau commit qui fait l'inverse, si bien que l'historique reste honnête et que les copies des autres restent valables. Des commandes comme `git reset --hard` ou `git push --force` réécrivent l'historique : gardez-les pour le jour où vous saurez exactement ce qu'elles vont jeter.

::: try Faites ceci sur votre ordinateur ou dans votre VM Ubuntu
```
git config --global user.name "Votre Nom"
git config --global user.email "vous@example.com"

git clone https://github.com/votrenom/cyber-journey.git
cd cyber-journey
echo "# Mon parcours cyber" > README.md
git add README.md
git commit -m "Ajoute un README avec le but de ce dépôt"
git push
```
Créez d'abord le dépôt vide sur [GitHub](https://github.com/new). Pour pousser, GitHub exige [une clé SSH ou un jeton](https://docs.github.com/en/get-started/git-basics/about-remote-repositories), pas votre mot de passe. Vous savez déjà créer une clé.
:::

### Relier votre ordinateur à GitHub

GitHub n'accepte plus les mots de passe de compte pour Git depuis 2021 : vous prouvez qui vous êtes avec une clé SSH, du même genre que celles de la leçon sur SSH. Créez-en une si vous n'en avez pas, et copiez sa moitié **publique** :

```
ssh-keygen -t ed25519 -C "you@example.com"
cat ~/.ssh/id_ed25519.pub
```

Collez cette ligne dans GitHub, sous Settings, puis SSH and GPG keys. Testez avec `ssh -T git@github.com` : GitHub répond que vous êtes bien authentifié mais qu'il ne fournit pas d'accès shell, et c'est la réponse attendue. Utilisez ensuite l'adresse SSH du dépôt, celle qui commence par `git@github.com:`. `git remote -v` montre quelle adresse votre dépôt utilise, sous le nom `origin`, le nom par défaut de la copie dont vous avez cloné.

?? Quelle est la différence entre `git commit` et `git push` ?
+ Commit enregistre en local, et push le publie
- Commit le publie, et push enregistre en local
- Ce sont deux noms pour la même action
- Commit supprime des fichiers, et push les restaure
=> Un commit est un instantané sur votre machine. Rien n'atteint GitHub tant que vous ne poussez pas.

## Branches et pull requests

Une **branche** vous laisse travailler sans toucher à la ligne principale, et une **pull request** demande à la fusionner. Dans une équipe, c'est là qu'a lieu la relecture. Le parcours vous demande de le faire même seul, pour que vous connaissiez le flux.

```
git switch -c add-bandit-notes
# modifier, ajouter et commiter
git push -u origin add-bandit-notes
```

Puis ouvrez une pull request sur GitHub et fusionnez-la.

Écrivez des messages de commit qui disent **pourquoi**, à l'impératif : « Ajoute des notes de durcissement SSH », pas « des trucs ». La validation demande au moins 8 commits qui ont du sens, et les recruteurs les lisent vraiment.

### Ce qu'est vraiment une branche

Une branche n'est pas une copie de vos fichiers. C'est une étiquette qui pointe vers un commit, et qui avance à chaque commit fait dessus. `main` n'est que la première étiquette. `git switch -c firewall` crée une nouvelle étiquette là où vous êtes et vous place dessus : les nouveaux commits y vont, et `main` reste où elle était. `git log --oneline --graph --all` dessine le résultat :

```
* 12b4bdf Note the firewall rule
| * 8204eb7 Note the web port
|/
* b47ac32 Note day 1
* 198c634 Add README
```

Deux lignes de travail sont parties de `b47ac32` : la note sur le pare-feu sur une branche, le port web sur `main`.

### Fusionner, et votre premier conflit

`git merge firewall`, lancé depuis `main`, y fait entrer les commits de cette branche. Quand les deux branches ont modifié des lignes différentes, Git les combine tout seul. Quand toutes deux ont modifié la *même* ligne, Git ne peut pas deviner ce que vous voulez, et s'arrête :

```
Auto-merging README.md
CONFLICT (content): Merge conflict in README.md
Automatic merge failed; fix conflicts and then commit the result.
```

Rien n'est perdu. Git écrit les deux versions dans le fichier, entre des marqueurs :

```
<<<<<<< HEAD
Firewall: allow 22 and 443
=======
Firewall: allow 22 only
>>>>>>> firewall
```

Au-dessus de `=======`, votre branche actuelle (`HEAD`) ; en dessous, la branche que vous fusionnez. Modifiez le fichier pour qu'il dise ce qui est vrai, supprimez les trois lignes de marqueurs, puis `git add README.md` et `git commit`. Si vous préférez réfléchir d'abord, `git merge --abort` remet tout comme avant la fusion.

### Quand Git refuse

Les messages d'erreur de Git disent en général quoi faire ensuite, si on les lit jusqu'au bout :

| Vous voyez | Cela veut dire | Faites ceci |
|---|---|---|
| `fatal: not a git repository` | Vous êtes dans un dossier qui n'est pas un dépôt | Allez dedans avec `cd`, ou lancez `git init` |
| `Please tell me who you are.` | Git ne connaît pas votre nom pour le commit | Les deux lignes `git config --global` plus haut |
| `! [rejected] main -> main (fetch first)` | Le dépôt distant a des commits que vous n'avez pas | `git pull`, réglez un éventuel conflit, puis poussez à nouveau |
| `Support for password authentication was removed` | GitHub a refusé votre mot de passe | Utilisez une clé SSH et l'adresse `git@github.com:` |
| `CONFLICT (content): Merge conflict in FICHIER` | Les deux côtés ont modifié les mêmes lignes | Modifiez le fichier, retirez les marqueurs, `git add`, `git commit` |
| `You are in 'detached HEAD' state` | Vous avez ouvert un commit, pas une branche | `git switch main`, ou `git switch -c NOUVELLE` pour garder le travail |

Le push refusé est celui que vous rencontrerez en premier, le jour où vous travaillerez depuis deux ordinateurs : le dépôt distant a un commit que l'autre a poussé. Ne le « réparez » jamais avec `--force`, qui supprime ce commit du dépôt distant.

?? Quel message de commit voudriez-vous qu'un recruteur lise ?
+ Ajoute des règles de pare-feu avec une raison pour chacune
- Met à jour les fichiers encore après quelques petites corrections
- Version finale du lab, vraiment terminée pour de bon maintenant
- Les changements faits aujourd'hui après la longue séance de lab
=> Il dit ce qui a changé et laisse deviner pourquoi. Les messages vagues n'apprennent rien au lecteur.

## Ne publiez jamais de secret

::: law Git se souvient pour toujours
Supprimer un mot de passe dans un commit ultérieur ne l'efface pas : il reste dans l'historique. Si vous poussez un secret, considérez-le comme volé. Changez-le d'abord, puis faites le ménage.
:::

- Gardez les secrets entièrement hors de votre dépôt. Ajoutez des fichiers comme `.env` au `.gitignore`.
- À partir du mois 4, lancez [gitleaks](https://github.com/gitleaks/gitleaks) comme hook de pré-commit.
- Ne publiez jamais les mots de passe de Bandit, les données d'autrui, ou quoi que ce soit d'un employeur.

### `.gitignore`, en pratique

`.gitignore` est un simple fichier texte à la racine du dépôt, avec un motif par ligne. Git fait comme si les fichiers correspondants n'existaient pas :

```
.env
*.log
```

Avec ce fichier en place, un `.env` qui contient `API_KEY=abc` n'apparaît plus du tout dans `git status`, donc `git add .` ne peut pas l'emporter. `git check-ignore -v .env` vous dit quelle règle cache un fichier :

```
.gitignore:1:.env	.env
```

Deux limites comptent. `.gitignore` ne joue que pour les fichiers que Git ne suit pas encore : un fichier déjà commité reste suivi jusqu'à ce que vous fassiez `git rm --cached`. Et c'est une commodité, pas une garantie : c'est pourquoi un détecteur comme gitleaks tourne aussi avant chaque commit.

?? Vous avez commité une clé d'API et l'avez poussée. Vous la supprimez et commitez à nouveau. Est-ce sûr maintenant ?
+ Non, elle reste dans tout l'historique, donc changez-la vite
- Oui, les gens ne voient que le dernier commit
- Oui, GitHub supprime les anciennes versions après un jour
- Non, mais rendre le dépôt privé règle le problème
=> N'importe qui a pu la copier déjà, et l'historique la garde. La clé doit être remplacée. Des robots scannent sans cesse les dépôts publics à la recherche de clés.

## Votre système d'apprentissage

Créez le coffre décrit dans [le système d'apprentissage](/guides/j1-the-learning-system/) et utilisez le [modèle de note de lab](/guides/n1-templates/) dès aujourd'hui. Écrivez vos notes **pendant** un lab, pas après.

?? Quand devriez-vous écrire vos notes de lab ?
+ Pendant le lab, tant qu'il est encore en cours
- Une semaine après, quand vous aurez eu le temps
- Seulement quand quelque chose tourne vraiment très mal là
- Jamais, car les commandes restent bien dans votre historique
=> Les notes écrites après coup oublient les erreurs, et ce sont elles qui vous apprennent le plus.

## Votre premier compte rendu

Le livrable du mois pour le portfolio est le compte rendu n° 1, « Ce que Bandit m'a appris sur Linux », sans divulgâcher les niveaux. Utilisez le [modèle de compte rendu](/guides/n1-templates/), et faites court. 400 mots terminés valent mieux que 2 000 inachevés.

?? Quelle règle s'applique au compte rendu d'un wargame ?
+ Partager ce que vous avez appris, sans divulgâcher les niveaux
- Publier chaque mot de passe pour que les lecteurs vérifient
- Copier la solution la plus complète que vous pouvez trouver
- Continuer d'écrire jusqu'à atteindre au moins les 5 000 mots
=> Les règles d'OverTheWire interdisent de publier des identifiants, et un texte court et fini vaut mieux qu'un long inachevé.

## La validation du mois 1

Allez au [mois 1 du parcours](/roadmap/1/). Ne cochez chaque case que si vous savez le faire sans aide :

- Bandit niveau 20 ou plus, avec 70 % résolus sans solution.
- Expliquer rwx, SUID, SGID et le sticky bit, et trouver tous les binaires SUID avec une seule commande `find`.
- Une ligne de commande qui extrait d'`auth.log` les IP sources des connexions échouées.
- Un lab de deux VM plus des instantanés, documenté dans un README, avec 8 commits ou plus qui ont du sens.

Si vous en manquez une, c'est une information utile. Servez-vous des jours de marge.

?! Écrivez le premier paragraphe de votre compte rendu Bandit : qu'est-ce qui vous a surpris à propos de Linux ?

## Ce que vous savez faire maintenant

Vous avez terminé le contenu du premier mois. Vous savez vous déplacer sous Linux, tout retrouver, enchaîner des outils, raisonner sur les permissions et les processus, parler le langage du risque, faire tourner un lab et publier des preuves. Ensuite : comment les données circulent vraiment.
