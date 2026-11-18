/* Contenu de l'atelier : étapes, continuums, postures, cartes, rubriques et bonnes pratiques.
   Modifiez ce fichier pour adapter l'atelier sans toucher au reste du code. */

window.CONTENT = (() => {

  const PARTS = [
    { id: "p0", nm: "Accueil", color: "var(--brand-forest)" },
    { id: "p1", nm: "Partie 1 : Ma posture", color: "var(--brand-emerald)" },
    { id: "p2", nm: "Partie 2 : Cartes d'usage", color: "var(--brand-gold)" },
    { id: "p3", nm: "Partie 3 : Skills", color: "var(--brand-plum)" },
    { id: "p4", nm: "Clôture", color: "var(--brand-forest)" }
  ];

  /* Chaque étape : part, titre, durée, consignes pour l'animation (anim) et pour les personnes (moi) */
  const STEPS = [
    { id: "accueil", short: "Accueil", goal: "Rejoindre la séance et s'engager à protéger les données.", part: 0, nm: "Bienvenue", min: 3,
      slides: ["Bienvenue"],
      anim: ["Laissez cette diapositive à l'écran pendant que les gens arrivent : le code QR et le code s'y trouvent, et les prénoms apparaissent à mesure. Chaque personne entre son prénom, son profil et s'engage à protéger les données."],
      moi: ["Entrez votre prénom et votre profil.", "Engagez-vous à ne rien entrer de personnel ou de confidentiel."] },

    { id: "posture", short: "Mon portrait", goal: "Dresser mon portrait de personne utilisatrice de l'IA générative : mes usages, mes croyances et perceptions, mes émotions, ma compétence, mes valeurs et les lignes directrices de l'UdeS.", part: 1, nm: "Mon portrait de personne utilisatrice", min: 12,
      slides: ["Six facettes", "Six écrans", "Les lignes directrices de l'UdeS", "Où en est le groupe"],
      anim: ["Survol, simplement pour expliquer l'activité : le portrait réunit cinq facettes de la posture personnelle et une sixième, les lignes directrices de l'UdeS. Chaque facette est un continuum, sans bonne ni mauvaise réponse.",
             "Annoncez la règle du jeu : chaque personne répond individuellement, sur son appareil, et le portrait reste privé. Pour les situations, on répond ce qu'on ferait vraiment. Invitez les personnes à commencer.",
             "Dans l'écran « Quatre situations », chaque personne indique d'abord dans quelle mesure elle applique une ligne directrice, puis vit la situation qui s'y rattache. Les situations montrent l'écart entre ce qu'on pense faire et ce qu'on ferait vraiment.",
             "Suivez l'avancement du groupe. Invitez les personnes qui ont terminé à relire leurs tensions et à télécharger leur portrait. Quand la majorité a vu son portrait, passez au groupe en miroir."],
      moi: ["Répondez aux questions, écran par écran.", "Pour chaque ligne directrice, dites ce que vous en faites, puis choisissez ce que vous feriez vraiment dans la situation.", "Lisez votre portrait et téléchargez-le."] },

    { id: "groupe", short: "Le groupe", goal: "Voir la diversité du groupe, discuter d'une situation qui divise et d'une qui rassemble, puis former des équipes variées.", part: 1, nm: "Le groupe en miroir", min: 8,
      slides: ["Le profil du groupe", "Deux situations", "Les équipes"],
      anim: ["Projetez le profil du groupe : chaque point est une personne, sans nom. L'outil indique la facette la plus dispersée : commentez-la. Glissez le résultat de Lee et al. (2025) : plus on fait confiance à l'outil, moins on exerce sa pensée critique.",
             "À gauche, la situation qui divise le plus le groupe; à droite, celle qui le rassemble. Demandez à deux personnes qui ont fait des choix différents de les expliquer, puis révélez la piste d'usage averti. Les petits numéros permettent d'afficher une autre situation.",
             "Choisissez la taille des équipes et cliquez sur « Former les équipes ». L'outil mélange les profils, les niveaux d'usage et les niveaux de confiance. Pour déplacer une personne, cliquez sur son prénom, puis sur « Déplacer ici ». Téléchargez la liste en Word au besoin."],
      moi: ["Regardez où vous vous situez dans le groupe.", "Repérez votre équipe et rejoignez ses membres."] }
  ];

  const PROFILS = ["CP", "Administratif", "Technique", "Autre"];

  /* ============ Partie 1, Mon portrait de personne utilisatrice de l'IAg ============
     Six facettes, vingt questions inspirées d'échelles validées (outil de réflexion, pas un test),
     quatre situations (une par ligne directrice de l'UdeS) et des tensions détectées entre facettes. */
  const LIKERT = ["Pas du tout", "Plutôt pas", "Plus ou moins", "Plutôt", "Tout à fait"];
  const FACETS = [
    { k: "usages", nm: "Mes usages", l: "rare", r: "presque chaque jour", q: "Qu'est-ce que je fais vraiment avec l'IAg?" },
    { k: "croyances", nm: "Mes croyances et perceptions", l: "méfiance, peu utile", r: "confiance, très utile", q: "Qu'est-ce qu'elle m'apporte et à quel point je m'y fie?" },
    { k: "emotions", nm: "Mes émotions", l: "inquiétude", r: "enthousiasme", q: "Qu'est-ce que je ressens?" },
    { k: "competence", nm: "Ma compétence", l: "peu capable", r: "tout à fait capable", q: "Est-ce que je me sens capable de bien l'utiliser?" },
    { k: "valeurs", nm: "Mes valeurs", l: "j'y pense peu", r: "j'y pense toujours", q: "Est-ce que je me demande si c'est souhaitable?" },
    { k: "attentes", nm: "Lignes directrices UdeS", l: "loin des lignes directrices", r: "en accord avec elles", q: "Mes choix suivent-ils les lignes directrices de l'UdeS?" }
  ];
  const FREQ = ["Jamais", "1 ou 2 fois", "Chaque semaine", "Presque chaque jour"];
  const TASKS = [
    { k: "rediger", nm: "Rédiger ou reformuler un texte" }, { k: "courriel", nm: "Rédiger un courriel ou une réponse" }, { k: "langue", nm: "Réviser la langue ou la clarté" },
    { k: "resumer", nm: "Résumer un document" }, { k: "traduire", nm: "Traduire" }, { k: "chercher", nm: "Chercher de l'information" },
    { k: "idees", nm: "Explorer des idées ou des pistes" }, { k: "materiel", nm: "Préparer du matériel ou une présentation" },
    { k: "pedago", nm: "Concevoir une activité d'apprentissage ou une évaluation" }, { k: "retro", nm: "Préparer une rétroaction ou un accompagnement" },
    { k: "reunion", nm: "Préparer une réunion ou un compte rendu" }, { k: "procedure", nm: "Documenter une procédure ou un guide" },
    { k: "planifier", nm: "Planifier un projet ou un échéancier" }, { k: "analyser", nm: "Analyser des données ou des commentaires" },
    { k: "code", nm: "Écrire du code, un script ou une formule" }, { k: "visuel", nm: "Créer une image ou un visuel" },
    { k: "accessibilite", nm: "Rendre un contenu accessible (sous-titres, textes alternatifs)" }, { k: "autre", nm: "Autre" }
  ];
  const TOOLS = [
    { k: "copilot", nm: "Copilot Chat avec mon compte UdeS" }, { k: "public", nm: "Un outil externe à l'UdeS, avec un compte personnel" },
    { k: "integre", nm: "Un outil intégré à un logiciel" }, { k: "aucun", nm: "Aucun" }
  ];
  /* Affirmations sur l'échelle d'accord (1 à 5). f = facette, src = inspiration */
  const ITEMS = [
    { k: "p_temps", f: "croyances", t: "L'IAg me permet de gagner du temps dans mes tâches professionnelles.", src: "Davis (1989)" },
    { k: "p_qualite", f: "croyances", t: "L'IAg améliore la qualité de certaines de mes productions.", src: "Davis (1989)" },
    { k: "p_reflexion", f: "croyances", t: "L'IAg m'aide à structurer ma réflexion ou à explorer d'autres angles.", src: "Tankelevitch et al. (2024)" },
    { k: "p_habitude", f: "croyances", t: "J'ai recours à l'IAg par habitude, sans toujours évaluer sa pertinence pour la tâche.", src: "Venkatesh et al. (2012)" },
    { k: "p_social", f: "croyances", t: "Je ressens une pression à l'utiliser parce que mon milieu professionnel le fait.", src: "Venkatesh et al. (2012)" },
    { k: "b_comprend", f: "croyances", t: "L'IAg comprend le sens de ce qu'elle produit.", src: "Long et Magerko (2020)" },
    { k: "b_ecrit", f: "croyances", t: "Une réponse bien rédigée est généralement exacte.", src: "Lee et See (2004)" },
    { k: "b_sources", f: "croyances", t: "L'IAg s'appuie sur des sources fiables et vérifiables.", src: "Ng et al. (2021)" },
    { k: "b_neutre", f: "croyances", t: "Les réponses de l'IAg sont neutres et exemptes de biais.", src: "Miao et Cukurova (2024)" },
    { k: "b_confiance", f: "croyances", t: "Je me fie aux réponses de l'IAg dans mon travail.", src: "Lee et al. (2025)" },
    { k: "c_formuler", f: "competence", t: "Je sais formuler une requête qui produit le résultat attendu.", src: "Carolus et al. (2023)" },
    { k: "c_ajuster", f: "competence", t: "Je sais préciser ou reformuler ma demande quand le premier résultat ne convient pas.", src: "Carolus et al. (2023)" },
    { k: "c_erreur", f: "competence", t: "Je suis capable de repérer une erreur dans une réponse de l'IAg.", src: "Lee et al. (2025)" },
    { k: "c_choisir", f: "competence", t: "Je sais distinguer les tâches où l'IAg est utile de celles où elle ne l'est pas.", src: "Long et Magerko (2020)" },
    { k: "c_expliquer", f: "competence", t: "Je pourrais expliquer à mes collègues les principales limites de l'IAg.", src: "Ng et al. (2021)" },
    { k: "v_souhaitable", f: "valeurs", t: "Avant d'utiliser l'IAg, je me demande si c'est souhaitable pour les personnes concernées.", src: "Miao et Cukurova (2024)" },
    { k: "v_transparence", f: "valeurs", t: "Je juge important de déclarer mon usage de l'IAg, même lorsqu'il est partiel.", src: "Lignes directrices de l'UdeS" },
    { k: "v_humain", f: "valeurs", t: "Je tiens à ce que les décisions qui touchent des personnes restent humaines.", src: "Miao et Cukurova (2024)" },
    { k: "v_equite", f: "valeurs", t: "Je me soucie des effets de l'IAg sur l'équité et l'inclusion.", src: "Miao et Cukurova (2024)" },
    { k: "v_environnement", f: "valeurs", t: "Je tiens compte de l'impact environnemental quand je choisis d'utiliser l'IAg.", src: "Miao et Cukurova (2024)" }
  ];
  const WORRIES = [
    { k: "valeur", nm: "Que mon travail perde de sa valeur" }, { k: "rythme", nm: "Ne pas suivre le rythme" },
    { k: "erreurs", nm: "Des erreurs que je ne verrais pas" }, { k: "donnees", nm: "La protection des données" },
    { k: "apprentissage", nm: "Les effets sur l'apprentissage" }, { k: "integrite", nm: "L'intégrité intellectuelle et académique" },
    { k: "biais", nm: "Les biais et l'équité" }, { k: "dependance", nm: "Une dépendance ou une perte de compétences" },
    { k: "droits", nm: "Le droit d'auteur et la propriété intellectuelle" }, { k: "cadre", nm: "Un encadrement institutionnel encore flou" },
    { k: "charge", nm: "Des attentes de productivité accrues" }, { k: "relation", nm: "Moins de contacts humains dans mon travail" },
    { k: "environnement", nm: "L'impact environnemental" }, { k: "rien", nm: "Rien en particulier" }
  ];
  /* Préoccupations inspirées des niveaux de préoccupation du modèle CBAM (Hall et Hord) */
  const PREOCC = [
    { k: "info", nm: "Comprendre", q: "Ce que c'est, au juste, et ce que ça peut faire.", note: "Vous cherchez d'abord à comprendre. Le jeu des cartes vous montrera concrètement ce que l'outil fait bien et moins bien." },
    { k: "perso", nm: "Mon rôle", q: "Ce que ça change pour moi et pour mon travail.", note: "Vous vous demandez ce que l'IAg change pour votre rôle. La discussion en équipe montrera que vous n'êtes pas la seule personne à vous poser la question." },
    { k: "gestion", nm: "Mon temps", q: "Comment l'intégrer sans y passer mes journées.", note: "Vous cherchez à intégrer l'IAg sans alourdir votre travail. Une bonne skill, écrite une fois, sert ensuite à toute l'équipe." },
    { k: "effets", nm: "Les effets", q: "Ses effets sur les personnes que je sers et sur leur apprentissage.", note: "Vous pensez aux personnes que vous servez. Cette préoccupation est au cœur de l'usage éthique et aura sa place dans chaque skill." },
    { k: "equipe", nm: "Notre équipe", q: "Comment en faire une pratique partagée avec mes collègues.", note: "Vous pensez déjà en équipe. La banque de skills de la partie 3 répond directement à cette préoccupation." },
    { k: "cadre", nm: "Le cadre", q: "Ce qui est permis, attendu et à déclarer à l'UdeS.", note: "Vous cherchez des repères clairs. Les lignes directrices de l'UdeS, présentées dans votre portrait, sont un point de départ; les skills permettent ensuite de les intégrer à vos façons de faire." },
    { k: "fiabilite", nm: "La fiabilité", q: "Comment savoir si je peux me fier à ce qu'elle produit.", note: "Vous vous souciez de la fiabilité. Les cartes d'usage vous feront tester l'outil sur des cas concrets et en repérer les limites." },
    { k: "donnees", nm: "Les données", q: "Ce qu'il advient de l'information que j'y entre.", note: "Vous pensez à la protection de l'information. C'est l'une des quatre lignes directrices de l'UdeS, et chaque skill précisera ce qu'il ne faut jamais y entrer." },
    { k: "integrite", nm: "L'intégrité", q: "Ses effets sur l'intégrité intellectuelle et sur l'évaluation des apprentissages.", note: "Vous pensez à l'intégrité. La déclaration de l'usage et les limites à fixer traversent tout l'atelier." },
    { k: "competences", nm: "Mes compétences", q: "Ce que je dois apprendre pour bien l'utiliser.", note: "Vous voulez développer vos compétences. L'atelier vous fait pratiquer sur des cas concrets, et la banque de skills vous donnera des procédures prêtes à essayer." },
    { k: "environnement", nm: "L'environnement", q: "Son coût énergétique et environnemental.", note: "Vous pensez à l'impact environnemental. Choisir le bon outil, et parfois renoncer à l'IAg, fait partie d'un usage averti." }
  ];
  const VALUES = [
    { k: "qualite", nm: "La qualité et l'exactitude", sit: "s2" }, { k: "temps", nm: "Le temps gagné" },
    { k: "personnes", nm: "Les personnes que je sers et leurs données", sit: "s4" }, { k: "apprentissage", nm: "L'apprentissage des personnes étudiantes" },
    { k: "equite", nm: "L'équité et l'inclusion", sit: "s2" }, { k: "environnement", nm: "L'environnement", sit: "s1" },
    { k: "jugement", nm: "Mon jugement professionnel", sit: "s3" }, { k: "transparence", nm: "La transparence", sit: "s3" },
    { k: "integrite", nm: "L'intégrité intellectuelle" }, { k: "collegialite", nm: "La collaboration avec mes collègues" }
  ];
  /* Les quatre lignes directrices de l'UdeS (2024) */
  const RULES = [
    { k: "r1", sit: "s1", nm: "Choisir le bon outil", d: "Un moteur de recherche d'abord, quand il suffit." },
    { k: "r2", sit: "s2", nm: "Valider les réponses", d: "Vérifier auprès d'autres sources." },
    { k: "r3", sit: "s3", nm: "Déclarer l'utilisation", d: "Le but, l'outil et sa version." },
    { k: "r4", sit: "s4", nm: "Préserver la sécurité de l'information", d: "Rien de confidentiel, de personnel ou de protégé." }
  ];
  const RULELEV = ["Je ne la connaissais pas", "Rarement", "Souvent", "Toujours"];
  /* Quatre situations. d = discernement (0 à 100), jamais affiché; lec = ce que le choix révèle */
  const SITUATIONS = [
    { id: "s1", rule: "r1", nm: "Une date à trouver",
      t: "Une personne étudiante vous demande la date limite d'abandon d'un cours pour la session d'hiver.",
      averti: "Pour une information officielle, aller à la source. Garder l'IAg pour ce qu'elle fait mieux qu'un moteur de recherche.",
      o: [
        { k: "a", t: "Je pose la question à Copilot et je transmets la réponse.", d: 10, lec: "Une date officielle se vérifie à la source. L'IAg peut donner une date d'une autre année ou d'un autre établissement." },
        { k: "b", t: "Je pose la question à Copilot, puis je vérifie sur le site de l'UdeS.", d: 60, lec: "Bonne vérification, mais l'IAg n'apportait rien ici : le site suffisait." },
        { k: "c", t: "Je cherche directement sur le site de l'UdeS.", d: 95, lec: "Le bon outil pour une information officielle. C'est la première règle de l'UdeS." },
        { k: "d", t: "Je demande à une collègue.", d: 55, lec: "Une source humaine fiable, mais qui ne remplace pas le calendrier officiel." } ] },
    { id: "s2", rule: "r2", nm: "Le résumé impeccable",
      t: "Copilot vient de résumer en cinq points une politique institutionnelle de 12 pages. Le résumé est clair et bien écrit. Vous devez le transmettre à votre équipe aujourd'hui.",
      averti: "Utiliser l'IAg pour le premier jet, puis vérifier chaque point dans le texte officiel.",
      o: [
        { k: "a", t: "Je l'envoie tel quel : il est clair et bien écrit.", d: 10, lec: "La clarté n'est pas l'exactitude. Un résumé peut omettre une exception ou un délai." },
        { k: "b", t: "Je le relis pour corriger le style, puis je l'envoie.", d: 35, lec: "Vous relisez la forme ; les omissions ne se voient qu'en comparant avec le texte officiel." },
        { k: "c", t: "Je compare chaque point au texte officiel avant de l'envoyer.", d: 95, lec: "Vous validez à la source : c'est la deuxième règle de l'UdeS." },
        { k: "d", t: "Je fais le résumé moi-même : c'est trop risqué.", d: 60, lec: "Prudent, mais vous renoncez à un gain réel qu'une vérification aurait rendu sûr." } ] },
    { id: "s3", rule: "r3", nm: "Le guide presque fini",
      t: "Vous avez rédigé avec Copilot une bonne partie d'un guide destiné aux enseignants. Vous l'avez relu et corrigé en profondeur.",
      averti: "Déclarer simplement, par exemple : « Premier jet rédigé avec Copilot Chat, puis révisé par l'auteur. »",
      o: [
        { k: "a", t: "Je ne le mentionne pas : je l'ai retravaillé, c'est mon texte.", d: 15, lec: "La déclaration est requise même pour un usage partiel. Elle informe les lecteurs, elle ne diminue pas votre travail." },
        { k: "b", t: "Je le mentionne si quelqu'un me pose la question.", d: 35, lec: "La transparence ne devrait pas dépendre d'une question." },
        { k: "c", t: "J'indique dans le guide l'outil, sa version et l'usage fait.", d: 95, lec: "C'est la troisième règle de l'UdeS : le but, l'outil et la version." },
        { k: "d", t: "Je réécris les passages pour ne pas avoir à le déclarer.", d: 40, lec: "Beaucoup de temps pour éviter une ligne de déclaration. Qu'est-ce qui gêne dans le fait de le dire?" } ] },
    { id: "s4", rule: "r4", nm: "Les commentaires d'appréciation",
      t: "Une enseignante vous transmet 180 commentaires d'appréciation de son cours pour en dégager les grands thèmes. Plusieurs commentaires nomment des personnes.",
      averti: "Vérifier ce qui est permis, anonymiser, puis faire valider les thèmes par l'enseignante.",
      o: [
        { k: "a", t: "Je les colle tels quels : Copilot est l'outil de l'UdeS.", d: 15, lec: "Un outil approuvé n'autorise pas tout. Les noms restent des renseignements personnels." },
        { k: "b", t: "Je retire les noms et tout détail identifiant, puis j'utilise Copilot.", d: 85, lec: "Vous protégez les personnes avant d'utiliser l'outil : c'est la quatrième règle de l'UdeS." },
        { k: "c", t: "Je vérifie d'abord ce qui est permis pour ces données, puis j'anonymise.", d: 100, lec: "Vous cherchez la règle avant d'agir, puis vous protégez les données." },
        { k: "d", t: "Je fais l'analyse à la main.", d: 55, lec: "Aucun risque pour les données, mais beaucoup de temps ; une version anonymisée permettait le gain sans le risque." } ] }
  ];
  /* Écrans du parcours participant, avec l'aide affichée à côté de chaque écran */
  const PSCREENS = [
    { k: "usages", nm: "Mes usages", min: 1.5,
      quoi: "Vous décrivez ce que vous faites vraiment avec l'IA générative au travail.",
      comment: ["Pensez au dernier mois.", "Choisissez une fréquence, puis vos tâches et vos outils.", "Plusieurs choix sont possibles pour les tâches et les outils."],
      pourquoi: "Ce qu'on fait vraiment est souvent différent de ce qu'on croit faire. C'est le point de départ du portrait." },
    { k: "pense", nm: "Ce que j'en pense", min: 3,
      quoi: "Vous dites ce que l'IAg vous apporte et ce que vous croyez ou savez de son fonctionnement.",
      comment: ["Lisez chaque affirmation.", "Choisissez votre degré d'accord, de « Pas du tout » à « Tout à fait ».", "Répondez spontanément : il n'y a pas de bonne réponse."],
      pourquoi: "Ce que l'on croit de l'outil influence la confiance qu'on lui accorde, et donc ce qu'on vérifie (Lee et See, 2004)." },
    { k: "ressens", nm: "Ce que je ressens", min: 2,
      quoi: "Vous situez vos émotions face à l'IAg et ce qui vous préoccupe.",
      comment: ["Déplacez le curseur entre l'inquiétude et l'enthousiasme.", "Choisissez au plus trois inquiétudes.", "Choisissez la question qui vous occupe le plus."],
      pourquoi: "Les émotions comptent : l'inquiétude comme l'enthousiasme changent la façon dont on utilise l'outil (Wang et Wang, 2019)." },
    { k: "reperes", nm: "Compétence et valeurs", min: 2.5,
      quoi: "Vous évaluez ce que vous vous sentez capable de faire, et ce qui compte pour vous.",
      comment: ["Répondez aux dix affirmations, en pensant à votre pratique actuelle.", "Choisissez au plus deux éléments qui comptent le plus pour vous."],
      pourquoi: "Se sentir capable de repérer une erreur aide à garder son esprit critique face à une réponse convaincante (Lee et al., 2025)." },
    { k: "situations", nm: "Quatre situations", min: 3,
      quoi: "Vous lisez quatre situations de travail et vous choisissez ce que vous feriez.",
      comment: ["Lisez la situation.", "Choisissez ce que vous feriez vraiment, un jour chargé, pas ce qu'il faudrait faire.", "Passez à la situation suivante avec le bouton en bas."],
      pourquoi: "Ce que l'on ferait vraiment en dit plus que ce que l'on croit faire. Votre portrait vous montrera ensuite ce que ces situations ont en commun." },
    { k: "portrait", nm: "Mon portrait", min: 3,
      quoi: "Vous lisez votre portrait : vos six facettes, les tensions à explorer, puis ce que les quatre situations avaient en commun.",
      comment: ["La silhouette et les lignes situent vos réponses sur des continuums. Aucune extrémité n'est la bonne.", "Lisez les tensions comme des questions, pas comme des jugements.", "Pour chaque ligne directrice de l'UdeS, dites si vous la connaissiez."],
      pourquoi: "Un portrait est une photo du moment. Il change selon la tâche, le temps dont on dispose et ce qui est en jeu." }
  ];

  /* Accueil : objectifs et animation */
  const KNOWN = ["Non", "Vaguement", "Oui"];
  const OBJECTIFS = ["Situer votre propre posture face aux SIAg.", "Juger la valeur ajoutée d'un usage selon la tâche et le but.", "Traduire une pratique avertie en « skill » réutilisable par l'équipe."];
  const ANIMATION = "Serge Piché et Alexandra Lez";
  const BESOINS = ["Un ordinateur ou une tablette", "Copilot Chat ouvert avec votre compte UdeS"];

  const SOURCES = [
    "Bandura, A. (1997). Self-efficacy: The exercise of control. W H Freeman/Times Books/ Henry Holt & Co.",
    "Carolus, A., Koch, M. J., Straka, S., Latoschik, M. E. et Wienrich, C. (2023). MAILS: Meta AI Literacy Scale. Computers in Human Behavior: Artificial Humans, 1(2), 100014. https://downloads.hci.informatik.uni-wuerzburg.de/Carolus-and-Kocch-(2023)-MAILS.pdf",
    "Davis, F. D. (1989). Perceived usefulness, perceived ease of use, and user acceptance of information technology. MIS Quarterly, 13(3), 319-340. https://doi.org/10.2307/249008",
    "Lee, H.-P., Sarkar, A., Tankelevitch, L., Drosos, I., Rintel, S., Banks, R. et Wilson, N. (2025). The impact of generative AI on critical thinking: Self-reported reductions in cognitive effort and confidence effects from a survey of knowledge workers. CHI '25, article 1121. https://doi.org/10.1145/3706598.3713778",
    "Lee, J. D. et See, K. A. (2004). Trust in automation: Designing for appropriate reliance. Human Factors, 46(1), 50-80. https://doi.org/10.1518/hfes.46.1.50_30392",
    "Long, D. et Magerko, B. (2020). What is AI literacy? Competencies and design considerations. CHI 2020, ACM. https://dl.acm.org/doi/10.1145/3313831.3376727",
    "Miao, F. et Cukurova, M. (2024). AI competency framework for teachers. UNESCO. https://doi.org/10.54675/ZJTE2084",
    "Ng, D. T. K., Leung, J. K. L., Chu, S. K. W. et Qiao, M. S. (2021). Conceptualizing AI literacy: An exploratory review. Computers and Education: Artificial Intelligence, 2. https://www.sciencedirect.com/science/article/pii/S2666920X21000357",
    "Parasuraman, R. et Riley, V. (1997). Humans and automation: Use, misuse, disuse, abuse. Human Factors, 39(2), 230-253. https://doi.org/10.1518/001872097778543886",
    "Schepman, A. et Rodway, P. (2020). Initial validation of the general attitudes towards artificial intelligence scale. Computers in Human Behavior Reports, 1. https://doi.org/10.1016/j.chbr.2020.100014",
    "Tankelevitch, L. et al. (2024). The metacognitive demands and opportunities of generative AI. CHI 2024, ACM. https://doi.org/10.1145/3613904.3642902",
    "Université de Sherbrooke (2024). Lignes directrices pour l'utilisation de l'intelligence artificielle générative. https://www.usherbrooke.ca/decouvrir/fileadmin/sites/decouvrir/documents/IA-regles-bonnes-pratiques.pdf",
    "Université de Sherbrooke, Service de soutien à la formation (2024). Balises d'utilisation des outils d'intelligence artificielle générative (IAg). Zenodo. https://zenodo.org/records/14510665",
    "Venkatesh, V., Thong, J. Y. L. et Xu, X. (2012). Consumer acceptance and use of information technology. MIS Quarterly, 36(1), 157-178. https://doi.org/10.2307/41410412",
    "Wang, Y.-Y. et Wang, Y.-S. (2019). Development and validation of an artificial intelligence anxiety scale. Interactive Learning Environments. https://doi.org/10.1080/10494820.2019.1674887"
  ];

  const TEAMS = [
    { id: "A", nm: "Prune", c: "#805186" },
    { id: "B", nm: "Or", c: "#C9902A" },
    { id: "C", nm: "Émeraude", c: "#00A759" },
    { id: "D", nm: "Cuivre", c: "#B35E2F" },
    { id: "E", nm: "Forêt", c: "#447B5A" },
    { id: "F", nm: "Lime", c: "#7FA83F" },
    { id: "G", nm: "Ardoise", c: "#5E6B73" },
    { id: "H", nm: "Aurore", c: "#C2577A" }
  ];

  const QUADS = [
    { k: "encadrer", nm: "À encadrer", hint: "Gain réel, à condition de vérifier, déclarer et protéger les données", c: "var(--q-encadrer)", key: "2" },
    { k: "adopter", nm: "À adopter", hint: "Gain réel, risque faible", c: "var(--q-adopter)", key: "4" },
    { k: "eviter", nm: "À éviter", hint: "Peu de gain, risques élevés", c: "var(--q-eviter)", key: "1" },
    { k: "gadget", nm: "Gadget", hint: "Peu de gain, peu de risque", c: "var(--q-gadget)", key: "3" }
  ];
  const RES = [{ k: "prevu", nm: "Comme prévu" }, { k: "mieux", nm: "Mieux que prévu" }, { k: "moins", nm: "Moins bien que prévu" }];

  /* Quinze cas choisis à la frontière de deux zones. et = la variante « Et si… » montrée après le classement;
     debat = la frontière visée (pour l'animation seulement). */
  const CARDS = [
    ["c01", "Faire générer une grille d'évaluation critériée à partir de la consigne d'un travail ; l'enseignant la révisera.", "CP", "Adopter ou encadrer", "la grille était remise aux étudiants sans révision?"],
    ["c02", "Demander à l'IA cinq références scientifiques sur la classe inversée pour une fiche-conseil.", "CP", "Encadrer ou éviter", "vous lui demandiez seulement des mots-clés pour chercher vous-même dans les bases documentaires?"],
    ["c03", "Simuler un enseignant réticent pour se pratiquer à un entretien d'accompagnement.", "CP", "Gadget ou adopter", "la simulation reprenait les propos réels d'un enseignant que vous accompagnez?"],
    ["c04", "Faire rédiger par l'IA toute la rétroaction sur un plan de cours envoyé par un enseignant.", "CP", "Encadrer ou éviter", "l'IA servait seulement à vérifier que vous n'avez rien oublié dans votre propre rétroaction?"],
    ["c05", "Passer un travail étudiant dans un détecteur d'IA pour savoir s'il a été rédigé avec l'IA.", "CP", "Gadget ou éviter", "le résultat servait de seule preuve dans un dossier de plagiat?"],
    ["c06", "Rédiger le procès-verbal d'une réunion à partir de la transcription automatique de Teams.", "Administratif", "Adopter ou éviter", "la réunion portait sur le dossier d'une personne étudiante?"],
    ["c07", "Reformuler en langage clair une procédure administrative pour la page web du service.", "Administratif", "Adopter ou encadrer", "la procédure comportait des délais réglementaires?"],
    ["c08", "Demander une réponse polie et empathique à un courriel d'étudiant mécontent.", "Administratif", "Adopter ou éviter", "le courriel décrivait sa situation de santé?"],
    ["c09", "Créer une formule Excel complexe pour un tableau de suivi des inscriptions.", "Administratif", "Adopter ou encadrer", "vous colliez le tableau avec les noms pour que l'IA comprenne mieux?"],
    ["c10", "Trouver un titre accrocheur pour l'infolettre du service.", "Administratif", "Gadget ou adopter", "vous génériez trente versions pour choisir la meilleure?"],
    ["c11", "Diagnostiquer un message d'erreur Moodle à partir d'une capture d'écran.", "Technique", "Adopter ou encadrer", "la capture montrait la liste des étudiants du cours?"],
    ["c12", "Générer les sous-titres d'une capsule vidéo.", "Technique", "Adopter ou encadrer", "la capsule portait sur la pharmacologie, avec beaucoup de termes techniques?"],
    ["c13", "Rédiger le texte alternatif des quarante images d'un cours en ligne.", "Technique", "Adopter ou encadrer", "les images étaient des schémas évalués à l'examen?"],
    ["c14", "Générer une image pour illustrer une présentation.", "Tous", "Gadget ou encadrer", "l'image représentait des personnes étudiantes de l'UdeS?"],
    ["c15", "Traduire en anglais un avis officiel destiné à toute la communauté universitaire.", "Tous", "Encadrer ou éviter", "c'était pour comprendre, pour vous uniquement, un article reçu en espagnol?"]
  ].map(([id, t, p, debat, et]) => ({ id, t, p, debat, et }));

  const NOTIONS = [
    { k: "valeur", nm: "Valeur ajoutée", q: "Est-ce que ça vaut la peine, pour cette tâche et ce but?", skill: "Le but, les étapes, les critères de qualité", c: "var(--brand-emerald)" },
    { k: "responsable", nm: "Responsable", q: "Est-ce permis, vérifié, déclaré et sécuritaire pour les données?", skill: "Les vérifications, ce qu'il ne faut jamais entrer, la déclaration", c: "var(--brand-gold)" },
    { k: "ethique", nm: "Éthique", q: "Est-ce souhaitable, compte tenu des effets sur les personnes, l'apprentissage et l'environnement?", skill: "Les limites, ce qui reste une décision humaine", c: "var(--brand-plum)" },
    { k: "aclasser", nm: "À classer", q: "On le rangera ensemble", skill: "", c: "var(--muted)" }
  ];

  const FIELDS = [
    { k: "nom", nm: "Nom de la skill", q: "Comment l'appellerait-on dans la banque?", n: "", short: true },
    { k: "quand", nm: "Quand l'utiliser", q: "Dans quelle situation précise sert-elle? Une ou deux phrases, qui aideront aussi Copilot à la reconnaître.", n: "valeur" },
    { k: "fournit", nm: "Ce que la personne fournit", q: "Quel document, quelle information ou quel contexte faut-il donner à l'IA?", n: "valeur" },
    { k: "etapes", nm: "Étapes", q: "Que doit faire l'IA, dans quel ordre? Une étape par ligne.", n: "valeur" },
    { k: "format", nm: "Format du résultat", q: "Tableau, liste, courriel?", n: "valeur" },
    { k: "criteres", nm: "Critères de qualité", q: "À quoi reconnaît-on un bon résultat? Un critère par ligne.", n: "valeur" },
    { k: "verifs", nm: "Vérifications", q: "Que doit vérifier la personne elle-même avant d'utiliser le résultat?", n: "responsable" },
    { k: "jamais", nm: "À ne jamais entrer", q: "Quelles données ne doivent pas être fournies à l'IA pour cette tâche?", n: "responsable" },
    { k: "declaration", nm: "Déclaration", q: "Faut-il déclarer l'usage, et comment?", n: "responsable" },
    { k: "limites", nm: "Limites", q: "Qu'est-ce qui doit rester une décision humaine? Quels effets surveiller sur les personnes?", n: "ethique" }
  ];

  /* Bonnes pratiques par rubrique : proposées à toutes les équipes */
  const PRACTICES = {
    quand: ["Décrire une situation précise : qui utilise la skill, pour quelle tâche, à quel moment.", "Préciser quand ne pas l'utiliser, par exemple pour une décision qui engage une personne."],
    fournit: ["Fournir des exemples fictifs ou anonymisés plutôt que de vrais documents.", "Préciser le contexte utile (public, niveau, durée) pour éviter une réponse générique."],
    etapes: ["Commencer par vérifier que le contenu fourni ne contient aucun renseignement personnel.", "Demander à l'IA de signaler ce qui est incertain plutôt que de supposer.", "Terminer par un rappel de relecture humaine."],
    format: ["Imposer une structure (tableau, liste numérotée) qui facilite la vérification.", "Demander de distinguer ce qui vient du document fourni et ce que l'IA ajoute."],
    criteres: ["Exiger l'exactitude par rapport au document source.", "Viser un langage clair, adapté au public visé.", "Vérifier le respect des principes d'équité, de diversité et d'inclusion."],
    verifs: ["Vérifier chaque fait, chiffre ou règle cité à la source officielle.", "Faire relire par une personne qui connaît le contexte."],
    jamais: ["Renseignements personnels : noms, matricules, courriels, notes, dossiers.", "Documents confidentiels ou internes non publiés.", "Contenu protégé par le droit d'auteur dont vous n'êtes pas titulaire."],
    declaration: ["Indiquer l'outil utilisé et sa version, comme le demandent les lignes directrices de l'UdeS.", "Préciser la nature de l'usage : résumer, traduire, réviser, générer."],
    limites: ["La décision finale reste humaine et relève du jugement professionnel.", "Ne pas remplacer l'apprentissage visé : produire n'est pas apprendre (Bastani et al., 2025).", "Utiliser l'IAg quand elle apporte une vraie valeur, compte tenu de son impact environnemental."]
  };

  /* Mises en garde déclenchées par des mots dans l'usage ou la fiche */
  const WARNINGS = [
    { re: /étudiant|étudiante|apprenant|travaux|copie|notes? d|dossier/i, t: "Données étudiantes", m: "Retirez toute information identifiante. La rétroaction ou la décision finale reste à la personne enseignante.", f: "jamais", add: "Noms, matricules ou travaux identifiables de personnes étudiantes" },
    { re: /référence|source|article|littérature|scientifique|recherche/i, t: "Références inventées", m: "L'IAg peut produire des références qui n'existent pas. Prévoyez une vérification de chaque référence à la source.", f: "verifs", add: "Retrouver chaque référence à la source avant de l'utiliser" },
    { re: /tradui|traduction/i, t: "Droits et terminologie", m: "Vérifiez que vous avez le droit de traduire la ressource et que la terminologie propre à l'UdeS est respectée.", f: "verifs", add: "Faire valider la terminologie par une personne du domaine" },
    { re: /image|illustr|visuel|photo/i, t: "Images générées", m: "Les images générées peuvent reproduire des biais ou des œuvres protégées. Indiquez qu'elles sont générées par l'IA.", f: "declaration", add: "Indiquer sous l'image qu'elle a été générée par l'IA, avec le nom de l'outil" },
    { re: /procès-verbal|réunion|courriel|fil de/i, t: "Propos de tiers", m: "Des notes ou des courriels contiennent souvent des propos de tiers et des renseignements confidentiels. Faites valider par une personne présente.", f: "verifs", add: "Faire valider le texte par une personne présente à la réunion" },
    { re: /règlement|politique|procédure|institutionnel|résum/i, t: "Omissions", m: "Un résumé peut omettre ou déformer une règle. Comparez avec le texte officiel avant de le transmettre.", f: "verifs", add: "Comparer le résultat avec le texte officiel" },
    { re: /évaluation|grille|examen|question|critérié/i, t: "Alignement pédagogique", m: "Vérifiez l'alignement avec les objectifs d'apprentissage. Le choix final appartient à la personne enseignante.", f: "limites", add: "Le choix des critères d'évaluation reste à la personne enseignante" },
    { re: /capture|erreur|code|macro|formule|script/i, t: "Tester avant d'utiliser", m: "Une capture d'écran peut montrer des données personnelles. Testez toute formule ou tout script sur des données fictives.", f: "verifs", add: "Tester la formule ou le script sur des données fictives" },
    { re: /moodle|tutoriel|teams|logiciel/i, t: "Version locale", m: "L'IAg peut décrire une autre version de l'outil que celle de l'UdeS. Vérifiez chaque étape dans l'environnement réel.", f: "verifs", add: "Refaire chaque étape du tutoriel dans l'environnement de l'UdeS" },
    { re: /appréciation|commentaire|sondage/i, t: "Commentaires nominatifs", m: "Des commentaires peuvent permettre d'identifier des personnes. Anonymisez-les avant toute analyse.", f: "jamais", add: "Commentaires non anonymisés" },
    { re: /accessib|texte alternatif|sous-titr|transcription/i, t: "Accessibilité", m: "Validez que le texte produit respecte l'intention pédagogique et les normes d'accessibilité.", f: "verifs", add: "Relire le texte produit avec l'intention pédagogique en tête" },
    { re: /simul|jeu de rôle|réticente/i, t: "Réalisme limité", m: "Une simulation reste une caricature possible. Utilisez-la pour vous pratiquer, pas pour prédire une réaction réelle.", f: "limites", add: "La simulation sert à se pratiquer, elle ne prédit pas une réaction réelle" }
  ];

  const SKILL_DEMO = `---
name: verifier-balises-iag-plan-de-cours
description: Vérifie si un plan de cours de l'Université de Sherbrooke précise clairement les usages permis de l'IA générative selon les balises du SSF (niveaux 0 à 4) et les consignes de déclaration. À utiliser quand une personne fournit un plan de cours ou une consigne d'activité et demande de vérifier l'encadrement de l'IAg.
---

# Vérifier les balises IAg d'un plan de cours

## Avant de commencer

Si le document contient des renseignements personnels (noms d'étudiantes ou d'étudiants, matricules, courriels, notes), arrête-toi et demande à la personne de les retirer.

## Repères

Les balises du SSF comptent cinq niveaux d'utilisation de l'IAg.
- Niveau 0, utilisation interdite
- Niveau 1, utilisation limitée
- Niveau 2, utilisation guidée
- Niveau 3, utilisation balisée
- Niveau 4, utilisation libre

## Étapes

1. Repère toutes les mentions de l'IAg dans le document.
2. Indique si un niveau d'utilisation est précisé pour le cours ou pour chaque activité évaluée.
3. Pour chaque activité évaluée, indique le niveau précisé ou écris « non précisé ».
4. Vérifie si des exemples d'usages permis et interdits sont donnés.
5. Vérifie si les consignes de déclaration sont présentes et claires.
6. Signale les incohérences, par exemple deux niveaux différents pour la même activité.

## Format du résultat

Un tableau avec les colonnes Activité, Niveau précisé, Exemples donnés, Consigne de déclaration et Commentaire. Ajoute au plus trois suggestions de clarification, formulées comme des questions à poser à la personne enseignante.

## Limites

- Ne choisis jamais le niveau à la place de la personne enseignante. Ce choix relève de son autonomie professionnelle.
- Si une information est ambiguë, dis-le au lieu de supposer.
- Rappelle à la fin que la personne doit relire le plan de cours elle-même.`;


  /* Données du mode essai : participants fictifs qui jouent pour tester l'atelier seule */
  const SIM = {
    names: ["Julie", "Marc", "Sofia", "Éric", "Nadia", "Paul", "Inès", "Louis", "Maude", "Karim", "Léa", "Hugo"],
    pos: ["On a placé la traduction dans « À encadrer » : utile, mais les droits d'auteur sont rarement clairs.",
          "Le procès-verbal nous a divisés : gain de temps réel, mais des propos peuvent être déformés.",
          "Les références scientifiques vont dans « À éviter » tant qu'on ne peut pas vérifier chaque source.",
          "La reformulation en langage clair est à adopter, avec une relecture pour garder le sens exact."],
    idees: ["Le même usage change de zone selon les données qu'on fournit.", "Tester dans Copilot nous a fait changer d'avis sur deux cartes.", "Il faudrait une liste commune de ce qu'on n'entre jamais."],
    crits: [["On peut vérifier le résultat facilement", "valeur"], ["Aucune donnée personnelle en jeu", "responsable"], ["Le gain de temps est réel", "valeur"], ["On sait comment déclarer l'usage", "responsable"], ["L'apprentissage des personnes étudiantes reste intact", "ethique"], ["La décision reste humaine", "ethique"], ["L'impact environnemental en vaut la peine", "ethique"]],
    quads: { c01: "adopter", c02: "encadrer", c03: "gadget", c04: "encadrer", c05: "eviter", c06: "encadrer", c07: "adopter", c08: "adopter", c09: "adopter", c10: "gadget", c11: "adopter", c12: "adopter", c13: "encadrer", c14: "gadget", c15: "encadrer" },
    moves: { c01: "encadrer", c02: "adopter", c03: "eviter", c04: "adopter", c06: "eviter", c08: "eviter", c09: "eviter", c11: "eviter", c12: "encadrer", c14: "encadrer", c15: "adopter" },
    whys: ["On gagne du temps, mais il faut relire.", "Trop de risques pour les données.", "Utile seulement avec des exemples fictifs.", "Le résultat est facile à vérifier.", "On n'a pas réussi à se mettre d'accord."],
    extra: ["Préparer l'ordre du jour d'une rencontre d'équipe", "Résumer un article pour une infolettre", "Créer un quiz de révision à partir d'un document public"],
    skill: { quand: "Quand je dois reformuler une procédure administrative de l'UdeS pour la rendre claire pour des personnes étudiantes ou des collègues.",
      fournit: "Le texte officiel de la procédure, sans renseignement personnel, et le public visé.",
      etapes: "Vérifier que le texte fourni ne contient aucun renseignement personnel.\nReformuler en phrases courtes, à la voix active.\nConserver chaque règle, délai et exception.\nSignaler tout passage ambigu plutôt que de l'interpréter.",
      format: "Une liste numérotée d'étapes, suivie d'un encadré « À retenir ».",
      criteres: "Le sens de chaque règle est exact.\nLe texte est compréhensible à la première lecture.",
      verifs: "Comparer le résultat avec le texte officiel.\nFaire relire par la personne responsable de la procédure.",
      jamais: "Noms, matricules, courriels ou dossiers de personnes.",
      declaration: "Mentionner en bas du document : « Reformulé avec l'aide de Copilot Chat, puis vérifié. »",
      limites: "La procédure officielle reste la référence.\nLa décision d'application d'une règle reste humaine." }
  };

  const INTENTION = "Explorer la posture de personne utilisatrice avertie : consciente de sa propre posture face à l'outil, elle choisit ses usages en fonction de leur valeur ajoutée, de leur caractère responsable et de leurs enjeux éthiques. Puis transformer nos usages les plus prometteurs en skills, des procédures réutilisables pour Copilot Chat.";

  return { PARTS, STEPS, PROFILS, LIKERT, FACETS, FREQ, TASKS, TOOLS, ITEMS, WORRIES, VALUES, RULES, RULELEV, SITUATIONS, PSCREENS, SOURCES, PREOCC, TEAMS, QUADS, RES, CARDS, NOTIONS, FIELDS, PRACTICES, WARNINGS, SKILL_DEMO, INTENTION, SIM, OBJECTIFS, ANIMATION, BESOINS, KNOWN };
})();
