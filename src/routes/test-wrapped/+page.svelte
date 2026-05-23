<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import GlassCard from '$lib/components/GlassCard.svelte';
	import BowButton from '$lib/components/BowButton.svelte';
	import HeartIcon from '$lib/components/HeartIcon.svelte';
	import Sparkle from '$lib/components/Sparkle.svelte';
	import HeartLoader from '$lib/components/HeartLoader.svelte';
	import PlayerAvatar from '$lib/components/PlayerAvatar.svelte';
	import { PLAYER_PALETTE, getInitials } from '$lib/design/colors';
	import { startCameraStream, stopStream, captureFrame } from '$lib/camera/capture';
	import { poseForPlayer } from '$lib/wrapped/poses';
	import { play } from '$lib/audio/sfx.svelte';
	import { gameStore } from '$lib/stores/game.svelte';
	import triviaData from '$lib/content/trivia.json';
	import wmlData from '$lib/content/whos_most_likely.json';
	import { GAME_ID } from '$lib/config';
	import type { Game, Player, TriviaAnswer, WmlVote, Photo } from '$lib/supabase/types';

	const FAKE_NAMES = ['Sofi', 'Lulu', 'Cami', 'Vale'];
	// "me" + 4 fakes = 5 players. Cada uno toma 1 foto = 5 fotos en total.

	function randomId(): string {
		if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
		return Math.random().toString(36).slice(2) + Date.now().toString(36);
	}

	type Subject = {
		id: string;
		name: string;
		initials: string;
		colorName: string;
		isMe: boolean;
	};

	type Status =
		| 'intro'
		| 'pose'
		| 'starting'
		| 'preview'
		| 'review'
		| 'building'
		| 'error';

	const subjects: Subject[] = (() => {
		const meName = 'Tú (prueba)';
		const meColor = PLAYER_PALETTE[0].name;
		const arr: Subject[] = [
			{
				id: randomId(),
				name: meName,
				initials: getInitials(meName),
				colorName: meColor,
				isMe: true
			}
		];
		FAKE_NAMES.forEach((n, i) => {
			arr.push({
				id: randomId(),
				name: n,
				initials: getInitials(n),
				colorName: PLAYER_PALETTE[(i + 1) % PLAYER_PALETTE.length].name,
				isMe: false
			});
		});
		return arr;
	})();

	let status = $state<Status>('intro');
	let currentIdx = $state(0);
	let videoEl: HTMLVideoElement | null = $state(null);
	let stream: MediaStream | null = $state(null);
	let preview = $state<string | null>(null);
	let previewBlob: Blob | null = null;
	let errorMsg = $state<string | null>(null);
	let fallbackInput: HTMLInputElement | null = $state(null);
	let flashing = $state(false);
	let buildMsg = $state('mezclando datos...');

	const capturedPhotos = new Map<string, { blobUrl: string }>();

	const currentSubject = $derived(subjects[currentIdx]);
	const currentPose = $derived(
		currentSubject ? poseForPlayer(currentSubject.id, GAME_ID) : null
	);

	function colorFor(name: string) {
		return PLAYER_PALETTE.find((c) => c.name === name) ?? PLAYER_PALETTE[0];
	}

	async function openCamera() {
		errorMsg = null;
		status = 'starting';
		try {
			const s = await startCameraStream();
			status = 'preview';
			stream = s;
		} catch (e) {
			console.error(e);
			errorMsg =
				'No pudimos abrir la cámara. Activa el permiso o usa una foto de la galería.';
			status = 'pose';
		}
	}

	$effect(() => {
		if (stream && videoEl && status === 'preview') {
			if (videoEl.srcObject !== stream) {
				videoEl.srcObject = stream;
				const p = videoEl.play();
				if (p) p.catch(() => {});
			}
		}
	});

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
			status = 'pose';
		}
	}

	function retake() {
		preview = null;
		previewBlob = null;
		status = 'pose';
	}

	function confirmPhoto() {
		if (!previewBlob) return;
		const url = URL.createObjectURL(previewBlob);
		capturedPhotos.set(currentSubject.id, { blobUrl: url });
		play('sparkle');
		preview = null;
		previewBlob = null;
		if (currentIdx + 1 >= subjects.length) {
			void buildAndGoToWrapped();
		} else {
			currentIdx = currentIdx + 1;
			status = 'pose';
		}
	}

	function useFallback(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;
		preview = URL.createObjectURL(file);
		previewBlob = file;
		status = 'review';
	}

	async function buildAndGoToWrapped() {
		status = 'building';
		buildMsg = 'creando jugadores...';
		const now = new Date().toISOString();

		const players: Player[] = subjects.map((s) => ({
			id: s.id,
			game_id: GAME_ID,
			name: s.name,
			initials: s.initials,
			color: s.colorName,
			is_ready: true,
			joined_at: now,
			last_seen_at: now
		}));

		buildMsg = 'inventando respuestas locas...';
		await new Promise((r) => setTimeout(r, 200));

		const answers: TriviaAnswer[] = [];
		const meSubject = subjects.find((s) => s.isMe)!;
		for (const q of triviaData) {
			for (const s of subjects) {
				let answer: string;
				let isCorrect: boolean;
				if (q.type === 'multiple' && Array.isArray(q.options)) {
					const opt = q.options[Math.floor(Math.random() * q.options.length)];
					// el "me" gana más seguido para que el cerebrito sea él
					const correctRoll = s.isMe ? Math.random() < 0.75 : Math.random() < 0.45;
					answer = correctRoll ? q.answer : opt;
					isCorrect = answer === q.answer;
				} else {
					const guesses = ['Japón', 'Corea', 'París', 'Tailandia', 'Disney', 'Italia'];
					answer = guesses[Math.floor(Math.random() * guesses.length)];
					isCorrect = Math.random() < (s.isMe ? 0.6 : 0.3);
				}
				answers.push({
					player_id: s.id,
					question_id: q.id,
					answer,
					is_correct: isCorrect,
					answered_at: now
				});
			}
		}

		buildMsg = 'simulando los votos desgraciados...';
		await new Promise((r) => setTimeout(r, 200));

		const votes: WmlVote[] = [];
		for (const w of wmlData) {
			for (const voter of subjects) {
				const others = subjects.filter((s) => s.id !== voter.id);
				const target = others[Math.floor(Math.random() * others.length)];
				votes.push({
					voter_id: voter.id,
					round_id: w.id,
					voted_for_id: target.id,
					voted_at: now
				});
			}
		}

		buildMsg = 'pegando tus fotos...';
		await new Promise((r) => setTimeout(r, 200));

		const photos: Photo[] = [];
		for (const s of subjects) {
			const cap = capturedPhotos.get(s.id);
			if (cap) {
				photos.push({
					player_id: s.id,
					storage_path: cap.blobUrl,
					uploaded_at: now
				});
			}
		}

		const game: Game = {
			id: GAME_ID,
			phase: 'wrapped',
			current_round: 0,
			reveal: true,
			started_at: now,
			finished_at: now,
			config: {
				trivia_order: triviaData.map((q) => q.id),
				wml_order: wmlData.map((w) => w.id),
				num_trivia: triviaData.length,
				num_wml: wmlData.length,
				intro_phase: null
			}
		};

		gameStore.seedTest({ game, players, answers, votes, photos });

		buildMsg = '¡listo! ♡';
		await new Promise((r) => setTimeout(r, 250));
		await goto(`/wrapped/${meSubject.id}`);
	}

	onDestroy(() => {
		stopStream(stream);
	});

	onMount(() => {
		// limpia cualquier seed previa si vuelves al test
		if (gameStore.testMode) gameStore.clearTest();
	});
