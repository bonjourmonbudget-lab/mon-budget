/* Mon Budget — service worker : fonctionne hors-ligne (vitrine + application) */
const CACHE = "monbudget-v19";
const ASSETS = ["./", "./index.html", "./app.html", "./jeu.html", "./methode-enveloppes.html", "./alternative-applis-budget.html", "./budget-a-deux.html", "./budget-enfants.html", "./fonds-urgence.html", "./manifest.json", "./icon-192.png", "./icon-512.png", "./apercu.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);

  // Navigation : réseau d'abord (pour rester à jour), repli sur les pages en cache
  // "no-cache" = revalidation serveur systématique : les mises à jour sont
  // visibles dès la visite suivante, même à moins de 10 minutes d'intervalle.
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request, { cache: "no-cache" })
        .then((r) => {
          const cp = r.clone();
          caches.open(CACHE).then((c) => c.put(e.request, cp));
          return r;
        })
        .catch(() =>
          caches.match(e.request).then(
            (hit) =>
              hit ||
              caches.match("./index.html").then(
                (idx) => idx || caches.match("./app.html")
              )
          )
        )
    );
    return;
  }

  // Hors origine (polices Google…) : cache d'abord pour le hors-ligne
  if (url.origin !== location.origin) {
    e.respondWith(
      caches.match(e.request).then(
        (hit) =>
          hit ||
          fetch(e.request)
            .then((r) => {
              const cp = r.clone();
              caches.open(CACHE).then((c) => c.put(e.request, cp));
              return r;
            })
            .catch(() => Response.error())
      )
    );
    return;
  }

  // Même origine (assets) : cache d'abord
  e.respondWith(
    caches.match(e.request).then(
      (hit) =>
        hit ||
        fetch(e.request).then((r) => {
          const cp = r.clone();
          caches.open(CACHE).then((c) => c.put(e.request, cp));
          return r;
        })
    )
  );
});
