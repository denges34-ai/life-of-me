# 🏢 Life of Me

Ma vie, gérée comme une mini-entreprise : une PWA installable sur iPhone et Android,
qui fonctionne hors ligne et garde toutes les données sur l'appareil.

**État : phase 0** — projet, PWA installable, onboarding. L'open space 3D et les
bureaux Finances et Voyages arrivent en phase 1.

## Lancer le projet

Il faut [Node.js](https://nodejs.org) 22 ou plus récent.

```bash
npm install
```

```bash
npm run dev
```

L'appli s'ouvre sur http://localhost:5173.

## Tester

```bash
npm test
```

Les tests couvrent la logique métier (création des données, formats de date et de montant).

## Construire la version de production

```bash
npm run build
```

Le résultat est dans `dist/`. `npm run preview` permet de le vérifier en local
(c'est là que le mode hors ligne est actif, pas en `npm run dev`).

## Déployer

Chaque push sur la branche `main` déclenche `.github/workflows/deploy.yml` :
tests, build, puis publication sur GitHub Pages.

Réglage à faire une seule fois sur GitHub : **Settings → Pages → Source : GitHub Actions**.

## Installer sur le téléphone

- **iPhone** : ouvrir le lien dans Safari → bouton Partager → « Sur l'écran d'accueil ».
- **Android** : ouvrir le lien dans Chrome → bouton « Installer » affiché dans l'appli
  (ou menu ⋮ → « Installer l'application »).

## Organisation du code

```
src/
  app/       routing, écrans transverses (onboarding, accueil, réglages)
  scene/     open space 3D (phase 1)
  offices/   un dossier par bureau + registry.ts
  core/      base de données, formats, installation PWA
  shared/    composants d'interface réutilisables
```

### Ajouter un bureau

1. Créer `src/offices/<id>/index.ts` qui exporte un `OfficeModule`.
2. L'ajouter à la liste dans `src/offices/registry.ts`.

### Modifier la base de données

Ne jamais changer une version existante dans `src/core/db/db.ts` : ajouter un bloc
`this.version(n + 1)`. C'est ce qui évite toute perte de données lors d'une mise à jour.

Chaque entité contient `id`, `createdAt`, `updatedAt`, `deletedAt`, `owner`, `visibility`
(voir `src/core/db/entity.ts`). Les montants sont stockés en centimes entiers.

### Ajouter une dépendance

Les anciennes versions de npm (dont la 11.6) écrivent un `package-lock.json` incomplet,
ce qui fait échouer `npm ci` au déploiement. Après un `npm install <paquet>`, régénérer
le fichier avec un npm récent, puis vérifier :

```bash
npx -y npm@11.21.2 install --package-lock-only
```

```bash
npm ci --dry-run
```

### Régénérer les icônes

Après avoir modifié `public/logo.svg` :

```bash
npm run icons
```
