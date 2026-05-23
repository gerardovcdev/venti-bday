<script lang="ts">
	let {
		size = 24,
		color = '#7FB8E8',
		class: className = ''
	}: { size?: number; color?: string; class?: string } = $props();
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	xmlns="http://www.w3.org/2000/svg"
	class={className}
	aria-hidden="true"
>
	<path
		d="M12 0 L13.5 9 L24 12 L13.5 15 L12 24 L10.5 15 L0 12 L10.5 9 Z"
		fill={color}
		opacity="0.95"
	/>
</svg>
