<script lang="ts">
	import { onDestroy } from 'svelte';
	import GlassCard from '$lib/components/GlassCard.svelte';
	import BowButton from '$lib/components/BowButton.svelte';
	import HeartIcon from '$lib/components/HeartIcon.svelte';
	import Sparkle from '$lib/components/Sparkle.svelte';
	import PlayerAvatar from '$lib/components/PlayerAvatar.svelte';
	import HeartLoader from '$lib/components/HeartLoader.svelte';
	import { gameStore } from '$lib/stores/game.svelte';
	import { uploadPhoto, advancePhase } from '$lib/supabase/mutations';
	import {
		startCameraStream,
		stopStream,
		captureFrame,
		downscaleIfNeeded
	} from '$lib/camera/capture';
	import { PLAYER_PALETTE } from '$lib/design/colors';
	import { play } from '$lib/audio/sfx.svelte';
	import SkipWaitingBanner from '$lib/components/SkipWaitingBanner.svelte';
	import AccentStickers from '$lib/components/AccentStickers.svelte';
	import { PHOTO_STICKERS } from '$lib/design/stickers-manifest';
	import { poseForPlayer } from '$lib/wrapped/poses';
	import { GAME_ID } from '$lib/config';

	let { playerId }: { playerId: string } = $props();

	type Status =
		| 'pose' // mostrando la pose, esperando que abra cámara
		| 'starting' // pidiendo cámara
		| 'preview' // cámara abierta, esperando shutter
		| 'review' // capturada, esperando confirmación / retake
		| 'uploading' // subiendo
		| 'done'
		| 'error';

	let status = $state<Status>('pose');
	let videoEl: HTMLVideoElement | null = $state(null);
	let stream: MediaStream | null = $state(null);
	let preview = $state<string | null>(null);
	let previewBlob: Blob | null = null;
	let errorMsg = $state<string | null>(null);
	let fallbackInput: HTMLInputElement | null = $state(null);
	let flashing = $state(false);

	const myPose = $derived(poseForPlayer(playerId, GAME_ID));
	const myPhoto = $derived(gameStore.photos.find((p) => p.player_id === playerId));
	const uploadedCount = $derived(gameStore.photos.length);
	const totalPlayers = $derived(gameStore.players.length);

	$effect(() => {
		if (myPhoto && status !== 'done') {
			status = 'done';
		}
	});

	$effect(() => {
		if (
			uploadedCount === totalPlayers &&
			totalPlayers > 0 &&
			playerId === gameStore.players[0]?.id
		) {
			void advancePhase('finish_photo').catch(() => {});
		}
	});

	async function openCamera() {
		errorMsg = null;
		status = 'starting';
		try {
			stream = await startCameraStream();
			if (videoEl) {
				videoEl.srcObject = stream;
				await videoEl.play();
			}
			status = 'preview';
		} catch (e) {
			console.error(e);
			errorMsg =
				'No pudimos abrir la cámara. Activa el permiso en el navegador o usa la galería.';
			status = 'error';
		}
	}

	async function takePhoto() {
		if (!videoEl) return;
		try {
			play('camera');
			flashing = true;
			setTimeout(() => (flashing = false), 250);
			const { blob, dataUrl } = await captureFrame(videoEl, true);
			preview = dataUrl;
			previewBlob = blob;
			stopStream(stream);
			stream = null;
			status = 'review';
		} catch (e) {
			console.error(e);
			stopStream(stream);
			stream = null;
			errorMsg = e instanceof Error ? `${e.message}. Probá de nuevo.` : 'Error capturando';
			status = 'error';
		}
	}

	async function retakePhoto() {
		preview = null;
		previewBlob = null;
		status = 'pose';
	}

	async function confirmPhoto() {
		if (!previewBlob) return;
		status = 'uploading';
		try {
			const compressed = await downscaleIfNeeded(previewBlob);
			await uploadPhoto({ playerId, blob: compressed });
			play('sparkle');
			status = 'done';
		} catch (e) {
			console.error(e);
			errorMsg = e instanceof Error ? e.message : 'Error subiendo la foto';
			status = 'error';
		}
	}

	async function useFallback(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;
		try {
			preview = URL.createObjectURL(file);
			previewBlob = file;
			status = 'review';
		} catch (err) {
			console.error(err);
			errorMsg = err instanceof Error ? err.message : 'Error abriendo la foto';
			status = 'error';
		}
	}

	function forceFinish() {
		void advancePhase('finish_photo', true).catch((e) => console.warn(e));
	}

	onDestroy(() => {
		stopStream(stream);
	});

	function colorFor(name: string) {
		return PLAYER_PALETTE.find((c) => c.name === name) ?? PLAYER_PALETTE[0];
	}
