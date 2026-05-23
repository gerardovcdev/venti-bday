<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { play } from '$lib/audio/sfx.svelte';
	import type { Player } from '$lib/supabase/types';
	import HeartIcon from '$lib/components/HeartIcon.svelte';
	import Sparkle from '$lib/components/Sparkle.svelte';
	import PlayerAvatar from '$lib/components/PlayerAvatar.svelte';
	import Sticker from '$lib/components/Sticker.svelte';
	import Confetti from '$lib/components/Confetti.svelte';
	import StoryProgressBar from './StoryProgressBar.svelte';
	import StoryPhotoBg from './StoryPhotoBg.svelte';
	import StickerExplosion from './StickerExplosion.svelte';
	import WatermarkBadge from './WatermarkBadge.svelte';
	import WatermarkHero from './WatermarkHero.svelte';
	import { PLAYER_PALETTE } from '$lib/design/colors';
	import { sticker } from '$lib/design/stickers-manifest';
	import BeachIcon from '$lib/components/BeachIcon.svelte';

	export type StoryPanel =
		| { kind: 'hero-intro'; duration: number }
		| {
				kind: 'hero-personal';
				duration: number;
				data: { player: Player; photoUrl: string | null };
		  }
		| {
				kind: 'stat-questions';
				duration: number;
				data: { correct: number; total: number; player: Player };
		  }
		| {
				kind: 'reveal-cerebrito';
				duration: number;
				data: { player: Player; photoUrl: string | null; correct: number; total: number };
		  }
		| {
				kind: 'reveal-despistada';
				duration: number;
				data: { player: Player; photoUrl: string | null };
		  }
		| {
				kind: 'quote-hardest-q';
				duration: number;
				data: { question: string; answer: string; wrong: number };
		  }
		| {
				kind: 'wml-spotlight';
				duration: number;
				data: {
					prompt: string;
					winner: Player;
					photoUrl: string | null;
					tiedNames: string[];
					accentSticker: string;
				};
		  }
		| {
				kind: 'personal-wml';
				duration: number;
				data: { prompts: string[]; player: Player };
		  }
		| { kind: 'stat-votes-cast'; duration: number; data: { total: number } }
		| {
				kind: 'collage-photos';
				duration: number;
				data: { items: Array<{ player: Player; photoUrl: string | null }> };
		  }
		| { kind: 'beach-vibes'; duration: number }
		| {
				kind: 'outro';
				duration: number;
				data: { items: Array<{ player: Player; photoUrl: string | null }> };
		  };

	let {
		panels,
		onfinish,
		onskip
	}: {
		panels: StoryPanel[];
		onfinish?: () => void;
		onskip?: () => void;
	} = $props();

	let currentIndex = $state(0);
	let progress = $state(0);
	let isPaused = $state(false);
	let confettiVisible = $state(false);
	let pressTimer: ReturnType<typeof setTimeout> | null = null;
	let rafId: number | null = null;
	let panelStartedAt = 0;
	let elapsedAtPause = 0;

	const current = $derived(panels[currentIndex] ?? null);

	function colorFor(name: string) {
		return PLAYER_PALETTE.find((c) => c.name === name) ?? PLAYER_PALETTE[0];
	}

	function startTick() {
		stopTick();
		panelStartedAt = performance.now() - elapsedAtPause;
		const tick = (now: number) => {
			if (isPaused) {
				rafId = requestAnimationFrame(tick);
				return;
			}
			const cur = panels[currentIndex];
			if (!cur) return;
			const elapsed = now - panelStartedAt;
			progress = Math.min(1, elapsed / cur.duration);
			if (progress >= 1) {
				stopTick();
				next();
				return;
			}
			rafId = requestAnimationFrame(tick);
		};
		rafId = requestAnimationFrame(tick);
	}

	function stopTick() {
		if (rafId !== null) cancelAnimationFrame(rafId);
		rafId = null;
	}

	function next() {
		if (currentIndex >= panels.length - 1) {
			onfinish?.();
			return;
		}
		elapsedAtPause = 0;
		progress = 0;
		currentIndex += 1;
		play('sparkle');
		startTick();
		maybeBigMoment();
	}

	function prev() {
		if (currentIndex <= 0) return;
		elapsedAtPause = 0;
		progress = 0;
		currentIndex -= 1;
		startTick();
	}

	function pause() {
		if (isPaused) return;
		isPaused = true;
		elapsedAtPause = performance.now() - panelStartedAt;
	}

	function resume() {
		if (!isPaused) return;
		isPaused = false;
		panelStartedAt = performance.now() - elapsedAtPause;
	}

	function maybeBigMoment() {
		const c = panels[currentIndex];
		if (!c) return;
		if (c.kind === 'hero-intro' || c.kind === 'outro' || c.kind === 'reveal-cerebrito') {
			confettiVisible = true;
			play('chime');
			setTimeout(() => (confettiVisible = false), 1800);
		}
	}

	function handlePointerDown(e: PointerEvent) {
		const target = e.target as HTMLElement;
		if (target.closest('[data-no-tap]')) return;
		pressTimer = setTimeout(() => pause(), 220);
	}

	function handlePointerUp(e: PointerEvent) {
		if (pressTimer) {
			clearTimeout(pressTimer);
			pressTimer = null;
		}
		if (isPaused) {
			resume();
			return;
		}
		const target = e.target as HTMLElement;
		if (target.closest('[data-no-tap]')) return;
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		const x = e.clientX - rect.left;
		if (x < rect.width * 0.35) {
			prev();
		} else {
			next();
		}
	}

	onMount(() => {
		startTick();
		maybeBigMoment();
	});

	onDestroy(() => {
		stopTick();
		if (pressTimer) clearTimeout(pressTimer);
	});
