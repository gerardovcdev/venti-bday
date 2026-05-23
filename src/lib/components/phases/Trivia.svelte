<script lang="ts">
	import GlassCard from '$lib/components/GlassCard.svelte';
	import BowButton from '$lib/components/BowButton.svelte';
	import HeartIcon from '$lib/components/HeartIcon.svelte';
	import Sparkle from '$lib/components/Sparkle.svelte';
	import PlayerAvatar from '$lib/components/PlayerAvatar.svelte';
	import HeartLoader from '$lib/components/HeartLoader.svelte';
	import { gameStore } from '$lib/stores/game.svelte';
	import { submitTriviaAnswer, advancePhase } from '$lib/supabase/mutations';
	import { PLAYER_PALETTE } from '$lib/design/colors';
	import triviaData from '$lib/content/trivia.json';
	import { play } from '$lib/audio/sfx.svelte';
	import SkipWaitingBanner from '$lib/components/SkipWaitingBanner.svelte';
	import AccentStickers from '$lib/components/AccentStickers.svelte';
	import { TRIVIA_STICKERS } from '$lib/design/stickers-manifest';

	let { playerId }: { playerId: string } = $props();

	type Question =
		| {
				id: string;
				about: 'venti' | 'general';
				type: 'multiple';
				question: string;
				options: string[];
				answer: string;
		  }
		| {
				id: string;
				about: 'venti' | 'general';
				type: 'open';
				question: string;
				answer: string;
				answer_alts?: string[];
		  };

	const questionsById = new Map(
		(triviaData as Question[]).map((q) => [q.id, q] as const)
	);

	const order = $derived((gameStore.game?.config.trivia_order ?? []) as string[]);
	const currentId = $derived(order[gameStore.currentRound]);
	const question = $derived(currentId ? questionsById.get(currentId) : undefined);
	const reveal = $derived(gameStore.reveal);

	const answersForQ = $derived(
		gameStore.answers.filter((a) => a.question_id === currentId)
	);
	const myAnswer = $derived(answersForQ.find((a) => a.player_id === playerId));
	const answeredCount = $derived(answersForQ.length);
	const totalPlayers = $derived(gameStore.players.length);

	let openInput = $state('');
	let submitBusy = $state(false);
	let advanceBusy = $state(false);

	function normalize(s: string): string {
		return s
			.normalize('NFD')
			.replace(/[̀-ͯ]/g, '')
			.toLowerCase()
			.trim();
	}

	function checkOpen(input: string, q: Question & { type: 'open' }): boolean {
		const norm = normalize(input);
		if (normalize(q.answer) === norm) return true;
		return (q.answer_alts ?? []).some((alt) => normalize(alt) === norm);
	}

	async function answerMultiple(option: string) {
		if (!question || question.type !== 'multiple' || myAnswer || submitBusy) return;
		submitBusy = true;
		play('sparkle');
		try {
			await submitTriviaAnswer({
				playerId,
				questionId: question.id,
				answer: option,
				isCorrect: option === question.answer
			});
		} finally {
			submitBusy = false;
		}
	}

	async function answerOpen() {
		if (!question || question.type !== 'open' || myAnswer || submitBusy) return;
		const value = openInput.trim();
		if (!value) return;
		submitBusy = true;
		play('sparkle');
		try {
			await submitTriviaAnswer({
				playerId,
				questionId: question.id,
				answer: value,
				isCorrect: checkOpen(value, question)
			});
			openInput = '';
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
			await advancePhase('reveal_trivia', force);
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
			await advancePhase('next_trivia');
		} catch (e) {
			console.warn(e);
		} finally {
			advanceBusy = false;
		}
	}

	$effect(() => {
		if (
			answeredCount === totalPlayers &&
			totalPlayers > 0 &&
			!reveal &&
			currentId &&
			playerId === gameStore.players[0]?.id
		) {
			void tryReveal();
		}
	});

	function colorFor(name: string) {
		return PLAYER_PALETTE.find((c) => c.name === name) ?? PLAYER_PALETTE[0];
	}
</script>

