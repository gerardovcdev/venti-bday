<script lang="ts">
	import GameIntro from '$lib/components/GameIntro.svelte';
	import Sticker from '$lib/components/Sticker.svelte';
	import { sticker } from '$lib/design/stickers-manifest';
	import { PHOTO_STICKERS } from '$lib/design/stickers-manifest';
	import { startCameraStream, stopStream } from '$lib/camera/capture';

	let { playerId }: { playerId: string } = $props();

	let permError = $state<string | null>(null);

	async function requestCameraPermission(): Promise<boolean> {
		permError = null;
		try {
			const stream = await startCameraStream();
			// inmediatamente cerramos — solo queremos disparar el prompt de permiso
			stopStream(stream);
			return true;
		} catch (e) {
			console.error(e);
			permError =
				'no pudimos abrir tu cámara. revisa los permisos del navegador e intenta de nuevo.';
			return false;
		}
	}
</script>

<GameIntro
	{playerId}
	phaseLabel="fase 3 de 3"
	title="foto del momento 📸"
	subtitle="vas a tener una pose única para tomarte una foto con la cumpleañera. Te diremos la pose y tendras que hacer tu mejor esfuerzo para imitarla. No te preocupes por salir bien, lo importante es divertirse y tener un recuerdo lindo juntos."
	acceptLabel="dale, dame la cámara"
	onaccept={requestCameraPermission}
	stickers={PHOTO_STICKERS}
>
	{#snippet demo()}
		<div class="relative w-full max-w-[260px] mx-auto">
			<div
				class="glass rounded-3xl p-4 shadow-glow text-center relative overflow-hidden aspect-[3/4]"
				style="background: linear-gradient(160deg, #DDEFFB 0%, #A8CFF0 100%);"
			>
				<div class="absolute inset-0 flex items-center justify-center">
					<div class="text-7xl animate-heartbeat">📸</div>
				</div>
				<div class="absolute top-2 left-2 font-script text-pink-cream text-xl drop-shadow">찰칵</div>
				<div class="absolute top-3 right-3 animate-sparkle">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="#FFF9F0">
						<path d="M12 0 L13.5 9 L24 12 L13.5 15 L12 24 L10.5 15 L0 12 L10.5 9 Z" />
					</svg>
				</div>
				<div class="absolute bottom-3 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-pink-cream shadow-glow animate-heartbeat"></div>
			</div>
			<div class="absolute -top-4 -right-4 animate-float">
				{#if sticker('kitty')}
					<Sticker src={sticker('kitty')!.src} alt="kitty" size="60px" rotate={10} float="a" lazy={false} />
				{/if}
			</div>
			<div class="absolute -bottom-3 -left-4 animate-float-alt">
				{#if sticker('mymelody')}
					<Sticker src={sticker('mymelody')!.src} alt="mymelody" size="60px" rotate={-12} float="b" lazy={false} />
				{/if}
			</div>
		</div>
		{#if permError}
			<p class="font-script text-pink-rose text-sm text-center mt-3 max-w-xs px-3">{permError}</p>
		{/if}
	{/snippet}
</GameIntro>
