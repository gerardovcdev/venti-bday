<script lang="ts">
	import HeartIcon from './HeartIcon.svelte';

	let {
		label = 'cargando...',
		size = 28
	}: { label?: string; size?: number } = $props();
</script>

<div class="flex flex-col items-center gap-2">
	<div class="flex gap-1.5">
		<span class="animate-heartbeat" style="animation-delay: 0s;">
			<HeartIcon {size} color="#A8CFF0" />
		</span>
		<span class="animate-heartbeat" style="animation-delay: 0.2s;">
			<HeartIcon {size} color="#7FB8E8" />
		</span>
		<span class="animate-heartbeat" style="animation-delay: 0.4s;">
			<HeartIcon {size} color="#4F8FD0" />
		</span>
	</div>
	{#if label}
		<span class="font-script text-pink-deep text-lg">{label}</span>
	{/if}
</div>
