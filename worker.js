/* Carnet de séjour Beg Meil 2026
   Copyright (c) 2026 Marius Amalric. Tous droits réservés. Voir LICENSE.

   Service de synchronisation, à déployer sur Cloudflare Workers.
   Ce fichier ne fait PAS partie du site : il n'est ni servi par GitHub Pages,
   ni chargé par le navigateur. Il est ici pour être versionné avec le reste.

   TROIS COLLECTIONS partagées entre les téléphones :
     visites  ce qui a été fait, qui et quand
     plan     ce qui est prévu, jour par jour, et par qui
     lieux    les adresses ajoutées à la main par la famille

   Chacune est un dictionnaire clé vers objet. La fusion est la même pour les
   trois : clé par clé, la modification la plus récente gagne, d'après le champ
   maj au format ISO, qui se compare correctement comme du texte.

   Rien n'est jamais effacé, seulement marqué supprime. Sans cela une
   suppression ne pourrait pas se propager : l'absence d'une clé ne se distingue
   pas d'une clé jamais reçue.

   Le code famille n'est écrit nulle part dans le site publié. Il est saisi une
   fois par téléphone et rangé dans le navigateur, comme le prénom. */

const ORIGINES = [
  "https://marckuuss.github.io",
  "http://localhost:8765"
];
const COLLECTIONS = ["visites", "plan", "lieux"];
const CLE = "carnet";

function entetes(origine) {
  return {
    "Access-Control-Allow-Origin": ORIGINES.indexOf(origine) !== -1 ? origine : ORIGINES[0],
    "Access-Control-Allow-Headers": "content-type, x-code",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

function fusionner(stock, envoi) {
  let change = false;
  for (const nom of COLLECTIONS) {
    const a = stock[nom] || (stock[nom] = {});
    const b = (envoi && envoi[nom]) || {};
    for (const k of Object.keys(b)) {
      const v = b[k];
      if (!v || typeof v !== "object") continue;
      const ancien = a[k];
      /* strictement plus recent : a horodatage egal on garde ce qui est stocke,
         ce qui rend la fusion stable quel que soit l'ordre des envois */
      if (!ancien || String(v.maj || "") > String(ancien.maj || "")) {
        a[k] = v;
        change = true;
      }
    }
  }
  return change;
}

export default {
  async fetch(req, env) {
    const cors = entetes(req.headers.get("Origin") || "");

    if (req.method === "OPTIONS") return new Response(null, { headers: cors });
    if (req.method !== "POST")
      return new Response("methode non autorisee", { status: 405, headers: cors });

    /* Sans le bon code, on ne dit rien de plus qu'un refus. */
    if (!env.CODE_FAMILLE || req.headers.get("x-code") !== env.CODE_FAMILLE)
      return new Response("code refuse", { status: 401, headers: cors });

    let envoi = {};
    try { envoi = await req.json(); } catch (e) { envoi = {}; }
    if (!envoi || typeof envoi !== "object" || Array.isArray(envoi)) envoi = {};

    const brut = await env.CARNET.get(CLE);
    let stock = {};
    try { stock = brut ? JSON.parse(brut) : {}; } catch (e) { stock = {}; }
    for (const nom of COLLECTIONS) if (!stock[nom]) stock[nom] = {};

    if (fusionner(stock, envoi)) await env.CARNET.put(CLE, JSON.stringify(stock));

    return new Response(JSON.stringify(stock), {
      headers: Object.assign({ "content-type": "application/json" }, cors)
    });
  }
};
