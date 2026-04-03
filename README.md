# Fiche Standard de Revue des Directions — MEF

Application web full-stack du Ministère de l'Économie et des Finances (Haïti) pour la gestion des fiches de revue périodique des directions et unités. Le modèle de données suit le référentiel technique officiel (**Cartographie_complete_professionnelle**) : 29 tables normalisées, clés UUID, workflow de validation.

## Stack

| Couche    | Technologie                             |
|-----------|-----------------------------------------|
| Frontend  | React 19, Vite, Tailwind CSS 4          |
| Backend   | Node.js, Express 5, Sequelize ORM       |
| Base de données | MySQL 8                           |
| Auth      | Keycloak 26                             |
| Graphiques | Recharts                               |
| Conteneurs | Docker Compose                         |

## Architecture de données

Le schéma suit la cartographie officielle avec **29 tables normalisées** :

| Table principale | Rôle |
|-----------------|------|
| `directions` | Informations permanentes de la direction (UUID PK, sigle, effectif théorique, statut) |
| `utilisateurs` | Comptes et profils des responsables (FK → directions) |
| `revues` | En-tête de chaque revue (FK → directions + utilisateurs, statut brouillon/soumis/valide) |

**26 tables thématiques** liées à `revues` via `revue_id` :

| Section | Tables |
|---------|--------|
| III — RH | `revue_ressources_humaines`, `revue_repartition_personnel`, `revue_besoins_personnel`, `revue_besoins_formation` |
| IV — Fonctionnement | `revue_activites` (3 types), `revue_resultats`, `revue_difficultes_activites` |
| V — Locaux | `revue_infrastructures`, `revue_travaux_prioritaires` |
| VI — Équipements | `revue_equipements`, `revue_insuffisances_materielles` |
| VII — Communication | `revue_communication`, `revue_outils_numeriques`, `revue_procedures_dematerialisees`, `revue_procedures_manuelles`, `revue_besoins_digitalisation` |
| VIII — Rapports | `revue_rapports`, `revue_derniers_rapports`, `revue_livrables`, `revue_causes_difficultes_rapports` |
| IX-X — Contraintes & Besoins | `revue_contraintes` (max 3), `revue_besoins_prioritaires` (max 5) |
| XI-XII — Actions & Appuis | `revue_actions`, `revue_appuis` |
| XIII-XIV — Observations & Signature | `revue_observations`, `revue_signature` |

## Prérequis

