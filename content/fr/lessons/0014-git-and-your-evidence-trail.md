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
