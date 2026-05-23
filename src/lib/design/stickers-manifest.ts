/**
 * Manifest of all sticker assets in /static/stickers/.
 * Aspect ratio is approximate - used only for layout hinting.
 * All paths are URL-encoded for safe use in <img src>.
 */

export type StickerMeta = {
	id: string;
	src: string;
	alt: string;
	aspect: 'square' | 'portrait' | 'landscape' | 'wide';
	mood: 'sanrio' | 'kpop' | 'reggaeton' | 'meme' | 'food' | 'fandom';
};

export const STICKERS: StickerMeta[] = [
	{ id: 'snoopy', src: '/stickers/snoopy.webp', alt: 'snoopy', aspect: 'square', mood: 'fandom' },
	{ id: 'kitty', src: '/stickers/kitty.webp', alt: 'hello kitty', aspect: 'portrait', mood: 'sanrio' },
	{ id: 'mymelody', src: '/stickers/mymelody.webp', alt: 'my melody', aspect: 'square', mood: 'sanrio' },
	{ id: 'cinnamoroll', src: '/stickers/cinamorroll.webp', alt: 'cinnamoroll', aspect: 'square', mood: 'sanrio' },
	{ id: 'pompompurin', src: '/stickers/ponporunin.webp', alt: 'pompompurin', aspect: 'square', mood: 'sanrio' },
	{ id: 'gato-meme', src: '/stickers/gato%20meme.webp', alt: 'gatito', aspect: 'square', mood: 'meme' },
	{ id: 'pastel', src: '/stickers/pastel.webp', alt: 'pastelito', aspect: 'square', mood: 'food' },
	{ id: 'ateez', src: '/stickers/atezz.webp', alt: 'ATEEZ', aspect: 'wide', mood: 'kpop' },
	{ id: 'san', src: '/stickers/san.webp', alt: 'San', aspect: 'square', mood: 'kpop' },
	{ id: 'san2', src: '/stickers/san2.webp', alt: 'San', aspect: 'square', mood: 'kpop' },
	{ id: 'rauw', src: '/stickers/rauw%20png.webp', alt: 'Rauw Alejandro', aspect: 'portrait', mood: 'reggaeton' },
	{ id: 'percy', src: '/stickers/percy%20(1).webp', alt: 'Percy Jackson', aspect: 'portrait', mood: 'fandom' }
];

export function sticker(id: string): StickerMeta | undefined {
	return STICKERS.find((s) => s.id === id);
}

/**
 * Curated layout for the landing "portada" collage.
 * Positions use percentages relative to a 100x100 viewport-like box.
 * The container is centered and clips to viewport on phone.
 */
export type StickerPlacement = {
	id: string;
	top?: string; // %
	bottom?: string;
	left?: string;
	right?: string;
	size: string; // e.g. '90px'
	rotate: number; // deg
	z: number; // z-index
	delay?: number; // anim delay seconds
	float?: 'a' | 'b'; // animation variant
};

export const LANDING_LAYOUT: StickerPlacement[] = [
	// upper band
	{ id: 'snoopy', top: '2%', left: '50%', size: '110px', rotate: -6, z: 1, delay: 0, float: 'a' },
	{ id: 'kitty', top: '6%', left: '4%', size: '78px', rotate: 8, z: 2, delay: 0.4, float: 'b' },
	{ id: 'pastel', top: '8%', right: '6%', size: '64px', rotate: -10, z: 2, delay: 0.8, float: 'a' },
	// mid band — around title
	{ id: 'mymelody', top: '40%', left: '-2%', size: '92px', rotate: -12, z: 1, delay: 0.2, float: 'b' },
	{ id: 'cinnamoroll', top: '42%', right: '-2%', size: '88px', rotate: 14, z: 1, delay: 0.6, float: 'a' },
	{ id: 'gato-meme', top: '32%', right: '24%', size: '54px', rotate: 12, z: 2, delay: 1.0, float: 'b' },
	// lower band — fandoms
	{ id: 'ateez', bottom: '22%', left: '8%', size: '120px', rotate: -5, z: 1, delay: 0.3, float: 'a' },
	{ id: 'pompompurin', bottom: '32%', right: '6%', size: '70px', rotate: 18, z: 2, delay: 0.9, float: 'b' },
	{ id: 'rauw', bottom: '4%', left: '4%', size: '88px', rotate: -8, z: 1, delay: 0.5, float: 'b' },
	{ id: 'san', bottom: '8%', right: '20%', size: '60px', rotate: 9, z: 2, delay: 0.7, float: 'a' },
	{ id: 'percy', bottom: '2%', right: '4%', size: '78px', rotate: -10, z: 1, delay: 1.1, float: 'a' },
	{ id: 'san2', bottom: '14%', left: '36%', size: '52px', rotate: -14, z: 2, delay: 1.3, float: 'b' }
];