</script>

<div class="relative flex flex-1 flex-col gap-4 animate-fade-up">
	<header class="text-center relative z-10">
		<div class="font-script text-pink-rose/80 text-sm">prueba ♡ modo wrapped</div>
		<h1 class="font-display text-2xl text-pink-deep inline-flex items-center gap-2">
			<Sparkle size={16} color="#4F8FD0" />
			test wrapped
			<Sparkle size={16} color="#4F8FD0" />
		</h1>
		{#if status !== 'intro' && status !== 'building'}
			<p class="font-script text-pink-rose/80 text-xs mt-1">
				foto {currentIdx + 1} de {subjects.length}
			</p>
		{/if}
	</header>

	{#if status === 'intro'}
		<GlassCard padding="lg" glow>
			<div class="flex flex-col items-center gap-3 text-center">
				<div class="text-4xl">📸</div>
				<p class="font-display text-pink-deep text-lg text-balance">
					vamos a tomar 5 fotos rápidas para simular el wrapped
				</p>
				<p class="font-script text-pink-rose/80 text-sm max-w-xs text-balance">
					una foto por cada jugadora (incluyéndote). El resto (trivia, votos)
					lo inventamos al azar. solo para probar.
				</p>
				<div class="flex flex-wrap gap-2 justify-center mt-1">
					{#each subjects as s (s.id)}
						{@const c = colorFor(s.colorName)}
						<div class="flex flex-col items-center gap-1">
							<PlayerAvatar
								initials={s.initials}
								colorBg={c.bg}
								colorFg={c.fg}
								colorRing={c.ring}
								size="sm"
							/>
							<span class="text-[10px] text-pink-berry/80 truncate max-w-[60px]">{s.name}</span>
						</div>
					{/each}
				</div>
				<BowButton onclick={() => (status = 'pose')} size="md">
					<HeartIcon size={16} color="#FFFFFF" />
					empezar
				</BowButton>
			</div>
		</GlassCard>
	{:else if status === 'pose' || status === 'starting'}
		<GlassCard padding="lg" glow>
			<div class="flex flex-col items-center gap-3 text-center">
				{#if currentSubject}
					{@const c = colorFor(currentSubject.colorName)}
					<PlayerAvatar
						initials={currentSubject.initials}
						colorBg={c.bg}
						colorFg={c.fg}
						colorRing={c.ring}
						size="md"
					/>
					<div class="font-display text-pink-deep text-lg">
						foto de <b>{currentSubject.name}</b>
					</div>
				{/if}
				{#if currentPose}
					<div class="text-5xl animate-heartbeat">{currentPose.emoji}</div>
					<p class="font-display text-pink-deep text-base text-balance leading-snug">
						{currentPose.prompt}
					</p>
				{/if}
				{#if errorMsg}
					<p class="font-script text-pink-rose text-sm">{errorMsg}</p>
				{/if}
				<BowButton onclick={openCamera} disabled={status === 'starting'} size="md">
					<HeartIcon size={16} color="#FFFFFF" />
					{status === 'starting' ? 'abriendo...' : 'abrir cámara'}
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
		{#if currentPose && currentSubject}
			<div class="glass rounded-2xl px-4 py-2 text-center shadow-card">
				<div class="font-script text-pink-rose/90 text-xs">
					pose de {currentSubject.name} ♡
				</div>
				<div class="font-display text-pink-deep text-base text-balance leading-tight">
					{currentPose.emoji} {currentPose.prompt}
				</div>
			</div>
		{/if}
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
		{#if preview}
			<div class="rounded-3xl overflow-hidden shadow-glow relative">
				<img src={preview} alt="preview" class="w-full aspect-[3/4] object-cover" />
				<div
					class="absolute inset-0 rounded-3xl ring-4 ring-pink-bubblegum/60 pointer-events-none"
				></div>
			</div>
		{/if}
		<div class="flex gap-2 justify-center flex-wrap">
			<BowButton onclick={confirmPhoto} size="sm">
				<HeartIcon size={14} color="#FFFFFF" />
				{currentIdx + 1 >= subjects.length ? 'crear wrapped ♡' : 'siguiente'}
			</BowButton>
			<BowButton onclick={retake} size="sm" variant="secondary" showBow={false}>
				<HeartIcon size={14} color="#4F8FD0" />
				otra
			</BowButton>
		</div>
	{:else if status === 'building'}
		<div class="flex flex-1 items-center justify-center">
			<HeartLoader label={buildMsg} />
		</div>
	{/if}
</div>
