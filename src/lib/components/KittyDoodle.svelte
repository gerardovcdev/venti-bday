<script lang="ts">
	let {
		size = 80,
		variant = 'cat',
		class: className = ''
	}: { size?: number; variant?: 'cat' | 'bunny' | 'pup' | 'pud'; class?: string } = $props();
</script>

{#if variant === 'cat'}
	<svg
		width={size}
		height={size}
		viewBox="0 0 100 100"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		class={className}
		aria-hidden="true"
	>
		<ellipse cx="50" cy="58" rx="34" ry="30" fill="#FFFFFF" stroke="#4F8FD0" stroke-width="2.2" />
		<path d="M22 38 L18 22 L36 32 Z" fill="#FFFFFF" stroke="#4F8FD0" stroke-width="2.2" stroke-linejoin="round" />
		<path d="M78 38 L82 22 L64 32 Z" fill="#FFFFFF" stroke="#4F8FD0" stroke-width="2.2" stroke-linejoin="round" />
		<path d="M27 30 L24 25 L31 28 Z" fill="#A8CFF0" />
		<path d="M73 30 L76 25 L69 28 Z" fill="#A8CFF0" />
		<circle cx="40" cy="55" r="2.8" fill="#3A1A2A" />
		<circle cx="60" cy="55" r="2.8" fill="#3A1A2A" />
		<ellipse cx="50" cy="64" rx="2.2" ry="1.4" fill="#7FB8E8" />
		<path d="M48 66 Q46 70 42 70 M52 66 Q54 70 58 70" stroke="#1F3A5C" stroke-width="1.5" stroke-linecap="round" fill="none" />
		<g stroke="#1F3A5C" stroke-width="1" stroke-linecap="round">
			<line x1="20" y1="58" x2="32" y2="60" />
			<line x1="20" y1="64" x2="32" y2="64" />
			<line x1="68" y1="60" x2="80" y2="58" />
			<line x1="68" y1="64" x2="80" y2="64" />
		</g>
		<g transform="translate(60 28) rotate(20)">
			<ellipse cx="-4" cy="0" rx="5" ry="3.5" fill="#7FB8E8" />
			<ellipse cx="4" cy="0" rx="5" ry="3.5" fill="#7FB8E8" />
			<circle cx="0" cy="0" r="2.5" fill="#4F8FD0" />
		</g>
	</svg>
{:else if variant === 'bunny'}
	<svg
		width={size}
		height={size}
		viewBox="0 0 100 100"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		class={className}
		aria-hidden="true"
	>
		<ellipse cx="35" cy="35" rx="9" ry="22" fill="#FFFFFF" stroke="#4F8FD0" stroke-width="2.2" />
		<ellipse cx="65" cy="35" rx="9" ry="22" fill="#FFFFFF" stroke="#4F8FD0" stroke-width="2.2" />
		<ellipse cx="35" cy="38" rx="4" ry="14" fill="#FFC0E2" />
		<ellipse cx="65" cy="38" rx="4" ry="14" fill="#FFC0E2" />
		<ellipse cx="50" cy="65" rx="32" ry="28" fill="#FFFFFF" stroke="#4F8FD0" stroke-width="2.2" />
		<circle cx="40" cy="62" r="2.8" fill="#3A1A2A" />
		<circle cx="60" cy="62" r="2.8" fill="#3A1A2A" />
		<ellipse cx="50" cy="70" rx="2.4" ry="1.6" fill="#7FB8E8" />
		<path d="M50 72 Q48 76 44 76 M50 72 Q52 76 56 76" stroke="#1F3A5C" stroke-width="1.5" stroke-linecap="round" fill="none" />
		<circle cx="28" cy="68" r="3" fill="#C5E2F7" />
		<circle cx="72" cy="68" r="3" fill="#C5E2F7" />
	</svg>
{:else if variant === 'pup'}
	<svg
		width={size}
		height={size}
		viewBox="0 0 100 100"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		class={className}
		aria-hidden="true"
	>
		<ellipse cx="50" cy="58" rx="36" ry="32" fill="#FFFFFF" stroke="#1F3A5C" stroke-width="2.2" />
		<ellipse cx="22" cy="50" rx="10" ry="18" fill="#FFFFFF" stroke="#1F3A5C" stroke-width="2.2" transform="rotate(-20 22 50)" />
		<ellipse cx="78" cy="50" rx="10" ry="18" fill="#3A1A2A" transform="rotate(20 78 50)" />
		<circle cx="40" cy="55" r="3.2" fill="#3A1A2A" />
		<circle cx="60" cy="55" r="3.2" fill="#3A1A2A" />
		<ellipse cx="50" cy="66" rx="3" ry="2" fill="#3A1A2A" />
		<path d="M50 68 Q47 74 42 73 M50 68 Q53 74 58 73" stroke="#1F3A5C" stroke-width="1.5" stroke-linecap="round" fill="none" />
		<ellipse cx="35" cy="68" rx="4" ry="2.5" fill="#FFC0E2" />
	</svg>
{:else}
	<svg
		width={size}
		height={size}
		viewBox="0 0 100 100"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		class={className}
		aria-hidden="true"
	>
		<ellipse cx="50" cy="60" rx="36" ry="30" fill="#FFE082" stroke="#7A5A1F" stroke-width="2.2" />
		<ellipse cx="50" cy="35" rx="28" ry="14" fill="#C68B3E" />
		<circle cx="40" cy="58" r="2.8" fill="#3A1A2A" />
		<circle cx="60" cy="58" r="2.8" fill="#3A1A2A" />
		<ellipse cx="50" cy="68" rx="3" ry="2" fill="#7A5A1F" />
		<path d="M48 70 Q46 74 42 73 M52 70 Q54 74 58 73" stroke="#7A5A1F" stroke-width="1.5" stroke-linecap="round" fill="none" />
		<circle cx="32" cy="64" r="3.5" fill="#FFC0E2" opacity="0.7" />
		<circle cx="68" cy="64" r="3.5" fill="#FFC0E2" opacity="0.7" />
	</svg>
{/if}
