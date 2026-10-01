# OlympicGamesStarter

Application Angular 18. Le développement, l'installation des dépendances, la compilation et les tests s'exécutent dans Docker. Aucune installation locale de Node.js, npm, Angular CLI, Java ou Chromium n'est nécessaire.

## Prérequis

- Docker Desktop démarré avec les conteneurs Linux et Docker Compose v2 ou ultérieur.
- Pour travailler dans l'éditeur : VS Code et l'extension Dev Containers (`ms-vscode-remote.remote-containers`).
- Accès réseau aux images Docker et au registre npm lors de la première installation.

L'image de développement utilise Node.js 22, compatible avec Angular 18 selon la [matrice officielle Angular](https://angular.dev/reference/versions). Les versions des dépendances sont définies par `package.json` et `package-lock.json`.

Tous les fichiers de configuration Docker sont regroupés dans `docker/`, y compris la configuration Dev Containers dans `docker/.devcontainer/devcontainer.json`.

## Démarrer le développement

Exécuter les commandes suivantes depuis la racine du dépôt :

```powershell
docker compose -f docker/compose.yaml up --build -d frontend
```

Au démarrage, le conteneur exécute `npm ci` lorsque les dépendances sont absentes ou lorsque `package.json` ou `package-lock.json` ont changé, puis lance le serveur Angular. Le premier démarrage peut donc prendre plusieurs minutes.

