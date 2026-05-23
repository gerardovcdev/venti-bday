<script lang="ts">
	let {
		position = 'bottom-right',
		opacity = 0.7
	}: {
		position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
		opacity?: number;
	} = $props();

	const posClass: Record<string, string> = {
		'bottom-right': 'bottom-2 right-3',
		'bottom-left': 'bottom-2 left-3',
		'top-right': 'top-2 right-3',
		'top-left': 'top-2 left-3'
	};
</script>

<span
	class="absolute z-10 font-script text-pink-deep text-[10px] tracking-wide select-none pointer-events-none {posClass[position]}"
	style="opacity: {opacity}; text-shadow: 0 1px 2px rgba(255,255,255,0.8);"
>
	venti b-day ♡
</span>
