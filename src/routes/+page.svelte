<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import BowButton from '$lib/components/BowButton.svelte';
	import Sparkle from '$lib/components/Sparkle.svelte';
	import HeartIcon from '$lib/components/HeartIcon.svelte';
	import StickerCollage from '$lib/components/StickerCollage.svelte';
	import { LANDING_LAYOUT } from '$lib/design/stickers-manifest';
	import { loadLocalPlayer, clearLocalPlayer } from '$lib/stores/player';
	import { clearCheckpoint } from '$lib/persistence/idb';
	import { play } from '$lib/audio/sfx.svelte';

	let existing = $state(loadLocalPlayer());
	let shareMsg = $state<string | null>(null);

	onMount(() => {
		existing = loadLocalPlayer();
	});

	function startGame() {
		goto('/join');
	}

	function continueGame() {
		goto('/play');
	}

	async function shareLink() {
		const url = window.location.origin;
		play('sparkle');
		try {
			if (navigator.share) {
				await navigator.share({
					title: 'Venti b-day! ♡',
					text: 'únete al juego del cumple de Venti ♡',
					url
				});
			} else {
				await navigator.clipboard.writeText(url);
				shareMsg = 'link copiado ♡';
				setTimeout(() => (shareMsg = null), 2000);
			}
		} catch {
			// usuario canceló o no soportado
		}
	}

	async function changeName() {
		clearLocalPlayer();
		await clearCheckpoint();
		existing = null;
		goto('/join');
	}
</script>

<!-- collage de stickers detrás de todo, ocupa min-h-dvh -->
<div class="relative -mx-5 -mt-6 min-h-dvh">
	<StickerCollage layout={LANDING_LAYOUT} />

	<!-- contenido encima, columna vertical centrada -->
	<div class="relative z-10 flex min-h-dvh flex-col items-center justify-between px-5 pt-10 pb-10 text-center">
		<!-- top: korean subtitle -->
		<div class="font-script text-pink-rose/90 text-xl drop-shadow-sm">
			벤띠 생일 축하해 ♡
		</div>

		<!-- middle: title -->
		<div class="relative animate-fade-up px-2">
			<!-- backdrop pill so title pops over busy collage -->
			<div
				class="relative rounded-[2rem] bg-white/55 backdrop-blur-md px-6 py-5 shadow-glow border border-white/70"
			>
				<h1
					class="font-display text-6xl sm:text-7xl text-transparent bg-clip-text bg-gradient-to-r from-pink-rose via-pink-deep to-pink-rose animate-gradient leading-[0.9]"
				>
					Venti
				</h1>
				<h2
					class="font-display text-5xl sm:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-pink-bubblegum via-pink-rose to-pink-deep animate-gradient leading-none mt-1"
				>
					b-day!
				</h2>
				<div class="mt-2 flex items-center justify-center gap-1.5">
					<Sparkle size={14} color="#E0668E" />
					<span class="font-script text-pink-deep text-base">un juego cute para ti</span>
					<Sparkle size={14} color="#E0668E" />
				</div>
			</div>
		</div>

		<!-- bottom: actions -->
		<div class="flex flex-col items-center gap-3 w-full">
			{#if existing}
				<BowButton onclick={continueGame} size="lg">
					<HeartIcon size={20} color="#FFFFFF" />
					continuar
					<HeartIcon size={20} color="#FFFFFF" />
				</BowButton>
				<p class="font-script text-pink-deep/80 text-sm drop-shadow-sm">
					estás como <b class="text-pink-deep">{existing.name}</b>
				</p>
				<button
					type="button"
					onclick={changeName}
					class="font-script text-pink-rose/90 text-sm underline no-tap"
				>
					cambiar nombre
				</button>
			{:else}
				<BowButton onclick={startGame} size="lg">
					<HeartIcon size={20} color="#FFFFFF" />
					Jugar
					<HeartIcon size={20} color="#FFFFFF" />
				</BowButton>
			{/if}

			<button
				type="button"
				onclick={shareLink}
				class="inline-flex items-center gap-1.5 font-script text-pink-rose text-sm no-tap hover:text-pink-deep transition mt-1 drop-shadow-sm"
			>
				<Sparkle size={12} color="#E0668E" />
				compartir el link
				<Sparkle size={12} color="#E0668E" />
			</button>
			{#if shareMsg}
				<p class="font-script text-pink-deep text-xs animate-fade-up">{shareMsg}</p>
			{/if}

			<div class="font-script text-pink-rose/80 text-base mt-1 drop-shadow-sm">
				hecho con amor para ti ♡
			</div>
		</div>
	</div>
</div>
