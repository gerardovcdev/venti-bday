export type StickerPlacement = {
	src: string;
	alt: string;
	top?: string;
	bottom?: string;
	left?: string;
	right?: string;
	size: string;
	rotate?: string;
	animation?: 'float' | 'float-alt' | 'sparkle';
	opacity?: number;
};

export const KOREAN_DECORATIONS: string[] = [
	'행복한 생일',
	'귀여워',
	'최고',
	'사랑해',
	'반짝반짝',
	'벤띠',
	'생일 축하해',
	'좋아',
	'예뻐'
];

export function pickKoreanDecorations(count: number, seed = Math.random()): string[] {
	const arr = [...KOREAN_DECORATIONS];
	const out: string[] = [];
	let s = Math.floor(seed * 1e9);
	for (let i = 0; i < count && arr.length; i++) {
		s = (s * 9301 + 49297) % 233280;
		const idx = Math.floor((s / 233280) * arr.length);
		out.push(arr.splice(idx, 1)[0]);
	}
	return out;
}
