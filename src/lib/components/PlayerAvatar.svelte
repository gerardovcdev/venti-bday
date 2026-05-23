<script lang="ts">
	let {
		initials,
		colorBg,
		colorFg,
		colorRing,
		size = 'md',
		ringActive = false,
		online = true
	}: {
		initials: string;
		colorBg: string;
		colorFg: string;
		colorRing?: string;
		size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
		ringActive?: boolean;
		online?: boolean;
	} = $props();

	const sizes: Record<string, { wrap: string; text: string }> = {
		xs: { wrap: 'h-7 w-7', text: 'text-[10px]' },
		sm: { wrap: 'h-10 w-10', text: 'text-xs' },
		md: { wrap: 'h-14 w-14', text: 'text-base' },
		lg: { wrap: 'h-20 w-20', text: 'text-xl' },
		xl: { wrap: 'h-28 w-28', text: 'text-3xl' }
	};
	const s = $derived(sizes[size]);
</script>

<div
	class="relative inline-flex items-center justify-center {s.wrap} {online && !ringActive ? 'avatar-bob' : ''}"
>
	<div
		class="absolute inset-0 rounded-full transition {ringActive ? 'animate-heartbeat' : ''}"
		style="background: {colorBg}; box-shadow: 0 0 0 3px {colorRing ?? colorBg}, 0 4px 10px -2px rgba(79,143,208,0.3);"
	></div>
	{#if ringActive}
		<div
			class="absolute -inset-1.5 rounded-full border-2 border-pink-rose/40 animate-sparkle"
			style="border-style: dashed;"
		></div>
	{/if}
	<span
		class="relative font-display font-bold tracking-tight {s.text}"
		style="color: {colorFg};"
	>
		{initials}
	</span>
	{#if !online}
		<span class="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-gray-300 ring-2 ring-white"></span>
	{:else}
		<span
			class="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-pink-rose ring-2 ring-white animate-heartbeat"
		></span>
	{/if}
</div>

<style>
	@keyframes avatar-bob {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-2px);
		}
	}
	.avatar-bob {
		animation: avatar-bob 3.6s ease-in-out infinite;
	}
</style>
