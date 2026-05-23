<script lang="ts">
	import GlassCard from './GlassCard.svelte';
	import BowButton from './BowButton.svelte';
	import HeartIcon from './HeartIcon.svelte';
	import KittyDoodle from './KittyDoodle.svelte';
	import { resetGame } from '$lib/supabase/mutations';
	import { play } from '$lib/audio/sfx.svelte';

	let { onreset }: { onreset?: () => void } = $props();

	let busy = $state(false);
	let confirming = $state(false);

	async function doReset() {
		if (busy) return;
		busy = true;
		try {
			await resetGame();
			play('chime');
			onreset?.();
		} catch (e) {
			console.error(e);
		} finally {
			busy = false;
			confirming = false;
		}
	}
</script>

<div class="flex flex-1 flex-col items-center justify-center px-2 gap-4 animate-fade-up">
	<KittyDoodle size={80} variant="cat" />
	<GlassCard padding="lg" glow>
		<div class="text-center flex flex-col items-center gap-3">
			<div class="font-script text-pink-rose text-xl">parece que hay un juego viejo</div>
			<p class="text-pink-berry/80 text-sm text-balance max-w-xs">
				el cuarto ya estaba en otra fase. ¿quieres empezar uno nuevo desde el lobby?
			</p>
			{#if !confirming}
				<BowButton onclick={() => (confirming = true)} size="md">
					<HeartIcon size={16} color="#FFFFFF" />
					reiniciar juego
				</BowButton>
			{:else}
				<p class="font-script text-pink-deep text-sm">¿segura? esto borra respuestas y votos previos</p>
				<div class="flex gap-2">
					<BowButton onclick={doReset} disabled={busy} size="sm" showBow={false}>
						<HeartIcon size={14} color="#FFFFFF" />
						{busy ? 'reiniciando...' : 'sí, reiniciar'}
					</BowButton>
					<BowButton
						onclick={() => (confirming = false)}
						disabled={busy}
						size="sm"
						showBow={false}
						variant="secondary"
					>
						cancelar
					</BowButton>
				</div>
			{/if}
		</div>
	</GlassCard>
</div>
