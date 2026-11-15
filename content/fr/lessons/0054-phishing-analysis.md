---
title: Analyser un courriel d'hameçonnage
summary: Comment voyage un courriel, la lecture des en-têtes, SPF, DKIM et DMARC, le contrôle sans risque des liens et des pièces jointes, et la construction d'un playbook.
builds: analyser sans risque un courriel signalé et en extraire les IOC
source: Cloudflare, Que sont DMARC, DKIM et SPF ? (en anglais) | https://www.cloudflare.com/learning/email-security/dmarc-dkim-spf/
words: SPF, DKIM, DMARC
---
Des courriels d'hameçonnage signalés arrivent dans la file de chaque SOC, tous les jours. L'**hameçonnage** consiste à amener quelqu'un, par un message, à livrer un mot de passe, à ouvrir un fichier, ou à envoyer de l'argent. Une analyse soigneuse prend quelques minutes et protège toute l'entreprise.

@term SPF = Un enregistrement de messagerie qui liste les serveurs autorisés à envoyer du courrier pour un domaine.
@term DKIM = Une signature numérique sur un courriel, qui prouve que le domaine l'a signé et qu'il n'a pas été modifié.
@term DMARC = Une politique qui dit aux destinataires quoi faire quand les contrôles SPF et DKIM échouent.
@term en-tête de courriel = Des métadonnées qui consignent comment un message a été acheminé et vérifié.
@term bac à sable = Un environnement isolé pour ouvrir sans risque des fichiers ou des liens suspects.
@term BEC (compromission de messagerie professionnelle) = Une fraude qui utilise un compte de messagerie professionnel détourné ou usurpé, souvent pour rediriger des paiements.
@term alignement = La règle de DMARC selon laquelle le domaine qui réussit SPF ou DKIM doit correspondre au domaine de l'adresse From visible.
@term neutralisation = Réécrire un lien pour qu'il ne puisse pas être cliqué par accident, comme example[.]com.
@term domaine sosie = Un domaine enregistré pour ressembler à un vrai, comme paypa1-secure.example.

## La sécurité d'abord

::: law Traitez-le comme une preuve
Ne cliquez jamais sur un lien et n'ouvrez jamais une pièce jointe sur votre propre machine. Travaillez sur une copie dans une VM isolée, et utilisez un bac à sable ou une recherche de réputation. Cherchez par empreinte avant d'envoyer quoi que ce soit, car les envois vers des services publics peuvent être vus par d'autres.
:::

Un fichier `.eml` est du texte brut. Le lire avec `cat` ou `grep` n'exécute rien. Le danger commence quand un logiciel de messagerie l'affiche, ou quand une personne clique.

?? Un collègue vous transfère une pièce jointe suspecte. Quelle est la première étape la plus sûre ?
+ Rechercher l'empreinte du fichier sans ouvrir
- L'ouvrir vite pour voir son effet
- L'envoyer aussitôt à un scanner public
- Le transférer à tous, par vigilance
=> Une recherche d'empreinte vous dit si le fichier est connu et ne révèle rien. L'envoyer peut exposer des données privées, et l'ouvrir peut vous infecter.

## Comment un courriel voyage vraiment

Le courriel a été conçu à une époque de confiance. L'enveloppe, dont se servent les serveurs pour la livraison, est séparée de la lettre à l'intérieur, que vous lisez. La ligne `From` que vous voyez n'est donc que du texte tapé par l'expéditeur. Rien dans la conception d'origine ne la vérifie. SPF, DKIM et DMARC ont été ajoutés plus tard pour combler ce manque.

| En-tête | Vous dit |
|---|---|
| `From` | De qui il prétend venir, et c'est facile à falsifier |
| `Return-Path` | Où vont les messages de non-remise |
| `Reply-To` | Où irait votre réponse. Une différence est suspecte |
| `Received` | Les serveurs traversés. À lire de bas en haut, car chaque serveur ajoute sa ligne au-dessus |
| `Authentication-Results` | Les résultats de SPF, DKIM et DMARC |

