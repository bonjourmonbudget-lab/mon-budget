/* Mon Budget — consentement aux cookies de mesure d'audience (Google Analytics).
   Principe : RIEN n'est chargé ni envoyé à Google tant que le visiteur n'a pas cliqué « Accepter ».
   Utilisé par la vitrine et les pages de guides ; l'application (app.html) ne mesure rien.
   Les appels gtag(...) faits avant le choix sont mis en attente : envoyés si « Accepter », jetés si « Refuser ». */
(function () {
  "use strict";
  var GA_ID = "G-P31JFZ6KP1";
  var CLE = "mb_cookies";
  var DUREE_MS = 180 * 24 * 3600 * 1000; // le choix est redemandé au bout de 6 mois
  var etat = "attente";                  // "attente" | "oui" | "non"
  var file = [];

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () {
    if (etat === "oui") { window.dataLayer.push(arguments); }
    else if (etat === "attente") { file.push(arguments); }
    /* « non » : on ne garde rien */
  };

  function lire() {
    try {
      var o = JSON.parse(localStorage.getItem(CLE) || "null");
      if (o && (o.v === "oui" || o.v === "non") && Date.now() - o.t < DUREE_MS) return o.v;
    } catch (e) {}
    return null;
  }
  function ecrire(v) {
    try { localStorage.setItem(CLE, JSON.stringify({ v: v, t: Date.now() })); } catch (e) {}
  }

  function activerAnalytics() {
    if (document.getElementById("mb-ga")) return;
    var s = document.createElement("script");
    s.id = "mb-ga"; s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
    document.head.appendChild(s);
    window.gtag("js", new Date());
    window.gtag("config", GA_ID, { cookie_expires: 34128000 }); // cookies Google : 13 mois au plus
    while (file.length) { window.dataLayer.push(file.shift()); }
  }

  function appliquer(v) {
    etat = v;
    if (v === "oui") activerAnalytics();
    else { file.length = 0; }
  }

  function fermerBandeau() {
    var b = document.getElementById("mb-cookies-bandeau");
    if (b) b.remove();
  }

  function choisir(v) {
    ecrire(v);
    var etaitOui = (etat === "oui");
    appliquer(v);
    fermerBandeau();
    /* Retrait du consentement : la mesure s'arrête immédiatement pour les prochains événements ;
       les cookies déjà posés par Google disparaissent en rechargeant la page. */
    if (etaitOui && v === "non") { window.location.reload(); }
  }

  function afficherBandeau() {
    if (document.getElementById("mb-cookies-bandeau")) return;
    var css = document.createElement("style");
    css.id = "mb-cookies-css";
    css.textContent =
      "#mb-cookies-bandeau{position:fixed;left:12px;right:12px;bottom:12px;z-index:99999;max-width:640px;margin:0 auto;" +
      "background:#14141d;color:#f3f3f7;border:1px solid #2a2a38;border-radius:14px;padding:16px 18px;" +
      "box-shadow:0 10px 40px rgba(0,0,0,.55);font:14px/1.5 Inter,system-ui,-apple-system,Segoe UI,sans-serif}" +
      "#mb-cookies-bandeau b{font-weight:700}" +
      "#mb-cookies-bandeau a{color:#a98afc}" +
      "#mb-cookies-bandeau p{margin:0 0 12px;color:#c9c9d6}" +
      "#mb-cookies-bandeau .mb-c-btns{display:flex;gap:10px;flex-wrap:wrap}" +
      "#mb-cookies-bandeau button{flex:1;min-width:130px;cursor:pointer;font:600 14px Inter,system-ui,sans-serif;" +
      "padding:10px 16px;border-radius:10px;border:1px solid #6d5bd0;background:#6d5bd0;color:#fff}" +
      "#mb-cookies-bandeau button:hover{filter:brightness(1.12)}" +
      "#mb-cookies-bandeau button:focus-visible{outline:2px solid #fff;outline-offset:2px}";
    if (!document.getElementById("mb-cookies-css")) document.head.appendChild(css);

    var b = document.createElement("div");
    b.id = "mb-cookies-bandeau";
    b.setAttribute("role", "dialog");
    b.setAttribute("aria-label", "Choix sur les cookies");
    b.innerHTML =
      "<p><b>Cookies de mesure d'audience</b><br>" +
      "Ce site peut utiliser Google Analytics pour compter les visites (pages vues, provenance, clics sur les boutons). " +
      "Rien n'est envoyé à Google sans votre accord, et l'application elle-même ne mesure rien. " +
      "Vous pouvez changer d'avis à tout moment via le lien « Cookies » en bas de page. <a href=\"cookies.html\">En savoir plus</a></p>" +
      "<div class=\"mb-c-btns\">" +
      "<button type=\"button\" id=\"mb-c-non\">Refuser</button>" +
      "<button type=\"button\" id=\"mb-c-oui\">Accepter</button></div>";
    document.body.appendChild(b);
    document.getElementById("mb-c-non").addEventListener("click", function () { choisir("non"); });
    document.getElementById("mb-c-oui").addEventListener("click", function () { choisir("oui"); });
  }

  function ajouterLienPied() {
    var pied = document.querySelector("footer");
    if (!pied || document.getElementById("mb-cookies-lien")) return;
    if (!pied.querySelector('a[href="confidentialite.html"]')) {
      var c = document.createElement("a");
      c.href = "confidentialite.html"; c.textContent = "Confidentialité";
      pied.appendChild(document.createTextNode(" · "));
      pied.appendChild(c);
    }
    var a = document.createElement("a");
    a.href = "#"; a.id = "mb-cookies-lien"; a.textContent = "Cookies";
    a.addEventListener("click", function (e) { e.preventDefault(); afficherBandeau(); });
    pied.appendChild(document.createTextNode(" · "));
    pied.appendChild(a);
  }

  window.mbCookiesOuvrir = afficherBandeau;

  var memo = lire();
  if (memo) appliquer(memo);

  function pret() {
    ajouterLienPied();
    if (!memo) afficherBandeau();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", pret);
  else pret();
})();
