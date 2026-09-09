#  Guide Pratique & Commandes de Démonstration Kubernetes (Soutenance)

Ce guide récapitule **toutes les commandes dans l'ordre chronologique** pour tester, valider et faire la démonstration complète du projet devant votre professeur.

---

##  Prérequis : Alias Pratique (Optionnel)
Pour éviter de taper `--kubeconfig=etudiant-05.kubeconfig` à chaque commande, vous pouvez exécuter cette ligne dans votre terminal :
```bash
alias k="kubectl --kubeconfig=etudiant-05.kubeconfig"
```
*(Si vous préférez ne pas utiliser l'alias, remplacez simplement `k` par `kubectl --kubeconfig=etudiant-05.kubeconfig`).*

---

##  Étape 1 : Vérification de la Connexion au Cluster OVH
Vérifiez que le badge d'accès `etudiant-05` communique parfaitement avec le cluster :
```bash
kubectl --kubeconfig=etudiant-05.kubeconfig cluster-info
```
* **Résultat attendu** : `Kubernetes control plane is running at https://vcluster-etudiant-05...`

---

##  Étape 2 : Déploiement Complet (Deployment + Service + Ingress + HPA)
Déployez tous les fichiers de configuration du dossier `k8s/` en une seule commande :
```bash
kubectl --kubeconfig=etudiant-05.kubeconfig apply -f k8s/
```
* **Résultat attendu** : `deployment`, `service`, `ingress` et `horizontalpodautoscaler` créés/mis à jour.

---

##  Étape 3 : Inspection des Ressources & Test du Site Web

### 1. Afficher tous les composants déployés :
```bash
kubectl --kubeconfig=etudiant-05.kubeconfig get pods,svc,ingress,hpa
```

### 2. Récupérer l'IP Publique de l'Ingress :
```bash
kubectl --kubeconfig=etudiant-05.kubeconfig get ingress
```
* **Résultat attendu** : L'IP Publique s'affiche sous la colonne `ADDRESS` (ex: `138.201.184.143`).

### 3. Tester le site web en direct :
```bash
curl -i http://138.201.184.143
```
* **Résultat attendu** : `HTTP/1.1 200 OK - Hello Hono!`

---

##  Étape 4 : Démonstration de Haute Disponibilité & Auto-Guérison (Crash Test)

Simulez une panne matérielle en supprimant un Pod à la main pour prouver que le site reste 100% en ligne sans interruption :

```bash
# 1. Lister les Pods pour obtenir le nom exact d'un Pod
kubectl --kubeconfig=etudiant-05.kubeconfig get pods

# 2. Supprimer le premier Pod (ex: ci-cd-kube-deployment-xxx)
kubectl --kubeconfig=etudiant-05.kubeconfig delete pod <NOM_DU_POD>

# 3. Tester immédiatement que le site web répond toujours !
curl -i http://138.201.184.143

# 4. Observer la création automatique du Pod de remplacement par K8s :
kubectl --kubeconfig=etudiant-05.kubeconfig get pods
```

---

## Étape 5 : Démonstration du Scaling Manuel (2 ➔ 5 Pods)

Prouvez à votre professeur comment ajouter 3 répliques en 2 secondes :

```bash
# 1. Passer à 5 Pods répliqués
kubectl --kubeconfig=etudiant-05.kubeconfig scale deployment/ci-cd-kube-deployment --replicas=5

# 2. Observer les 5 Pods actifs
kubectl --kubeconfig=etudiant-05.kubeconfig get pods

# 3. Redescendre à 2 Pods
kubectl --kubeconfig=etudiant-05.kubeconfig scale deployment/ci-cd-kube-deployment --replicas=2
```

---

##  Étape 6 : Démonstration de l'Autoscaling Automatique HPA (Test de Charge)

Prouvez que Kubernetes s'adapte automatiquement à la charge de travail :

```bash
# 1. Inspecter l'état de l'Autoscaler HPA
kubectl --kubeconfig=etudiant-05.kubeconfig get hpa

# 2. Ouvrir la surveillance en direct des Pods dans un premier terminal :
kubectl --kubeconfig=etudiant-05.kubeconfig get pods -w

# 3. Dans un deuxième terminal, lancer une boucle de requêtes pour faire monter le CPU :
while true; do curl -s http://138.201.184.143 > /dev/null; done

# 4. Observer le HPA faire monter automatiquement les Pods de 2 ➔ 4 ➔ 6 ➔ 10 Pods !
# (Tapez Ctrl+C dans le 2ème terminal pour stopper le test).
```

---

##  Étape 7 : Vérification des Logs de l'Application en Direct
Consultez les logs de tous les conteneurs Hono en temps réel :
```bash
kubectl --kubeconfig=etudiant-05.kubeconfig logs -l app=ci-cd-kube --tail=20 -f
```





kubectl --kubeconfig=etudiant-05.kubeconfig scale deployment/ci-cd-kube-deployment --replicas=8
 2. Voir les Pods en direct dans le terminal
Pour lister vos Pods et voir leurs noms uniques :

bash
kubectl --kubeconfig=etudiant-05.kubeconfig get pods
 3. Simuler le crash ou la suppression d'un Pod
Pour supprimer un Pod spécifique (ex: ci-cd-kube-deployment-8594f5df74-xxxxx) :

bash
kubectl --kubeconfig=etudiant-05.kubeconfig delete pod <NOM_DU_POD>
(Kubernetes s'en aperçoit immédiatement et en recrée un nouveau sous vos yeux en 10 secondes).

 4. Réduire le nombre de Pods (Revenir à 2 Pods)
Pour ramener le cluster à sa taille normale :

bash
kubectl --kubeconfig=etudiant-05.kubeconfig scale deployment/ci-cd-kube-deployment --replicas=2
 5. Tester l'accès web pendant la manipulation
À tout moment, vous pouvez ouvrir votre navigateur ou taper la commande suivante pour vérifier que le site répond sans interruption :

bash
curl -i http://138.201.184.143