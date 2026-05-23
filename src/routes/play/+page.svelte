<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import Lobby from '$lib/components/phases/Lobby.svelte';
	import Trivia from '$lib/components/phases/Trivia.svelte';
	import WhosMostLikely from '$lib/components/phases/WhosMostLikely.svelte';
	import PhotoCapture from '$lib/components/phases/PhotoCapture.svelte';
	import HeartLoader from '$lib/components/HeartLoader.svelte';
	import GlassCard from '$lib/components/GlassCard.svelte';
	import BowButton from '$lib/components/BowButton.svelte';
	import HeartIcon from '$lib/components/HeartIcon.svelte';
	import ReconnectOverlay from '$lib/components/ReconnectOverlay.svelte';
	import GameHeader from '$lib/components/GameHeader.svelte';
	import StaleGameBanner from '$lib/components/StaleGameBanner.svelte';
	import TriviaIntro from '$lib/components/intros/TriviaIntro.svelte';
	import WhosMostLikelyIntro from '$lib/components/intros/WhosMostLikelyIntro.svelte';
	import PhotoIntro from '$lib/components/intros/PhotoIntro.svelte';
	import { loadLocalPlayer, clearLocalPlayer } from '$lib/stores/player';
	import { gameStore } from '$lib/stores/game.svelte';
	import { touchPresence, pruneStalePlayers } from '$lib/supabase/mutations';
	import { hasBackend } from '$lib/supabase/client';
	import { loadCheckpoint, clearCheckpoint } from '$lib/persistence/idb';

	let player = $state(loadLocalPlayer());
	let presenceInterval: ReturnType<typeof setInterval> | null = null;
	let staleTicker = $state(Date.now());
	let hintPhase = $state<string | null>(null);
	let everSeen = $state(false);
	let kicked = $state(false);

	onMount(async () => {
		if (!player) {
			await goto('/');
			return;
		}
		const cp = await loadCheckpoint();
		if (cp && cp.playerId === player.id) {
			hintPhase = cp.phase;
		}
		if (!hasBackend()) return;
		// Limpieza oportunista de fantasmas antes de sincronizar
		void pruneStalePlayers().catch(() => {});
		await gameStore.start(player.id);
		presenceInterval = setInterval(() => {
			if (player) void touchPresence(player.id);
			staleTicker = Date.now();
		}, 15_000);

		const onVisibility = () => {
			if (document.visibilityState === 'visible' && player) {
				void touchPresence(player.id);
			}
		};
		document.addEventListener('visibilitychange', onVisibility);
		(window as unknown as { __visHandler: () => void }).__visHandler = onVisibility;
	});

	const isStale = $derived(
		gameStore.connected &&
			staleTicker - gameStore.lastUpdateAt > 60_000
	);

	// Detector de juego "huérfano": el cuarto está en una fase != lobby pero el
	// jugador actual entró DESPUÉS de que arrancó. Significa que el juego se quedó
	// trabado de una sesión vieja.
	const gameIsOrphaned = $derived.by(() => {
		if (!gameStore.connected) return false;
		if (gameStore.phase === 'lobby') return false;
		const me = player ? gameStore.playerById(player.id) : null;
		if (!me) return false;
		const startedAt = gameStore.game?.started_at;
		if (!startedAt) return true; // fase != lobby sin started_at = inconsistente
		return new Date(me.joined_at).getTime() > new Date(startedAt).getTime() + 5_000;
	});

	// Cuando el server confirma que ya nos vio (al menos una vez), activamos
	// el detector de "me sacaron del juego" (resetGame() borró todos los jugadores).
	$effect(() => {
		if (player && gameStore.connected && gameStore.playerById(player.id)) {
			everSeen = true;
		}
	});

	$effect(() => {
		if (
			everSeen &&
			!kicked &&
			player &&
			gameStore.connected &&
			!gameStore.playerById(player.id)
		) {
			kicked = true;
			void handleKick();
		}
	});

	async function handleKick() {
		try {
			clearLocalPlayer();
			await clearCheckpoint();
			gameStore.stop();
		} finally {
			// Pequeña pausa para mostrar mensaje
			setTimeout(() => {
				window.location.href = '/';
			}, 1200);
		}
	}

	$effect(() => {
		if (gameStore.phase === 'wrapped' && player) {
			void goto(`/wrapped/${player.id}`);
		}
	});

	onDestroy(() => {
		if (presenceInterval) clearInterval(presenceInterval);
		gameStore.stop();
		if (typeof window !== 'undefined') {
			const w = window as unknown as { __visHandler?: () => void };
			if (w.__visHandler) document.removeEventListener('visibilitychange', w.__visHandler);
		}
	});
