const CACHE = "prospect3d-v1";
const FICHIERS = ["./", "index.html", "app.js", "manifest.json", "icon.svg"];
self.addEventListener("install", e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(FICHIERS))));
self.addEventListener("fetch", e => e.respondWith(fetch(e.request).catch(() => caches.match(e.request))));
