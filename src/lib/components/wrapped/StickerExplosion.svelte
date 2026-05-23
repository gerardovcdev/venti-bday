<script lang="ts">
	import Sticker from '$lib/components/Sticker.svelte';
	import { STICKERS, type StickerPlacement } from '$lib/design/stickers-manifest';

	let {
		ids = ['snoopy', 'kitty', 'mymelody', 'cinnamoroll', 'ateez', 'rauw'],
		seed = 0.3
	}: { ids?: string[]; seed?: number } = $props();

	const meta = new Map(STICKERS.map((s) => [s.id, s] as const));

	function rand(i: number, min: number, max: number) {
		const x = Math.sin(seed * 1000 + i * 37.1) * 10000;
		const f = x - Math.floor(x);
		return min + f * (max - min);
	}

	const placements = $derived<StickerPlacement[]>(
		ids.map((id, i) => ({
		id,
		top: `${rand(i, 4, 80)}%`,
		left: `${rand(i + 100, -4, 92)}%`,
		size: `${Math.round(rand(i + 200, 56, 96))}px`,
		rotate: Math.round(rand(i + 300, -20, 20)),
		z: 1,
		delay: i * 0.18,
		float: i % 2 === 0 ? 'a' : 'b'
	}))
	);
</script>

<div class="pointer-events-none absolute inset-0 overflow-hidden">
	{#each placements as p, i (p.id + i)}
		{@const m = meta.get(p.id)}
		{#if m}
			<div
				class="absolute animate-fade-up"
				style="top: {p.top}; left: {p.left}; z-index: {p.z}; animation-delay: {(p.delay ?? 0) * 0.5}s;"
			>
				<Sticker
					src={m.src}
					alt={m.alt}
					size={p.size}
					rotate={p.rotate}
					float={p.float ?? 'a'}
					delay={p.delay ?? 0}
					lazy={false}
				/>
			</div>
		{/if}
	{/each}
</div>