</script>

<ReconnectOverlay visible={isStale} />

{#if kicked}
	<div class="flex flex-1 flex-col items-center justify-center gap-4 text-center animate-fade-up">
		<GlassCard padding="lg" glow>
			<p class="font-script text-pink-deep text-lg">
				el juego se reinició ♡<br />
				volviendo al inicio...
			</p>
		</GlassCard>
		<HeartLoader />
	</div>
{:else if !player}
	<div class="flex flex-1 items-center justify-center">
		<HeartLoader label="redirigiendo..." />
	</div>
{:else if !hasBackend()}
	<div class="flex flex-1 flex-col items-center justify-center gap-4 text-center">
		<GlassCard padding="lg">
			<div class="font-display text-pink-deep text-xl">modo demo ♡</div>
			<p class="text-pink-berry/80 text-sm mt-2 max-w-xs text-balance">
				configura Supabase para activar el multijugador. revisa
				<code class="font-script text-pink-rose">.env</code> y el archivo
				<code class="font-script text-pink-rose">supabase/migrations/0001_init.sql</code>.
			</p>
		</GlassCard>
		<BowButton onclick={() => goto('/')} size="md">
			<HeartIcon size={16} color="#FFFFFF" />
			volver al inicio
		</BowButton>
	</div>
{:else if !gameStore.connected && !gameStore.error}
	<div class="flex flex-1 items-center justify-center">
		<HeartLoader
			label={hintPhase
				? `volviendo a la fase: ${hintPhase}...`
				: 'conectando...'}
		/>
	</div>
{:else if gameStore.error}
	<div class="flex flex-1 flex-col items-center justify-center gap-4 text-center">
		<GlassCard padding="md">
			<div class="font-script text-pink-rose">no pudimos conectar</div>
			<p class="text-pink-berry/80 text-xs mt-2">{gameStore.error}</p>
		</GlassCard>
	</div>
{:else if gameIsOrphaned}
	<StaleGameBanner />
{:else}
	{@const introPhase = gameStore.game?.config?.intro_phase}
	{@const isIntro = introPhase === gameStore.phase}
	{#if gameStore.phase !== 'lobby' && !isIntro}
		<GameHeader playerId={player.id} />
	{/if}
	{#if gameStore.phase === 'lobby'}
		<Lobby playerId={player.id} />
	{:else if gameStore.phase === 'trivia' && isIntro}
		<TriviaIntro playerId={player.id} />
	{:else if gameStore.phase === 'trivia'}
		<Trivia playerId={player.id} />
	{:else if gameStore.phase === 'wml' && isIntro}
		<WhosMostLikelyIntro playerId={player.id} />
	{:else if gameStore.phase === 'wml'}
		<WhosMostLikely playerId={player.id} />
	{:else if gameStore.phase === 'photo' && isIntro}
		<PhotoIntro playerId={player.id} />
	{:else if gameStore.phase === 'photo'}
		<PhotoCapture playerId={player.id} />
	{:else}
		<div class="flex flex-1 items-center justify-center">
			<HeartLoader label="preparando el wrapped..." />
		</div>
	{/if}
{/if}