- [Docker](https://www.docker.com/) et Docker Compose

## Démarrage rapide

1. Copier et renseigner le fichier d'environnement :

   ```bash
   cp .env.example .env
   ```

2. Lancer tous les services :

   ```bash
   docker compose up --build
   ```

3. Accéder à l'application :
   - Frontend : http://localhost
   - API backend : http://localhost:5000/api
   - Keycloak admin : http://localhost:8180 (identifiants : `admin` / `admin`)

### Premier démarrage — initialisation du schéma

Pour créer toutes les tables à partir d'un schéma vide, lancer une fois avec `DB_FORCE=true` :

```bash
DB_FORCE=true docker compose up backend
```

Puis redémarrer normalement. Cette opération **supprime et recrée toutes les tables**.

## Variables d'environnement

### Backend (`.env`)

| Variable         | Défaut         | Description                        |
|------------------|----------------|------------------------------------|
| `PORT`           | `5000`         | Port du serveur Express            |
| `MYSQL_HOST`     | `localhost`    | Hôte MySQL (`mysql` sous Docker)   |
| `MYSQL_PORT`     | `3306`         | Port MySQL                         |
| `MYSQL_USER`     | `root`         | Utilisateur MySQL                  |
| `MYSQL_PASS`     | —              | Mot de passe MySQL                 |
| `MYSQL_DB`       | `mef_fiches`   | Nom de la base de données          |
| `CLIENT_URL`     | `http://localhost:5173` | Origine autorisée (CORS) |
| `KEYCLOAK_URL`   | `http://keycloak:8080` | URL Keycloak              |
| `KEYCLOAK_REALM` | `mef`          | Realm Keycloak                     |
| `DB_FORCE`       | `false`        | `true` pour DROP + CREATE (reset)  |

### Frontend (`.env`)

| Variable              | Défaut                        | Description              |
|-----------------------|-------------------------------|--------------------------|
| `VITE_API_URL`        | `http://localhost:5000/api`   | URL de l'API backend     |
| `VITE_KEYCLOAK_URL`   | `http://localhost:8080`       | URL Keycloak             |
| `VITE_KEYCLOAK_REALM` | `mef`                         | Realm Keycloak           |
| `VITE_KEYCLOAK_CLIENT`| `mef-form`                    | Client ID Keycloak       |

## Structure du projet

```
.
├── backend/
│   └── src/
│       ├── server.js               # Point d'entrée Express
│       ├── db.js                   # Connexion Sequelize / MySQL
│       ├── models/
│       │   └── index.js            # 29 modèles Sequelize + associations
│       ├── routes/
│       │   ├── revues.js           # CRUD revues (POST crée en transaction)
│       │   ├── directions.js       # CRUD directions
│       │   └── analytics.js        # 8 endpoints analytiques
│       └── middleware/
│           └── auth.js             # Validation JWT Keycloak
├── mef-form/
│   └── src/
│       ├── App.jsx                 # Formulaire multi-étapes (11 étapes)
│       ├── api.js                  # Client fetch vers /api
│       ├── keycloak.jsx            # Provider d'authentification
│       ├── components/
│       │   └── FormField.jsx       # Field, DateField, SearchableSelect,
│       │                           # DynamicList, DynamicTable, FieldGroup
│       ├── steps/                  # Étapes 1–11 du formulaire
│       └── pages/
│           └── Dashboard.jsx       # Tableau de bord analytique
├── keycloak/                       # Configuration du realm MEF
└── docker-compose.yml
```

## API

### Directions
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/directions` | Liste (auto-seeding si vide) |
| `POST` | `/api/directions` | Créer une direction |
| `PUT` | `/api/directions/:id` | Mettre à jour |
| `DELETE` | `/api/directions/:id` | Supprimer |

### Revues
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `POST` | `/api/revues` | Soumettre une revue complète (29 tables, transactionnel) |
| `GET` | `/api/revues` | Lister (filtres `?direction=` et `?mois=`) |
| `GET` | `/api/revues/check` | Vérifier doublon (`?direction=&periode_debut=&periode_fin=`) |
| `GET` | `/api/revues/:id` | Détail complet avec toutes les sous-tables |
| `PUT` | `/api/revues/:id` | Modifier (bloqué à J-2 avant la réunion) |
| `DELETE` | `/api/revues/:id` | Supprimer (cascade) |

### Analytics
| Endpoint | Description |
|----------|-------------|
| `GET /api/analytics/overview` | KPIs globaux (total, ce mois, directions actives, taux RH) |
| `GET /api/analytics/par-direction` | Revues par direction (top 15) |
| `GET /api/analytics/par-mois` | Soumissions sur 12 mois glissants |
| `GET /api/analytics/par-periode` | Revues par période couverte |
| `GET /api/analytics/locaux` | Locaux adaptés Oui/Non |
| `GET /api/analytics/rapports` | Rapports produits Oui/Non |
| `GET /api/analytics/effectifs` | Effectifs théorique vs disponible par direction |
| `GET /api/analytics/equipements` | Catégorisation internet et électricité |

Tous les endpoints analytics acceptent le filtre optionnel `?direction=<nom>`.

## Développement sans Docker

**Backend**
```bash
cd backend
npm install
npm run dev      # Express + nodemon sur le port 5000
```

**Frontend**
```bash
cd mef-form
npm install
npm run dev      # Vite dev server sur http://localhost:5173
```

> Nécessite une instance MySQL et Keycloak accessibles. Renseigner `.env` en conséquence.

## Règles métier

- **Unicité mensuelle** : une direction ne peut soumettre qu'une seule revue par période (`direction_id + periode_debut + periode_fin`)
- **Délai de modification** : toute modification est bloquée à moins de 2 jours avant la date de réunion
- **Champs multiples** : 19 champs du formulaire sont stockés dans des tables dédiées (listes dynamiques avec boutons +/−)
- **Données persistantes** : direction, responsable, mission, etc. sont pré-remplis lors des soumissions mensuelles suivantes


Note de déploiement : Au premier démarrage avec le nouveau schéma, lancer le backend avec DB_FORCE=true pour recréer toutes les tables proprement (docker compose run backend DB_FORCE=true node src/server.js), puis redémarrer normalement.
