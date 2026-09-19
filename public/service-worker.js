const VERSION='kachmohol-v10';const SCOPE='/Kachmohol2099/';const SHELL=[SCOPE,SCOPE+'index.html',SCOPE+'manifest.webmanifest',SCOPE+'icon.svg'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(VERSION).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==VERSION).map(key=>caches.delete(key)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{if(event.request.method!=='GET'||new URL(event.request.url).origin!==location.origin)return;event.respondWith(fetch(event.request).then(response=>{const copy=response.clone();caches.open(VERSION).then(cache=>cache.put(event.request,copy));return response}).catch(()=>caches.match(event.request).then(cached=>cached||caches.match(SCOPE+'index.html'))))});
self.addEventListener('message',event=>{if(event.data==='SKIP_WAITING')self.skipWaiting()});
