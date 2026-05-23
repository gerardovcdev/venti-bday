<script lang="ts">
	let {
		size = 32,
		color = '#7FB8E8',
		accent = '#4F8FD0',
		class: className = ''
	}: { size?: number; color?: string; accent?: string; class?: string } = $props();
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 48 32"
	fill="none"
	xmlns="http://www.w3.org/2000/svg"
	class={className}
	aria-hidden="true"
>
	<path
		d="M24 16 C16 4 4 4 4 16 C4 28 16 28 24 16 Z"
		fill={color}
	/>
	<path
		d="M24 16 C32 4 44 4 44 16 C44 28 32 28 24 16 Z"
		fill={color}
	/>
	<ellipse cx="24" cy="16" rx="4" ry="6" fill={accent} />
	<path d="M20 18 C18 22 16 26 17 30" stroke={color} stroke-width="2.5" stroke-linecap="round" />
	<path d="M28 18 C30 22 32 26 31 30" stroke={color} stroke-width="2.5" stroke-linecap="round" />
</svg>
