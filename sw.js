/* 每次发布新版本时，务必修改 CACHE_VERSION。 */
const CACHE_VERSION = "radio-shell-v1.0.2";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/app.css",
  "./js/stations.js",
  "./js/app.js",
  "./icons/icon.svg",
  "./icons/icon-192.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(async (cache) => {
        // 新版本安装时绕过 HTTP 缓存，避免把旧静态文件误当成新版缓存。
        await Promise.all(APP_SHELL.map(async (path) => {
          const response = await fetch(new Request(path, { cache: "reload" }));
          if (!response.ok) throw new Error(`缓存失败：${path}`);
          await cache.put(path, response);
        }));
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key.startsWith("radio-shell-") && key !== CACHE_VERSION)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // 不拦截非 GET、跨域资源、音频流或媒体请求。
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (request.destination === "audio" || /\.(mp3|aac|m4a|ogg|wav|flac|m3u8|mpd)(?:$|[?#])/i.test(url.href)) return;

  // HTML 导航采用网络优先：联网时可拿到最新页面；断网时回退到已缓存页面。
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put("./index.html", copy)).catch(() => {});
        }
        return response;
      }).catch(async () => {
        return (await caches.match(request)) ||
          (await caches.match("./index.html")) ||
          Response.error();
      })
    );
    return;
  }

  // 本应用静态资源采用缓存优先，首次安装时已预缓存完整应用外壳。
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response && response.ok && response.type === "basic") {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy)).catch(() => {});
        }
        return response;
      });
    })
  );
});
