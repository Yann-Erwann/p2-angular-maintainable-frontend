# Validation de la consolidation — 9 octobre 2026

## Seuil Lighthouse obligatoire — 10 octobre 2026

L’action `treosh/lighthouse-ci-action@v12` exécute Lighthouse CI sans Playwright.
Les configurations mobile et desktop sont dans `.github/lighthouse/`.
Les assertions de catégorie utilisent le niveau `error`, `minScore: 1` et
`aggregationMethod: pessimistic`. Les artefacts `lighthouse-mobile` et
`lighthouse-desktop` conservent les rapports et résultats d’assertion.
Les tests Playwright restent disponibles localement et le contrôle après
déploiement existant reste séparé.

Le workflow exige désormais un score exact de 100 dans les quatre catégories
Lighthouse à chacun des trois passages, sur chaque route en mobile et desktop.
Les routes couvrent l’accueil et tous les pays du JSON livré. Les URL de pays
invalide, pays absent et page inconnue renvoient volontairement un HTTP 404 :
elles sont exclues de la collecte Lighthouse et restent couvertes par les tests
navigateur. Aucun lancement manuel ne peut désactiver
ce contrôle. Une erreur ou un score absent échoue aussi ; le déploiement dépend
de cette validation. Les rapports restent disponibles même en cas de score insuffisant.
Cette modification définit le seuil ; elle ne prouve pas que le site l’atteint.
Les mesures historiques ci-dessous précèdent cette règle.

## Extraction des scripts de livraison — 10 octobre 2026

La préparation des routes et du manifeste, le serveur local et le contrôle après
déploiement sont dans `.github/scripts/`. Lighthouse CI gère désormais ses audits
et le cycle de vie du serveur via l’action dédiée. Les validations historiques
ci-dessous précèdent cette intégration.
Contrôles locaux réussis : syntaxe Node et shell, formatage, lint, 15 parcours
navigateur, six audits Lighthouse et vérification du manifeste et des pages
sur le serveur local. Le workflow distant et la publication n’ont pas été exécutés.
Les notes ci-dessous décrivent les validations et l’organisation antérieures.

## CSS critique

Le build de production utilise `inlineCritical: true`. Les styles de mise en page
communs sont inclus dans les composants des pages, et le titre de repli utilise
la même classe masquée que le titre de l’accueil. La feuille globale peut ainsi
arriver après le premier rendu sans déplacer le graphique.

Avec cette feuille retardée de deux secondes, Chromium mesure un CLS de zéro
sur l’accueil et la France à 320, 768 et 1280 px. Deux tests de régression mobile
complètent les parcours existants : 175 tests unitaires et 15 tests navigateur
passent, ainsi que lint, vérification des types et build de production.
Le bundle initial mesure 492,90 kB bruts (140,38 kB estimés au transfert).
Aucun nouveau score Lighthouse ni gain de 300 ms n’a été mesuré.

Ces modifications CSS n’ont pas encore été déployées.

## Cache GitHub Pages

La réponse HTTP du module publié sur GitHub Pages contient `Cache-Control:
max-age=600`. Les règles de `serve.json` concernent le serveur local et ne
modifient pas cet en-tête.

## Contrôle de livraison après simplification

Les builds de développement et de production préfixée passent. Le HTML de chacun
contient les préchargements générés par Angular. Le graphique initial a été
vérifié avec `ng serve`, en retardant le JSON, puis en naviguant vers la France.
Les 175 tests unitaires et les 13 parcours Playwright passent localement.
Le chargement initial de production atteint 492,66 kB bruts (140,49 kB estimés
au transfert), car Chart.js est désormais initial. Les six audits cités ci-dessous
précèdent ce changement, ils ne mesurent pas cette dernière révision.
Le contrôle post-déploiement a été exécuté sur un serveur local avec une révision
de test : accueil, navigation vers la France, rechargement direct et retour passent.
Quatre défauts simulés sont rejetés : mauvaise révision, HTML ne correspondant pas
au manifeste, module JavaScript manquant et erreur JavaScript à l’exécution.
Les erreurs du navigateur, captures et traces sont bien conservées.
Les six audits Lighthouse optionnels ont été exécutés depuis l’étape du workflow.
Le YAML, la syntaxe des blocs Node/shell et le formatage passent aussi.

