# Carnet Beg Meil 2026

Application web installable, à héberger sur GitHub Pages.

## Contenu

| Fichier | Rôle |
|---|---|
| `index.html` | toute l'application, Leaflet et les données inclus |
| `manifest.json` | nom, icônes, couleurs, lancement plein écran |
| `sw.js` | service worker, cache hors ligne |
| `icons/` | icônes 192, 512, maskable, Apple, favicon |

Aucune dépendance externe à installer, aucun build.

## Mise en ligne

Important : ces commandes se lancent **dans le dossier du projet**, jamais
dans `C:\Users\ton_compte`. Un `git init` à la racine du profil essaierait
de versionner tout Windows.

Placer les fichiers de ce dossier (index.html, manifest.json, sw.js, le
dossier icons, .nojekyll) à la racine d'un dossier dédié, par exemple
`C:\Users\ton_compte\Documents\beg-meil`.

Créer d'abord un dépôt vide sur github.com, sans README ni licence.

Configuration à faire une seule fois :

```bash
git config --global user.name "Ton Nom"
git config --global user.email "ton.adresse@exemple.fr"
```

Puis, dans le dossier du projet :

```bash
cd C:\Users\ton_compte\Documents\beg-meil
git init
git add .
git commit -m "Carnet Beg Meil 2026"
git branch -M main
git remote add origin https://github.com/TON_COMPTE/beg-meil.git
git push -u origin main
```

L'adresse en `https` ouvre une fenêtre de connexion GitHub au premier
push. L'adresse en `git@github.com` demanderait une clé SSH configurée,
inutile ici.

Puis dans le dépôt : Settings, Pages, Source `Deploy from a branch`,
branche `main`, dossier `/ (root)`. L'adresse est ensuite
`https://TON_COMPTE.github.io/beg-meil/`.

Tous les chemins sont relatifs, le sous dossier du dépôt ne pose donc
aucun problème.

## Installation sur iPhone

Ouvrir l'adresse dans Safari, bouton Partager, `Sur l'écran d'accueil`.
L'icône apparaît sur le bureau et l'application se lance sans la barre
d'adresse.

Sur Android, Chrome propose l'installation tout seul, ou via le menu
`Installer l'application`.

## En cas de git init au mauvais endroit

Un `git init` lancé par erreur dans le dossier utilisateur se répare en
supprimant le seul dossier `.git`, sans toucher aux fichiers :

```bash
cd C:\Users\ton_compte
rmdir /s /q .git
```

## Ce qui marche hors réseau

- La liste des adresses, les horaires, les téléphones
- Les marées du mois entier et le calendrier des coefficients
- Le fond de carte, uniquement pour les zones déjà consultées

Ce qui a besoin du réseau : les tuiles de carte non encore vues, et le
calcul des distances et des temps de trajet.

## Mise à jour

Modifier les fichiers, incrémenter `VERSION` en tête de `sw.js`, puis
`git push`. L'ancien cache est purgé et les appareils récupèrent la
nouvelle version au lancement suivant.

## Géolocalisation

Elle exige une origine sécurisée. En https sur GitHub Pages le bouton
`Ma position GPS` fonctionne. Le bouton `Point de départ sur la carte`,
lui, marche partout et ne demande aucune permission.

## Vie privée

Le fichier ne contient ni l'adresse, ni les coordonnées, ni aucun temps
de trajet permettant de situer la location. Le point de départ choisi
reste en mémoire de la page et n'est jamais enregistré.

Attention : un dépôt GitHub public rend ces fichiers lisibles par tous.
Le contenu ne comporte que des adresses publiques, mais un dépôt privé
avec Pages reste possible sur les offres payantes.
