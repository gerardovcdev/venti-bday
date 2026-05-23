<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/state';
	import GlassCard from '$lib/components/GlassCard.svelte';
	import BowButton from '$lib/components/BowButton.svelte';
	import HeartIcon from '$lib/components/HeartIcon.svelte';
	import HeartLoader from '$lib/components/HeartLoader.svelte';
	import PlayerAvatar from '$lib/components/PlayerAvatar.svelte';
	import KittyDoodle from '$lib/components/KittyDoodle.svelte';
	import Sparkle from '$lib/components/Sparkle.svelte';
	import Confetti from '$lib/components/Confetti.svelte';
	import AccentStickers from '$lib/components/AccentStickers.svelte';
	import WrappedStories, {
		type StoryPanel
	} from '$lib/components/wrapped/WrappedStories.svelte';
	import WatermarkBadge from '$lib/components/wrapped/WatermarkBadge.svelte';
	import WatermarkHero from '$lib/components/wrapped/WatermarkHero.svelte';
	import BeachIcon from '$lib/components/BeachIcon.svelte';
	import { play } from '$lib/audio/sfx.svelte';
	import { summarizeWml } from '$lib/wrapped/stats';
	import { gameStore } from '$lib/stores/game.svelte';
	import { hasBackend } from '$lib/supabase/client';
	import { getPhotoPublicUrl } from '$lib/supabase/mutations';
	import { PLAYER_PALETTE } from '$lib/design/colors';
	import triviaData from '$lib/content/trivia.json';
	import wmlData from '$lib/content/whos_most_likely.json';

	const playerId = $derived(page.params.playerId ?? '');

	let loaded = $state(false);
	let exportBusy = $state<'png' | 'video' | null>(null);
	let exportMsg = $state<string | null>(null);
	let videoSupported = $state(false);
	let wrappedEl: HTMLDivElement | null = $state(null);
	let confetti = $state(false);
	let autoScroll = $state(false); // se activa después de las stories
	let reachedEnd = $state(false);
	let storiesActive = $state(true);
	let resumeTimer: ReturnType<typeof setTimeout> | null = null;
	let rafId: number | null = null;
	let lastTs = 0;
	let observer: IntersectionObserver | null = null;

	const SCROLL_SPEED_PX_PER_SEC = 28; // velocidad bajita tipo wrapped

	onMount(async () => {
		if (!gameStore.testMode && hasBackend()) {
			await gameStore.start();
		}
		loaded = true;
		try {
			const mod = await import('$lib/wrapped/canvas-share');
			videoSupported = mod.isVideoExportSupported();
		} catch {
			videoSupported = false;
		}

		// observer para animar secciones al entrar al viewport (scroll detalle)
		observer = new IntersectionObserver(
			(entries) => {
				for (const e of entries) {
					if (e.isIntersecting) {
						e.target.classList.add('section-in');
						observer?.unobserve(e.target);
					}
				}
			},
			{ threshold: 0.18, rootMargin: '0px 0px -8% 0px' }
		);
		setTimeout(() => {
			document
				.querySelectorAll('[data-wrapped-slide]')
				.forEach((el) => observer?.observe(el));
		}, 100);

		// Auto-scroll arranca solo después de las stories

		// pausa al interactuar
		const pauseAndResume = () => {
			autoScroll = false;
			if (resumeTimer) clearTimeout(resumeTimer);
			resumeTimer = setTimeout(() => {
				if (!reachedEnd) autoScroll = true;
			}, 3500);
		};
		window.addEventListener('wheel', pauseAndResume, { passive: true });
		window.addEventListener('touchstart', pauseAndResume, { passive: true });
		(window as unknown as { __wrappedPause: () => void }).__wrappedPause = pauseAndResume;
	});

	onDestroy(() => {
		if (rafId !== null) cancelAnimationFrame(rafId);
		if (resumeTimer) clearTimeout(resumeTimer);
		observer?.disconnect();
		if (typeof window !== 'undefined') {
			const w = window as unknown as { __wrappedPause?: () => void };
			if (w.__wrappedPause) {
				window.removeEventListener('wheel', w.__wrappedPause);
				window.removeEventListener('touchstart', w.__wrappedPause);
			}
		}
	});

	function startAutoScroll() {
		lastTs = 0;
		const tick = (ts: number) => {
			if (!lastTs) lastTs = ts;
			const dt = (ts - lastTs) / 1000;
			lastTs = ts;
			if (autoScroll && !reachedEnd) {
				const max = document.documentElement.scrollHeight - window.innerHeight;
				const next = Math.min(window.scrollY + SCROLL_SPEED_PX_PER_SEC * dt, max);
				window.scrollTo({ top: next });
				if (next >= max - 2) {
					reachedEnd = true;
					autoScroll = false;
					play('sparkle');
				}
			}
			rafId = requestAnimationFrame(tick);
		};
		rafId = requestAnimationFrame(tick);
	}

	function toggleAutoScroll() {
		autoScroll = !autoScroll;
		if (autoScroll && reachedEnd) {
			window.scrollTo({ top: 0, behavior: 'smooth' });
			reachedEnd = false;
		}
	}

	function tiltFor(i: number): string {
		const arr = [-6, 4, -3, 7, -5, 3, -8, 6, -2, 5];
		return `${arr[i % arr.length]}deg`;
	}

	const me = $derived(gameStore.playerById(playerId));
	const triviaById = new Map(triviaData.map((q) => [q.id, q] as const));
	const wmlById = new Map(wmlData.map((w) => [w.id, w] as const));

	const storyPanels = $derived.by<StoryPanel[]>(() => {
		if (!me) return [];
		const panels: StoryPanel[] = [];
		panels.push({ kind: 'hero-intro', duration: 5000 });
		panels.push({
			kind: 'hero-personal',
			duration: 4500,
			data: { player: me, photoUrl: photoUrl(me.id) }
		});

		const myCorrect = correctByPlayer.get(me.id) ?? 0;
		const myTotal = totalByPlayer.get(me.id) ?? 0;
		if (myTotal > 0) {
			panels.push({
				kind: 'stat-questions',
				duration: 4000,
				data: { correct: myCorrect, total: myTotal, player: me }
			});
		}

		if (winner) {
			const wp = gameStore.playerById(winner);
			if (wp) {
				panels.push({
					kind: 'reveal-cerebrito',
					duration: 5000,
					data: {
						player: wp,
						photoUrl: photoUrl(wp.id),
						correct: correctByPlayer.get(wp.id) ?? 0,
						total: totalByPlayer.get(wp.id) ?? 0
					}
				});
			}
		}

		if (despistado && despistado !== winner) {
			const dp = gameStore.playerById(despistado);
			if (dp) {
				panels.push({
					kind: 'reveal-despistada',
					duration: 4500,
					data: { player: dp, photoUrl: photoUrl(dp.id) }
				});
			}
		}

		if (hardestQuestion && hardestQuestion.q) {
			panels.push({
				kind: 'quote-hardest-q',
				duration: 6000,
				data: {
					question: hardestQuestion.q.question,
					answer: hardestQuestion.q.answer,
					wrong: hardestQuestion.wrong
				}
			});
		}

		const wmlAccents = ['ateez', 'rauw', 'percy', 'san', 'san2', 'gato-meme'];
		const topWml = wmlSummary.slice(0, 3);
		topWml.forEach((w, i) => {
			const wp = gameStore.playerById(w.winnerId);
			if (!wp) return;
			const tiedNames = w.tiedWith
				.map((id) => gameStore.playerById(id)?.name)
				.filter((n): n is string => !!n);
			panels.push({
				kind: 'wml-spotlight',
				duration: 5000,
				data: {
					prompt: w.prompt,
					winner: wp,
					photoUrl: photoUrl(wp.id),
					tiedNames,
					accentSticker: wmlAccents[i % wmlAccents.length]
				}
			});
		});

		if (myVotesReceived.length > 0) {
			panels.push({
				kind: 'personal-wml',
				duration: 5000,
				data: {
					player: me,
					prompts: myVotesReceived.map((v) => v.prompt ?? '').filter((s): s is string => !!s)
				}
			});
		}

		const totalVotes = gameStore.votes.length;
		if (totalVotes > 0) {
			panels.push({
				kind: 'stat-votes-cast',
				duration: 3800,
				data: { total: totalVotes }
			});
		}

		const photoItems = gameStore.players
			.map((p) => ({ player: p, photoUrl: photoUrl(p.id) }))
			.filter((x) => x.photoUrl);
		if (photoItems.length > 0) {
			panels.push({
				kind: 'collage-photos',
				duration: 5500,
				data: { items: photoItems }
			});
		}

		panels.push({ kind: 'beach-vibes', duration: 4500 });
		panels.push({
			kind: 'outro',
			duration: 6500,
			data: {
				items: gameStore.players.map((p) => ({ player: p, photoUrl: photoUrl(p.id) }))
			}
		});

		return panels;
	});

	function onStoriesFinish() {
		storiesActive = false;
		play('chime');
		setTimeout(() => {
			autoScroll = true;
			startAutoScroll();
		}, 200);
	}

	function onStoriesSkip() {
		storiesActive = false;
		autoScroll = false;
	}

	function colorFor(name: string) {
		return PLAYER_PALETTE.find((c) => c.name === name) ?? PLAYER_PALETTE[0];
	}

	const correctByPlayer = $derived.by(() => {
		const map = new Map<string, number>();
		for (const a of gameStore.answers) {
			if (a.is_correct) map.set(a.player_id, (map.get(a.player_id) ?? 0) + 1);
		}
		return map;
	});

	const totalByPlayer = $derived.by(() => {
		const map = new Map<string, number>();
		for (const a of gameStore.answers) {
			map.set(a.player_id, (map.get(a.player_id) ?? 0) + 1);
		}
		return map;
	});

	const winner = $derived.by(() => {
		let max = -1;
		let id: string | null = null;
		for (const [pid, count] of correctByPlayer) {
			if (count > max) {
				max = count;
				id = pid;
			}
		}
		return id;
	});

	const despistado = $derived.by(() => {
		let min = Infinity;
		let id: string | null = null;
		for (const p of gameStore.players) {
			const c = correctByPlayer.get(p.id) ?? 0;
			if (c < min) {
				min = c;
				id = p.id;
			}
		}
		return id;
	});

	const hardestQuestion = $derived.by(() => {
		const counts = new Map<string, { total: number; wrong: number }>();
		for (const a of gameStore.answers) {
			const cur = counts.get(a.question_id) ?? { total: 0, wrong: 0 };
			cur.total++;
			if (!a.is_correct) cur.wrong++;
			counts.set(a.question_id, cur);
		}
		let max = 0;
		let id: string | null = null;
		for (const [qid, c] of counts) {
			if (c.wrong > max) {
				max = c.wrong;
				id = qid;
			}
		}
		return id ? { id, wrong: max, q: triviaById.get(id) } : null;
	});

	const wmlSummary = $derived.by(() => {
		const roundIds = [...new Set(gameStore.votes.map((v) => v.round_id))];
		const items = summarizeWml(gameStore.votes, roundIds);
		return items
			.map((item) => ({
				prompt: wmlById.get(item.roundId)?.prompt ?? '',
				winnerId: item.winnerId,
				voters: item.voters,
				tiedWith: item.tiedWith,
				totalVotes: item.totalVotes
			}))
			.filter((x) => x.prompt)
			.slice(0, 6);
	});

	const myVotesReceived = $derived.by(() => {
		const rounds = gameStore.votes.filter((v) => v.voted_for_id === playerId);
		const byRound = new Map<string, string[]>();
		for (const v of rounds) {
			const arr = byRound.get(v.round_id) ?? [];
			arr.push(v.voter_id);
			byRound.set(v.round_id, arr);
		}
		return [...byRound.entries()]
			.map(([rid, voters]) => ({ prompt: wmlById.get(rid)?.prompt, voters }))
			.filter((x) => !!x.prompt)
			.slice(0, 3);
	});

	const photoUrl = $derived((pid: string) => {
		const p = gameStore.photos.find((x) => x.player_id === pid);
		if (!p) return null;
		// modo test: storage_path lleva un blob: o data: URL directo
		if (gameStore.testMode) {
			const sp = p.storage_path;
			if (sp.startsWith('blob:') || sp.startsWith('data:') || sp.startsWith('http')) {
				return sp;
			}
			return null;
		}
		if (!hasBackend()) return null;
		try {
			return getPhotoPublicUrl(p.storage_path);
		} catch {
			return null;
		}
	});

	function buildShareData() {
		if (!me) throw new Error('no hay jugador');
		const myColor = colorFor(me.color);
		const team = gameStore.players.map((p) => {
			const c = colorFor(p.color);
			return {
				id: p.id,
				name: p.name,
				initials: p.initials,
				photoUrl: photoUrl(p.id),
				color: { bg: c.bg, fg: c.fg, ring: c.ring }
			};
		});
		const myCorrect = correctByPlayer.get(me.id) ?? 0;
		const myTotal = totalByPlayer.get(me.id) ?? 0;
		const myVotes = myVotesReceived.length;
		// elegir el WML más relevante para el usuario: donde lo votaron a él si existe,
		// si no, el más popular del juego
		let highlight: { prompt: string; winnerName: string } | undefined;
		const mineAsWinner = wmlSummary.find((w) => w.winnerId === me.id);
		if (mineAsWinner) {
			highlight = { prompt: mineAsWinner.prompt, winnerName: me.name };
		} else if (wmlSummary.length > 0) {
			const top = wmlSummary[0];
			const wp = gameStore.playerById(top.winnerId);
			if (wp) highlight = { prompt: top.prompt, winnerName: wp.name };
		}
		return {
			me: {
				id: me.id,
				name: me.name,
				initials: me.initials,
				photoUrl: photoUrl(me.id),
				color: { bg: myColor.bg, fg: myColor.fg, ring: myColor.ring }
			},
			team,
			stats: {
				correct: myCorrect,
				total: myTotal,
				votesReceived: myVotes
			},
			highlight,
			hardestQuestion: hardestQuestion?.q
				? { question: hardestQuestion.q.question, answer: hardestQuestion.q.answer }
				: undefined
		};
	}

	async function shareOrDownload(blob: Blob, filename: string, mime: string, title: string) {
		const file = new File([blob], filename, { type: mime });
		if (navigator.share && navigator.canShare?.({ files: [file] })) {
			try {
				await navigator.share({ files: [file], title });
				return;
			} catch (err) {
				// si el usuario canceló, no descargar
				const msg = err instanceof Error ? err.message : '';
				if (/abort|cancel/i.test(msg)) return;
			}
		}
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		a.click();
		URL.revokeObjectURL(url);
	}

	async function exportPng() {
		if (exportBusy) return;
		exportBusy = 'png';
		exportMsg = 'creando tu imagen ♡';
		try {
			const { buildShareImage } = await import('$lib/wrapped/canvas-share');
			const data = buildShareData();
			const { blob, mime } = await buildShareImage(data);
			await shareOrDownload(blob, 'venti-wrapped.png', mime, 'Venti b-day wrapped ♡');
			exportMsg = '¡imagen lista! ♡';
		} catch (e) {
			console.error(e);
			exportMsg = 'no se pudo guardar la imagen, probá de nuevo';
		} finally {
			exportBusy = null;
		}
	}

	async function exportVideo() {
		if (exportBusy) return;
		exportBusy = 'video';
		exportMsg = 'grabando tu video... esto tarda ~25s ♡';
		try {
			const { buildShareVideo } = await import('$lib/wrapped/canvas-share');
			const data = buildShareData();
			const { blob, mime, extension } = await buildShareVideo(data, (ratio) => {
				const pct = Math.min(99, Math.round(ratio * 100));
				exportMsg = `grabando... ${pct}% ♡`;
			});
			const filename = `venti-wrapped.${extension}`;
			await shareOrDownload(blob, filename, mime, 'Venti b-day wrapped ♡');
			exportMsg = '¡video listo! ♡';
		} catch (e) {
			console.error(e);
			const msg = e instanceof Error ? e.message : '';
			if (msg.includes('no soporta')) {
				exportMsg = 'tu navegador no soporta video, prueba la imagen ♡';
			} else {
				exportMsg = 'no se pudo crear el video, probá la imagen';
			}
		} finally {
			exportBusy = null;
		}
	}