/**
 * Lighter sticker accents for in-game pages — only the cute Sanrio + food ones.
 * (Mantenido como default para compatibilidad)
 */
export const ACCENT_STICKERS: StickerPlacement[] = [
	{ id: 'mymelody', top: '5%', right: '-4%', size: '72px', rotate: 10, z: 0, delay: 0, float: 'a' },
	{ id: 'cinnamoroll', bottom: '8%', left: '-3%', size: '64px', rotate: -8, z: 0, delay: 0.4, float: 'b' },
	{ id: 'pastel', top: '38%', right: '3%', size: '40px', rotate: 12, z: 0, delay: 0.8, float: 'a' },
	{ id: 'pompompurin', bottom: '30%', right: '-2%', size: '54px', rotate: 14, z: 0, delay: 0.6, float: 'b' }
];

/**
 * Set para el LOBBY — vibe sanrio + meme acogedor.
 */
export const LOBBY_STICKERS: StickerPlacement[] = [
	{ id: 'kitty', top: '4%', left: '-3%', size: '74px', rotate: -8, z: 0, delay: 0, float: 'a' },
	{ id: 'mymelody', top: '12%', right: '-4%', size: '72px', rotate: 10, z: 0, delay: 0.4, float: 'b' },
	{ id: 'cinnamoroll', bottom: '20%', left: '-4%', size: '66px', rotate: -12, z: 0, delay: 0.8, float: 'a' },
	{ id: 'pompompurin', bottom: '8%', right: '-3%', size: '62px', rotate: 14, z: 0, delay: 0.2, float: 'b' },
	{ id: 'gato-meme', top: '46%', right: '2%', size: '46px', rotate: 18, z: 0, delay: 1.1, float: 'a' },
	{ id: 'pastel', bottom: '40%', left: '5%', size: '38px', rotate: -14, z: 0, delay: 0.6, float: 'b' }
];

/**
 * Set para TRIVIA — comida + sanrio cute, lateral y discreto (no compite con la pregunta).
 */
export const TRIVIA_STICKERS: StickerPlacement[] = [
	{ id: 'pastel', top: '6%', left: '-4%', size: '52px', rotate: -10, z: 0, delay: 0, float: 'a' },
	{ id: 'mymelody', bottom: '12%', right: '-5%', size: '64px', rotate: 12, z: 0, delay: 0.4, float: 'b' },
	{ id: 'cinnamoroll', bottom: '38%', left: '-4%', size: '58px', rotate: -8, z: 0, delay: 0.7, float: 'a' },
	{ id: 'pompompurin', top: '36%', right: '-3%', size: '48px', rotate: 14, z: 0, delay: 1.0, float: 'b' }
];

/**
 * Set para WHO'S MOST LIKELY — meme + kpop/reggaeton (vibe pícaro/dramático).
 */
