<script lang="ts">
	import GameIntro from '$lib/components/GameIntro.svelte';
	import PlayerAvatar from '$lib/components/PlayerAvatar.svelte';
	import Sticker from '$lib/components/Sticker.svelte';
	import { sticker } from '$lib/design/stickers-manifest';
	import { WML_STICKERS } from '$lib/design/stickers-manifest';

	let { playerId }: { playerId: string } = $props();
</script>

<GameIntro
	{playerId}
	phaseLabel="fase 2 de 3"
	title="¿quién es más probable que...? 👀"
	subtitle="te voy a dar situaciones picantes y tú votas por quien sea más probable. puedes votar por ti misma, no hay reglas. al final del juego, te muestro un resumen con drama."
	acceptLabel="lista pa el drama 💅"
	stickers={WML_STICKERS}
>
	{#snippet demo()}
		<div class="relative w-full max-w-[280px] mx-auto">
			<div class="glass rounded-3xl p-4 shadow-glow text-center">
				<div class="font-display text-pink-deep text-sm mb-3">¿quién es más probable que...?</div>
				<div class="flex justify-center gap-3">
					<div class="animate-heartbeat" style="animation-delay: 0s;">
						<PlayerAvatar initials="Mar" colorBg="#FFB6D5" colorFg="#6B2C4A" colorRing="#FF8FB8" size="md" />
					</div>
					<div class="animate-heartbeat" style="animation-delay: 0.3s;">
						<PlayerAvatar initials="Luz" colorBg="#E8D5FF" colorFg="#5B3A7A" colorRing="#C9A8F0" size="md" />
					</div>
					<div class="animate-heartbeat" style="animation-delay: 0.6s;">
						<PlayerAvatar initials="Sof" colorBg="#FFD9C4" colorFg="#7A3E1F" colorRing="#FFB893" size="md" />
					</div>
				</div>
				<div class="font-script text-pink-rose text-xs mt-2">tap para votar</div>
			</div>
			<div class="absolute -top-4 -right-4 animate-float-alt">
				{#if sticker('rauw')}
					<Sticker src={sticker('rauw')!.src} alt="rauw" size="70px" rotate={10} float="b" lazy={false} />
				{/if}
			</div>
			<div class="absolute -bottom-3 -left-4 animate-float">
				{#if sticker('gato-meme')}
					<Sticker src={sticker('gato-meme')!.src} alt="gato meme" size="58px" rotate={-12} float="a" lazy={false} />
				{/if}
			</div>
		</div>
	{/snippet}
</GameIntro>