</script>

<Confetti visible={confetti} />

{#if !loaded}
	<div class="flex flex-1 items-center justify-center">
		<HeartLoader label="cargando tu wrapped..." />
	</div>
{:else if !me}
	<div class="flex flex-1 items-center justify-center text-center">
		<GlassCard padding="lg">
			<p class="font-script text-pink-deep">no encontramos tu wrapped ♡</p>
		</GlassCard>
	</div>
{:else}
	{#if storiesActive && storyPanels.length > 0}
		<WrappedStories
			panels={storyPanels}
			onfinish={onStoriesFinish}
			onskip={onStoriesSkip}
		/>
	{/if}

	<div bind:this={wrappedEl} class="relative flex flex-1 flex-col gap-6 pb-32">
		<AccentStickers variant="wrapped" />

		<!-- Watermark hero al inicio del scroll detail -->
		<div class="relative z-10 flex flex-col items-center pt-4 pb-2">
			<WatermarkHero />
			<p class="font-script text-pink-deep/70 text-xs mt-1">resumen completo ↓</p>
		</div>
		<!-- Cover -->
		<section data-wrapped-slide class="wslide wslide-scale flex flex-col items-center text-center gap-3 pt-4">
			<div class="font-script text-pink-rose text-2xl">venti b-day ♡ wrapped</div>
			<h1
				class="font-display text-5xl text-transparent bg-clip-text bg-gradient-to-r from-pink-rose via-pink-deep to-pink-rose"
			>
				{me.name}
			</h1>
			<div class="font-script text-pink-deep/70 text-lg">tu resumen lindo</div>
			{#if photoUrl(me.id)}
				<img
					src={photoUrl(me.id)}
					alt="tu foto"
					class="w-40 aspect-square object-cover rounded-3xl shadow-glow ring-4 ring-pink-bubblegum"
				/>
			{:else}
				{@const c = colorFor(me.color)}
				<PlayerAvatar
					initials={me.initials}
					colorBg={c.bg}
					colorFg={c.fg}
					colorRing={c.ring}
					size="xl"
				/>
			{/if}
		</section>

		<!-- Equipo -->
		<section data-wrapped-slide class="wslide wslide-right">
			<GlassCard padding="md">
				<div class="text-center mb-3">
					<div class="font-script text-pink-rose">el equipo de la fiesta</div>
					<div class="font-display text-pink-deep text-xl">
						{gameStore.players.length} {gameStore.players.length === 1 ? 'persona linda' : 'personas lindas'}
					</div>
				</div>
				<div class="flex flex-wrap gap-3 justify-center">
					{#each gameStore.players as p (p.id)}
						{@const c = colorFor(p.color)}
						<div class="flex flex-col items-center gap-1">
							{#if photoUrl(p.id)}
								<img
									src={photoUrl(p.id)}
									alt={p.name}
									class="w-14 h-14 object-cover rounded-full ring-2"
									style="--tw-ring-color: {c.ring};"
								/>
							{:else}
								<PlayerAvatar
									initials={p.initials}
									colorBg={c.bg}
									colorFg={c.fg}
									colorRing={c.ring}
									size="sm"
								/>
							{/if}
							<span class="text-[10px] text-pink-berry/80 truncate max-w-[60px]">{p.name}</span>
						</div>
					{/each}
				</div>
			</GlassCard>
		</section>

		<!-- Cerebrito -->
		{#if winner}
			{@const wp = gameStore.playerById(winner)}
			{#if wp}
				{@const c = colorFor(wp.color)}
				<section data-wrapped-slide class="wslide wslide-left">
					<GlassCard padding="md" glow>
						<div class="flex flex-col items-center gap-2 text-center">
							<Sparkle size={20} color="#E0668E" />
							<div class="font-script text-pink-rose text-lg">la cerebrito ♡</div>
							<PlayerAvatar
								initials={wp.initials}
								colorBg={c.bg}
								colorFg={c.fg}
								colorRing={c.ring}
								size="lg"
							/>
							<div class="font-display text-2xl text-pink-deep">{wp.name}</div>
							<div class="text-pink-berry/80 text-sm">
								{correctByPlayer.get(winner) ?? 0} de {totalByPlayer.get(winner) ?? 0} correctas
							</div>
						</div>
					</GlassCard>
				</section>
			{/if}
		{/if}

		<!-- Despistado -->
		{#if despistado && despistado !== winner}
			{@const dp = gameStore.playerById(despistado)}
			{#if dp}
				{@const c = colorFor(dp.color)}
				<section data-wrapped-slide class="wslide wslide-right">
					<GlassCard padding="md">
						<div class="flex flex-col items-center gap-2 text-center">
							<div class="font-script text-pink-rose text-lg">la más despistada (con amor)</div>
							<PlayerAvatar
								initials={dp.initials}
								colorBg={c.bg}
								colorFg={c.fg}
								colorRing={c.ring}
								size="lg"
							/>
							<div class="font-display text-2xl text-pink-deep">{dp.name}</div>
							<div class="text-pink-berry/80 text-sm">
								{correctByPlayer.get(despistado) ?? 0} correctas, pero todo bien ♡
							</div>
						</div>
					</GlassCard>
				</section>
			{/if}
		{/if}

		<!-- Hardest -->
		{#if hardestQuestion}
			<section data-wrapped-slide class="wslide wslide-left">
				<GlassCard padding="md">
					<div class="text-center">
						<div class="font-script text-pink-rose">la más difícil</div>
						<p class="font-display text-pink-deep mt-1 text-balance">
							{hardestQuestion.q?.question}
						</p>
						<div class="font-script text-pink-rose mt-2 text-sm">
							la falló {hardestQuestion.wrong} {hardestQuestion.wrong === 1 ? 'persona' : 'personas'}
						</div>
						<div class="font-display text-pink-bubblegum text-lg mt-1">
							respuesta: {hardestQuestion.q?.answer}
						</div>
					</div>
				</GlassCard>
			</section>
		{/if}

		<!-- WML highlights -->
		{#if wmlSummary.length > 0}
			<section data-wrapped-slide class="wslide wslide-right">
				<GlassCard padding="md">
					<div class="font-script text-pink-rose text-center text-lg mb-3">
						los momentos picantes ♡
					</div>
					<ul class="flex flex-col gap-3">
						{#each wmlSummary as w (w.prompt)}
							{@const wp = gameStore.playerById(w.winnerId)}
							{#if wp}
								{@const c = colorFor(wp.color)}
								{@const tiedNames = w.tiedWith
									.map((id) => gameStore.playerById(id)?.name)
									.filter(Boolean)}
								<li class="flex items-center gap-3 bg-white/40 rounded-2xl p-2.5">
									<PlayerAvatar
										initials={wp.initials}
										colorBg={c.bg}
										colorFg={c.fg}
										colorRing={c.ring}
										size="md"
									/>
									<div class="flex-1 min-w-0">
										<p class="text-pink-berry/90 text-xs leading-tight text-balance">
											{w.prompt}
										</p>
										<p class="font-display text-pink-deep text-sm mt-0.5 truncate">
											→ {wp.name}
										</p>
										{#if tiedNames.length > 0}
											<p class="font-script text-pink-rose/70 text-[10px] leading-tight">
												empate con {tiedNames.join(', ')}
											</p>
										{/if}
										<div class="flex gap-0.5 mt-1">
											{#each w.voters as vid}
												{@const v = gameStore.playerById(vid)}
												{#if v}
													{@const vc = colorFor(v.color)}
													<span
														class="inline-flex items-center justify-center rounded-full text-[8px] font-bold h-4 w-4"
														style="background:{vc.bg}; color:{vc.fg};"
													>
														{v.initials.slice(0, 2)}
													</span>
												{/if}
											{/each}
										</div>
									</div>
								</li>
							{/if}
						{/each}
					</ul>
				</GlassCard>
			</section>
		{/if}

		<!-- Personal: tus votos -->
		{#if myVotesReceived.length > 0}
			<section data-wrapped-slide class="wslide wslide-left">
				<GlassCard padding="md" glow>
					<div class="text-center">
						<div class="font-script text-pink-rose">tu momento ♡</div>
						<p class="font-display text-pink-deep text-lg mt-1">
							te votaron en {myVotesReceived.length} {myVotesReceived.length === 1 ? 'categoría' : 'categorías'}
						</p>
					</div>
					<ul class="flex flex-col gap-2 mt-3">
						{#each myVotesReceived as v (v.prompt)}
							<li class="bg-white/40 rounded-2xl p-2 text-xs text-pink-berry text-balance text-center">
								{v.prompt}
							</li>
						{/each}
					</ul>
				</GlassCard>
			</section>
		{/if}

		<!-- Photos polaroid mosaic -->
		{#if gameStore.photos.length > 0}
			<section data-wrapped-slide class="wslide wslide-scale">
				<GlassCard padding="md">
					<div class="font-script text-pink-rose text-center text-lg mb-4">
						los recuerdos del día ♡
					</div>
					<div class="relative min-h-[260px] py-4">
						{#each gameStore.players as p, i (p.id)}
							{@const url = photoUrl(p.id)}
							{#if url}
								<div
									class="absolute left-1/2 top-1/2 origin-center shadow-glow transition"
									style="transform: translate(-50%, -50%) translateX({((i % 3) - 1) * 70}px) translateY({(Math.floor(i / 3) - 0.5) * 90}px) rotate({tiltFor(i)});"
								>
									<div class="bg-white p-1.5 pb-5 rounded-sm relative" style="width: 100px;">
										<img src={url} alt={p.name} class="w-full aspect-square object-cover" />
										<span
											class="absolute bottom-1 left-0 right-0 text-center font-script text-pink-deep text-xs"
										>
											{p.name}
										</span>
									</div>
								</div>
							{/if}
						{/each}
					</div>
				</GlassCard>
			</section>
		{/if}

		<!-- Beach vibes -->
		<section data-wrapped-slide class="wslide wslide-scale">
			<div
				class="relative rounded-3xl overflow-hidden shadow-glow p-6"
				style="background: linear-gradient(180deg, #C7E3FF 0%, #FFE8C0 100%);"
			>
				<div class="absolute top-3 right-3">
					<BeachIcon variant="sun" size={56} />
				</div>
				<div class="absolute top-2 left-2 opacity-90">
					<BeachIcon variant="palm" size={64} />
				</div>
				<div class="absolute bottom-3 left-3">
					<BeachIcon variant="umbrella" size={48} />
				</div>
				<div class="absolute bottom-4 right-4">
					<BeachIcon variant="starfish" size={40} />
				</div>
				<div class="absolute bottom-12 right-1/3 opacity-90">
					<BeachIcon variant="shell" size={36} />
				</div>
				<div class="text-center py-8">
					<div class="font-script text-pink-deep text-lg">y todo esto pasó...</div>
					<h2 class="font-display text-4xl text-transparent bg-clip-text bg-gradient-to-r from-pink-rose to-pink-deep">
						en la playa ♡
					</h2>
					<div class="font-script text-pink-deep/80 text-sm mt-2">sol, mar y cumpleaños</div>
				</div>
			</div>
		</section>

		<!-- Outro -->
		<section data-wrapped-slide class="wslide wslide-scale">
			<GlassCard padding="lg" glow>
				<div class="text-center flex flex-col items-center gap-3">
					<div class="flex items-center justify-center gap-2 opacity-80">
						<BeachIcon variant="sun" size={32} />
						<BeachIcon variant="wave" size={48} />
						<BeachIcon variant="palm" size={32} />
					</div>
					<div class="font-script text-pink-rose text-xl">para Venti, con todo el cariño</div>
					<h2 class="font-display text-3xl text-pink-deep">¡feliz cumpleaños! ♡</h2>
					<div class="font-script text-pink-deep/70 text-sm">사랑해</div>
				</div>
			</GlassCard>
		</section>

		<!-- Watermark final del scroll detail -->
		<div class="relative z-10 flex flex-col items-center gap-1 pt-4 pb-2">
			<WatermarkHero />
			<p class="font-script text-pink-deep/60 text-xs">venti b-day ♡ 2026</p>
		</div>

		<!-- Watermark badge esquina (siempre visible, sobrevive en exports) -->
		<WatermarkBadge position="bottom-right" />
	</div>

	<!-- Floating play/pause toggle del scroll-detail (oculto durante stories) -->
	{#if !storiesActive && !reachedEnd}
		<button
			type="button"
			onclick={toggleAutoScroll}
			aria-label={autoScroll ? 'pausar' : 'reproducir'}
			data-export-hide
			class="fixed top-3 left-3 z-30 h-9 w-9 rounded-full glass shadow-card flex items-center justify-center no-tap active:scale-95 transition"
		>
			{#if autoScroll}
				<svg width="14" height="14" viewBox="0 0 24 24" fill="#E0668E">
					<rect x="6" y="5" width="4" height="14" rx="1" />
					<rect x="14" y="5" width="4" height="14" rx="1" />
				</svg>
			{:else}
				<svg width="14" height="14" viewBox="0 0 24 24" fill="#E0668E">
					<path d="M8 5 L19 12 L8 19 Z" />
				</svg>
			{/if}
		</button>
	{/if}

	<!-- Export buttons fixed (oculto durante stories) -->
	{#if !storiesActive}
	<div
		data-export-hide
		class="fixed bottom-0 left-0 right-0 z-20 px-5 pb-6 pt-3 backdrop-blur-md bg-pink-cream/80 border-t border-pink-blush/60 transition-all duration-500 {reachedEnd
			? 'pb-7 pt-4 shadow-glow'
			: ''}"
	>
		<div class="mx-auto max-w-md flex flex-col gap-2">
			{#if reachedEnd}
				<p class="font-script text-pink-rose text-base text-center animate-fade-up">
					guarda o comparte tu wrapped ♡
				</p>
			{/if}
			{#if exportMsg}
				<p class="font-script text-pink-rose text-sm text-center">{exportMsg}</p>
			{/if}
			<div class="flex gap-2 justify-center flex-wrap">
				<BowButton
					onclick={exportPng}
					disabled={exportBusy !== null}
					size="sm"
					showBow={reachedEnd}
					variant="primary"
				>
					<HeartIcon size={14} color="#FFFFFF" />
					{exportBusy === 'png' ? 'guardando...' : 'guardar imagen'}
				</BowButton>
				{#if videoSupported}
					<BowButton
						onclick={exportVideo}
						disabled={exportBusy !== null}
						size="sm"
						showBow={false}
						variant="secondary"
					>
						<Sparkle size={14} color="#E0668E" />
						{exportBusy === 'video' ? 'grabando...' : 'guardar video'}
					</BowButton>
				{/if}
				{#if reachedEnd}
					<BowButton
						onclick={toggleAutoScroll}
						size="sm"
						showBow={false}
						variant="ghost"
					>
						<HeartIcon size={12} color="#E0668E" />
						ver otra vez
					</BowButton>
				{/if}
			</div>
		</div>
	</div>
	{/if}
{/if}

<style>
	/* Watermark "venti b-day ♡" en cada slide del scroll detail — se exporta naturalmente */
	:global(section[data-wrapped-slide]) {
		position: relative;
	}
	:global(section[data-wrapped-slide])::after {
		content: 'venti b-day ♡';
		position: absolute;
		bottom: 6px;
		right: 10px;
		font-family: 'Nanum Pen Script', 'Caveat', 'Brush Script MT', cursive;
		font-style: italic;
		color: #E0668E;
		font-size: 10px;
		opacity: 0.6;
		pointer-events: none;
		text-shadow: 0 1px 2px rgba(255, 255, 255, 0.85);
		z-index: 5;
		letter-spacing: 0.02em;
	}
	.wslide {
		opacity: 0;
		will-change: transform, opacity;
		transition:
			opacity 0.7s cubic-bezier(0.2, 0.7, 0.3, 1),
			transform 0.7s cubic-bezier(0.2, 0.7, 0.3, 1);
	}
	.wslide-left {
		transform: translateX(-32px);
	}
	.wslide-right {
		transform: translateX(32px);
	}
	.wslide-scale {
		transform: scale(0.92);
	}
	.wslide:global(.section-in) {
		opacity: 1;
		transform: translateX(0) scale(1);
	}
	@media (prefers-reduced-motion: reduce) {
		.wslide {
			transition: opacity 0.3s ease;
			transform: none !important;
		}
	}
</style>
