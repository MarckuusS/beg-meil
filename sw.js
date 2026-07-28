/* Service worker du carnet Beg Meil.
   Incremente VERSION a chaque deploiement : l'ancienne coquille est alors
   purgee et les appareils recuperent la nouvelle version au lancement suivant. */
const VERSION = "v11";
const COQUILLE = "carnet-" + VERSION;
/* Volontairement hors du versionnement. Les tuiles ne sont pas du code, ce sont
   des donnees couteuses a reconstituer : les purger a chaque publication vidait
   la carte hors ligne apres plusieurs jours de parcours. Leur nombre reste
   borne par elaguer() et TUILES_MAX. */
const TUILES = "tuiles";
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

/* La page demande sa version pour l'afficher : ainsi le numero ne peut pas
   diverger entre le service worker et l'application, il n'existe qu'ici. */
self.addEventListener("message", e => {
  if(e.data === "version" && e.source) e.source.postMessage({version: VERSION});
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

  /* Le routage et le geocodage doivent toujours partir du reseau : une reponse
     en cache serait fausse des que le point de depart change. */
  if(/router\.project-osrm\.org|routing\.openstreetmap\.de|valhalla1\.openstreetmap\.de|nominatim\.openstreetmap\.org/.test(url.hostname)){
    return;
  }

  /* Tuiles de fond de carte : cache d'abord. Une tuile deja vue s'affiche
     instantanement et sans reseau, ce qui correspond exactement a l'usage en
     vacances. Auparavant le reseau passait en premier, si bien que les zones
     parcourues la veille attendaient quand meme l'expiration du reseau. */
  if(/tile\.openstreetmap|basemaps\.cartocdn\.com/.test(url.hostname)){
    e.respondWith(
      caches.match(req).then(cache => cache || fetch(req).then(rep => {
        /* ne cacher que les vraies tuiles : en pleine saison les serveurs OSM
           renvoient des 429, qui seraient resservis a la place de l'image */
        if(rep && rep.ok){
          const copie = rep.clone();
          caches.open(TUILES).then(c => c.put(req, copie).then(() => elaguer(TUILES, TUILES_MAX)));
        }
        return rep;
      }))
    );
    return;
  }

  /* La page elle meme porte le code ET le contenu du carnet. Elle est servie
     depuis le cache pour rester instantanee et disponible hors ligne, mais
     rafraichie en arriere plan : une correction publiee sans incrementer
     VERSION finit ainsi par arriver, au lancement suivant. */
  if(req.mode === "navigate" || /\.html$/.test(url.pathname)){
    e.respondWith(
      caches.match(req).then(cache => {
        const reseau = fetch(req).then(rep => {
          if(rep && rep.ok && rep.type === "basic"){
            const copie = rep.clone();
            caches.open(COQUILLE).then(c => c.put(req, copie));
          }
          return rep;
        }).catch(() => caches.match("./index.html"));
        return cache || reseau;
      })
    );
    return;
  }

  /* Le reste de la coquille (icones, manifeste) ne change qu'avec VERSION :
     cache d'abord, sans rafraichissement inutile. */
  e.respondWith(
    caches.match(req).then(cache => cache || fetch(req).then(rep => {
      if(rep && rep.ok && rep.type === "basic"){
        const copie = rep.clone();
        caches.open(COQUILLE).then(c => c.put(req, copie));
      }
      return rep;
    }).catch(() => undefined))
  );
});
