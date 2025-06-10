# ReflexBienEtre Backend API

Ce dépôt contient le code nécessaire pour exécuter le backend de ReflexBienEtre.

## Démarrage

### Prérequis

ReflexBienEtre utilise la pile technologique suivante :

- [Node.js v16+](https://nodejs.org/en/)
- [MongoDB Community Server](https://www.mongodb.com/try/download/community)

Assurez-vous d'avoir les bonnes versions installées. Vous pouvez vérifier cela avec les commandes suivantes dans votre terminal :

```bash
# Vérifier la version de Node.js
node --version

# Vérifier la version de MongoDB
mongo --version
```

### Instructions

1. Clonez ce dépôt sur votre ordinateur.
2. Ouvrez une fenêtre de terminal dans le projet cloné.
3. Exécutez les commandes suivantes :

```bash
# Installer les dépendances
npm install

# Démarrer le serveur de développement local
npm run dev:server

# Remplir la base de données avec des utilisateurs de test
npm run populate-db
```

Votre serveur devrait maintenant être en cours d'exécution à l'adresse suivante : `http://localhost:4000`. Vous aurez également des utilisateurs de test dans votre base de données MongoDB.

---

## Données de la base de données pré-remplies

Une fois que vous avez exécuté le script `populate-db`, vous devriez avoir deux utilisateurs dans votre base de données :

### Eric Sermande

- **Prénom :** `Eric`
- **Nom :** `Sermande`
- **Email :** `eric@example.com`
- **Mot de passe :** `password123`

### Jane Doe

- **Prénom :** `Jane`
- **Nom :** `Doe`
- **Email :** `jane.doe@example.com`
- **Mot de passe :** `password456`

---

## Documentation de l'API

Pour en savoir plus sur le fonctionnement de l'API, une fois que votre environnement local est démarré, vous pouvez visiter la documentation Swagger à l'adresse suivante :

```
http://localhost:4000/api-docs
```

---

## Ressources de conception

Les fichiers HTML et CSS statiques pour la plupart du site se trouvent dans le dossier `/designs`.

Pour certaines fonctionnalités dynamiques, comme la modification des utilisateurs, vous pouvez consulter les maquettes dans `/designs/wireframes/edit-user-name.png`.

Pour le modèle d'API que vous proposez pour les transactions, la maquette se trouve dans `/designs/wireframes/transactions.png`.
