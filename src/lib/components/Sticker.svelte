<script lang="ts">
	let {
		src,
		alt = '',
		size = '80px',
		rotate = 0,
		float = 'a' as 'a' | 'b' | 'none',
		delay = 0,
		shadow = true,
		lazy = true,
		class: className = ''
	}: {
		src: string;
		alt?: string;
		size?: string;
		rotate?: number;
		float?: 'a' | 'b' | 'none';
		delay?: number;
		shadow?: boolean;
		lazy?: boolean;
		class?: string;
	} = $props();

	const animClass = $derived(
		float === 'a' ? 'animate-float' : float === 'b' ? 'animate-float-alt' : ''
	);
</script>

<img
	{src}
	{alt}
	loading={lazy ? 'lazy' : 'eager'}
	decoding="async"
	class="select-none pointer-events-none {animClass} {shadow ? 'sticker-shadow' : ''} {className}"
	style="width: {size}; height: auto; transform: rotate({rotate}deg); animation-delay: {delay}s;"
/>

<style>
	.sticker-shadow {
		filter: drop-shadow(0 4px 8px rgba(224, 102, 142, 0.25))
			drop-shadow(0 1px 0 rgba(255, 255, 255, 0.8));
	}
</style>
