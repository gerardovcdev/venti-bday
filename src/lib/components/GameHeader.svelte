<script lang="ts">
	import PlayerAvatar from './PlayerAvatar.svelte';
	import HeartIcon from './HeartIcon.svelte';
	import { gameStore } from '$lib/stores/game.svelte';
	import { PLAYER_PALETTE } from '$lib/design/colors';
	import type { GamePhase } from '$lib/supabase/types';

	let { playerId }: { playerId: string } = $props();

	const me = $derived(gameStore.playerById(playerId));
	const c = $derived(
		me ? (PLAYER_PALETTE.find((p) => p.name === me.color) ?? PLAYER_PALETTE[0]) : null
	);

	const phaseLabel: Record<GamePhase, string> = {
		lobby: 'lobby',
		trivia: 'trivia',
		wml: '¿quién es más probable?',
		photo: 'foto del momento',
		wrapped: 'wrapped'
	};

	const order = $derived((gameStore.game?.config?.trivia_order ?? []) as string[]);
	const wmlOrder = $derived((gameStore.game?.config?.wml_order ?? []) as string[]);

	const progress = $derived.by(() => {
		if (gameStore.phase === 'trivia' && order.length) {
			return { current: gameStore.currentRound + 1, total: order.length };
		}
		if (gameStore.phase === 'wml' && wmlOrder.length) {
			return { current: gameStore.currentRound + 1, total: wmlOrder.length };
		}
		return null;
	});
</script>

{#if me && c}
	<div
		class="sticky top-0 z-20 -mx-5 mb-4 px-5 py-2 backdrop-blur-md bg-pink-cream/70 border-b border-pink-blush/40"
	>
		<div class="flex items-center gap-3">
			<PlayerAvatar
				initials={me.initials}
				colorBg={c.bg}
				colorFg={c.fg}
				colorRing={c.ring}
				size="sm"
				online
			/>
			<div class="flex-1 min-w-0">
				<div class="font-display text-pink-deep text-sm truncate">{me.name}</div>
				<div class="font-script text-pink-rose/70 text-xs leading-none">
					{phaseLabel[gameStore.phase]}
					{#if progress}
						· {progress.current}/{progress.total}
					{/if}
				</div>
			</div>
			<div class="flex items-center gap-1 text-pink-rose">
				<HeartIcon size={12} color="#7FB8E8" />
				<span class="font-script text-xs">{gameStore.players.length}</span>
			</div>
		</div>
		{#if progress}
			<div class="mt-1.5 h-1 w-full rounded-full bg-pink-blush/40 overflow-hidden">
				<div
					class="h-full rounded-full bg-gradient-to-r from-pink-bubblegum to-pink-rose transition-all duration-500"
					style="width: {(progress.current / progress.total) * 100}%"
				></div>
			</div>
		{/if}
	</div>
{/if}