</script>

<div
	class="fixed inset-0 z-40 bg-pink-cream overflow-hidden select-none"
	onpointerdown={handlePointerDown}
	onpointerup={handlePointerUp}
	onpointercancel={() => {
		if (pressTimer) {
			clearTimeout(pressTimer);
			pressTimer = null;
		}
	}}
	role="button"
	tabindex="0"
>
	<StoryProgressBar total={panels.length} current={currentIndex} {progress} />

	<button
		type="button"
		onclick={() => onskip?.()}
		aria-label="saltar al detalle"
		data-no-tap
		class="absolute top-3 right-3 z-40 h-9 w-9 rounded-full glass shadow-card flex items-center justify-center no-tap active:scale-95"
	>
		<svg width="14" height="14" viewBox="0 0 24 24" stroke="#E0668E" stroke-width="2.4" stroke-linecap="round" fill="none">
			<path d="M6 6 L18 18 M18 6 L6 18" />
		</svg>
	</button>

	<Confetti visible={confettiVisible} count={14} duration={1800} />

	{#if current}
		{#key currentIndex}
			<div
				in:fade={{ duration: 220 }}
				class="absolute inset-0 flex flex-col"
				data-story-panel
			>
				{#if current.kind === 'hero-intro'}
					<div
						class="absolute inset-0 bg-gradient-to-br from-pink-cream via-pink-cloud to-lavender animate-gradient"
					></div>
					<StickerExplosion ids={['snoopy', 'kitty', 'ateez', 'rauw', 'mymelody']} seed={0.31} />
					<div class="relative z-10 flex flex-1 flex-col items-center justify-center text-center px-8">
						<div class="font-script text-pink-rose text-2xl mb-2">벤띠 생일 축하해 ♡</div>
						<h1 class="font-display text-6xl text-transparent bg-clip-text bg-gradient-to-r from-pink-rose via-pink-deep to-pink-rose leading-none">
							venti b-day!
						</h1>
						<div class="font-display text-4xl text-pink-deep mt-2">· wrapped ·</div>
						<div class="mt-6 inline-flex items-center gap-2 font-script text-pink-deep text-lg">
							<Sparkle size={16} color="#E0668E" />
							lo que vivimos juntas
							<Sparkle size={16} color="#E0668E" />
						</div>
					</div>
				{:else if current.kind === 'hero-personal'}
					{@const p = current.data.player}
					{@const c = colorFor(p.color)}
					<div
						class="absolute inset-0 bg-gradient-to-b from-pink-cloud via-pink-cream to-lavender animate-gradient"
					></div>
					<StickerExplosion ids={['mymelody', 'cinnamoroll', 'pastel', 'pompompurin']} seed={0.5} />
					<div class="relative z-10 flex flex-1 flex-col items-center justify-center text-center px-8 gap-4">
						<div class="font-script text-pink-rose text-xl">para ti ♡</div>
						<h1 class="font-display text-5xl text-pink-deep">{p.name}</h1>
						{#if current.data.photoUrl}
							<div class="bg-white p-2 pb-6 rounded-sm shadow-glow rotate-[-4deg]" style="width: 180px;">
								<img
									src={current.data.photoUrl}
									alt={p.name}
									class="w-full aspect-square object-cover"
									crossorigin="anonymous"
								/>
								<span class="absolute bottom-2 left-0 right-0 text-center font-script text-pink-deep text-sm">
									{p.name}
								</span>
							</div>
						{:else}
							<PlayerAvatar
								initials={p.initials}
								colorBg={c.bg}
								colorFg={c.fg}
								colorRing={c.ring}
								size="xl"
							/>
						{/if}
						<div class="font-script text-pink-rose text-base mt-2">
							este es tu wrapped del cumple
						</div>
					</div>
				{:else if current.kind === 'stat-questions'}
					<div class="absolute inset-0 bg-gradient-to-br from-lavender via-pink-cloud to-pink-cream"></div>
					<div class="absolute top-20 right-6 opacity-90">
						{#if sticker('pompompurin')}
							<Sticker
								src={sticker('pompompurin')!.src}
								alt="pompompurin"
								size="80px"
								rotate={14}
								float="a"
								lazy={false}
							/>
						{/if}
					</div>
					<div class="relative z-10 flex flex-1 flex-col items-center justify-center text-center px-8 gap-3">
						<div class="font-script text-pink-rose text-xl">tu trivia ♡</div>
						<div class="font-display leading-none flex items-end gap-3">
							<span class="text-transparent bg-clip-text bg-gradient-to-br from-pink-rose to-pink-deep text-[10rem]">
								{current.data.correct}
							</span>
							<span class="text-pink-deep/70 text-6xl mb-3">/{current.data.total}</span>
						</div>
						<div class="font-display text-pink-deep text-xl">respuestas correctas</div>
					</div>
				{:else if current.kind === 'reveal-cerebrito'}
					{@const p = current.data.player}
					{@const c = colorFor(p.color)}
					<StoryPhotoBg photoUrl={current.data.photoUrl} fallbackColor={c.bg} overlay="dark">
						{#snippet children()}
							<div class="flex flex-1 flex-col items-center justify-end text-center px-8 pb-24 gap-3 h-full">
								<div class="font-script text-pink-cream text-xl drop-shadow">la cerebrito ♡</div>
								<h1 class="font-display text-5xl text-pink-cream leading-none drop-shadow-[0_4px_12px_rgba(107,44,74,0.6)]">
									{p.name}
								</h1>
								<div class="font-display text-2xl text-pink-cream/95 drop-shadow">
									{current.data.correct} de {current.data.total} correctas
								</div>
								<div class="font-script text-pink-cream/80 text-base">la mente más rápida del grupo ♡</div>
							</div>
						{/snippet}
					</StoryPhotoBg>
					<div class="absolute bottom-6 right-6 z-20">
						{#if sticker('ateez')}
							<Sticker
								src={sticker('ateez')!.src}
								alt="ATEEZ"
								size="100px"
								rotate={-6}
								float="b"
								lazy={false}
							/>
						{/if}
					</div>
				{:else if current.kind === 'reveal-despistada'}
					{@const p = current.data.player}
					{@const c = colorFor(p.color)}
					<div class="absolute inset-0 bg-gradient-to-br from-pink-bubblegum via-pink-rose to-pink-deep"></div>
					<div class="absolute inset-0 flex items-center justify-center opacity-90">
						{#if sticker('gato-meme')}
							<Sticker
								src={sticker('gato-meme')!.src}
								alt="gato meme"
								size="280px"
								rotate={-8}
								float="a"
								lazy={false}
							/>
						{/if}
					</div>
					<div class="relative z-10 flex flex-1 flex-col items-center justify-between text-center px-8 py-16">
						<div class="font-script text-pink-cream text-xl drop-shadow">y la más despistada... con amor</div>
						<div class="flex flex-col items-center gap-2 mt-auto">
							<PlayerAvatar
								initials={p.initials}
								colorBg={c.bg}
								colorFg={c.fg}
								colorRing="#FFF9F0"
								size="lg"
							/>
							<h1 class="font-display text-4xl text-pink-cream leading-none drop-shadow-[0_4px_12px_rgba(107,44,74,0.6)]">
								{p.name}
							</h1>
							<div class="font-script text-pink-cream/90 text-base">se distrajo pero la queremos ♡</div>
						</div>
					</div>
				{:else if current.kind === 'quote-hardest-q'}
					<div class="absolute inset-0 bg-gradient-to-br from-pink-cream via-lavender to-pink-cloud"></div>
					<div class="absolute top-16 left-6 opacity-80">
						{#if sticker('cinnamoroll')}
							<Sticker
								src={sticker('cinnamoroll')!.src}
								alt="cinnamoroll"
								size="80px"
								rotate={-12}
								float="b"
								lazy={false}
							/>
						{/if}
					</div>
					<div class="absolute bottom-20 right-6 opacity-80">
						{#if sticker('san')}
							<Sticker
								src={sticker('san')!.src}
								alt="san"
								size="64px"
								rotate={10}
								float="a"
								lazy={false}
							/>
						{/if}
					</div>
					<div class="relative z-10 flex flex-1 flex-col items-center justify-center text-center px-8 gap-5">
						<div class="font-script text-pink-rose text-xl">la pregunta que las rompió</div>
						<div class="glass rounded-3xl p-5 shadow-glow">
							<p class="font-display text-2xl text-pink-deep text-balance leading-snug">
								"{current.data.question}"
							</p>
						</div>
						<div class="font-script text-pink-rose text-base">la falló {current.data.wrong} {current.data.wrong === 1 ? 'persona' : 'personas'}</div>
						<div class="mt-2">
							<span class="font-display text-pink-deep text-3xl">respuesta:</span>
							<div class="font-display text-pink-rose text-4xl mt-1">{current.data.answer}</div>
						</div>
					</div>
				{:else if current.kind === 'wml-spotlight'}
					{@const w = current.data.winner}
					{@const c = colorFor(w.color)}
					<StoryPhotoBg photoUrl={current.data.photoUrl} fallbackColor={c.bg} overlay="dark">
						{#snippet children()}
							<div class="flex flex-1 flex-col items-center justify-between text-center px-7 py-16 h-full">
								<div class="flex flex-col items-center gap-1">
									{#if current.data.tiedNames.length > 0}
										<div class="font-script text-pink-cream/80 text-xs drop-shadow">
											empate con {current.data.tiedNames.join(', ')}
										</div>
									{/if}
									<div class="font-script text-pink-cream text-xl drop-shadow">más probable de...</div>
								</div>
								<p class="font-display text-2xl text-pink-cream text-balance leading-tight drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] max-w-[300px]">
									{current.data.prompt}
								</p>
								<div class="flex flex-col items-center gap-2">
									<HeartIcon size={28} color="#FF8FB8" />
									<h1 class="font-display text-5xl text-pink-cream leading-none drop-shadow-[0_4px_12px_rgba(107,44,74,0.7)]">
										{w.name}
									</h1>
								</div>
							</div>
						{/snippet}
					</StoryPhotoBg>
					<div class="absolute bottom-4 left-4 z-20">
						{#if sticker(current.data.accentSticker)}
							<Sticker
								src={sticker(current.data.accentSticker)!.src}
								alt={current.data.accentSticker}
								size="80px"
								rotate={-8}
								float="a"
								lazy={false}
							/>
						{/if}
					</div>
				{:else if current.kind === 'personal-wml'}
					{@const p = current.data.player}
					{@const c = colorFor(p.color)}
					<div class="absolute inset-0 bg-gradient-to-br from-pink-cream via-pink-cloud to-pink-blush"></div>
					<div class="absolute top-14 right-4 opacity-90">
						{#if sticker('mymelody')}
							<Sticker
								src={sticker('mymelody')!.src}
								alt="mymelody"
								size="90px"
								rotate={10}
								float="b"
								lazy={false}
							/>
						{/if}
					</div>
					<div class="relative z-10 flex flex-1 flex-col items-center justify-center text-center px-8 gap-4">
						<div class="font-script text-pink-rose text-xl">el grupo te ve como...</div>
						<PlayerAvatar
							initials={p.initials}
							colorBg={c.bg}
							colorFg={c.fg}
							colorRing={c.ring}
							size="lg"
						/>
						<ul class="flex flex-col gap-2 max-w-[300px] w-full">
							{#each current.data.prompts as prompt}
								<li class="glass rounded-2xl p-2.5 font-display text-pink-deep text-sm text-balance">
									{prompt}
								</li>
							{/each}
						</ul>
					</div>
				{:else if current.kind === 'stat-votes-cast'}
					<div class="absolute inset-0 bg-gradient-to-br from-lavender via-pink-bubblegum to-pink-rose"></div>
					<div class="absolute top-20 left-4 opacity-90">
						{#if sticker('rauw')}
							<Sticker
								src={sticker('rauw')!.src}
								alt="rauw"
								size="90px"
								rotate={-10}
								float="b"
								lazy={false}
							/>
						{/if}
					</div>
					<div class="relative z-10 flex flex-1 flex-col items-center justify-center text-center px-8 gap-3">
						<div class="font-display leading-none text-cream">
							<span class="text-[8rem] drop-shadow-[0_4px_12px_rgba(107,44,74,0.5)]">
								{current.data.total}
							</span>
						</div>
						<div class="font-display text-cream text-2xl drop-shadow">votos repartidos</div>
						<div class="font-script text-cream/90 text-base">en quién es más probable ♡</div>
					</div>
				{:else if current.kind === 'collage-photos'}
					<div class="absolute inset-0 bg-gradient-to-b from-pink-cream via-pink-cloud to-lavender"></div>
					<div class="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pt-12 pb-10">
						<div class="font-script text-pink-rose text-xl text-center mb-6">los recuerdos del día ♡</div>
						<div class="relative w-full flex-1 max-h-[420px]">
							{#each current.data.items as item, i (item.player.id)}
								{#if item.photoUrl}
									{@const tilts = [-12, 8, -6, 14, -10, 6, -14, 10]}
									{@const cols = 3}
									{@const tilt = tilts[i % tilts.length]}
									<div
										class="absolute shadow-glow"
										style="left: {((i % cols) / (cols - 1)) * 65 + 5}%; top: {Math.floor(i / cols) * 28}%; transform: translateX(-50%) rotate({tilt}deg);"
									>
										<div class="bg-white p-1.5 pb-4 rounded-sm" style="width: 90px;">
											<img
												src={item.photoUrl}
												alt={item.player.name}
												class="w-full aspect-square object-cover"
												crossorigin="anonymous"
											/>
											<span class="block text-center font-script text-pink-deep text-[10px] mt-0.5">
												{item.player.name}
											</span>
										</div>
									</div>
								{/if}
							{/each}
						</div>
					</div>
				{:else if current.kind === 'beach-vibes'}
					<div
						class="absolute inset-0"
						style="background: linear-gradient(180deg, #A8DCF0 0%, #C7E3FF 35%, #FFE8C0 70%, #FFD9A8 100%);"
					></div>
					<!-- sol arriba -->
					<div class="absolute top-10 right-8 animate-float">
						<BeachIcon variant="sun" size={90} />
					</div>
					<!-- palmeras -->
					<div class="absolute top-24 left-2 animate-float-alt">
						<BeachIcon variant="palm" size={100} />
					</div>
					<div class="absolute top-32 right-2 animate-float">
						<BeachIcon variant="palm" size={80} />
					</div>
					<!-- olas en el medio -->
					<div class="absolute top-1/2 left-0 right-0">
						<BeachIcon variant="wave" size={200} class="w-full opacity-80" />
					</div>
					<!-- elementos abajo en la arena -->
					<div class="absolute bottom-16 left-6 animate-float-alt">
						<BeachIcon variant="umbrella" size={70} />
					</div>
					<div class="absolute bottom-24 right-10 animate-float">
						<BeachIcon variant="shell" size={50} />
					</div>
					<div class="absolute bottom-10 right-1/3 animate-float-alt">
						<BeachIcon variant="starfish" size={56} />
					</div>
					<div class="absolute bottom-12 left-1/3 animate-float">
						<BeachIcon variant="cocktail" size={56} />
					</div>
					<div class="relative z-10 flex flex-1 flex-col items-center justify-center text-center px-8 gap-3">
						<div class="font-script text-pink-deep text-2xl drop-shadow-sm">y todo esto pasó...</div>
						<h1 class="font-display text-5xl text-transparent bg-clip-text bg-gradient-to-r from-pink-rose via-pink-deep to-pink-rose leading-none drop-shadow-sm">
							en la playa ♡
						</h1>
						<div class="font-script text-pink-deep/80 text-base mt-2">sol, mar, risas y cumpleaños</div>
					</div>
				{:else if current.kind === 'outro'}
					<div class="absolute inset-0 bg-gradient-to-br from-pink-rose via-pink-bubblegum to-lavender animate-gradient"></div>
					<StickerExplosion ids={['snoopy', 'kitty', 'mymelody', 'cinnamoroll', 'pompompurin', 'ateez']} seed={0.7} />
					<div class="relative z-10 flex flex-1 flex-col items-center justify-center text-center px-8 gap-3">
						<div class="font-script text-pink-cream text-2xl drop-shadow">사랑해</div>
						<h1 class="font-display text-5xl text-pink-cream leading-none drop-shadow-[0_4px_12px_rgba(107,44,74,0.6)]">
							feliz cumple
						</h1>
						<h2 class="font-display text-6xl text-cream leading-none drop-shadow-[0_4px_12px_rgba(107,44,74,0.7)]">
							venti ♡
						</h2>
						<div class="font-script text-pink-cream/95 text-base mt-3">con todo el cariño</div>
						<div class="mt-4">
							<WatermarkHero />
						</div>
					</div>
				{/if}

				{#if current.kind === 'hero-intro' || current.kind === 'outro'}
					<div class="absolute bottom-6 left-1/2 -translate-x-1/2 z-20" data-no-tap>
						<WatermarkHero />
					</div>
				{/if}
				<WatermarkBadge position="bottom-right" />
			</div>
		{/key}
	{/if}

	{#if isPaused}
		<div class="absolute inset-0 z-30 pointer-events-none flex items-center justify-center" data-no-tap>
			<div class="glass rounded-full px-4 py-2 font-script text-pink-deep text-sm">en pausa</div>
		</div>
	{/if}
</div>
