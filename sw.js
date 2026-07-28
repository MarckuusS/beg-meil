/* Service worker du carnet Beg Meil.
   Incremente VERSION a chaque deploiement : l'ancien cache est alors purge
   et les appareils recuperent la nouvelle version au lancement suivant. */
const VERSION = "v3";
const COQUILLE = "carnet-" + VERSION;
const TUILES = "tuiles-" + VERSION;
const TUILES_MAX = 400;

/* Chemins relatifs : le site fonctionne aussi bien a la racine d'un domaine
   que dans un sous dossier du type /mon-depot/ sur GitHub Pages. */
const A_PRECHARGER = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(COQUILLE)
      .then(c => c.addAll(A_PRECHARGER))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(noms => Promise.all(
        noms.filter(n => n !== COQUILLE && n !== TUILES).map(n => caches.delete(n))
      ))
      .then(() => self.clients.claim())
  );
});

/* Limite la taille du cache de tuiles, sinon il grossit sans fin. */
async function elaguer(nom, max){
  const c = await caches.open(nom);
  const cles = await c.keys();
  if(cles.length > max){
    for(const k of cles.slice(0, cles.length - max)) await c.delete(k);
  }
}

self.addEventListener("fetch", e => {
  const req = e.request;
  if(req.method !== "GET") return;

  const url = new URL(req.url);

  /* Le routage doit toujours partir du reseau : une reponse en cache
     serait fausse des que le point de depart change. */
  if(/router\.project-osrm\.org|routing\.openstreetmap\.de|valhalla1\.openstreetmap\.de|nominatim\.openstreetmap\.org/.test(url.hostname)){
    return;
  }

  /* Tuiles de fond de carte : reseau d'abord, cache en secours,
     ce qui rend consultables les zones deja parcourues. */
  if(/tile\.openstreetmap|basemaps\.cartocdn\.com/.test(url.hostname)){
    e.respondWith(
      fetch(req)
        .then(rep => {
          const copie = rep.clone();
          caches.open(TUILES).then(c => c.put(req, copie).then(() => elaguer(TUILES, TUILES_MAX)));
          return rep;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  /* Le reste, c'est la coquille de l'application : cache d'abord.
     Navigation hors ligne : on retombe sur la page d'accueil. */
  e.respondWith(
    caches.match(req).then(cache => cache || fetch(req).then(rep => {
      if(rep && rep.status === 200 && rep.type === "basic"){
        const copie = rep.clone();
        caches.open(COQUILLE).then(c => c.put(req, copie));
      }
      return rep;
    }).catch(() => {
      if(req.mode === "navigate") return caches.match("./index.html");
    }))
  );
});
