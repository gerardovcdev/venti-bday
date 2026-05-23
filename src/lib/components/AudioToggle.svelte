<script lang="ts">
	import { sfx, play } from '$lib/audio/sfx.svelte';

	function toggle() {
		const wasMuted = sfx.muted;
		sfx.toggle();
		if (wasMuted) {
			play('sparkle');
		}
	}
</script>

<button
	type="button"
	onclick={toggle}
	aria-label={sfx.muted ? 'activar sonidos' : 'silenciar'}
	class="fixed top-3 right-3 z-30 h-9 w-9 rounded-full glass shadow-card flex items-center justify-center no-tap active:scale-95 transition"
	title={sfx.muted ? 'sonidos off' : 'sonidos on'}
>
	{#if sfx.muted}
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4F8FD0" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M11 5L6 9H2v6h4l5 4V5z" />
			<line x1="22" y1="9" x2="16" y2="15" />
			<line x1="16" y1="9" x2="22" y2="15" />
		</svg>
	{:else}
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4F8FD0" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M11 5L6 9H2v6h4l5 4V5z" />
			<path d="M15.54 8.46a5 5 0 010 7.07" />
			<path d="M19.07 4.93a10 10 0 010 14.14" />
		</svg>
	{/if}
</button>
