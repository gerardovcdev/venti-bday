<script lang="ts">
	import GlassCard from '$lib/components/GlassCard.svelte';
	import BowButton from '$lib/components/BowButton.svelte';
	import PlayerAvatar from '$lib/components/PlayerAvatar.svelte';
	import HeartIcon from '$lib/components/HeartIcon.svelte';
	import HeartLoader from '$lib/components/HeartLoader.svelte';
	import Sparkle from '$lib/components/Sparkle.svelte';
	import { gameStore } from '$lib/stores/game.svelte';
	import { submitWmlVote, advancePhase } from '$lib/supabase/mutations';
	import { PLAYER_PALETTE } from '$lib/design/colors';
	import wmlData from '$lib/content/whos_most_likely.json';
	import { play } from '$lib/audio/sfx.svelte';
	import SkipWaitingBanner from '$lib/components/SkipWaitingBanner.svelte';
	import AccentStickers from '$lib/components/AccentStickers.svelte';
	import { WML_STICKERS } from '$lib/design/stickers-manifest';

	let { playerId }: { playerId: string } = $props();

	type WmlPrompt = { id: string; prompt: string };

	const promptsById = new Map((wmlData as WmlPrompt[]).map((w) => [w.id, w] as const));
	const order = $derived((gameStore.game?.config.wml_order ?? []) as string[]);
	const currentId = $derived(order[gameStore.currentRound]);
	const prompt = $derived(currentId ? promptsById.get(currentId) : undefined);
	const reveal = $derived(gameStore.reveal);

	const votesForRound = $derived(gameStore.votes.filter((v) => v.round_id === currentId));
	const myVote = $derived(votesForRound.find((v) => v.voter_id === playerId));

	const tally = $derived.by(() => {
		const map = new Map<string, number>();
		for (const v of votesForRound) {
			map.set(v.voted_for_id, (map.get(v.voted_for_id) ?? 0) + 1);
		}
		return map;
	});

	const winner = $derived.by(() => {
		let max = 0;
		let winnerId: string | null = null;
		for (const [id, count] of tally) {
			if (count > max) {
				max = count;
				winnerId = id;
			}
		}
		return winnerId;
	});

	let submitBusy = $state(false);
	let advanceBusy = $state(false);

	function colorFor(name: string) {
		return PLAYER_PALETTE.find((c) => c.name === name) ?? PLAYER_PALETTE[0];
	}

	async function vote(targetId: string) {
		if (!prompt || myVote || submitBusy) return;
		submitBusy = true;
		play('sparkle');
		try {
			await submitWmlVote({ voterId: playerId, roundId: prompt.id, votedForId: targetId });
		} finally {
			submitBusy = false;
		}
	}

	let lastReveal = $state(false);
	$effect(() => {
		if (reveal && !lastReveal) {
			play('reveal');
		}
		lastReveal = reveal;
	});

	async function tryReveal(force = false) {
		if (advanceBusy) return;
		advanceBusy = true;
		try {
			await advancePhase('reveal_wml', force);
		} catch (e) {
			console.warn(e);
		} finally {
			advanceBusy = false;
		}
	}

	async function next() {
		if (advanceBusy) return;
		advanceBusy = true;
		try {
			await advancePhase('next_wml');
		} catch (e) {
			console.warn(e);
		} finally {
			advanceBusy = false;
		}
	}

	$effect(() => {
		if (
			votesForRound.length === gameStore.players.length &&
			gameStore.players.length > 0 &&
			!reveal &&
			currentId &&
			playerId === gameStore.players[0]?.id
		) {
			void tryReveal();
		}
	});

	function votersFor(targetId: string) {
		return votesForRound
			.filter((v) => v.voted_for_id === targetId)
			.map((v) => gameStore.playerById(v.voter_id))
			.filter((p): p is NonNullable<typeof p> => !!p);
	}
</script>

{#if !prompt}
	<div class="flex flex-1 items-center justify-center">
		<HeartLoader label="cargando preguntas malditas..." />
	</div>
{:else}
	<div class="relative flex flex-1 flex-col gap-5 animate-fade-up">
		<AccentStickers variant={WML_STICKERS} />
		<div class="text-center">
			<div class="font-script text-pink-rose/80 text-sm">
				ronda {gameStore.currentRound + 1} de {order.length}
			</div>
			<div class="inline-flex items-center gap-2 mt-1">
				<Sparkle size={16} color="#7FB8E8" />
				<span class="font-display text-pink-deep text-sm uppercase tracking-widest">
					¿quién es más probable?
				</span>
				<Sparkle size={16} color="#7FB8E8" />
			</div>
		</div>

		<GlassCard padding="lg" glow>
			<h2 class="font-display text-base sm:text-lg text-pink-deep text-center text-balance leading-snug px-1">
				{prompt.prompt}
			</h2>
		</GlassCard>

		<div class="grid grid-cols-3 gap-3 sm:grid-cols-4">
			{#each gameStore.players as target (target.id)}
				{@const c = colorFor(target.color)}
				{@const voters = votersFor(target.id)}
				{@const picked = myVote?.voted_for_id === target.id}
				{@const isWinner = reveal && winner === target.id}
				<button
					type="button"
					onclick={() => vote(target.id)}
					disabled={!!myVote || submitBusy}
					class="relative flex flex-col items-center gap-1 rounded-2xl p-2 transition no-tap {picked
						? 'bg-pink-cloud ring-2 ring-pink-rose'
						: 'bg-white/30 hover:bg-white/60'} {isWinner ? 'shadow-glow scale-110' : ''}"
				>
					<PlayerAvatar
						initials={target.initials}
						colorBg={c.bg}
						colorFg={c.fg}
						colorRing={c.ring}
						size={isWinner ? 'lg' : 'md'}
						online={gameStore.presence.has(target.id)}
					/>
					<span class="font-display text-xs text-pink-berry truncate max-w-full">
						{target.name}
					</span>
					{#if reveal && voters.length > 0}
						<div class="flex flex-wrap justify-center gap-0.5 mt-1">
							{#each voters as v (v.id)}
								{@const vc = colorFor(v.color)}
								<span
									class="inline-flex items-center justify-center rounded-full text-[8px] font-bold h-4 w-4"
									style="background:{vc.bg}; color:{vc.fg};"
									title={v.name}
								>
									{v.initials.slice(0, 2)}
								</span>
							{/each}
						</div>
					{/if}
					{#if isWinner}
						<span class="absolute -top-2 -right-2 animate-heartbeat">
							<HeartIcon size={20} color="#4F8FD0" />
						</span>
					{/if}
				</button>
			{/each}
		</div>

		<div class="text-center">
			{#if !reveal}
				<p class="font-script text-pink-deep/80">
					{votesForRound.length} de {gameStore.players.length} votaron
				</p>
			{:else}
				<p class="font-script text-pink-rose text-lg">¡el ganador! ♡</p>
			{/if}
		</div>

		{#if reveal}
			<div class="flex justify-center">
				<BowButton onclick={next} disabled={advanceBusy} size="md">
					<HeartIcon size={16} color="#FFFFFF" />
					{gameStore.currentRound + 1 >= order.length ? 'a las fotos!' : 'siguiente'}
				</BowButton>
			</div>
		{:else}
			<SkipWaitingBanner
				visible={!!myVote && votesForRound.length < gameStore.players.length}
				onskip={() => tryReveal(true)}
			/>
		{/if}
	</div>
{/if}
