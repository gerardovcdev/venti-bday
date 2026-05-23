<script lang="ts">
	import BowButton from '$lib/components/BowButton.svelte';
	import GlassCard from '$lib/components/GlassCard.svelte';
	import PlayerAvatar from '$lib/components/PlayerAvatar.svelte';
	import ReadyToggle from '$lib/components/ReadyToggle.svelte';
	import HeartLoader from '$lib/components/HeartLoader.svelte';
	import KittyDoodle from '$lib/components/KittyDoodle.svelte';
	import HeartIcon from '$lib/components/HeartIcon.svelte';
	import StartCountdown from '$lib/components/StartCountdown.svelte';
	import AccentStickers from '$lib/components/AccentStickers.svelte';
	import { LOBBY_STICKERS } from '$lib/design/stickers-manifest';
	import { gameStore } from '$lib/stores/game.svelte';
	import { setReady, advancePhase, resetGame, leaveGame } from '$lib/supabase/mutations';
	import { PLAYER_PALETTE } from '$lib/design/colors';
	import { MIN_PLAYERS_TO_START } from '$lib/config';

	let { playerId }: { playerId: string } = $props();

	let toggleBusy = $state(false);
	let startBusy = $state(false);
	let countingDown = $state(false);
	let showAdmin = $state(false);
	let resetBusy = $state(false);
	let leaveBusy = $state(false);

	const me = $derived(gameStore.playerById(playerId));
	const playersSorted = $derived(
		[...gameStore.players].sort((a, b) => a.joined_at.localeCompare(b.joined_at))
	);
	const allReady = $derived(
		playersSorted.length >= MIN_PLAYERS_TO_START &&
			playersSorted.every((p) => p.is_ready)
	);

	$effect(() => {
		if (allReady && !countingDown && !startBusy && playerId === playersSorted[0]?.id) {
			countingDown = true;
		}
	});

	function colorFor(name: string) {
		return PLAYER_PALETTE.find((c) => c.name === name) ?? PLAYER_PALETTE[0];
	}

	async function toggleReady(next: boolean) {
		if (!me) return;
		toggleBusy = true;
		try {
			await setReady(me.id, next);
		} finally {
			toggleBusy = false;
		}
	}

	async function tryStart() {
		if (startBusy) return;
		startBusy = true;
		try {
			await advancePhase('start_game');
		} catch (e) {
			console.warn(e);
		} finally {
			startBusy = false;
		}
	}

	function onCountdownDone() {
		void tryStart();
	}

	async function doReset() {
		if (resetBusy) return;
		if (!confirm('¿reiniciar la partida? esto saca a todos del juego y borra todo.')) return;
		resetBusy = true;
		try {
			await resetGame();
		} catch (e) {
			console.error(e);
		} finally {
			resetBusy = false;
		}
	}

	async function doLeave() {
		if (leaveBusy || !me) return;
		if (!confirm('¿salir del juego?')) return;
		leaveBusy = true;
		try {
			await leaveGame(me.id);
			localStorage.clear();
			window.location.href = '/';
		} catch (e) {
			console.error(e);
			leaveBusy = false;
		}
	}
</script>

{#if countingDown}
	<StartCountdown oncomplete={onCountdownDone} from={3} />
{/if}

<div class="relative flex flex-1 flex-col gap-6 animate-fade-up">
	<AccentStickers variant={LOBBY_STICKERS} />
	<header class="text-center">
		<div class="font-script text-pink-rose/80 text-lg">sala de la fiesta</div>
		<h1 class="font-display text-4xl text-pink-deep flex items-center justify-center gap-2">
			<HeartIcon size={26} color="#4F8FD0" />
			Lobby
			<HeartIcon size={26} color="#4F8FD0" />
		</h1>
	</header>

	{#if playersSorted.length === 0}
		<GlassCard padding="lg" glow>
			<div class="flex flex-col items-center gap-4 py-4">
				<KittyDoodle size={80} variant="cat" />
				<HeartLoader label="esperando a las amigas..." />
			</div>
		</GlassCard>
	{:else}
		<GlassCard padding="md">
			<div class="font-script text-pink-deep text-center mb-3">
				{playersSorted.length} {playersSorted.length === 1 ? 'persona' : 'personas'} en la sala
			</div>
			<ul class="flex flex-col gap-2.5">
				{#each playersSorted as player (player.id)}
					{@const c = colorFor(player.color)}
					{@const isMe = player.id === playerId}
					<li
						class="flex items-center gap-3 rounded-2xl px-3 py-2 transition {isMe
							? 'bg-pink-cloud/60 ring-2 ring-pink-bubblegum'
							: 'bg-white/40'}"
					>
						<PlayerAvatar
							initials={player.initials}
							colorBg={c.bg}
							colorFg={c.fg}
							colorRing={c.ring}
							size="md"
							online={gameStore.presence.has(player.id)}
							ringActive={player.is_ready}
						/>
						<div class="flex-1 min-w-0">
							<div class="font-display text-lg text-pink-berry truncate">
								{player.name}
								{#if isMe}
									<span class="font-script text-pink-rose text-sm ml-1">(tú)</span>
								{/if}
							</div>
							<div class="text-xs text-pink-deep/70">
								{player.is_ready ? '¡lista! ♡' : 'todavía no'}
							</div>
						</div>
						{#if player.is_ready}
							<HeartIcon size={20} color="#7FB8E8" />
						{/if}
					</li>
				{/each}
			</ul>
		</GlassCard>
	{/if}

	<div class="flex flex-col items-center gap-3">
		{#if me}
			<ReadyToggle ready={me.is_ready} disabled={toggleBusy} onchange={toggleReady} />
		{/if}
		{#if playersSorted.length < MIN_PLAYERS_TO_START}
			<p class="font-script text-pink-deep/70 text-sm text-center">
				faltan al menos {MIN_PLAYERS_TO_START - playersSorted.length} más para empezar
			</p>
		{:else if !allReady}
			<p class="font-script text-pink-deep/70 text-sm text-center">
				esperando a todas para empezar...
			</p>
		{:else}
			<p class="font-script text-pink-rose text-sm text-center animate-heartbeat">
				¡todas listas! empezando...
			</p>
		{/if}
	</div>

	<div class="mt-2 flex flex-col items-center gap-1">
		<button
			type="button"
			onclick={() => (showAdmin = !showAdmin)}
			class="font-script text-pink-rose/50 text-xs underline no-tap"
		>
			{showAdmin ? 'ocultar' : '· · ·'}
		</button>
		{#if showAdmin}
			<div class="flex gap-3 animate-fade-up">
				<button
					type="button"
					onclick={doReset}
					disabled={resetBusy}
					class="font-script text-pink-rose text-xs underline no-tap"
				>
					{resetBusy ? 'reiniciando...' : 'reiniciar juego'}
				</button>
				<button
					type="button"
					onclick={doLeave}
					disabled={leaveBusy}
					class="font-script text-pink-rose text-xs underline no-tap"
				>
					{leaveBusy ? 'saliendo...' : 'salir'}
				</button>
			</div>
		{/if}
	</div>
</div>