Ouvrir [http://localhost:4200](http://localhost:4200). Le serveur surveille les modifications des sources et recharge l'application.

```powershell
docker compose -f docker/compose.yaml logs -f frontend
```

Le dépôt est monté dans `/workspace`. Un volume Docker nommé `node-modules` est monté dans `/workspace/node_modules` : `npm ci` installe les dépendances uniquement dans ce volume, séparément des fichiers Windows. Les extensions ouvertes dans Dev Containers peuvent lire les dépendances et les déclarations TypeScript.

Toutes les commandes Node.js et npm du projet s'exécutent dans le conteneur. Aucun paquet de `node_modules` n'est installé dans le dépôt Windows. Docker peut y créer un dossier `node_modules` vide pour préparer le point de montage ; son contenu reste exclusivement dans le volume Docker. `node_modules/` reste exclu de Git.

## Compiler, tester et générer du code

Une fois le service `frontend` démarré, compiler avec la configuration de production définie dans `angular.json` :

```powershell
docker compose -f docker/compose.yaml exec frontend npm run build
```

Les fichiers compilés sont écrits dans `dist/olympic-games-starter/`, accessible sur la machine grâce au montage du dépôt.

Exécuter les tests Karma avec Chromium installé dans le conteneur :

```powershell
docker compose -f docker/compose.yaml exec frontend npm test -- --watch=false --browsers=ChromeHeadlessDocker --karma-config=docker/karma.conf.cjs
```

`docker/karma.conf.cjs` adapte le lancement du navigateur au conteneur en réutilisant la configuration Karma existante. La suite de tests du starter contient des incohérences préexistantes, notamment des références à `AppComponent.title` alors que cette propriété est absente du composant. La configuration Docker ne corrige pas ces tests et ne garantit pas leur réussite.

Utiliser Angular CLI sans l'installer sur la machine :

```powershell
docker compose -f docker/compose.yaml exec frontend npm run ng -- generate component pages/example
```

Ajouter une dépendance dans le conteneur, en remplaçant `<package>` par son nom :

```powershell
docker compose -f docker/compose.yaml exec frontend npm install <package>
```

Cette commande met à jour `package.json` et `package-lock.json` dans le dépôt monté, et `node_modules/` uniquement dans le volume Docker. Au prochain démarrage du conteneur, la modification des manifestes déclenche un nouveau `npm ci`.

Arrêter les services :

```powershell
docker compose -f docker/compose.yaml down
```

Cette commande conserve les volumes Docker des dépendances et du cache npm pour les prochains démarrages.

## VS Code, linters et analyses

1. Ouvrir le dossier local `docker/` dans VS Code.
2. Exécuter **Dev Containers: Reopen in Container** depuis la palette de commandes.
3. Travailler dans `/workspace`, qui ouvre le dépôt complet dans le conteneur, avec l'utilisateur `node`.

La barre d'état de VS Code doit indiquer **Dev Container: Olympic Games (Docker)**. Les diagnostics TypeScript et Angular utilisent alors les dépendances du volume Docker. Si l'éditeur affiche `Cannot find module` dans une fenêtre Windows locale, suivre les étapes ci-dessus pour ouvrir le dépôt dans le conteneur.

La configuration conserve le démarrage du service Angular (`overrideCommand: false`) et l'installation automatique des dépendances. Le terminal intégré s'exécute dans le conteneur : il peut utiliser directement `npm run build`, `npm test` avec les options indiquées ci-dessus et `npm run ng -- ...`.

Le `PATH` de l'image de développement inclut `/workspace/node_modules/.bin` pour utiliser directement le CLI Angular du projet (`ng version`, `ng generate`, `ng serve`). Après une modification du Dockerfile, exécuter **Dev Containers: Rebuild Container** pour appliquer ce réglage. Dans un conteneur déjà ouvert, `npm run ng -- ...` reste utilisable.

Le service `frontend` lance déjà le serveur sur le port 4200. Pour lancer un second serveur depuis le terminal, utiliser un autre port :

```bash
ng serve --host 0.0.0.0 --port 4201
```

Les extensions suivantes sont déclarées pour l'environnement du conteneur :

| Extension | Identifiant |
| --- | --- |
| Angular Language Service | `Angular.ng-template` |
| SonarQube for IDE | `SonarSource.sonarlint-vscode` |
| Checkmarx | `checkmarx.ast-results` |
| ESLint | `dbaeumer.vscode-eslint` |
| Codex | `openai.chatgpt` |

Elles accèdent au même `/workspace/node_modules` que l'application. Node.js est disponible à `/usr/local/bin/node` et Java 21 est fourni à `/opt/java`, conformément aux [prérequis SonarQube for IDE](https://docs.sonarsource.com/sonarqube-for-vs-code/getting-started/requirements). La fenêtre VS Code reste sur la machine ; les extensions du projet et leurs outils s'exécutent dans le conteneur.

Le dépôt ne contient actuellement ni configuration ESLint, ni dépendances ESLint, ni script `lint`. L'extension ESLint est disponible, mais cela ne configure pas un linter et ne constitue pas une validation de lint. Le mode connecté SonarQube et les accès Checkmarx nécessitent une configuration propre à votre compte et à vos serveurs ; aucun identifiant n'est enregistré dans le dépôt.

## Image de production

`docker/Dockerfile` définit trois étapes : `development` pour les outils de développement, `build` pour compiler l'application, et `production` pour servir les fichiers compilés avec Nginx.

```powershell
docker compose -f docker/compose.yaml --profile production up --build -d production
```

Ouvrir [http://localhost:8080](http://localhost:8080). Nginx redirige les routes de l'application vers `index.html` pour permettre les accès directs aux pages Angular.

La compilation de cette image installe les dépendances et compile les sources dans Docker, sans montage du dépôt. L'image finale contient les fichiers compilés et Nginx. Une modification des sources nécessite de reconstruire l'image.

```powershell
docker compose -f docker/compose.yaml --profile production down
```

## Architecture existante

L'application utilise une architecture Angular avec NgModule :

- `src/app/app.module.ts` déclare le module principal.
- `src/app/app-routing.module.ts` définit les routes.
- `src/app/pages/` contient les pages `home`, `country` et `not-found`.
- `src/assets/mock/olympic.json` contient les données utilisées par l'application.
- `src/environments/` contient les configurations d'environnement utilisées par le build.

La mise en place de Docker conserve cette architecture et les configurations Angular existantes.

### Navigateur pour les tests Karma

`npm test` lance Chrome ou Chromium sans interface graphique. La configuration
`karma.conf.ts` détecte les exécutables Linux usuels automatiquement ; une variable
`CHROME_BIN` déjà définie reste prioritaire.

Sur Debian/Ubuntu, installer le navigateur une fois :

```bash
sudo apt-get update
sudo apt-get install -y chromium
npm test -- --watch=false
```

Le navigateur reste installé dans cet environnement. Si le conteneur est recréé,
prévoir cette installation dans son Dockerfile ou sa configuration de démarrage.
