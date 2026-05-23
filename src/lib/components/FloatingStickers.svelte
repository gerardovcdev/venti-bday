<script lang="ts">
	import HeartIcon from './HeartIcon.svelte';
	import StarIcon from './StarIcon.svelte';
	import BowIcon from './BowIcon.svelte';
	import Sparkle from './Sparkle.svelte';
	import KittyDoodle from './KittyDoodle.svelte';
	import { pickKoreanDecorations } from '$lib/design/stickers';

	let {
		seed = 0.42,
		intensity = 'normal'
	}: { seed?: number; intensity?: 'light' | 'normal' | 'rich' } = $props();

	const koreanWords = $derived(pickKoreanDecorations(3, seed));
	const sparkleCount = $derived(intensity === 'light' ? 4 : intensity === 'normal' ? 7 : 11);
	const heartCount = $derived(intensity === 'light' ? 2 : 3);

	function rand(i: number, min: number, max: number) {
		const x = Math.sin(seed * 1000 + i * 31.7) * 10000;
		const f = x - Math.floor(x);
		return min + f * (max - min);
	}
</script>

<div class="pointer-events-none fixed inset-0 z-0 overflow-hidden">
	<!-- gradient blob -->
	<div
		class="absolute -top-32 -right-24 h-80 w-80 rounded-full blur-3xl opacity-60"
		style="background: radial-gradient(circle, #FFB6D5 0%, transparent 70%);"
	></div>
	<div
		class="absolute -bottom-40 -left-20 h-96 w-96 rounded-full blur-3xl opacity-50"
		style="background: radial-gradient(circle, #E8D5FF 0%, transparent 70%);"
	></div>

	<!-- sparkles -->
	{#each Array(sparkleCount) as _, i}
		<div
			class="absolute animate-sparkle"
			style="top: {rand(i, 4, 92)}%; left: {rand(i + 100, 2, 96)}%; animation-delay: {i * 0.3}s;"
		>
			<Sparkle size={rand(i + 200, 10, 22)} color={i % 2 === 0 ? '#FF8FB8' : '#E8D5FF'} />
		</div>
	{/each}

	<!-- hearts floating -->
	{#each Array(heartCount) as _, i}
		<div
			class="absolute animate-float"
			style="top: {rand(i + 50, 10, 80)}%; left: {rand(i + 60, 5, 90)}%; animation-delay: {i * 1.1}s;"
		>
			<HeartIcon size={rand(i + 70, 14, 26)} color={i % 2 === 0 ? '#FFB6D5' : '#FF8FB8'} />
		</div>
	{/each}

	<!-- bow corner -->
	<div class="absolute top-6 right-4 animate-float-alt opacity-70">
		<BowIcon size={42} color="#FFB6D5" accent="#E0668E" />
	</div>

	<!-- kitty doodles corners -->
	{#if intensity !== 'light'}
		<div class="absolute -bottom-2 -right-2 opacity-40 animate-float-alt">
			<KittyDoodle size={120} variant="cat" />
		</div>
		<div class="absolute top-32 -left-4 opacity-30 animate-float">
			<KittyDoodle size={90} variant="bunny" />
		</div>
	{/if}
	{#if intensity === 'rich'}
		<div class="absolute bottom-36 right-2 opacity-35 animate-float">
			<KittyDoodle size={80} variant="pup" />
		</div>
		<div class="absolute top-1/3 right-4 opacity-30 animate-float-alt">
			<KittyDoodle size={70} variant="pud" />
		</div>
	{/if}

	<!-- korean accents -->
	{#each koreanWords as word, i}
		<div
			class="font-script absolute text-pink-rose/30 select-none whitespace-nowrap"
			style="top: {rand(i + 800, 8, 88)}%; left: {rand(i + 900, 6, 70)}%; font-size: {rand(i + 1000, 18, 32)}px; transform: rotate({rand(i + 1100, -12, 12)}deg);"
		>
			{word}
		</div>
	{/each}

	<!-- stars -->
	<div class="absolute top-8 left-6 animate-sparkle" style="animation-delay: 0.5s;">
		<StarIcon size={18} color="#FFC0E2" />
	</div>
	<div class="absolute bottom-12 right-8 animate-sparkle" style="animation-delay: 1.2s;">
		<StarIcon size={22} color="#E8D5FF" />
	</div>
</div>
