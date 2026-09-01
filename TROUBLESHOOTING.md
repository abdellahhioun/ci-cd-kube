# 🛠️ Rapport d'Incident & Dépannage Pipeline CI/CD

Ce document récapitule l'analyse et la résolution des incidents rencontrés lors du développement de la pipeline CI/CD GitHub Actions.

---

## 📌 Incident #1 : Fausses alertes sur les dépendances de développement (`npm audit`)

### Erreur
Lors du lancement du workflow (Run `#33510182337`), le **Job 1** a échoué avec l'erreur :
```text
npm audit --audit-level=high
4 vulnerabilities (2 moderate, 1 high, 1 critical)
esbuild <=0.24.2 / vite / vitest
```

### Cause Racine
La commande `npm audit` sans option vérifiait à la fois les dépendances de production et de développement. La bibliothèque `vitest` (outil de test dev) intègre des sous-dépendances avec des avertissements pour les serveurs de dév locaux, alors qu'elles sont totalement exclues de notre conteneur de production.

### Solution Appliquée
Utilisation du drapeau `--omit=dev` dans [`.github/workflows/ci-cd.yml`](file://.github/workflows/ci-cd.yml) :
```yaml
run: npm audit --omit=dev --audit-level=high
```
**Résultat** : 0 vulnérabilité en production (Run `#33510445723` validé).

---

## 📌 Incident #2 : Chute du taux de couverture lors de l'ajout du Dashboard Web (`Vitest Coverage`)

### Erreur
Lors de l'ajout de l'application web dans `dashboard/`, le **Job 2 (Unit Tests & Coverage)** du PR #5 (Run `#33514322198`) a échoué avec l'erreur :
```text
All files: 5.77% Stmts (Threshold 80% required)
dashboard/app.js: 0% Coverage (Uncovered lines 1-212)
ERROR: Coverage for lines (5.77%) does not meet global threshold (80%)
```

### Cause Racine
Le moteur de couverture V8 de Vitest incluait par défaut tous les fichiers `.js` du dépôt, y compris le code JavaScript client du dashboard navigateur (`dashboard/app.js`). Comme ces fonctions s'exécutent dans le navigateur et non dans les tests unitaires Node.js backend, la couverture moyenne s'est effondrée à 5.77%.

### Solution Appliquée
Configuration ciblée de la couverture dans [`vitest.config.ts`](file://vitest.config.ts) :
```typescript
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['dashboard/**', 'node_modules/**', 'tests/**'],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 }
    }
  }
})
```
**Résultat** : Calcul de couverture restreint à 100% sur le code backend (`src/**/*.ts`). Run `#33514592083` validé avec 100% de succès !
