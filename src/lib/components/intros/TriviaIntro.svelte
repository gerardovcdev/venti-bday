<script lang="ts">
	import GameIntro from '$lib/components/GameIntro.svelte';
	import Sticker from '$lib/components/Sticker.svelte';
	import { sticker } from '$lib/design/stickers-manifest';
	import { TRIVIA_STICKERS } from '$lib/design/stickers-manifest';

	let { playerId }: { playerId: string } = $props();
</script>

<GameIntro
	{playerId}
	phaseLabel="fase 1 de 3"
	title="trivia ♡"
	subtitle="vamos a ver quién conoce mejor a Venti y un poquito de cultura general. responde rápido, espera a las demás, y el sistema cuenta cuántas acertaste. ¡al final hay cerebrito!"
	acceptLabel="lista para arrancar"
	stickers={TRIVIA_STICKERS}
>
	{#snippet demo()}
		<div class="relative w-full max-w-[280px] mx-auto">
			<div class="glass rounded-3xl p-6 shadow-glow text-center relative overflow-hidden">
				<div class="text-7xl font-display text-pink-rose animate-heartbeat">?</div>
				<div class="absolute top-2 left-2 animate-sparkle text-2xl">✨</div>
				<div class="absolute bottom-2 right-2 animate-sparkle text-2xl" style="animation-delay: 0.4s;">✨</div>
			</div>
			<div class="absolute -top-3 -right-3 animate-float">
				{#if sticker('pompompurin')}
					<Sticker src={sticker('pompompurin')!.src} alt="pompompurin" size="60px" rotate={14} float="a" lazy={false} />
				{/if}
			</div>
			<div class="absolute -bottom-3 -left-3 animate-float-alt">
				{#if sticker('pastel')}
					<Sticker src={sticker('pastel')!.src} alt="pastel" size="50px" rotate={-12} float="b" lazy={false} />
				{/if}
			</div>
		</div>
	{/snippet}
</GameIntro>
