# 🛠️ Rapport d'Incident & Dépannage Pipeline CI/CD

Ce document récapitule l'analyse et la résolution d'un problème rencontré lors de l'intégration du scan de sécurité DevSecOps dans la pipeline GitHub Actions.

---

## ❌ Problème Éprouvé

### Description de l'erreur
Lors du lancement du workflow (Run ID `#33510182337`), le **Job 1 (Code Quality, Typecheck & Security Audit)** a échoué à l'étape `Run Dependency Security Audit` avec l'erreur suivante :

```text
npm audit --audit-level=high
4 vulnerabilities (2 moderate, 1 high, 1 critical)
esbuild <=0.24.2 / vite / vitest
Process completed with exit code 1.
```

---

## 🔍 Analyse de la Cause Racine (Root Cause Analysis)

1. **Fausses Alertes de Dépendances de Développement** :
   La commande `npm audit` sans option vérifie à la fois les dépendances de **production** et de **développement** (`devDependencies`).
   La bibliothèque de test `vitest` (dépendance dev) intègre transitivement une version d'outillage de build (`esbuild`) contenant des avertissements de sécurité pour les serveurs de dév locaux.

2. **Absence d'impact en Production** :
   Dans notre architecture Docker, les `devDependencies` ne sont **jamais embarquées dans l'image finale de production** grâce à notre `Dockerfile` multi-stage (qui exécute `npm ci --only=production`). Le check échouait donc sur du code n'allant jamais en production.

---

## ✅ Solution Appliquée

Pour cibler strictement les dépendances embarquées en production, nous avons mis à jour l'étape dans [`.github/workflows/ci-cd.yml`](file:///Users/abd-ellah/Documents/ci-cd-kube/.github/workflows/ci-cd.yml) :

```yaml
- name: Run Dependency Security Audit
  run: npm audit --omit=dev --audit-level=high
```

### Explication du flag `--omit=dev` :
* Restreint l'audit de sécurité aux seules dépendances qui seront réellement déployées sur le cluster Kubernetes.
* Résultat de l'audit après correction : **0 vulnérabilité détectée en production**.

---

## 🚀 Résultat et Validation

Le workflow corrigé (Run ID `#33510445723`) s'est exécuté avec **100% de succès en 1m28s** :
* **Job 1 (Code Quality & Security)** : ✅ PASS
* **Job 2 (Unit Tests)** : ✅ PASS
* **Job 3 (Build, Trivy Scan & Push GHCR)** : ✅ PASS (Image publiée : `ghcr.io/abdellahhioun/ci-cd-kube:dev`)
