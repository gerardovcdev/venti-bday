<script lang="ts">
	let {
		size = 20,
		color = '#A8CFF0',
		class: className = ''
	}: { size?: number; color?: string; class?: string } = $props();
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill={color}
	xmlns="http://www.w3.org/2000/svg"
	class={className}
	aria-hidden="true"
>
	<path
		d="M12 2 L14.5 9.5 L22 9.5 L16 14 L18.5 21.5 L12 17 L5.5 21.5 L8 14 L2 9.5 L9.5 9.5 Z"
	/>
</svg>
