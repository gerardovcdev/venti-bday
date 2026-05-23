<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		photoUrl,
		fallbackColor = '#A8CFF0',
		overlay = 'dark',
		children
	}: {
		photoUrl: string | null;
		fallbackColor?: string;
		overlay?: 'dark' | 'pink' | 'light';
		children: Snippet;
	} = $props();

	const overlayClass: Record<string, string> = {
		dark: 'bg-gradient-to-b from-black/10 via-black/30 to-black/60',
		pink: 'bg-gradient-to-b from-pink-rose/10 via-pink-rose/40 to-pink-deep/70',
		light: 'bg-gradient-to-b from-white/0 via-white/10 to-white/30'
	};
</script>

<div class="absolute inset-0">
	{#if photoUrl}
		<img
			src={photoUrl}
			alt=""
			class="absolute inset-0 w-full h-full object-cover"
			crossorigin="anonymous"
		/>
	{:else}
		<div class="absolute inset-0" style="background: {fallbackColor};"></div>
	{/if}
	<div class="absolute inset-0 {overlayClass[overlay]}"></div>
</div>
<div class="relative z-10 h-full w-full">
	{@render children()}
</div>
