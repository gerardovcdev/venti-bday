<script lang="ts">
	import BowIcon from './BowIcon.svelte';
	import { play } from '$lib/audio/sfx.svelte';

	let {
		ready = false,
		onchange,
		disabled = false,
		label = '¿Listo?'
	}: {
		ready?: boolean;
		onchange?: (next: boolean) => void;
		disabled?: boolean;
		label?: string;
	} = $props();

	function toggle() {
		if (disabled) return;
		play(!ready ? 'sparkle' : 'pop');
		onchange?.(!ready);
	}
</script>

<button
	type="button"
	onclick={toggle}
	{disabled}
	class="group relative inline-flex items-center gap-3 rounded-full px-5 py-2.5 transition-all duration-300 no-tap disabled:opacity-50 {ready
		? 'bg-gradient-to-r from-pink-bubblegum to-pink-rose text-cream shadow-glow'
		: 'glass text-pink-deep border border-pink-blush'}"
>
	<span
		class="relative inline-block h-6 w-12 rounded-full transition-colors duration-300 {ready
			? 'bg-cream/40'
			: 'bg-pink-blush'}"
	>
		<span
			class="absolute top-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-card transition-all duration-300 {ready
				? 'left-6'
				: 'left-0.5'}"
		>
			{#if ready}
				<BowIcon size={14} color="#FF8FB8" accent="#E0668E" />
			{/if}
		</span>
	</span>
	<span class="font-display tracking-wide">
		{ready ? '¡Lista!' : label}
	</span>
</button>