export const WML_STICKERS: StickerPlacement[] = [
	{ id: 'gato-meme', top: '4%', left: '-3%', size: '60px', rotate: -12, z: 0, delay: 0, float: 'a' },
	{ id: 'ateez', top: '8%', right: '-2%', size: '90px', rotate: 8, z: 0, delay: 0.3, float: 'b' },
	{ id: 'rauw', bottom: '4%', left: '-4%', size: '72px', rotate: -10, z: 0, delay: 0.6, float: 'b' },
	{ id: 'percy', bottom: '10%', right: '-4%', size: '64px', rotate: 12, z: 0, delay: 0.9, float: 'a' },
	{ id: 'san', top: '52%', right: '2%', size: '44px', rotate: 16, z: 0, delay: 1.2, float: 'a' },
	{ id: 'san2', bottom: '42%', left: '4%', size: '42px', rotate: -14, z: 0, delay: 1.5, float: 'b' }
];

/**
 * Set para PHOTO CAPTURE — kawaii cute apoyando el "momento foto".
 */
export const PHOTO_STICKERS: StickerPlacement[] = [
	{ id: 'kitty', top: '4%', left: '-4%', size: '70px', rotate: -10, z: 0, delay: 0, float: 'a' },
	{ id: 'mymelody', top: '8%', right: '-4%', size: '66px', rotate: 12, z: 0, delay: 0.4, float: 'b' },
	{ id: 'snoopy', bottom: '6%', left: '-3%', size: '78px', rotate: -8, z: 0, delay: 0.7, float: 'a' },
	{ id: 'pastel', bottom: '14%', right: '-3%', size: '50px', rotate: 14, z: 0, delay: 1.0, float: 'b' }
];

/**
 * Set para SCROLL DETALLE del WRAPPED — mezcla rotada según posición.
 */
export const WRAPPED_ACCENTS: StickerPlacement[] = [
	{ id: 'kitty', top: '2%', left: '-2%', size: '60px', rotate: -10, z: 0, delay: 0, float: 'b' },
	{ id: 'snoopy', top: '8%', right: '-3%', size: '70px', rotate: 8, z: 0, delay: 0.3, float: 'a' },
	{ id: 'ateez', top: '24%', left: '0%', size: '70px', rotate: -6, z: 0, delay: 0.5, float: 'b' },
	{ id: 'gato-meme', top: '38%', right: '-3%', size: '50px', rotate: 16, z: 0, delay: 0.7, float: 'a' },
	{ id: 'rauw', bottom: '42%', left: '-3%', size: '68px', rotate: -12, z: 0, delay: 0.9, float: 'b' },
	{ id: 'mymelody', bottom: '24%', right: '-3%', size: '64px', rotate: 14, z: 0, delay: 1.1, float: 'a' },
	{ id: 'percy', bottom: '8%', left: '-3%', size: '60px', rotate: -8, z: 0, delay: 1.3, float: 'b' },
	{ id: 'pompompurin', bottom: '4%', right: '-2%', size: '58px', rotate: 10, z: 0, delay: 1.5, float: 'a' }
];

/**
 * Stickers grandes para momentos hero del wrapped (cover, outro).
 */
export const WRAPPED_HERO_STICKERS: StickerPlacement[] = [
	{ id: 'snoopy', top: '8%', left: '-2%', size: '88px', rotate: -8, z: 1, delay: 0, float: 'a' },
	{ id: 'ateez', top: '14%', right: '-2%', size: '100px', rotate: 6, z: 1, delay: 0.3, float: 'b' },
	{ id: 'kitty', bottom: '14%', left: '-3%', size: '78px', rotate: 10, z: 1, delay: 0.6, float: 'a' },
	{ id: 'mymelody', bottom: '8%', right: '-3%', size: '82px', rotate: -12, z: 1, delay: 0.9, float: 'b' }
];

/**
 * Set ligero para momentos stat del wrapped (números grandes, no saturar).
 */
export const WRAPPED_STAT_STICKERS: StickerPlacement[] = [
	{ id: 'pompompurin', top: '6%', right: '-3%', size: '60px', rotate: 12, z: 0, delay: 0, float: 'a' },
	{ id: 'pastel', bottom: '12%', left: '-3%', size: '46px', rotate: -10, z: 0, delay: 0.4, float: 'b' }
];