Mettez un vrai message sous vos yeux. Dans la plupart des logiciels de messagerie, une entrée de menu appelée **Afficher l'original** ou **Afficher la source** montre le texte brut, et **Télécharger** l'enregistre en fichier `.eml`. Prenez l'un des vôtres, une lettre d'information par exemple, dans votre VM Linux et sortez-en les lignes qui comptent :

```
grep -iE '^(from|reply-to|return-path|subject|date):' message.eml
grep -ic '^received:' message.eml          combien de serveurs l'ont traité ?
```

Chaque ligne `Received` a été écrite par un serveur à l'arrivée du message chez lui :

```
Received: from mailer-77.example (mailer-77.example [203.0.113.25])
        by mx.corp.example with ESMTPS id a1b2c3
        for <ana@corp.example>; Sun, 15 Nov 2026 09:14:02 +0000
```

Lisez-la ainsi : « reçu **de** cette machine, **par** celle-ci, **pour** cette personne, à cette heure ». L'adresse entre crochets a été relevée par le serveur destinataire lui-même, donc sur une ligne écrite par votre propre serveur de messagerie, c'est le fait le plus fiable de tout le message.

Python lit le même fichier avec son module standard `email`, et c'est ainsi que vous traiteriez une boîte entière de signalements :

```python
from email import message_from_string
from email.utils import parseaddr

msg = message_from_string(open("message.eml").read())
print(parseaddr(msg["From"]))          # ('IT Support', 'it-support@corp-helpdesk.example')
print(msg["Reply-To"], len(msg.get_all("Received")))
```

Une adresse de réponse sur un autre domaine que celui de l'expéditeur est l'un des contrôles les moins chers qui soient, et l'un des plus révélateurs.

@code reply-mismatch

?? Pourquoi lisez-vous les en-têtes `Received` de bas en haut ?
+ Chaque serveur ajoute sa ligne au-dessus de la précédente
- Les lignes du bas sont toujours les plus récentes
- Les logiciels de messagerie les inversent contre les attaquants
- Les lignes du haut sont toujours falsifiées par l'expéditeur
=> Le saut le plus ancien est en bas. Retenez que seules les lignes ajoutées par vos propres serveurs sont pleinement fiables.

## Les trois contrôles

| Contrôle | Question | Publié dans |
|---|---|---|
| **SPF** | Ce serveur avait-il le droit d'envoyer pour le domaine de l'enveloppe ? | DNS TXT |
| **DKIM** | La signature est-elle valide, et de qui est-elle ? | DNS TXT |
| **DMARC** | L'un des deux résultats est-il **aligné** avec le domaine `From` visible, et quelle est la politique ? | DNS TXT |

Les trois vivent dans le DNS sous forme d'enregistrements texte, vous pouvez donc lire les réglages de n'importe quel domaine avec le `dig` appris au mois 2 :

```
$ dig +short TXT example.com
"v=spf1 include:_spf.mailhost.example -all"
$ dig +short TXT _dmarc.example.com
"v=DMARC1; p=reject; rua=mailto:dmarc@example.com"
```

| Partie | Signification |
|---|---|
| `v=spf1` | Cet enregistrement est une politique SPF |
| `include:…` | Les serveurs listés par cet autre domaine peuvent envoyer pour nous |
| `-all` | Tous les autres échouent. `~all` signifie « probablement pas », un réglage plus doux |
| `p=reject` | Notre politique DMARC : refuser le courrier qui échoue |
| `rua=mailto:…` | Où les destinataires envoient leurs rapports sur ce qu'ils ont vu |

Recherchez votre propre organisation et votre banque. Un domaine sans enregistrement DMARC, ou avec `p=none`, peut être imité dans la ligne `From` bien plus facilement qu'un domaine avec `p=reject`.

L'en-tête `Authentication-Results` est un petit langage à lui seul : des résultats séparés par des points-virgules, chacun étant une paire `contrôle=résultat` suivie de détails. Sortez-en les trois résultats.

@code auth-results

Voici le piège dans lequel tout le monde tombe. SPF et DKIM peuvent réussir pour un domaine que vous ne voyez jamais. **DMARC** est le contrôle qui les relie à la ligne `From`.

