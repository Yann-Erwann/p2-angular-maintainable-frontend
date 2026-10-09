# Commentaires et Compodoc

Commenter une règle que le nom et le type ne suffisent pas à expliquer :
précondition, arrondi, ordre stable, absence de mutation, durée du cache,
interaction clavier ou obligation de nettoyage.
Ne pas décrire chaque propriété injectée ni reformuler une instruction.
Les types TypeScript restent la référence pour la structure des données.

Placer `/** ... */` avant le symbole ou son décorateur Angular.
`@param` et `@returns` sont utiles pour un argument ambigu ou un cas limite,
`{@link Symbole}` pour une référence. Ces balises restent facultatives.
Réserver les exemples longs au Markdown associé, comme `chart.component.md`.
Les commentaires `//` expliquent une décision locale.

```bash
pnpm run docs
pnpm run docs:serve
```

La CI vérifie la génération, sans imposer une description pour chaque symbole.
Relire les contrats et leurs liens dans le rendu, ne pas utiliser `@ignore` pour
améliorer artificiellement la couverture.
Voir les guides Compodoc des [commentaires](https://compodoc.app/guides/comments.html)
et des [balises JSDoc](https://compodoc.app/guides/jsdoc-tags.html).
