const CACHE = "prospect3d-v2";
const FICHIERS = ["./", "index.html", "app.js", "manifest.json", "icon.svg", "icon-192.png", "icon-512.png"];
self.addEventListener("install", e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(FICHIERS))));
self.addEventListener("fetch", e => e.respondWith(fetch(e.request).catch(() => caches.match(e.request))));
