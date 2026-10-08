# Validation de la migration Angular 21 — I05

Vérification effectuée le 8 octobre 2026 sur la révision `2a26174`, incluant
les corrections de tests I03 et le typage I07. Les modifications de clôture
ajoutent ce rapport et actualisent le README ; elles ne modifient ni les
manifestes, ni le lockfile, ni les contrats applicatifs.

## Étapes présentes dans l'historique

| Étape | Commit |
| --- | --- |
| Conversion initiale des composants et du bootstrap en standalone | `b42a186` |
| Migration npm → pnpm | `0de40e6` |
| Suppression des dépendances directes inutilisées | `11ae1db` |
| Angular 18 → 19 | `a29c486` |
| Angular 19 → 20 et adaptation du builder | `60a466e` |
| Angular 20 → 21 | `451a699` |
| Exclusion des polyfills de test du bundle applicatif | `4ac74a0` |
| Remplacement du module de routing par les providers standalone | `3309863` |
| Configuration de Node.js 24 et pnpm 12.10.1 avec mise | `74e7aeb` |

Les diffs et manifestes des paliers ont été examinés. Les validations exécutées
ci-dessous portent sur l'état final Angular 21 ; elles ne constituent pas des
preuves d'exécution des builds et tests au moment des anciennes migrations.
L'historique reste inchangé.

## Versions installées et compatibilité

Environnement : Linux x64, Node.js **24.21.0**, pnpm **12.10.1**, Chromium
**154.0.0.0**. Node.js et pnpm sont sélectionnés via `mise.toml`.

| Dépendance | Version installée |
| --- | --- |
| Angular core, common, compiler, compiler-cli, router et plateformes navigateur | 21.2.25 |
| Angular CLI et builder `@angular/build` | 21.2.24 |
| TypeScript | 5.9.3 |
| RxJS | 7.8.2 |
| Zone.js | 0.15.1 |
| Chart.js | 4.5.0 |

La [matrice officielle Angular](https://angular.dev/reference/versions), consultée
le 8 octobre 2026, autorise pour Angular 21.x Node.js `^20.19.0`, `^22.12.0` ou
`^24.0.0`, TypeScript `>=5.9.0 <6.0.0` et RxJS `^6.5.3` ou `^7.4.0`.
Les versions installées satisfont ces contraintes. La version de Zone.js satisfait
le peer dependency déclaré par `@angular/core@21.2.25` : `~0.15.0 || ~0.16.0`.

Le framework et son compilateur ont la même version ; CLI et builder ont la même
version et restent sur la majeure 21. `packageManager` fixe pnpm 12.10.1.
La [documentation pnpm](https://pnpm.io/installation) confirme la compatibilité
de pnpm 12 avec Node.js 24. Aucune montée vers Angular 22 n'est effectuée.

## Installation figée dans une copie propre

Une archive Git de `2a26174` a été extraite dans un dossier temporaire sans
`node_modules`. L'installation a utilisé le store pnpm de l'environnement,
avec téléchargement des dépendances manquantes et exécution des scripts autorisés
par `pnpm-workspace.yaml`.

```bash
pnpm install --frozen-lockfile
pnpm run lint
pnpm exec tsc --noEmit -p tsconfig.app.json
pnpm exec tsc --noEmit -p tsconfig.spec.json
pnpm exec ng test --watch=false
pnpm run build
pnpm run preview
```

Les commandes ont été exécutées avec `mise exec --`, en ciblant la copie temporaire
avec `pnpm --dir`. L'installation a également reçu le chemin explicite du store.
Le sandbox empêchait l'ouverture du verrou du store et des ports locaux ; ces
opérations ont été relancées hors du sandbox sans changer la configuration du projet.

| Contrôle | Résultat |
| --- | --- |
| Installation avec lockfile figé | Réussie, résolution sautée, 818 paquets installés. |
| Lint | Aucune erreur. |
| Compilation TypeScript application et tests | Réussie pour les deux configurations. |
| Tests Karma/Chrome Headless | 11 tests réussis. |
| Build de production | Réussi ; bundle initial de 466,94 kB, inférieur au budget warning de 500 kB. |
| Prévisualisation | Build servi avec `serve -s` sur un port local. |

`package.json`, `pnpm-lock.yaml` et `pnpm-workspace.yaml` sont identiques octet
pour octet entre la copie installée et le dépôt. SHA-256 du lockfile :

```text
c8757cbdde7dc503428a42eed8b5a5d67a14da92f69a19eba32f38227abbd013
```

## Contrôles de navigation et de graphiques

Le build de production a été ouvert dans Chromium headless, via des URL directes
sur le serveur de prévisualisation. Les réponses utilisent le JSON du build,
sans substitution de données ni mock de Chart.js.

| URL | Résultat observé |
| --- | --- |
| `/` | 5 pays, 3 éditions ; instance du graphique d'accueil créée dans son canvas. |
| `/country/France` | 3 participations, 113 médailles, 1 238 athlètes ; instance du graphique du pays créée dans son canvas. |
| `/not-found` | Page inconnue affichée. |
| `/unknown-page` | Repli vers la page inconnue. |

Les tests I03 complètent ces contrôles avec des assertions sur les datasets réels
de Chart.js, les statistiques du DOM, la sélection d'un pays et le lien de retour.
Ces contrôles ne constituent pas un audit visuel, d'accessibilité ou de performance.

## Vérifications structurelles et limites

- `src/main.ts` utilise `bootstrapApplication` et conserve le signalement des erreurs.
- HTTP, routing et Zone.js sont fournis par `app.config.ts` ; les composants et TestBed sont standalone.
- Aucun `AppModule`, `AppRoutingModule` ni décorateur `NgModule` ne subsiste dans les sources.
- `pnpm-lock.yaml` remplace le lockfile npm ; les commandes du README utilisent pnpm.
- `@angular/forms`, `@angular/animations`, `@angular/platform-server` et `@types/express` sont absents des dépendances directes et des imports/configurations applicatifs.
- `@angular/platform-browser-dynamic` est conservé car `src/test.ts` utilise son bootstrap de tests.
- Les budgets de `angular.json` restent en place et la structure du JSON n'est pas modifiée.

Les mesures avant migration et les comparaisons de performance relèvent d'I04 ;
aucun résultat historique ni baseline manquante n'est reconstitué dans ce rapport.
Le routing complet d'un pays inexistant, le cycle de vie applicatif des graphiques
et l'hébergement de production relèvent respectivement d'I12, I13 et I19.
Le script de prévisualisation télécharge `serve` via `pnpm dlx` ; ce téléchargement
est distinct de l'installation applicative avec lockfile figé.
