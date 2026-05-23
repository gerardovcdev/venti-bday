<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import BowButton from '$lib/components/BowButton.svelte';
	import GlassCard from '$lib/components/GlassCard.svelte';
	import HeartIcon from '$lib/components/HeartIcon.svelte';
	import Sticker from '$lib/components/Sticker.svelte';
	import { sticker } from '$lib/design/stickers-manifest';
	import { loadLocalPlayer, createLocalPlayer } from '$lib/stores/player';
	import { joinGame } from '$lib/supabase/mutations';
	import { hasBackend } from '$lib/supabase/client';

	let name = $state('');
	let submitting = $state(false);
	let error = $state<string | null>(null);

	onMount(() => {
		const existing = loadLocalPlayer();
		if (existing) {
			goto('/play');
		}
	});

	async function submit(e: Event) {
		e.preventDefault();
		if (submitting) return;
		const trimmed = name.trim();
		if (trimmed.length < 1 || trimmed.length > 20) {
			error = 'Pon un nombre entre 1 y 20 letras';
			return;
		}
		submitting = true;
		error = null;
		try {
			const player = createLocalPlayer(trimmed);
			if (hasBackend()) {
				await joinGame({
					id: player.id,
					name: player.name,
					initials: player.initials,
					color: player.color.name
				});
			}
			await goto('/play');
		} catch (e) {
			error = e instanceof Error ? e.message : 'Algo salió mal, intenta de nuevo';
			submitting = false;
		}
	}
</script>

<div class="flex flex-1 flex-col items-center justify-center text-center gap-6 animate-fade-up">
	<div class="flex items-end gap-2">
		{#if sticker('mymelody')}
			<Sticker
				src={sticker('mymelody')!.src}
				alt={sticker('mymelody')!.alt}
				size="76px"
				rotate={-8}
				float="b"
				lazy={false}
			/>
		{/if}
		{#if sticker('kitty')}
			<Sticker
				src={sticker('kitty')!.src}
				alt={sticker('kitty')!.alt}
				size="68px"
				rotate={6}
				float="a"
				delay={0.3}
				lazy={false}
			/>
		{/if}
		{#if sticker('cinnamoroll')}
			<Sticker
				src={sticker('cinnamoroll')!.src}
				alt={sticker('cinnamoroll')!.alt}
				size="70px"
				rotate={10}
				float="b"
				delay={0.6}
				lazy={false}
			/>
		{/if}
	</div>

	<div>
		<div class="font-script text-pink-rose/80 text-lg">반가워요</div>
		<h1 class="font-display text-4xl text-pink-deep">¿Cómo te llamas?</h1>
		<p class="text-pink-berry/70 text-sm mt-1">tu nombre lindo va aquí ♡</p>
	</div>

	<form onsubmit={submit} class="flex w-full flex-col gap-4">
		<GlassCard padding="md">
			<input
				type="text"
				bind:value={name}
				maxlength={20}
				autocomplete="off"
				autocapitalize="words"
				placeholder="tu nombre"
				class="w-full bg-transparent border-0 outline-none text-center font-display text-2xl placeholder:text-pink-blush focus:placeholder:opacity-50"
				style="color: var(--color-pink-berry); caret-color: var(--color-pink-rose); -webkit-text-fill-color: var(--color-pink-berry);"
			/>
		</GlassCard>

		{#if error}
			<p class="font-script text-pink-rose text-base">{error}</p>
		{/if}

		<div class="flex justify-center pt-2">
			<BowButton type="submit" disabled={submitting || name.trim().length === 0}>
				<HeartIcon size={18} color="#FFFFFF" />
				{submitting ? 'entrando...' : 'entrar a la sala'}
			</BowButton>
		</div>
	</form>

	{#if !hasBackend()}
		<p class="font-script text-pink-rose/70 text-sm max-w-xs">
			(modo demo · configura Supabase en .env para multijugador)
		</p>
	{/if}
</div>
