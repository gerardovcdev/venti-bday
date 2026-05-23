<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import FloatingStickers from '$lib/components/FloatingStickers.svelte';
	import AudioToggle from '$lib/components/AudioToggle.svelte';

	let { children } = $props();

	onMount(async () => {
		// Self-heal: si quedó un service worker viejo de una build anterior,
		// forzar update y recargar cuando esté el nuevo.
		if ('serviceWorker' in navigator) {
			try {
				const regs = await navigator.serviceWorker.getRegistrations();
				for (const reg of regs) {
					reg.update();
					reg.addEventListener('updatefound', () => {
						const nw = reg.installing;
						if (!nw) return;
						nw.addEventListener('statechange', () => {
							if (nw.state === 'activated' && navigator.serviceWorker.controller) {
								// El nuevo SW tomó control - recargar sin caché vieja
								window.location.reload();
							}
						});
					});
				}
			} catch {
				// ignorar
			}
		}
	});
</script>

<svelte:head>
	<title>Venti b-day! ♡</title>
	<meta name="description" content="Un juego cute para celebrarte" />
</svelte:head>

<FloatingStickers intensity="light" />
<AudioToggle />

<main class="relative z-10 mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pt-6 pb-12">
	{@render children()}
</main>