{#if !question}
	<div class="flex flex-1 items-center justify-center">
		<HeartLoader label="preparando preguntas..." />
	</div>
{:else}
	<div class="relative flex flex-1 flex-col gap-5 animate-fade-up">
		<AccentStickers variant={TRIVIA_STICKERS} />
		<div class="text-center">
			<div class="font-script text-pink-rose/80 text-sm">
				pregunta {gameStore.currentRound + 1} de {order.length}
			</div>
			<div class="inline-flex items-center gap-2 mt-1">
				<Sparkle size={16} color="#FF8FB8" />
				<span class="font-display text-pink-deep text-sm uppercase tracking-widest">
					{question.about === 'venti' ? 'sobre Venti' : 'cultura'}
				</span>
				<Sparkle size={16} color="#FF8FB8" />
			</div>
		</div>

		<GlassCard padding="lg" glow>
			<h2 class="font-display text-2xl text-pink-deep text-center text-balance">
				{question.question}
			</h2>
		</GlassCard>

		{#if !reveal}
			{#if question.type === 'multiple'}
				<div class="grid grid-cols-1 gap-2.5">
					{#each question.options as opt}
						{@const picked = myAnswer?.answer === opt}
						<button
							type="button"
							onclick={() => answerMultiple(opt)}
							disabled={!!myAnswer || submitBusy}
							class="glass rounded-2xl py-3 px-4 text-left font-display text-lg transition no-tap {picked
								? 'bg-pink-rose text-cream shadow-glow ring-2 ring-pink-deep font-bold'
								: 'text-pink-berry hover:bg-white/70 active:scale-95'}"
							style={picked
								? 'text-shadow: 0 1px 2px rgba(107,44,74,0.4);'
								: ''}
						>
							{opt}
						</button>
					{/each}
				</div>
			{:else}
				<form
					onsubmit={(e) => {
						e.preventDefault();
						answerOpen();
					}}
					class="flex flex-col gap-3"
				>
					<GlassCard padding="sm">
						<input
							type="text"
							bind:value={openInput}
							disabled={!!myAnswer || submitBusy}
							placeholder="escribe tu respuesta..."
							class="w-full bg-transparent border-0 outline-none text-center font-display text-xl placeholder:text-pink-blush"
							style="color: var(--color-pink-berry); caret-color: var(--color-pink-rose); -webkit-text-fill-color: var(--color-pink-berry);"
						/>
					</GlassCard>
					<div class="flex justify-center">
						<BowButton type="submit" disabled={!!myAnswer || submitBusy || !openInput.trim()} size="md" showBow={false}>
							<HeartIcon size={16} color="#FFFFFF" />
							enviar
						</BowButton>
					</div>
				</form>
			{/if}
		{:else}
			<GlassCard padding="md">
				<div class="text-center">
					<div class="font-script text-pink-rose text-lg">respuesta correcta ♡</div>
					<div class="font-display text-3xl text-pink-deep mt-1">
						{question.answer}
					</div>
				</div>
			</GlassCard>
		{/if}

		<GlassCard padding="sm">
			<div class="font-script text-pink-deep text-center text-sm mb-2">
				{reveal
					? '¿cómo respondieron?'
					: `${answeredCount} de ${totalPlayers} listas`}
			</div>
			<div class="flex flex-wrap gap-2 justify-center">
				{#each gameStore.players as p (p.id)}
					{@const c = colorFor(p.color)}
					{@const ans = answersForQ.find((x) => x.player_id === p.id)}
					<div class="flex flex-col items-center gap-1">
						<PlayerAvatar
							initials={p.initials}
							colorBg={c.bg}
							colorFg={c.fg}
							colorRing={ans ? (reveal && ans.is_correct ? '#FF8FB8' : ans ? '#E8D5FF' : '#FFE0EC') : '#FFE0EC'}
							size="sm"
							online={gameStore.presence.has(p.id)}
							ringActive={!!ans && !reveal}
						/>
						{#if reveal && ans}
							<span class="text-[10px] text-pink-deep/80 max-w-[60px] truncate">
								{ans.is_correct ? '✓' : '✗'} {ans.answer}
							</span>
						{/if}
					</div>
				{/each}
			</div>
		</GlassCard>

		{#if reveal}
			<div class="flex justify-center pt-1">
				<BowButton onclick={next} disabled={advanceBusy} size="md">
					<HeartIcon size={16} color="#FFFFFF" />
					{gameStore.currentRound + 1 >= order.length ? 'al siguiente juego' : 'siguiente pregunta'}
				</BowButton>
			</div>
		{:else}
			<SkipWaitingBanner
				visible={!!myAnswer && answeredCount < totalPlayers}
				onskip={() => tryReveal(true)}
			/>
		{/if}
	</div>
{/if}
