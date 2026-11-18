# PARTIE 1 | Mon portrait de personne utilisatrice

Application web de l'atelier 1 « De l'usage averti à la pratique partagée de l'IA générative » (Service de soutien à la formation, Université de Sherbrooke). Elle ne demande aucun écran de projection : chaque personne l'utilise sur son ordinateur ou sa tablette, et la personne qui anime suit tout sur son propre appareil.

1. **Le portrait.** Chaque personne remplit six courts écrans (usages, ce qu'elle en pense, ce qu'elle ressent, compétence et valeurs, quatre situations), puis lit son portrait privé et le télécharge en Word.
2. **Les lignes directrices de l'UdeS, découvertes plutôt que données.** Les quatre situations ne mentionnent jamais les lignes directrices. Elles sont révélées seulement dans le portrait, où chaque personne voit ce qu'elle a choisi et indique si elle connaissait chacune d'elles.
3. **Le portrait du groupe.** Un portrait général, sans aucune réponse individuelle : la part du groupe dans chaque zone des six facettes, la connaissance des lignes directrices, ce qui occupe et inquiète le groupe.
4. **Les équipes.** À l'accueil, chaque personne indique si elle participe en présence ou à distance. L'outil forme les équipes séparément pour chacun de ces deux groupes, sans jamais les mélanger. Dans chaque groupe, il mélange les fonctions, les niveaux d'usage et les niveaux de confiance, sans jamais afficher ces informations.

## Les deux adresses

| Pour qui | Adresse | Ce qu'on y fait |
| --- | --- | --- |
| Personnes participantes | `https://…/exercice-posture/` puis le code, ou directement `https://…/exercice-posture/#CODE` | Bienvenue, portrait, puis les onglets « Le groupe » et « Mon équipe » |
| Animation | `https://…/exercice-posture/#animer` | Créer la séance, suivre l'avancement, partager le portrait du groupe, former les équipes, effacer les données |

L'adresse d'animation n'apparaît nulle part du côté des participants. Gardez-la dans vos favoris.

### Les participants peuvent-ils accéder à l'animation?

Non. Même si quelqu'un trouve l'adresse `#animer` :

- il ne peut que créer **sa propre** séance, vide. Il ne voit pas la vôtre;
- s'il tape l'adresse d'animation de **votre** séance (`#animer/CODE`), il obtient « Accès réservé » : seul le navigateur qui a créé la séance peut l'animer;
- avec Firebase, ce sont les règles de sécurité du serveur (`firestore.rules`) qui l'imposent, pas seulement l'interface : une personne participante ne peut lire que **sa propre** fiche et ne peut pas modifier la séance.

Conséquence pratique : animez depuis le **même navigateur** que celui qui a créé la séance, et ne videz pas son historique pendant l'atelier. La page d'animation garde la liste de vos séances récentes.

## Confidentialité

- **Le portrait est privé.** Les réponses de chaque personne ne sont lisibles que par elle et par le navigateur d'animation, qui en a besoin pour calculer le portrait du groupe et les équipes. L'écran d'animation n'affiche toutefois aucune réponse individuelle : seulement l'avancement (combien de personnes ont terminé chaque écran).
- **Le portrait du groupe est général.** Il n'apparaît qu'à partir de 5 portraits terminés, et seulement quand vous activez « Visible par les participants ». Il présente des pourcentages par zone (début, milieu ou fin de chaque continuum), jamais de points individuels. Aucune personne n'y est repérable : on peut le projeter à l'écran.
- **Les équipes ne montrent que des prénoms.** Ni l'animation ni les participants ne voient sur quels critères une personne a été placée.
- Le portrait Word reste sur l'appareil de la personne.
- À la fin, ouvrez **Fin de séance** et effacez les données.

## Déployer sur GitHub Pages

L'application est un site statique : aucune compilation n'est nécessaire. Les polices et les bibliothèques sont incluses; le site ne fait appel à aucun service externe, sauf Firebase une fois configuré.

### 1. Mettre les fichiers sur GitHub

1. Créez un dépôt sur GitHub, par exemple `exercice-posture`.
2. Téléversez **le contenu** de ce dossier à la racine du dépôt (*Add file › Upload files*) : `index.html`, `config.js`, `firestore.rules`, `.nojekyll`, `README.md` et les dossiers `js`, `assets` et `vendor`.
3. Ouvrez *Settings › Pages*. Sous *Build and deployment*, choisissez *Deploy from a branch*, la branche `main` et le dossier `/ (root)`, puis *Save*.
4. Après une ou deux minutes, l'adresse du site s'affiche, par exemple `https://votre-compte.github.io/exercice-posture/`.

À cette étape, l'application fonctionne en **mode démonstration** : tout marche, mais seulement dans le navigateur qui a créé la séance. C'est suffisant pour vous exercer avec les participants fictifs (section « S'exercer » de la page d'animation).

### 2. Relier les appareils de la salle avec Firebase (gratuit)

GitHub Pages ne fait qu'héberger des fichiers. Pour que les appareils de la salle partagent la même séance, l'application utilise Firebase Firestore. Le forfait gratuit *Spark* suffit pour un atelier.

