# 📊 Guide Simple : Gestion des Ressources & Horizontal Scaling dans Kubernetes

Ce document explique simplement comment Kubernetes gère la mémoire (RAM) et le processeur (CPU) pour chaque Pod, et comment fonctionne le passage à l'échelle (*Horizontal Scaling*).

---

## 1. Comment un Pod consomme-t-il les ressources du Serveur ?

Chaque conteneur dans un Pod consomme de la mémoire vive (RAM) et de la puissance de calcul (CPU) sur les serveurs du cluster.

Dans notre fichier [`k8s/deployment.yaml`](file://k8s/deployment.yaml), nous avons configuré des limites précises :

```yaml
resources:
  requests:
    cpu: 50m        # 5% d'un cœur CPU garanti
    memory: 64Mi    # 64 Mo de RAM garantis au démarrage
  limits:
    cpu: 200m       # Plafond max : 20% d'un cœur CPU
    memory: 128Mi   # Plafond max : 128 Mo de RAM
```

---

## 2. Définitions Simples (Requests vs Limits)

* **`requests` (Le minimum garanti)** : 
  * C'est le ticket d'entrée. Kubernetes cherche un serveur qui possède **au moins 64 Mo de RAM** et **5% de CPU libre** pour y poser le Pod.
* **`limits` (Le plafond de sécurité)** :
  * C'est la limite maximale que le Pod ne peut pas dépasser.
  * Si un Pod tente de consommer plus de 128 Mo de RAM, Kubernetes coupe le Pod (*OOMKilled - Out Of Memory*) et le redémarre pour protéger le serveur.

---

## 3. Calcul de Consommation Totale (Horizontal Scaling)

Notre application Node.js / Hono est ultra-légère. En vitesse de croisière :
* **1 Pod** consomme environ **~30 Mo de RAM** et **~5m CPU**.

Voici la consommation cumulée selon le nombre de répliques (*Horizontal Scaling*) :

| Nombre de Répliques (Pods) | Consommation RAM Totale | Consommation CPU Totale |
| :---: | :---: | :---: |
| **1 Pod** | ~30 Mo | ~5m (0.5% CPU) |
| **2 Pods (Actuel)** | **~60 Mo** | **~10m (1% CPU)** |
| **5 Pods** | ~150 Mo | ~25m (2.5% CPU) |
| **10 Pods (Pic de charge)** | ~300 Mo | ~50m (5% CPU) |

---

## 🧪 Comment tester le changement de répliques en direct ?

Dans votre terminal, vous pouvez changer le nombre de Pods à la volée avec une seule commande :

```bash
# Passer à 5 répliques en direct
kubectl --kubeconfig=etudiant-05.kubeconfig scale deployment/ci-cd-kube-deployment --replicas=5

# Vérifier les Pods créés
kubectl --kubeconfig=etudiant-05.kubeconfig get pods
```
