<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import Sparkle from './Sparkle.svelte';
	import HeartIcon from './HeartIcon.svelte';
	import { play } from '$lib/audio/sfx.svelte';

	let {
		oncomplete,
		from = 3
	}: { oncomplete?: () => void; from?: number } = $props();

	let count = $state(3);
	let timer: ReturnType<typeof setTimeout> | null = null;

	onMount(() => {
		count = from;
		play('tick');
		const step = () => {
			if (count <= 1) {
				play('chime');
				timer = setTimeout(() => oncomplete?.(), 800);
				count = 0;
				return;
			}
			count -= 1;
			play('tick');
			timer = setTimeout(step, 900);
		};
		timer = setTimeout(step, 900);
	});

	onDestroy(() => {
		if (timer) clearTimeout(timer);
	});
</script>

<div
	class="fixed inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-pink-cream/85 backdrop-blur-md"
>
	<div class="flex items-center gap-3 opacity-70">
		<Sparkle size={18} color="#FF8FB8" />
		<span class="font-script text-pink-rose text-lg">empezamos...</span>
		<Sparkle size={18} color="#FF8FB8" />
	</div>
	{#key count}
		<div class="relative animate-fade-up">
			{#if count > 0}
				<div
					class="font-display text-[12rem] leading-none text-transparent bg-clip-text bg-gradient-to-br from-pink-rose via-pink-bubblegum to-pink-deep animate-heartbeat"
				>
					{count}
				</div>
			{:else}
				<div class="flex items-center gap-2 animate-heartbeat">
					<HeartIcon size={48} color="#E0668E" />
					<span
						class="font-display text-6xl text-transparent bg-clip-text bg-gradient-to-r from-pink-rose to-pink-deep"
					>
						¡vamos!
					</span>
					<HeartIcon size={48} color="#E0668E" />
				</div>
			{/if}
		</div>
	{/key}
</div>
