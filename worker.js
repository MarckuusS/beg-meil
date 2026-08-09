/* Carnet de séjour Beg Meil 2026
   Copyright (c) 2026 Marius Amalric. Tous droits réservés. Voir LICENSE.

   Service de synchronisation, à déployer sur Cloudflare Workers.
   Ce fichier ne fait PAS partie du site : il n'est ni servi par GitHub Pages,
   ni chargé par le navigateur. Il est ici pour être versionné avec le reste.

   Un seul point d'entrée. Chaque téléphone envoie ses visites, le service les
   fusionne avec celles des autres et renvoie l'état complet. Un aller-retour,
   pas de session, pas de compte.

   La fusion se fait lieu par lieu : la modification la plus récente gagne.
   C'est à ça que sert le champ maj posé sur chaque visite. Les horodatages
   sont au format ISO, qui se compare correctement comme du texte.

   Le code famille n'est écrit nulle part dans le site publié. Il est saisi une
   fois par téléphone et rangé dans le navigateur, comme le prénom. */

const ORIGINE = "https://marckuuss.github.io";

export default {
  async fetch(req, env) {
    const cors = {
      "Access-Control-Allow-Origin": ORIGINE,
      "Access-Control-Allow-Headers": "content-type, x-code",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Max-Age": "86400",
      "Vary": "Origin"
    };

    if (req.method === "OPTIONS") return new Response(null, { headers: cors });
    if (req.method !== "POST")
      return new Response("methode non autorisee", { status: 405, headers: cors });

    /* Sans le bon code, on ne dit rien de plus qu'un refus. */
    if (req.headers.get("x-code") !== env.CODE_FAMILLE)
      return new Response("code refuse", { status: 401, headers: cors });

    let envoi = {};
    try { envoi = await req.json(); } catch (e) { envoi = {}; }
    if (!envoi || typeof envoi !== "object" || Array.isArray(envoi)) envoi = {};

    const brut = await env.CARNET.get("visites");
    let stock = {};
    try { stock = brut ? JSON.parse(brut) : {}; } catch (e) { stock = {}; }

    let change = false;
    for (const lieu of Object.keys(envoi)) {
      const v = envoi[lieu];
      if (!v || typeof v !== "object") continue;
      const ancien = stock[lieu];
      /* strictement plus recent : a horodatage egal on garde ce qui est stocke,
         ce qui rend la fusion stable quel que soit l'ordre des envois */
      if (!ancien || String(v.maj || "") > String(ancien.maj || "")) {
        stock[lieu] = { le: v.le || null, par: v.par || "",
                        maj: v.maj || new Date().toISOString(),
                        supprime: !!v.supprime };
        change = true;
      }
    }

    if (change) await env.CARNET.put("visites", JSON.stringify(stock));

    return new Response(JSON.stringify(stock), {
      headers: Object.assign({ "content-type": "application/json" }, cors)
    });
  }
};