```
From: payroll@oasis-payroll.example
Authentication-Results: spf=pass smtp.mailfrom=mailer-77.example;
                        dkim=pass header.d=mailer-77.example;
                        dmarc=fail header.from=oasis-payroll.example
```

Les deux ont réussi, mais pour `mailer-77.example`. Ce n'est pas le domaine montré au lecteur, donc DMARC échoue. Une politique DMARC `p=none` ne fait que signaler, `quarantine` envoie le courrier dans les indésirables, et `reject` le refuse.

L'alignement est la comparaison au cœur de cet exemple, et il est assez simple pour être écrit. Dans le mode « relâché » habituel, le domaine authentifié doit être le domaine du `From` ou l'un de ses sous-domaines.

@code dmarc-aligned

Une réussite ne veut pas dire que c'est sans danger : les attaquants authentifient aussi leurs propres domaines sosies, et un vrai compte détourné réussit tout.

@drill phish-auth

Les domaines sosies agissent sur l'œil, pas sur l'ordinateur. `paypa1` utilise le chiffre un pour la lettre l, `rnicrosoft` utilise r et n pour un m, et un vrai nom auquel on ajoute `-secure` ou `-login` est un tout autre domaine. Un programme ne se laisse pas tromper par les formes, donc un détecteur grossier n'a qu'à défaire les substitutions courantes et à chercher un nom de marque dans un domaine qui n'est pas celui de la marque.

@code lookalike-domain

?? Un courriel réussit SPF, DKIM et DMARC pour `paypa1-secure.example`. Qu'est-ce que cela prouve ?
+ Ce domaine l'a envoyé, pas qu'il est honnête
- PayPal lui-même a vérifié puis envoyé le message
- Les liens qu'il contient sont tous sans danger
- La pièce jointe a été déclarée sans malware
=> L'authentification prouve qui l'a envoyé. N'importe qui peut la mettre en place sur un domaine sosie.

## La marche à suivre

@flow Préserver l'original > Vérifier les en-têtes > Inspecter liens et pièces jointes sans risque > Qui d'autre l'a reçu ? > Extraire les IOC > Bloquer et prévenir > Documenter

