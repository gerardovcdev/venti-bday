<script lang="ts">
	import Sticker from './Sticker.svelte';
	import {
		STICKERS,
		ACCENT_STICKERS,
		WRAPPED_ACCENTS,
		type StickerPlacement
	} from '$lib/design/stickers-manifest';

	let {
		variant = 'accent'
	}: { variant?: 'accent' | 'wrapped' | StickerPlacement[] } = $props();

	const layout = $derived(
		variant === 'accent'
			? ACCENT_STICKERS
			: variant === 'wrapped'
				? WRAPPED_ACCENTS
				: variant
	);

	const map = new Map(STICKERS.map((s) => [s.id, s] as const));

	function styleFor(p: StickerPlacement): string {
		const parts: string[] = ['position:absolute'];
		if (p.top) parts.push(`top:${p.top}`);
		if (p.bottom) parts.push(`bottom:${p.bottom}`);
		if (p.left) parts.push(`left:${p.left}`);
		if (p.right) parts.push(`right:${p.right}`);
		parts.push(`z-index:${p.z}`);
		parts.push('opacity:0.85');
		return parts.join(';');
	}
</script>

<div class="pointer-events-none absolute inset-0 overflow-hidden">
	{#each layout as p (p.id + (p.top ?? p.bottom) + (p.left ?? p.right))}
		{@const meta = map.get(p.id)}
		{#if meta}
			<div style={styleFor(p)}>
				<Sticker
					src={meta.src}
					alt={meta.alt}
					size={p.size}
					rotate={p.rotate}
					float={p.float ?? 'a'}
					delay={p.delay ?? 0}
				/>
			</div>
		{/if}
	{/each}
</div>
