<script lang="ts">
	import HeartIcon from './HeartIcon.svelte';
	import Sparkle from './Sparkle.svelte';
	import StarIcon from './StarIcon.svelte';

	let {
		visible = false,
		count = 18,
		duration = 2400
	}: { visible?: boolean; count?: number; duration?: number } = $props();

	const palette = ['#7FB8E8', '#A8CFF0', '#4F8FD0', '#FFC0E2', '#E8D5FF'];

	function piece(i: number) {
		const left = (i * 97 + 13) % 100;
		const delay = (i * 31) % 600;
		const rot = ((i * 137) % 360) - 180;
		const size = 14 + (i % 4) * 4;
		const color = palette[i % palette.length];
		const variant = i % 3;
		return { left, delay, rot, size, color, variant };
	}
</script>

{#if visible}
	<div
		class="pointer-events-none fixed inset-0 z-30 overflow-hidden"
		style="animation: fade-out {duration}ms forwards;"
	>
		{#each Array(count) as _, i}
			{@const p = piece(i)}
			<span
				class="absolute top-0"
				style="left: {p.left}%; animation: confetti-fall {duration}ms cubic-bezier(0.2, 0.7, 0.4, 1) {p.delay}ms forwards; transform: rotate({p.rot}deg);"
			>
				{#if p.variant === 0}
					<HeartIcon size={p.size} color={p.color} />
				{:else if p.variant === 1}
					<Sparkle size={p.size} color={p.color} />
				{:else}
					<StarIcon size={p.size} color={p.color} />
				{/if}
			</span>
		{/each}
	</div>
{/if}

<style>
	@keyframes confetti-fall {
		0% {
			transform: translateY(-40px) rotate(0deg);
			opacity: 0;
		}
		10% {
			opacity: 1;
		}
		100% {
			transform: translateY(110vh) rotate(720deg);
			opacity: 0;
		}
	}
	@keyframes fade-out {
		0%,
		70% {
			opacity: 1;
		}
		100% {
			opacity: 0;
		}
	}
</style>
