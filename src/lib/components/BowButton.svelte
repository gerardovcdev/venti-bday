<script lang="ts">
	import type { Snippet } from 'svelte';
	import BowIcon from './BowIcon.svelte';
	import { play } from '$lib/audio/sfx.svelte';

	let {
		children,
		onclick,
		disabled = false,
		variant = 'primary',
		size = 'lg',
		showBow = true,
		type = 'button',
		sound = 'pop' as 'pop' | 'sparkle' | 'none'
	}: {
		children: Snippet;
		onclick?: () => void;
		disabled?: boolean;
		variant?: 'primary' | 'secondary' | 'ghost';
		size?: 'sm' | 'md' | 'lg';
		showBow?: boolean;
		type?: 'button' | 'submit';
		sound?: 'pop' | 'sparkle' | 'none';
	} = $props();

	function handleClick() {
		if (disabled) return;
		if (sound !== 'none') play(sound);
		onclick?.();
	}

	const sizeClasses: Record<string, string> = {
		sm: 'px-4 py-2 text-sm rounded-2xl',
		md: 'px-6 py-3 text-base rounded-3xl',
		lg: 'px-8 py-4 text-lg rounded-full'
	};

	const variantClasses: Record<string, string> = {
		primary:
			'bg-gradient-to-r from-pink-bubblegum to-pink-rose text-cream shadow-soft hover:brightness-105 active:scale-95',
		secondary: 'glass text-pink-deep border border-pink-blush hover:bg-white/70 active:scale-95',
		ghost: 'text-pink-deep hover:bg-pink-cream active:scale-95'
	};
</script>

<button
	{type}
	onclick={handleClick}
	{disabled}
	class="relative inline-flex items-center justify-center gap-2 font-display tracking-wide transition disabled:opacity-50 disabled:cursor-not-allowed no-tap {sizeClasses[size]} {variantClasses[variant]}"
>
	{#if showBow && variant === 'primary'}
		<span class="absolute -top-3 -right-2 rotate-12 drop-shadow-md">
			<BowIcon size={28} color="#FFCFE0" accent="#FF8FB8" />
		</span>
	{/if}
	{@render children()}
</button>
