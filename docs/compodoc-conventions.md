# Conventions de documentation Compodoc

Références officielles consultées le 9 octobre 2026 :
[commentaires](https://compodoc.app/guides/comments.html),
[balises JSDoc](https://compodoc.app/guides/jsdoc-tags.html),
[compléments Markdown](https://compodoc.app/guides/tips-and-tricks.html).
Version installée : Compodoc 2.0.0.

## Commenter un contrat

Conserver un commentaire lorsqu'il apporte une règle absente du nom et du type :
précondition, cas limite, absence de mutation, arrondi, durée de vie ou obligation
de nettoyage. Une description de composant tient en quelques lignes.

Chaque déclaration comptabilisée par Compodoc reçoit une description courte,
y compris les propriétés privées et les fonctions de validation. Une phrase suffit
pour les membres simples, les contrats complexes gardent quelques lignes.
Ne pas répéter les signatures TypeScript ou paraphraser les opérateurs RxJS.
Les détails d'architecture sont dans `docs/architecture/architecture.md` et les
notes de décision, les exemples détaillés du graphique sont dans
`chart.component.md`, automatiquement intégré par Compodoc.

## Syntaxe

Placer `/** ... */` avant le symbole ou son décorateur Angular. Une ligne `*` vide
sépare les paragraphes dans le rendu.

- `@param` précise une précondition ou le sens d'un argument ambigu.
- `@returns` précise un résultat ou un cas limite non évident.
- `{@link Symbole}` relie une interface, une classe ou un composant documenté.
- Réserver les exemples longs au Markdown séparé.

Ces balises sont facultatives : un contrat clair peut tenir en une phrase.
`@ignore` et `@internal` ne servent pas à masquer des symboles pour améliorer la
couverture. Les commentaires `//` expliquent uniquement une décision locale.

## Vérifier le rendu

```bash
pnpm run docs
pnpm run docs:check
pnpm run docs:serve
```

Vérifier les descriptions et liens dans les pages générées. `docs:check` impose
100 % globalement et pour chaque fichier, et est exécuté par la CI. Aucun symbole
n'est masqué ou exclu pour satisfaire ce seuil. La couverture mesure la présence
de descriptions, leur exactitude reste à vérifier lors de la relecture.

Limites observées avec la version 2.0.0 : `@example` ne s'affiche pas pour les
fonctions libres et les liens JSDoc dans `@returns` restent bruts. Utiliser la
description principale ou un fichier Markdown pour ces éléments. Le lien
automatique du type retourné par `toDataLoadError` contient aussi `classess` au lieu
de `classes`, son lien explicite dans la description fonctionne.
