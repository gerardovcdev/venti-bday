/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { build, files, version } from '$service-worker';

const sw = self as unknown as ServiceWorkerGlobalScope;

const CACHE = `venti-cache-v3-${version}`;
const ASSETS = new Set([...build, ...files]);

sw.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE)
			.then(async (cache) => {
				// Add assets one by one so a single 404 doesn't break the whole install
				await Promise.allSettled(
					[...ASSETS].map((path) => cache.add(path).catch(() => undefined))
				);
			})
			.then(() => sw.skipWaiting())
	);
});

sw.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
			)
			.then(() => sw.clients.claim())
	);
});

sw.addEventListener('fetch', (event) => {
	const request = event.request;
	if (request.method !== 'GET') return;

	const url = new URL(request.url);

	// Never intercept anything outside our origin
	if (url.origin !== sw.location.origin) return;

	// Never intercept HTML navigations — let the network handle them
	// so SvelteKit routing always works (no stale page bugs).
	if (request.mode === 'navigate' || request.destination === 'document') return;

	// Never intercept API-like or websocket requests
	if (url.pathname.startsWith('/api')) return;

	// Only cache known asset paths (built JS, static files)
	if (ASSETS.has(url.pathname)) {
		event.respondWith(
			caches.match(request).then((cached) => cached ?? fetch(request).catch(() => Response.error()))
		);
		return;
	}

	// Everything else: pass through to network (don't cache, don't break)
});
