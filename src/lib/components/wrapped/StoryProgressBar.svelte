<script lang="ts">
	let {
		total,
		current,
		progress = 0
	}: { total: number; current: number; progress?: number } = $props();
</script>

<div class="absolute top-0 left-0 right-0 z-30 px-3 pt-3 pb-1 flex gap-1 pointer-events-none">
	{#each Array(total) as _, i}
		<div class="flex-1 h-1 rounded-full bg-white/40 overflow-hidden">
			{#if i < current}
				<div class="h-full bg-pink-cream" style="width: 100%;"></div>
			{:else if i === current}
				<div
					class="h-full bg-pink-cream transition-[width] duration-100 ease-linear"
					style="width: {Math.round(progress * 100)}%;"
				></div>
			{/if}
		</div>
	{/each}
</div>
