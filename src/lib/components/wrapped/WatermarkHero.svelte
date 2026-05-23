<script lang="ts">
	import HeartIcon from '$lib/components/HeartIcon.svelte';
	import Sparkle from '$lib/components/Sparkle.svelte';
</script>

<div class="font-display text-3xl tracking-wide inline-flex items-center gap-2 select-none pointer-events-none">
	<Sparkle size={20} color="#4F8FD0" />
	<span
		class="text-transparent bg-clip-text bg-gradient-to-r from-pink-rose via-pink-deep to-pink-rose"
	>
		venti b-day!
	</span>
	<HeartIcon size={22} color="#4F8FD0" />
</div>
