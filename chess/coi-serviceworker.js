/* coi-serviceworker v0.1.7 - Guido Zuidhof, licensed under MIT */
/* https://github.com/gzuidhof/coi-serviceworker */

if (typeof window === 'undefined') {
  // === Код внутри Service Worker ===
  self.addEventListener("install", () => self.skipWaiting());
  self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

  self.addEventListener("fetch", function(event) {
    if (event.request.cache === "only-if-cached" && event.request.mode !== "same-origin") return;

    event.respondWith(
      fetch(event.request).then(function(response) {
        // Не трогаем opaque-ответы
        if (response.status === 0) return response;

        const newHeaders = new Headers(response.headers);
        newHeaders.set("Cross-Origin-Opener-Policy", "same-origin");
        newHeaders.set("Cross-Origin-Embedder-Policy", "credentialless");
        newHeaders.set("Cross-Origin-Resource-Policy", "cross-origin");

        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: newHeaders,
        });
      }).catch(e => { console.error(e); return fetch(event.request); })
    );
  });

} else {
  // === Код на странице ===
  (async function() {
    if (window.crossOriginIsolated) return; // уже изолировано — всё ок

    const reloadedBySelf = sessionStorage.getItem("coiReloadedBySelf");
    sessionStorage.removeItem("coiReloadedBySelf");

    if (!("serviceWorker" in navigator)) {
      console.warn("coi-serviceworker: Service Workers не поддерживаются");
      return;
    }

    // Регистрируем SW
    try {
      await navigator.serviceWorker.register(
        window.coi?.serviceWorkerFile || "coi-serviceworker.js"
      );
    } catch(e) {
      console.error("coi-serviceworker: не удалось зарегистрировать SW", e);
      return;
    }

    // Если SW только что установился — перезагружаем страницу чтобы он вступил в силу
    if (!reloadedBySelf) {
      sessionStorage.setItem("coiReloadedBySelf", "1");
      window.location.reload();
    } else {
      console.warn("coi-serviceworker: перезагрузка не помогла, SharedArrayBuffer может быть недоступен");
    }
  })();
}
