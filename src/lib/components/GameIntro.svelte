<script lang="ts">
	import type { Snippet } from 'svelte';
	import GlassCard from './GlassCard.svelte';
	import BowButton from './BowButton.svelte';
	import HeartIcon from './HeartIcon.svelte';
	import Sparkle from './Sparkle.svelte';
	import HeartLoader from './HeartLoader.svelte';
	import PlayerAvatar from './PlayerAvatar.svelte';
	import AccentStickers from './AccentStickers.svelte';
	import { gameStore } from '$lib/stores/game.svelte';
	import { setReady, advancePhase } from '$lib/supabase/mutations';
	import { PLAYER_PALETTE } from '$lib/design/colors';
	import { play } from '$lib/audio/sfx.svelte';
	import type { StickerPlacement } from '$lib/design/stickers-manifest';

	let {
		playerId,
		phaseLabel,
		title,
		subtitle,
		acceptLabel = '¡entendido!',
		onaccept,
		demo,
		stickers
	}: {
		playerId: string;
		phaseLabel: string;
		title: string;
		subtitle: string;
		acceptLabel?: string;
		onaccept?: () => Promise<boolean> | boolean; // si devuelve false, no marca ready
		demo: Snippet;
		stickers?: StickerPlacement[];
	} = $props();

	let accepting = $state(false);
	let acceptError = $state<string | null>(null);

	const me = $derived(gameStore.playerById(playerId));
	const players = $derived(gameStore.players);
	const readyCount = $derived(players.filter((p) => p.is_ready).length);
	const allReady = $derived(readyCount === players.length && players.length > 0);

	function colorFor(name: string) {
		return PLAYER_PALETTE.find((c) => c.name === name) ?? PLAYER_PALETTE[0];
	}

	async function accept() {
		if (!me || accepting) return;
		accepting = true;
		acceptError = null;
		try {
			let ok = true;
			if (onaccept) {
				const res = await onaccept();
				ok = res !== false;
			}
			if (!ok) {
				accepting = false;
				return;
			}
			play('sparkle');
			await setReady(me.id, true);
		} catch (e) {
			console.error(e);
			acceptError = e instanceof Error ? e.message : 'algo salió mal, intentá de nuevo';
			accepting = false;
		}
	}

	$effect(() => {
		if (allReady && me?.is_ready && playerId === players[0]?.id) {
			void advancePhase('skip_intro').catch((e) => console.warn(e));
		}
	});
</script>

<div class="relative flex flex-1 flex-col gap-5 animate-fade-up">
	{#if stickers}
		<AccentStickers variant={stickers} />
	{/if}

	<header class="text-center relative z-10">
		<div class="font-script text-pink-rose/80 text-sm uppercase tracking-widest">
			{phaseLabel}
		</div>
		<h1 class="font-display text-4xl text-pink-deep flex items-center justify-center gap-2 mt-1">
			<Sparkle size={18} color="#E0668E" />
			{title}
			<Sparkle size={18} color="#E0668E" />
		</h1>
	</header>

	<div class="relative z-10 flex-1 flex items-center justify-center px-2">
		{@render demo()}
	</div>

	<GlassCard padding="md" glow>
		<p class="font-display text-pink-berry text-base leading-snug text-balance text-center">
			{subtitle}
		</p>
	</GlassCard>

	<div class="relative z-10 flex flex-col items-center gap-3">
		{#if me?.is_ready}
			<div class="flex items-center gap-2 font-script text-pink-rose text-base animate-heartbeat">
				<HeartIcon size={16} color="#E0668E" />
				lista... esperando a las demás
				<HeartIcon size={16} color="#E0668E" />
			</div>
			<div class="font-script text-pink-deep/70 text-xs">
				{readyCount}/{players.length} listas
			</div>
		{:else}
			<BowButton onclick={accept} disabled={accepting}>
				<HeartIcon size={18} color="#FFFFFF" />
				{accepting ? 'un momento...' : acceptLabel}
			</BowButton>
			{#if acceptError}
				<p class="font-script text-pink-rose text-sm text-center max-w-xs">{acceptError}</p>
			{/if}
		{/if}

		<div class="flex flex-wrap gap-1.5 justify-center mt-1">
			{#each players as p (p.id)}
				{@const c = colorFor(p.color)}
				<PlayerAvatar
					initials={p.initials}
					colorBg={c.bg}
					colorFg={c.fg}
					colorRing={p.is_ready ? '#FF8FB8' : '#FFE0EC'}
					size="xs"
					online={gameStore.presence.has(p.id)}
					ringActive={p.is_ready}
				/>
			{/each}
		</div>
	</div>
</div>