La CI est configurée pour livrer le même artefact que celui testé et comparer
`release.json` au SHA attendu après publication. Les outils de contrôle sont
installés avant de déployer. Angular génère le HTML et ses préchargements via `index.preloadInitial`.
Le manifeste, Lighthouse et le contrôle après déploiement sont intégrés au YAML
GitHub Actions, le dossier `scripts/` est supprimé.
Un échec du contrôle fait échouer le job, sans annuler automatiquement la publication.
La CI distante et le contrôle sur GitHub Pages n’ont pas été exécutés pour ces changements.
La génération Compodoc reste vérifiée, le seuil documentaire de 100 % a été retiré.

## Vérification finale avant les commits

Le découpage en 12 commits a été préparé dans un dossier temporaire. Chaque état
intermédiaire passe la compilation TypeScript de l’application et des tests,
ainsi que le build de production. Le dossier de travail conserve les sources finales.

Sur les sources finales : formatage, lint, typage application/tests/Playwright,
175 tests Karma/Jasmine, 13 tests navigateur et couverture documentaire Compodoc
à 100 % passent. Le parcours navigateur vérifie notamment les textes de l’en-tête
avec Tab, le titre stable « Medals per Country », la bannière pays cliquable,
le filtre sans le pays courant ni défilement interne et les mises en page responsive.
L’infobulle du pays a aussi été examinée à 320 et 1280 px.

Les mesures Lighthouse historiques ci-dessous n’ont pas été renouvelées pour
ces dernières modifications. Les rapports HTML Compodoc, captures et builds
générés restent hors de Git.

## Référence et protocole

La référence est l'état du dossier au début du travail, avec ses modifications
préexistantes conservées. Un snapshot des sources et du build préfixé a été pris
avant refactorisation dans `/tmp/olympic-expert-baseline/`.

Sur cette référence : lint, compilation TypeScript application/tests, build et
Compodoc passent, 172 tests Karma/Jasmine passent. Le lancement initial de Karma
dans le sandbox ne pouvait pas ouvrir son port, la vérification réussie utilise
le même code avec accès au port local et à Chromium.

Node 24.21.0, pnpm 12.10.1, Chromium headless 154, Playwright 1.64.0 et Lighthouse
13.5.0 sous Linux/WSL. Les builds sont servis sans compression et avec `no-cache`
sous `/p2-angular-maintainable-frontend/`, sur la même machine. Les chiffres de
transfert ne représentent pas ceux d'un hébergement compressé.

Les audits de performance utilisent trois premières visites par page, le profil
mobile Lighthouse par défaut et les médianes. Les références portent sur l'accueil
et la France (`/#/country/5`). L’option `measure_performance` du workflow remplace les anciennes commandes
locales de mesure. Les comparaisons historiques ci-dessous ont été réalisées
avec les anciens scripts, elles n’ont pas été renouvelées. Le JavaScript mesuré inclut tous les scripts transférés
pendant la visite initiale, y compris les modules préchargés/différés, la taille
initiale du build est également contrôlée séparément.

## Changements vérifiés

- Modèles en lecture seule, validation des compteurs entiers sûrs non négatifs.
- Tri chronologique stable sur une copie, aucune mutation des participations.
- Calculs purs, lignes associant identité et statistiques, modèles d'affichage.
- États de pages explicites, sélection par route et récupération après erreur.
- Contrat graphique `{ label, value }`, configurations et plugins séparés.
- Indicateurs identifiés par leur signification et styles appartenant aux composants.
- Préchargements et règles de cache en mémoire conservés.
- Outillage aligné : aucune incompatibilité de peer dependency signalée par pnpm.

## Contrôles automatiques finaux

| Contrôle                         | Résultat                                                   |
| -------------------------------- | ---------------------------------------------------------- |
| `pnpm install --frozen-lockfile` | Réussi, lockfile inchangé à l'installation                 |
| `pnpm peers check`               | Aucune incompatibilité signalée                            |
| `pnpm run format:check`          | Réussi                                                     |
| `pnpm run lint`                  | Réussi                                                     |
| `pnpm run typecheck`             | Application, tests unitaires et tests navigateur : réussi  |
| `pnpm test --watch=false`        | 175 tests réussis avec Chromium                            |
| `pnpm run docs`                  | Compodoc généré avec succès                                |
| `pnpm run build:e2e`             | Production préfixée : réussi, sans avertissement de budget |
| `pnpm run test:e2e`              | 10 tests Chromium réussis                                  |
| Contrôle de livraison local      | HTML, JSON, accueil et accès direct France : réussi        |
| `git diff --check`               | Réussi                                                     |