</script>

<div class="relative flex flex-1 flex-col gap-4 animate-fade-up">
	<AccentStickers variant={PHOTO_STICKERS} />

	<header class="text-center relative z-10">
		<div class="font-script text-pink-rose/80 text-sm">찰칵 ♡ tu reto</div>
		<h1 class="font-display text-2xl text-pink-deep inline-flex items-center gap-2">
			<Sparkle size={16} color="#E0668E" />
			foto del momento
			<Sparkle size={16} color="#E0668E" />
		</h1>
	</header>

	{#if status === 'pose' || status === 'starting'}
		<GlassCard padding="lg" glow>
			<div class="flex flex-col items-center gap-4 text-center">
				<div class="text-6xl animate-heartbeat">{myPose.emoji}</div>
				<p class="font-display text-pink-deep text-xl text-balance leading-snug">
					{myPose.prompt}
				</p>
				<p class="font-script text-pink-rose/80 text-sm max-w-xs">
					sin countdown, sin presión — tú decides cuándo disparar
				</p>
				{#if errorMsg}
					<p class="font-script text-pink-rose text-sm">{errorMsg}</p>
				{/if}
				<BowButton onclick={openCamera} disabled={status === 'starting'} size="md">
					<HeartIcon size={16} color="#FFFFFF" />
					{status === 'starting' ? 'abriendo cámara...' : 'abrir cámara'}
				</BowButton>
				<button
					type="button"
					onclick={() => fallbackInput?.click()}
					class="font-script text-pink-rose/80 text-sm underline no-tap"
				>
					o usar foto de la galería
				</button>
				<input
					bind:this={fallbackInput}
					type="file"
					accept="image/*"
					capture="user"
					class="hidden"
					onchange={useFallback}
				/>
			</div>
		</GlassCard>
	{:else if status === 'preview'}
		<!-- Recordatorio de pose, sticky arriba del video -->
		<div class="glass rounded-2xl px-4 py-2 text-center shadow-card">
			<div class="font-script text-pink-rose/90 text-xs">tu pose ♡</div>
			<div class="font-display text-pink-deep text-base text-balance leading-tight">
				{myPose.emoji} {myPose.prompt}
			</div>
		</div>
		<div class="relative rounded-3xl overflow-hidden shadow-glow">
			<video
				bind:this={videoEl}
				autoplay
				playsinline
				muted
				class="w-full aspect-[3/4] object-cover scale-x-[-1]"
			></video>
			<div
				class="pointer-events-none absolute inset-0 rounded-3xl ring-4 ring-pink-bubblegum/70"
			></div>
			<div class="absolute top-3 left-3 font-script text-pink-cream text-2xl drop-shadow">찰칵</div>
			<div class="absolute top-3 right-3"><Sparkle size={24} color="#FFF" /></div>
			{#if flashing}
				<div class="absolute inset-0 bg-white animate-fade-up pointer-events-none"></div>
			{/if}
		</div>
		<div class="flex justify-center">
			<BowButton onclick={takePhoto} size="md">
				<HeartIcon size={16} color="#FFFFFF" />
				tomar foto
			</BowButton>
		</div>
	{:else if status === 'review'}
		<div class="glass rounded-2xl px-4 py-2 text-center shadow-card">
			<div class="font-script text-pink-rose/90 text-xs">tu pose era ♡</div>
			<div class="font-display text-pink-deep text-sm text-balance leading-tight">
				{myPose.emoji} {myPose.prompt}
			</div>
		</div>
		{#if preview}
			<div class="rounded-3xl overflow-hidden shadow-glow relative">
				<img src={preview} alt="tu foto" class="w-full aspect-[3/4] object-cover" />
				<div class="absolute inset-0 rounded-3xl ring-4 ring-pink-bubblegum/60 pointer-events-none"></div>
			</div>
		{/if}
		<div class="flex gap-2 justify-center flex-wrap">
			<BowButton onclick={confirmPhoto} size="sm">
				<HeartIcon size={14} color="#FFFFFF" />
				¡esta me encanta!
			</BowButton>
			<BowButton onclick={retakePhoto} size="sm" variant="secondary" showBow={false}>
				<HeartIcon size={14} color="#E0668E" />
				tomar otra
			</BowButton>
		</div>
	{:else if status === 'uploading'}
		{#if preview}
			<div class="rounded-3xl overflow-hidden shadow-glow relative">
				<img src={preview} alt="tu foto" class="w-full aspect-[3/4] object-cover" />
				<div
					class="absolute inset-0 bg-pink-cloud/70 flex items-center justify-center backdrop-blur-sm"
				>
					<HeartLoader label="subiendo..." />
				</div>
			</div>
		{:else}
			<div class="flex flex-1 items-center justify-center">
				<HeartLoader label="subiendo..." />
			</div>
		{/if}
	{:else if status === 'done'}
		{#if preview}
			<div class="rounded-3xl overflow-hidden shadow-glow">
				<img src={preview} alt="tu foto" class="w-full aspect-[3/4] object-cover" />
			</div>
		{/if}
		<GlassCard padding="md" glow>
			<div class="text-center flex flex-col items-center gap-2">
				<div class="text-4xl">♡</div>
				<div class="font-script text-pink-rose text-xl">¡foto subida!</div>
				<div class="text-pink-deep/80 text-sm">
					esperando a las demás: {uploadedCount} de {totalPlayers}
				</div>
				<div class="flex flex-wrap gap-1.5 justify-center mt-1">
					{#each gameStore.players as p (p.id)}
						{@const c = colorFor(p.color)}
						{@const has = gameStore.photos.some((ph) => ph.player_id === p.id)}
						<PlayerAvatar
							initials={p.initials}
							colorBg={c.bg}
							colorFg={c.fg}
							colorRing={has ? '#FF8FB8' : '#FFE0EC'}
							size="xs"
							online={gameStore.presence.has(p.id)}
							ringActive={has}
						/>
					{/each}
				</div>
			</div>
		</GlassCard>
		{#if uploadedCount < totalPlayers}
			<SkipWaitingBanner
				visible={true}
				label="algunas todavía no suben foto..."
				onskip={forceFinish}
			/>
		{/if}
	{:else if status === 'error'}
		<GlassCard padding="md">
			<div class="text-center flex flex-col items-center gap-3">
				<div class="font-script text-pink-rose text-lg">algo salió mal</div>
				<p class="text-pink-berry/80 text-sm">{errorMsg}</p>
				<div class="flex gap-2">
					<BowButton onclick={openCamera} size="sm">
						<HeartIcon size={14} color="#FFFFFF" />
						probar de nuevo
					</BowButton>
					<BowButton
						onclick={() => fallbackInput?.click()}
						size="sm"
						variant="secondary"
						showBow={false}
					>
						<Sparkle size={12} color="#E0668E" />
						usar galería
					</BowButton>
				</div>
				<input
					bind:this={fallbackInput}
					type="file"
					accept="image/*"
					capture="user"
					class="hidden"
					onchange={useFallback}
				/>
			</div>
		</GlassCard>
	{/if}
</div>
