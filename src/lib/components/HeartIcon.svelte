<script lang="ts">
	let {
		size = 24,
		color = '#7FB8E8',
		filled = true,
		class: className = ''
	}: { size?: number; color?: string; filled?: boolean; class?: string } = $props();
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill={filled ? color : 'none'}
	stroke={color}
	stroke-width="2"
	stroke-linejoin="round"
	xmlns="http://www.w3.org/2000/svg"
	class={className}
	aria-hidden="true"
>
	<path
		d="M12 21s-7-4.35-9.5-9.5C0.5 7.5 3 4 6.5 4c2 0 3.5 1 5.5 3.5C14 5 15.5 4 17.5 4c3.5 0 6 3.5 4 7.5C19 16.65 12 21 12 21z"
	/>
</svg>