Les artefacts locaux sont conservés dans `validation-artifacts/` : rapports
Lighthouse avant/après, comparaison JSON, captures et journaux des tests. Ce dossier
est ignoré par Git. Les rapports navigateur sont aussi dans `playwright-report/` et
la documentation générée dans `documentation/`. Les commandes du README permettent
de reconstruire ces preuves.

## Performance

Médianes de trois passages par page. Les tailles transférées sont exprimées en
octets, le LCP est exprimé en millisecondes.

| Page    | Mesure               |    Avant |    Après | Évolution |
| ------- | -------------------- | -------: | -------: | --------: |
| Accueil | JavaScript transféré |  473 318 |  484 702 |   +2,41 % |
| Accueil | Transfert total      |  509 697 |  506 619 |   −0,60 % |
| Accueil | LCP                  | 3 508,64 | 3 666,05 |   +4,49 % |
| Accueil | CLS                  |        0 |        0 |    Stable |
| France  | JavaScript transféré |  480 478 |  495 512 |   +3,13 % |
| France  | Transfert total      |  516 857 |  517 429 |   +0,11 % |
| France  | LCP                  | 3 615,80 | 3 650,25 |   +0,95 % |
| France  | CLS                  |        0 |        0 |    Stable |

Les seuils de +5 % de JavaScript et +10 % de LCP sont respectés. La taille initiale
du build passe de 299,61 kB à 296,86 kB. Le transfert JavaScript de la visite inclut
les styles désormais encapsulés dans les composants et les modules différés,
il ne correspond donc pas à la seule taille initiale du build. Ces mesures locales
ne constituent pas une mesure terrain et leur précision dépend du profil simulé
et de la charge de la machine.

## Comparaison visuelle

Six captures avant/après : accueil et France, viewport de 320, 768 et 1280 pixels,
hauteur 1000 pixels, facteur de pixels 1. Les captures de la vérification finale
après refactorisation sont identiques octet par octet à la référence (SHA-256).
Les tests navigateur contrôlent aussi l'absence de débordement horizontal et
joignent les captures au rapport Playwright.

## Accessibilité et limites

Le parcours réel au clavier est automatisé dans Chromium : sélection d'un pays,
Entrée, focus du nouveau titre, exploration des années, sortie avec Tab et Maj+Tab.
Les textes de remplacement, descriptions et annonces sont aussi vérifiés par les
tests unitaires. Les captures desktop de référence et de résultat ont été examinées.

**La vérification manuelle avec lecteur d'écran reste à réaliser.** Aucun lecteur
d'écran avec session graphique/audio exploitable n'est disponible dans cet
exécuteur, aucun résultat d'écoute n'est revendiqué. Avant de déclarer ce contrôle
terminé, relever la version du lecteur et du navigateur et vérifier : annonces de
chargement/erreur, lecture des données, changement de pays, entrée/sortie du canvas
et focus après navigation. Ce contrôle ne constitue pas un audit RGAA complet.

La CI et le contrôle post-déploiement sont configurés et vérifiés localement.
Le workflow distant et une nouvelle publication GitHub Pages n'ont pas été exécutés
pendant cette session. Les contrôles distant et humain restent des preuves à
obtenir dans leurs environnements respectifs.

## Livraison et retour arrière

Les PR passent par le job de validation. Depuis `main`, le job de déploiement
réutilise l'artefact de production validé. Le smoke check vérifie le HTML, le JSON,
le démarrage Angular, l'accueil et la France en accès direct dans Chromium.

Pour revenir à une version fonctionnelle, annuler les commits responsables ou
rétablir leur contenu dans un nouveau commit, puis faire valider/fusionner sur
`main`. Le pipeline livre cet état sans réécriture de l'historique. Aucune migration
persistante ni changement de format du JSON livré n'est nécessaire.
