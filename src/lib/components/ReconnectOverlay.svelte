<script lang="ts">
	import HeartLoader from './HeartLoader.svelte';
	import KittyDoodle from './KittyDoodle.svelte';

	let { visible = false }: { visible?: boolean } = $props();
</script>

{#if visible}
	<div
		class="fixed inset-0 z-40 flex flex-col items-center justify-center gap-4 bg-pink-cream/85 backdrop-blur-md animate-fade-up"
	>
		<KittyDoodle size={120} variant="cat" />
		<HeartLoader label="reconectando..." />
		<p class="font-script text-pink-deep/80 text-sm text-center max-w-xs px-6">
			estamos volviendo a conectar contigo ♡
			<br />no cierres la página
		</p>
	</div>
{/if}
