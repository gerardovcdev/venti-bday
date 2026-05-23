<script lang="ts">
	import { goto } from '$app/navigation';
	import BowButton from '$lib/components/BowButton.svelte';
	import Sparkle from '$lib/components/Sparkle.svelte';
	import HeartIcon from '$lib/components/HeartIcon.svelte';
</script>

<div class="relative flex flex-1 flex-col items-center justify-center gap-5 px-6 py-10 text-center animate-fade-up">
	<div class="font-script text-pink-rose/80 text-sm">modo oculto ♡</div>
	<h1 class="font-display text-3xl text-pink-deep inline-flex items-center gap-2">
		<Sparkle size={18} color="#4F8FD0" />
		test wrapped
		<Sparkle size={18} color="#4F8FD0" />
	</h1>
	<p class="font-script text-pink-deep/80 text-sm max-w-xs text-balance">
		ruta secreta para probar el wrapped sin jugar el juego completo.
	</p>
	<BowButton onclick={() => goto('/test-wrapped')} size="lg">
		<HeartIcon size={18} color="#FFFFFF" />
		probar wrapped
	</BowButton>
	<button
		type="button"
		onclick={() => goto('/')}
		class="font-script text-pink-rose/80 text-xs underline no-tap mt-4"
	>
		volver al inicio
	</button>
</div>