1. Sur https://console.firebase.google.com, créez un projet, par exemple `exercice-posture-ssf`. Google Analytics n'est pas nécessaire.
2. **Authentification :** *Build › Authentication › Get started*, onglet *Sign-in method*, activez **Anonymous**. Aucun compte n'est demandé aux personnes.
3. **Base de données :** *Build › Firestore Database › Create database*. Choisissez la région `northamerica-northeast1` (Montréal) et le *production mode*.
4. **Règles de sécurité :** dans Firestore, onglet *Rules*, remplacez tout par le contenu du fichier `firestore.rules`, puis *Publish*. C'est cette étape qui garantit que chaque personne ne lit que sa fiche.
5. **Configuration web :** *Project settings* (roue dentée) › *Your apps* › icône `</>`. Donnez un nom à l'application (pas besoin de Firebase Hosting) et copiez l'objet `firebaseConfig`.
6. Dans votre dépôt GitHub, ouvrez `config.js` (icône crayon) et remplacez `firebase: null` par la configuration copiée :

   ```js
   window.ATELIER_CONFIG = {
     firebase: {
       apiKey: "AIza...",
       authDomain: "exercice-posture-ssf.firebaseapp.com",
       projectId: "exercice-posture-ssf",
       storageBucket: "exercice-posture-ssf.appspot.com",
       messagingSenderId: "123456789",
       appId: "1:123456789:web:abc123"
     }
   };
   ```

   Ces clés ne sont pas secrètes : ce sont les règles de sécurité qui protègent les données.
7. **Domaine autorisé :** *Authentication › Settings › Authorized domains*, ajoutez `votre-compte.github.io`.

### 3. Faire un essai avant l'atelier

Ouvrez `…/#animer` sur votre ordinateur et créez une séance. Rejoignez-la avec une tablette et un téléphone, remplissez un portrait, ajoutez des participants fictifs pour dépasser 5 portraits, partagez le portrait du groupe, formez les équipes, puis effacez les données. Vérifiez aussi qu'en ouvrant `…/#animer/CODE` sur la tablette, vous obtenez bien « Accès réservé ».

## Le jour de l'atelier

1. Sur votre ordinateur, ouvrez `…/#animer` et créez la séance. Gardez cet onglet ouvert : c'est lui qui calcule le portrait du groupe et les équipes.
2. Donnez aux personnes le lien ou le code (bouton **Copier**, ou code QR à montrer).
3. Suivez l'avancement. Quand au moins 5 portraits sont terminés, activez **Visible par les participants** : l'onglet « Le groupe » s'ouvre sur leurs appareils.
4. Choisissez la taille des équipes et cliquez sur **Former les équipes**. Les équipes apparaissent aussitôt dans l'onglet « Mon équipe ». Les équipes en présence et à distance sont présentées séparément. Pour déplacer quelqu'un, cliquez sur son prénom, puis sur **Déplacer ici**. Si vous déplacez une personne vers une équipe de l'autre groupe, sa façon de participer est mise à jour. Une personne arrivée en retard apparaît dans « Sans équipe ».
5. Téléchargez au besoin la liste des équipes en Word, puis effacez les données de la séance.

## Adapter le contenu

Les textes (facettes, affirmations, situations, aide de chaque écran) sont dans `js/content.js`. Chaque option d'une situation porte une valeur `d` (discernement, de 0 à 100) qui n'est jamais affichée : elle place la facette « Lignes directrices UdeS » et sert à détecter les tensions. Une option à 80 ou plus compte comme « suit la piste d'usage averti » dans le portrait du groupe.

## Fichiers

| Fichier | Rôle |
| --- | --- |
| `index.html` | Page et styles |
| `config.js` | Configuration Firebase (laisser `null` pour le mode démonstration) |
| `firestore.rules` | Règles de sécurité à coller dans Firebase |
| `js/app.js` | Fonctionnement : vue participante, vue d'animation, calculs |
| `js/content.js` | Textes de l'exercice |
| `js/store.js` | Synchronisation (démonstration ou Firebase) |
| `js/docs.js` | Documents Word (portrait, équipes) |
| `js/icons.js` | Icônes (Material Design, licence Apache 2.0) |
| `vendor/docx.iife.js` | Bibliothèque docx (licence MIT) |
| `vendor/qrcode.js` | Générateur de code QR (licence MIT) |
| `vendor/jszip.min.js` | Lecture et écriture du gabarit Word (licence MIT) |
| `assets/gabarit.docx` | Gabarit Word du portrait et de la liste des équipes : styles, en-tête « Apprivoiser les iA » et pied de page du cahier de la personne participante, sans page couverture. Pour le modifier, ouvrez-le dans Word et gardez le paragraphe `{{CONTENU}}` |
| `assets/logo-apprivoiser.png` | Logo « Apprivoiser les iA » de l'en-tête Word |
| `js/gabarit.js` | Copie intégrée du gabarit Word, utilisée si `assets/gabarit.docx` ne peut pas être lu. Gardez les deux fichiers en ligne |
| `assets/fonts/` | Polices Archivo et Archivo Narrow, hébergées avec le site (licence SIL OFL 1.1) |
| `assets/` | Logo « iA » et image de fond de la marque |
