<script lang="ts">
	import BowButton from './BowButton.svelte';
	import HeartIcon from './HeartIcon.svelte';
	import { onMount, onDestroy } from 'svelte';

	let {
		visible = false,
		onskip,
		label = 'algunas amigas siguen pensando...'
	}: {
		visible?: boolean;
		onskip?: () => void;
		label?: string;
	} = $props();

	let showAfter = $state(false);
	let timer: ReturnType<typeof setTimeout> | null = null;

	$effect(() => {
		if (visible) {
			showAfter = false;
			timer = setTimeout(() => (showAfter = true), 30_000);
		} else {
			showAfter = false;
			if (timer) clearTimeout(timer);
		}
	});

	onDestroy(() => {
		if (timer) clearTimeout(timer);
	});
</script>

{#if visible && showAfter}
	<div class="flex flex-col items-center gap-2 animate-fade-up">
		<p class="font-script text-pink-rose/80 text-sm text-center">{label}</p>
		<BowButton onclick={() => onskip?.()} size="sm" variant="secondary" showBow={false}>
			<HeartIcon size={14} color="#E0668E" />
			seguir sin las ausentes
		</BowButton>
	</div>
{/if}
