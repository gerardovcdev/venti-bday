<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		children,
		class: className = '',
		padding = 'md',
		glow = false
	}: {
		children: Snippet;
		class?: string;
		padding?: 'sm' | 'md' | 'lg';
		glow?: boolean;
	} = $props();

	const paddingClasses: Record<string, string> = {
		sm: 'p-3',
		md: 'p-5',
		lg: 'p-7'
	};
</script>

<div
	class="glass rounded-3xl shadow-card {paddingClasses[padding]} {glow ? 'shadow-glow' : ''} {className}"
>
	{@render children()}
</div>
