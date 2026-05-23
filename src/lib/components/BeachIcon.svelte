<script lang="ts">
	let {
		variant,
		size = 48,
		class: className = ''
	}: {
		variant: 'sun' | 'palm' | 'wave' | 'shell' | 'starfish' | 'cocktail' | 'umbrella';
		size?: number;
		class?: string;
	} = $props();
</script>

{#if variant === 'sun'}
	<svg
		width={size}
		height={size}
		viewBox="0 0 48 48"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		class={className}
		aria-hidden="true"
	>
		<circle cx="24" cy="24" r="10" fill="#FFE082" stroke="#F5A623" stroke-width="2" />
		<g stroke="#F5A623" stroke-width="2.4" stroke-linecap="round">
			<line x1="24" y1="4" x2="24" y2="10" />
			<line x1="24" y1="38" x2="24" y2="44" />
			<line x1="4" y1="24" x2="10" y2="24" />
			<line x1="38" y1="24" x2="44" y2="24" />
			<line x1="10" y1="10" x2="14" y2="14" />
			<line x1="34" y1="34" x2="38" y2="38" />
			<line x1="38" y1="10" x2="34" y2="14" />
			<line x1="14" y1="34" x2="10" y2="38" />
		</g>
		<circle cx="20" cy="22" r="1.5" fill="#7A5A1F" />
		<circle cx="28" cy="22" r="1.5" fill="#7A5A1F" />
		<path d="M20 27 Q24 30 28 27" stroke="#7A5A1F" stroke-width="1.6" stroke-linecap="round" fill="none" />
	</svg>
{:else if variant === 'palm'}
	<svg
		width={size}
		height={size}
		viewBox="0 0 48 48"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		class={className}
		aria-hidden="true"
	>
		<path
			d="M24 18 Q22 28 22 44"
			stroke="#8B5A2B"
			stroke-width="3.2"
			stroke-linecap="round"
			fill="none"
		/>
		<path d="M24 18 Q14 14 6 18" stroke="#5C9933" stroke-width="3" stroke-linecap="round" fill="none" />
		<path d="M24 18 Q34 14 42 18" stroke="#5C9933" stroke-width="3" stroke-linecap="round" fill="none" />
		<path d="M24 18 Q18 10 12 8" stroke="#7BC04D" stroke-width="3" stroke-linecap="round" fill="none" />
		<path d="M24 18 Q30 10 36 8" stroke="#7BC04D" stroke-width="3" stroke-linecap="round" fill="none" />
		<path d="M24 18 Q24 8 22 4" stroke="#5C9933" stroke-width="3" stroke-linecap="round" fill="none" />
		<circle cx="24" cy="18" r="3" fill="#7BC04D" />
		<circle cx="20" cy="20" r="2" fill="#A8784A" />
		<circle cx="27" cy="21" r="2" fill="#A8784A" />
	</svg>
{:else if variant === 'wave'}
	<svg
		width={size}
		height={size}
		viewBox="0 0 48 48"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		class={className}
		aria-hidden="true"
	>
		<path
			d="M2 32 Q8 24 14 32 T26 32 T38 32 T46 32"
			stroke="#7CC0E8"
			stroke-width="3"
			stroke-linecap="round"
			fill="none"
		/>
		<path
			d="M2 40 Q8 32 14 40 T26 40 T38 40 T46 40"
			stroke="#A8DCF0"
			stroke-width="2.5"
			stroke-linecap="round"
			fill="none"
			opacity="0.7"
		/>
		<path
			d="M2 22 Q8 14 14 22 T26 22"
			stroke="#7CC0E8"
			stroke-width="2.2"
			stroke-linecap="round"
			fill="none"
			opacity="0.5"
		/>
	</svg>
{:else if variant === 'shell'}
	<svg
		width={size}
		height={size}
		viewBox="0 0 48 48"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		class={className}
		aria-hidden="true"
	>
		<path
			d="M24 6 Q8 16 6 38 Q24 44 42 38 Q40 16 24 6 Z"
			fill="#FFCBC1"
			stroke="#4F8FD0"
			stroke-width="2"
		/>
		<path d="M24 6 L18 38" stroke="#4F8FD0" stroke-width="1.4" fill="none" />
		<path d="M24 6 L24 38" stroke="#4F8FD0" stroke-width="1.4" fill="none" />
		<path d="M24 6 L30 38" stroke="#4F8FD0" stroke-width="1.4" fill="none" />
		<path d="M24 6 L12 36" stroke="#4F8FD0" stroke-width="1.4" fill="none" opacity="0.6" />
		<path d="M24 6 L36 36" stroke="#4F8FD0" stroke-width="1.4" fill="none" opacity="0.6" />
	</svg>
{:else if variant === 'starfish'}
	<svg
		width={size}
		height={size}
		viewBox="0 0 48 48"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		class={className}
		aria-hidden="true"
	>
		<path
			d="M24 4 L29 18 L44 18 L32 27 L37 42 L24 33 L11 42 L16 27 L4 18 L19 18 Z"
			fill="#FFB87A"
			stroke="#D88440"
			stroke-width="2"
			stroke-linejoin="round"
		/>
		<circle cx="20" cy="22" r="1.5" fill="#7A4A1F" />
		<circle cx="28" cy="22" r="1.5" fill="#7A4A1F" />
		<path d="M21 27 Q24 30 27 27" stroke="#7A4A1F" stroke-width="1.4" stroke-linecap="round" fill="none" />
	</svg>
{:else if variant === 'cocktail'}
	<svg
		width={size}
		height={size}
		viewBox="0 0 48 48"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		class={className}
		aria-hidden="true"
	>
		<path
			d="M10 10 L38 10 L26 26 L26 38 L34 40 L14 40 L22 38 L22 26 Z"
			fill="#FFCBC1"
			stroke="#4F8FD0"
			stroke-width="2"
			stroke-linejoin="round"
		/>
		<circle cx="32" cy="14" r="2.5" fill="#FF6B6B" />
		<line x1="32" y1="16" x2="38" y2="6" stroke="#5C9933" stroke-width="1.8" stroke-linecap="round" />
		<path d="M18 14 L14 6" stroke="#FFA000" stroke-width="2" stroke-linecap="round" />
	</svg>
{:else if variant === 'umbrella'}
	<svg
		width={size}
		height={size}
		viewBox="0 0 48 48"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		class={className}
		aria-hidden="true"
	>
		<path
			d="M4 24 Q24 4 44 24 Q34 24 24 24 Q14 24 4 24 Z"
			fill="#7FB8E8"
			stroke="#4F8FD0"
			stroke-width="2"
		/>
		<path d="M4 24 Q14 18 14 24" fill="#C5E2F7" stroke="#4F8FD0" stroke-width="1.5" />
		<path d="M14 24 Q24 16 24 24" fill="#7FB8E8" stroke="#4F8FD0" stroke-width="1.5" />
		<path d="M24 24 Q34 16 34 24" fill="#C5E2F7" stroke="#4F8FD0" stroke-width="1.5" />
		<path d="M34 24 Q44 18 44 24" fill="#7FB8E8" stroke="#4F8FD0" stroke-width="1.5" />
		<line x1="24" y1="24" x2="24" y2="42" stroke="#7A5A1F" stroke-width="2.5" stroke-linecap="round" />
		<path d="M24 42 Q26 44 28 42" stroke="#7A5A1F" stroke-width="2" stroke-linecap="round" fill="none" />
	</svg>
{/if}
