// Offline support: everything is cached on the first (online) visit, then the app runs with no internet.
const CACHE = '3d-uzegch-v1';
const LOCAL = ["./", "index.html", "manifest.json", "icon-192.png", "icon-512.png", "icon-maskable-512.png", "apple-touch-icon.png"];
const CDN = [
  "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js",
  "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js",
  "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js",
  "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/ColladaLoader.js",
  "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/OBJLoader.js",
  "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/MTLLoader.js",
  "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/STLLoader.js",
  "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/FBXLoader.js",
  "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/TGALoader.js",
  "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/curves/NURBSCurve.js",
  "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/curves/NURBSUtils.js",
  "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/fflate.module.js",
  "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/utils/BufferGeometryUtils.js",
  "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/environments/RoomEnvironment.js",
  "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/lines/LineSegments2.js",
  "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/lines/LineSegmentsGeometry.js",
  "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/lines/LineMaterial.js"
];
self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await Promise.all([...LOCAL, ...CDN].map(u => c.add(u).catch(() => {})));
    self.skipWaiting();
  })());
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith('http')) return;
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    const hit = await c.match(req, { ignoreSearch: true });
    if (hit) return hit;
    try {
      const res = await fetch(req);
      if (res.ok) c.put(req, res.clone());
      return res;
    } catch (err) {
      if (req.mode === 'navigate') return (await c.match('index.html')) || Response.error();
      throw err;
    }
  })());
});