Extrayez les URL sans cliquer, et vérifiez-les avec [URLScan](https://urlscan.io/) ou des recherches d'empreinte. Quand vous les notez, **neutralisez**-les pour que personne ne clique : `hxxps://example[.]com`. L'étape que l'on oublie est le **périmètre** : cherchez dans les journaux de messagerie tous ceux qui l'ont reçu, et qui a cliqué.

Le texte du lien que voit une personne et l'adresse où il mène sont deux choses distinctes. Dans le message brut, un lien s'écrit `<a href="ADRESSE">TEXTE</a>`, et seul le `href` compte. Listez chaque adresse sans rien ouvrir :

```
grep -oE 'https?://[^" <>]+' message.eml | sort -u
sha256sum invoice.pdf
```

La seconde commande donne l'empreinte à rechercher pour une pièce jointe que vous avez enregistrée dans votre VM isolée.

@code defang-url

Agissez ensuite : retirez le message de toutes les boîtes, bloquez l'expéditeur et le domaine, et si quelqu'un a saisi un mot de passe, réinitialisez-le et vérifiez ses connexions. Dites à la personne qui l'a signalé ce que vous avez trouvé, car un remerciement est ce qui fait que les gens continuent de signaler.

::: tip La compromission de messagerie professionnelle
Certaines des fraudes les plus coûteuses n'ont ni lien ni malware : seulement une demande plausible de changer des coordonnées bancaires. Cherchez l'urgence, une procédure de paiement modifiée et une nouvelle adresse de réponse. Confirmez par un canal séparé.
:::

?? Vous avez confirmé un courriel d'hameçonnage. Qu'est-ce qui s'oublie facilement, et compte beaucoup ?
+ Trouver tous les autres destinataires de ce courriel
- Répondre à l'expéditeur pour le mettre en garde
- Le transférer à tout le personnel comme formation
- Le supprimer avant d'avoir consigné la moindre preuve
=> Un signalement signifie en général beaucoup de destinataires. Délimiter le périmètre vous dit qui est en danger.

## L'IA a changé l'appât

Une mauvaise grammaire était autrefois un signe révélateur. Les attaquants utilisent maintenant des modèles de langage pour écrire des messages fluides et personnalisés dans n'importe quelle langue, donc l'orthographe ne prouve rien. Jugez la **demande** plutôt que l'écriture : est-elle inhabituelle, urgente, ou réclame-t-elle de l'argent ou des identifiants ? Les voix contrefaites suivent la même logique, et le [guide sur l'IA](/guides/d1-ai-what-changed/) en parle. La défense reste la même : vérifier par un second canal.

?? Un courriel parfaitement écrit du « PDG » demande à la finance de payer d'urgence un nouveau fournisseur. Quel est le meilleur contrôle ?
+ Appeler le PDG à un numéro déjà connu
- Chercher des fautes d'orthographe dans le courriel reçu
- Répondre au courriel pour demander une confirmation écrite
- Payer une petite somme pour faire un essai
=> Répondre va droit à l'attaquant. Un canal séparé et de confiance met en échec un message convaincant.

## Lire un message

Ceci arrive dans la boîte de signalement. Le vrai domaine de votre entreprise est `corp.example`.

```
From: "IT Support" <it-support@corp-helpdesk.example>
Reply-To: it.support.team@freemail.example
Subject: Your password expires today
Authentication-Results: spf=pass smtp.mailfrom=corp-helpdesk.example;
                        dkim=pass header.d=corp-helpdesk.example;
                        dmarc=pass header.from=corp-helpdesk.example
```

?? Tous les contrôles réussissent. Qu'est-ce qui rend quand même ce message suspect ?
+ Un domaine sosie, et des réponses qui partent ailleurs
- Une ligne d'objet qui mentionne un mot de passe
- Un nom affiché qui est écrit entre des guillemets
- Un en-tête qui liste trois résultats bien séparés ici
=> `corp-helpdesk.example` n'est pas `corp.example` : celui qui l'a enregistré a correctement configuré SPF, DKIM et DMARC pour son propre domaine. L'adresse de réponse sur un service de messagerie gratuit confirme que l'informatique ne l'a pas envoyé.

?? Le corps renvoie vers `https://corp-helpdesk.example/reset`. Comment l'écrivez-vous dans le ticket ?
+ `hxxps://corp-helpdesk[.]example/reset`
- `https://corp-helpdesk.example/reset`
- `corp-helpdesk.example/reset`
- `HTTPS://CORP-HELPDESK.EXAMPLE/RESET`
=> Neutralisé, personne ne peut cliquer dessus par accident et aucun outil de discussion n'ira en chercher un aperçu. La deuxième et la troisième forme restent des liens actifs dans la plupart des programmes.

?? Les journaux de messagerie montrent que 40 personnes l'ont reçu, et que l'une d'elles a tapé son mot de passe dans la page. Qu'est-ce qui passe en premier ?
+ Réinitialiser ce mot de passe et fermer ses sessions
- Envoyer un long rapport aux quarante personnes par courriel
- Attendre de voir si le compte se comporte mal
- Demander à cet utilisateur de faire plus attention désormais
=> Le mot de passe est maintenant entre les mains de quelqu'un d'autre. Fermez cette porte, puis vérifiez les connexions récentes du compte, puis retirez le message des 39 autres boîtes.

## S'exercer

Traitez un signalement réaliste, de la lecture des en-têtes jusqu'au périmètre.

@range phish

?! Rédigez un court playbook de triage d'hameçonnage : six étapes qu'un autre analyste pourrait suivre.

### Pour aller plus loin

Les sources primaires et le meilleur matériel gratuit sur ce sujet, tous vérifiés en novembre 2026 (en anglais) :

- [RFC 7208 : SPF](https://www.rfc-editor.org/rfc/rfc7208)
- [RFC 6376 : les signatures DKIM](https://www.rfc-editor.org/rfc/rfc6376)
- [RFC 7489 : DMARC](https://www.rfc-editor.org/rfc/rfc7489)
