# 🚀 CI/CD Kube - Pipeline d'Intégration & Déploiement Continu

Projet d'automatisation CI/CD avec **GitHub Actions**, **Docker**, **GHCR** et **Kubernetes** pour une application **Node.js + Hono**.

---

## 🛠️ Architecture du Projet

```text
ci-cd-kube/
├── .github/workflows/
│   └── ci-cd.yml          # Pipeline CI/CD automatisée avec DevSecOps
├── src/
│   └── index.ts           # Application Hono (Port 3000)
├── tests/
│   └── app.test.ts        # Tests unitaires avec Vitest
├── k8s/                   # Manifestes Kubernetes (Deployment, Service, Ingress)
├── Dockerfile             # Build multi-stage Node.js 22 Alpine
├── TROUBLESHOOTING.md     # Documentation des résolutions de problèmes / incidents
└── README.md
```

---

## 🔄 Structure de la Pipeline CI/CD

La pipeline [`.github/workflows/ci-cd.yml`](file://.github/workflows/ci-cd.yml) s'exécute automatiquement sur les pushes et Pull Requests :

1. **Job 1 : Code Quality & Security Audit**
   * Typage strict TypeScript (`tsc --noEmit`).
   * Audit des dépendances de production (`npm audit --omit=dev --audit-level=high`).
2. **Job 2 : Unit Tests**
   * Exécution de la suite de tests fonctionnels Hono (`vitest run`).
3. **Job 3 : Build, Trivy Security Scan & Push Docker**
   * Build multi-stage optimisé avec cache Docker Buildx.
   * Scan de vulnérabilités système et packages avec **Trivy** (`aquasecurity/trivy-action`).
   * Publication automatique sur GitHub Container Registry (`ghcr.io/abdellahhioun/ci-cd-kube:dev`).

---

## 📘 Documentation & Dépannage
Retrouvez le rapport d'incident complet et l'analyse de la cause racine dans [TROUBLESHOOTING.md](file://TROUBLESHOOTING.md).