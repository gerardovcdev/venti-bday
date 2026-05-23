<script lang="ts">
	import Sticker from './Sticker.svelte';
	import { STICKERS, LANDING_LAYOUT, type StickerPlacement } from '$lib/design/stickers-manifest';

	let { layout = LANDING_LAYOUT }: { layout?: StickerPlacement[] } = $props();

	const map = new Map(STICKERS.map((s) => [s.id, s] as const));

	function styleFor(p: StickerPlacement): string {
		const parts: string[] = ['position:absolute'];
		if (p.top) parts.push(`top:${p.top}`);
		if (p.bottom) parts.push(`bottom:${p.bottom}`);
		if (p.left) parts.push(`left:${p.left}`);
		if (p.right) parts.push(`right:${p.right}`);
		parts.push(`z-index:${p.z}`);
		return parts.join(';');
	}
</script>

<div class="pointer-events-none absolute inset-0 overflow-hidden">
	{#each layout as p (p.id + (p.top ?? p.bottom) + (p.left ?? p.right))}
		{@const meta = map.get(p.id)}
		{#if meta}
			<div style={styleFor(p)} class="animate-fade-up" style:animation-delay="{(p.delay ?? 0) * 0.6}s">
				<Sticker
					src={meta.src}
					alt={meta.alt}
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
