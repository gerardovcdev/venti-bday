/**
 * Renderizado pixel-perfect del wrapped a imagen est tica (PNG) y video
 * cinem tico (MP4/WebM). Todo se dibuja sobre <canvas> programaticamente,
 * sin tocar HTML.
 *
 * Filosof a (rev. 2026-05): la foto del jugador es la protagonista. Stickers
 * sanrio/kpop/reggaeton flotan alrededor como en un scrapbook coreano.
 * Pacing cinem tico (~35s) tipo Spotify Wrapped pero con sello "y2k kawaii".
 */

export type SharePlayer = {
	id: string;
	name: string;
	initials: string;
	photoUrl: string | null;
	color: { bg: string; fg: string; ring: string };
};

export type ShareData = {
	me: SharePlayer;
	team: SharePlayer[];
	stats: {
		correct: number;
		total: number;
		votesReceived: number;
	};
	highlight?: {
		prompt: string;
		winnerName: string;
	};
	hardestQuestion?: {
		question: string;
		answer: string;
	};
};

// -------------------- carga de im genes --------------------

const imageCache = new Map<string, HTMLImageElement>();

async function loadImage(url: string): Promise<HTMLImageElement | null> {
	if (imageCache.has(url)) return imageCache.get(url)!;
	return new Promise((resolve) => {
		const img = new Image();
		img.crossOrigin = 'anonymous';
		img.onload = () => {
			imageCache.set(url, img);
			resolve(img);
		};
		img.onerror = () => resolve(null);
		img.src = url;
	});
}

async function preloadPhotos(data: ShareData): Promise<Map<string, HTMLImageElement>> {
	const map = new Map<string, HTMLImageElement>();
	const urls: { id: string; url: string }[] = [];
	if (data.me.photoUrl) urls.push({ id: data.me.id, url: data.me.photoUrl });
	for (const p of data.team) {
		if (p.photoUrl) urls.push({ id: p.id, url: p.photoUrl });
	}
	const loaded = await Promise.all(
		urls.map((u) => loadImage(u.url).then((img) => ({ id: u.id, img })))
	);
	for (const { id, img } of loaded) {
		if (img) map.set(id, img);
	}
	return map;
}

// Stickers — IDs deben coincidir con stickers-manifest.ts
const STICKER_PATHS: Record<string, string> = {
	kitty: '/stickers/kitty.webp',
	mymelody: '/stickers/mymelody.webp',
	cinnamoroll: '/stickers/cinamorroll.webp',
	pompompurin: '/stickers/ponporunin.webp',
	snoopy: '/stickers/snoopy.webp',
	'gato-meme': '/stickers/gato%20meme.webp',
	pastel: '/stickers/pastel.webp',
	ateez: '/stickers/atezz.webp',
	san: '/stickers/san.webp',
	san2: '/stickers/san2.webp',
	rauw: '/stickers/rauw%20png.webp',
	percy: '/stickers/percy%20(1).webp'
};

async function preloadStickers(ids: string[]): Promise<Map<string, HTMLImageElement>> {
	const map = new Map<string, HTMLImageElement>();
	const entries = ids
		.map((id) => ({ id, src: STICKER_PATHS[id] }))
		.filter((e): e is { id: string; src: string } => !!e.src);
	const loaded = await Promise.all(
		entries.map((e) => loadImage(e.src).then((img) => ({ id: e.id, img })))
	);
	for (const { id, img } of loaded) {
		if (img) map.set(id, img);
	}
	return map;
}

// -------------------- primitivas --------------------

function roundedPath(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	w: number,
	h: number,
	r: number
) {
	const rr = Math.min(r, w / 2, h / 2);
	ctx.beginPath();
	ctx.moveTo(x + rr, y);
	ctx.arcTo(x + w, y, x + w, y + h, rr);
	ctx.arcTo(x + w, y + h, x, y + h, rr);
	ctx.arcTo(x, y + h, x, y, rr);
	ctx.arcTo(x, y, x + w, y, rr);
	ctx.closePath();
}

function drawCircleImage(
	ctx: CanvasRenderingContext2D,
	img: HTMLImageElement,
	cx: number,
	cy: number,
	radius: number,
	ring?: { color: string; width: number }
) {
	ctx.save();
	ctx.beginPath();
	ctx.arc(cx, cy, radius, 0, Math.PI * 2);
	ctx.closePath();
	ctx.clip();
	const iw = img.naturalWidth;
	const ih = img.naturalHeight;
	const scale = Math.max((radius * 2) / iw, (radius * 2) / ih);
	const dw = iw * scale;
	const dh = ih * scale;
	ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
	ctx.restore();
	if (ring) {
		ctx.beginPath();
		ctx.arc(cx, cy, radius + ring.width / 2, 0, Math.PI * 2);
		ctx.lineWidth = ring.width;
		ctx.strokeStyle = ring.color;
		ctx.stroke();
	}
}

function drawInitialsAvatar(
	ctx: CanvasRenderingContext2D,
	initials: string,
	cx: number,
	cy: number,
	radius: number,
	color: { bg: string; fg: string; ring: string }
) {
	ctx.save();
	ctx.beginPath();
	ctx.arc(cx, cy, radius, 0, Math.PI * 2);
	ctx.closePath();
	ctx.fillStyle = color.bg;
	ctx.fill();
	ctx.lineWidth = 6;
	ctx.strokeStyle = color.ring;
	ctx.stroke();
	ctx.fillStyle = color.fg;
	ctx.font = `bold ${Math.round(radius * 0.7)}px "Caveat", "Nanum Pen Script", system-ui, sans-serif`;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillText(initials.slice(0, 2).toUpperCase(), cx, cy + radius * 0.04);
	ctx.restore();
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
	const words = text.split(/\s+/);
	const lines: string[] = [];
	let current = '';
	for (const w of words) {
		const test = current ? current + ' ' + w : w;
		if (ctx.measureText(test).width <= maxWidth) {
			current = test;
		} else {
			if (current) lines.push(current);
			current = w;
		}
	}
	if (current) lines.push(current);
	return lines;
}

function drawText(
	ctx: CanvasRenderingContext2D,
	text: string,
	x: number,
	y: number,
	opts: {
		font: string;
		color: string;
		align?: CanvasTextAlign;
		baseline?: CanvasTextBaseline;
		maxWidth?: number;
		lineHeight?: number;
		shadow?: { color: string; blur: number; dy?: number };
	}
): number {
	ctx.save();
	ctx.font = opts.font;
	ctx.fillStyle = opts.color;
	ctx.textAlign = opts.align ?? 'left';
	ctx.textBaseline = opts.baseline ?? 'alphabetic';
	if (opts.shadow) {
		ctx.shadowColor = opts.shadow.color;
		ctx.shadowBlur = opts.shadow.blur;
		ctx.shadowOffsetY = opts.shadow.dy ?? 0;
	}
	const lh = opts.lineHeight ?? 0;
	if (opts.maxWidth) {
		const lines = wrapLines(ctx, text, opts.maxWidth);
		let cy = y;
		for (const line of lines) {
			ctx.fillText(line, x, cy);
			cy += lh;
		}
		ctx.restore();
		return cy - y;
	}
	ctx.fillText(text, x, y);
	ctx.restore();
	return lh;
}

function drawGradientText(
	ctx: CanvasRenderingContext2D,
	text: string,
	x: number,
	y: number,
	font: string,
	colors: string[],
	align: CanvasTextAlign = 'center'
) {
	ctx.save();
	ctx.font = font;
	ctx.textAlign = align;
	ctx.textBaseline = 'alphabetic';
	const m = ctx.measureText(text);
	const w = m.width;
	const h = (m.actualBoundingBoxAscent ?? 40) + (m.actualBoundingBoxDescent ?? 10);
	const startX = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
	const grad = ctx.createLinearGradient(startX, 0, startX + w, 0);
	const step = 1 / Math.max(colors.length - 1, 1);
	colors.forEach((c, i) => grad.addColorStop(i * step, c));
	ctx.fillStyle = grad;
	ctx.shadowColor = 'rgba(79,143,208,0.22)';
	ctx.shadowBlur = 20;
	ctx.shadowOffsetY = 4;
	ctx.fillText(text, x, y);
	ctx.restore();
	return { width: w, height: h };
}

function drawHeart(
	ctx: CanvasRenderingContext2D,
	cx: number,
	cy: number,
	size: number,
	color: string,
	rotate = 0
) {
	ctx.save();
	ctx.translate(cx, cy);
	if (rotate) ctx.rotate((rotate * Math.PI) / 180);
	ctx.fillStyle = color;
	ctx.scale(size / 32, size / 32);
	ctx.beginPath();
	ctx.moveTo(0, -6);
	ctx.bezierCurveTo(-2, -14, -16, -14, -16, -2);
	ctx.bezierCurveTo(-16, 8, -6, 12, 0, 18);
	ctx.bezierCurveTo(6, 12, 16, 8, 16, -2);
	ctx.bezierCurveTo(16, -14, 2, -14, 0, -6);
	ctx.closePath();
	ctx.fill();
	ctx.restore();
}

function drawSparkle(
	ctx: CanvasRenderingContext2D,
	cx: number,
	cy: number,
	size: number,
	color: string,
	rotate = 0
) {
	ctx.save();
	ctx.fillStyle = color;
	ctx.translate(cx, cy);
	if (rotate) ctx.rotate((rotate * Math.PI) / 180);
	ctx.beginPath();
	const s = size / 2;
	ctx.moveTo(0, -s);
	ctx.quadraticCurveTo(s * 0.18, -s * 0.18, s, 0);
	ctx.quadraticCurveTo(s * 0.18, s * 0.18, 0, s);
	ctx.quadraticCurveTo(-s * 0.18, s * 0.18, -s, 0);
	ctx.quadraticCurveTo(-s * 0.18, -s * 0.18, 0, -s);
	ctx.closePath();
	ctx.fill();
	ctx.restore();
}

// Polaroid grande con tilt y stickers alrededor
function drawPolaroid(
	ctx: CanvasRenderingContext2D,
	cx: number,
	cy: number,
	w: number,
	h: number,
	img: HTMLImageElement | null,
	caption: string,
	rotate: number,
	color: { bg: string; fg: string; ring: string },
	opts: { showCaption?: boolean; tapeColor?: string } = {}
) {
	const { showCaption = true, tapeColor } = opts;
	ctx.save();
	ctx.translate(cx, cy);
	ctx.rotate((rotate * Math.PI) / 180);
	// sombra del marco
	ctx.shadowColor = 'rgba(31,58,92,0.28)';
	ctx.shadowBlur = 22;
	ctx.shadowOffsetY = 8;
	// frame blanco
	const captionH = showCaption ? Math.max(48, w * 0.16) : 14;
	ctx.fillStyle = '#FFFFFF';
	const frameW = w;
	const frameH = h + captionH;
	roundedPath(ctx, -frameW / 2, -frameH / 2, frameW, frameH, 10);
	ctx.fill();
	ctx.shadowColor = 'transparent';
	// inner photo area
	const padding = Math.max(10, w * 0.04);
	const innerX = -w / 2 + padding;
	const innerY = -frameH / 2 + padding;
	const innerW = w - padding * 2;
	const innerH = h - padding * 2;
	if (img) {
		ctx.save();
		roundedPath(ctx, innerX, innerY, innerW, innerH, 6);
		ctx.clip();
		const iw = img.naturalWidth;
		const ih = img.naturalHeight;
		const scale = Math.max(innerW / iw, innerH / ih);
		const dw = iw * scale;
		const dh = ih * scale;
		ctx.drawImage(img, innerX + (innerW - dw) / 2, innerY + (innerH - dh) / 2, dw, dh);
		ctx.restore();
	} else {
		ctx.fillStyle = color.bg;
		roundedPath(ctx, innerX, innerY, innerW, innerH, 6);
		ctx.fill();
		ctx.fillStyle = color.fg;
		ctx.font = `bold ${Math.round(innerW * 0.3)}px "Caveat", system-ui, sans-serif`;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText('♡', innerX + innerW / 2, innerY + innerH / 2);
	}
	// tape (cinta washi tape arriba)
	if (tapeColor) {
		ctx.save();
		ctx.globalAlpha = 0.85;
		ctx.fillStyle = tapeColor;
		const tapeW = w * 0.32;
		const tapeH = Math.max(18, w * 0.07);
		ctx.translate(0, -frameH / 2 - 4);
		ctx.rotate(-0.08);
		ctx.fillRect(-tapeW / 2, 0, tapeW, tapeH);
		ctx.restore();
	}
	// caption
	if (showCaption) {
		ctx.fillStyle = '#4F8FD0';
		ctx.font = `${Math.round(w * 0.14)}px "Nanum Pen Script", "Caveat", cursive`;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText(caption, 0, h / 2 + captionH / 2);
	}
	ctx.restore();
}

// Dibuja un sticker (image) con rotaci n y tama o
function drawSticker(
	ctx: CanvasRenderingContext2D,
	img: HTMLImageElement | undefined,
	cx: number,
	cy: number,
	size: number,
	rotate: number,
	alpha = 1
) {
	if (!img) return;
	ctx.save();
	ctx.globalAlpha = alpha;
	ctx.translate(cx, cy);
	ctx.rotate((rotate * Math.PI) / 180);
	// drop shadow sutil para que el sticker se levante del fondo
	ctx.shadowColor = 'rgba(31,58,92,0.18)';
	ctx.shadowBlur = 12;
	ctx.shadowOffsetY = 4;
	const iw = img.naturalWidth;
	const ih = img.naturalHeight;
	const scale = size / Math.max(iw, ih);
	const dw = iw * scale;
	const dh = ih * scale;
	ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
	ctx.restore();
}

function fillBackground(
	ctx: CanvasRenderingContext2D,
	w: number,
	h: number,
	variant: 'cream' | 'sunset' | 'beach' = 'cream'
) {
	let grad: CanvasGradient;
	if (variant === 'sunset') {
		grad = ctx.createLinearGradient(0, 0, w, h);
		grad.addColorStop(0, '#DDEFFB');
		grad.addColorStop(0.5, '#B8DEF4');
		grad.addColorStop(1, '#DCE5FB');
	} else if (variant === 'beach') {
		grad = ctx.createLinearGradient(0, 0, 0, h);
		grad.addColorStop(0, '#C7E3FF');
		grad.addColorStop(0.5, '#DDEFFB');
		grad.addColorStop(1, '#FFE8C0');
	} else {
		grad = ctx.createLinearGradient(0, 0, w, h);
		grad.addColorStop(0, '#F0F8FF');
		grad.addColorStop(0.5, '#DDEFFB');
		grad.addColorStop(1, '#ECECFB');
	}
	ctx.fillStyle = grad;
	ctx.fillRect(0, 0, w, h);
}

function drawConfetti(ctx: CanvasRenderingContext2D, w: number, h: number, seed: number, density = 28) {
	let s = seed;
	const rand = () => {
		s = (s * 9301 + 49297) % 233280;
		return s / 233280;
	};
	for (let i = 0; i < density; i++) {
		const x = rand() * w;
		const y = rand() * h;
		const r = 4 + rand() * 9;
		const c = ['#A8CFF0', '#C5E2F7', '#E8D5FF', '#D5EAF8', '#FFE8C0'][Math.floor(rand() * 5)];
		ctx.save();
		ctx.globalAlpha = 0.42;
		ctx.fillStyle = c;
		ctx.beginPath();
		ctx.arc(x, y, r, 0, Math.PI * 2);
		ctx.fill();
		ctx.restore();
	}
}

async function ensureFontsReady() {
	if (typeof document === 'undefined' || !document.fonts) return;
	try {
		await Promise.race([
			document.fonts.ready,
			new Promise<void>((resolve) => setTimeout(resolve, 2000))
		]);
		const probes = ['40px "Caveat"', '40px "Nanum Pen Script"', '30px "Gowun Dodum"'];
		await Promise.all(probes.map((f) => document.fonts.load(f, 'venti ♡').catch(() => null)));
	} catch {
		/* ignore */
	}
}

// -------------------- PNG est tico --------------------

const CARD_W = 1080;
const CARD_H = 1920;

// Disposici n de stickers que rodean la foto hero del PNG (relativos al canvas)
type StickerPos = { id: string; x: number; y: number; size: number; rotate: number };

const HERO_STICKER_LAYOUT: StickerPos[] = [
	// Esquinas alrededor de la foto hero (foto centrada en ~y=900, ~700x900)
	{ id: 'kitty', x: 110, y: 470, size: 140, rotate: -14 },
	{ id: 'ateez', x: 950, y: 510, size: 170, rotate: 12 },
	{ id: 'rauw', x: 100, y: 1280, size: 150, rotate: 15 },
	{ id: 'mymelody', x: 970, y: 1310, size: 135, rotate: -10 },
	// Acentos m s peque os flotando
	{ id: 'gato-meme', x: 230, y: 850, size: 80, rotate: 18 },
	{ id: 'pastel', x: 870, y: 880, size: 75, rotate: -16 }
];

// Stickers para team strip (esquinas)
const FOOTER_STICKER_LAYOUT: StickerPos[] = [
	{ id: 'snoopy', x: 90, y: 1750, size: 110, rotate: -8 },
	{ id: 'percy', x: 985, y: 1755, size: 100, rotate: 10 }
];

export async function buildShareImage(
	data: ShareData
): Promise<{ blob: Blob; mime: string; extension: string }> {
	await ensureFontsReady();
	const [photos, stickers] = await Promise.all([
		preloadPhotos(data),
		preloadStickers([
			'kitty',
			'ateez',
			'rauw',
			'mymelody',
			'gato-meme',
			'pastel',
			'snoopy',
			'percy',
			'cinnamoroll',
			'pompompurin'
		])
	]);
	const canvas = document.createElement('canvas');
	canvas.width = CARD_W;
	canvas.height = CARD_H;
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('Canvas no soportado');

	// fondo
	fillBackground(ctx, CARD_W, CARD_H, 'sunset');
	drawConfetti(ctx, CARD_W, CARD_H, 42, 22);

	// --- HEADER (compacto, deja espacio a la foto) ---
	drawText(ctx, '벤띠 생일', CARD_W / 2, 110, {
		font: '52px "Nanum Pen Script", "Caveat", cursive',
		color: '#7FB8E8',
		align: 'center',
		shadow: { color: 'rgba(255,255,255,0.7)', blur: 4 }
	});
	drawGradientText(ctx, 'venti b-day ♡ wrapped', CARD_W / 2, 200, '700 70px "Caveat", cursive', [
		'#7FB8E8',
		'#4F8FD0',
		'#7FB8E8'
	]);

	// --- FOTO HERO (60% del canvas) ---
	// Polaroid grande: 700x900 (interior 660x860). Levemente inclinada.
	const heroW = 700;
	const heroH = 900;
	const heroCx = CARD_W / 2;
	const heroCy = 880;
	const meColor = data.me.color;
	const heroPhoto = photos.get(data.me.id);

	// "shadow box" para que destaque sobre el fondo
	ctx.save();
	ctx.fillStyle = 'rgba(255,255,255,0.55)';
	ctx.shadowColor = 'rgba(79,143,208,0.25)';
	ctx.shadowBlur = 50;
	roundedPath(ctx, heroCx - heroW / 2 - 30, heroCy - heroH / 2 - 30, heroW + 60, heroH + 100, 28);
	ctx.fill();
	ctx.restore();

	drawPolaroid(
		ctx,
		heroCx,
		heroCy,
		heroW,
		heroH,
		heroPhoto ?? null,
		data.me.name,
		-3,
		meColor,
		{ showCaption: true, tapeColor: '#A8CFF0' }
	);

	// Stickers flotando alrededor de la foto hero
	for (const sp of HERO_STICKER_LAYOUT) {
		drawSticker(ctx, stickers.get(sp.id), sp.x, sp.y, sp.size, sp.rotate);
	}
	// Sparkles sutiles (sin corazones — keep it clean)
	drawSparkle(ctx, heroCx + heroW / 2 + 60, heroCy - heroH / 2 + 80, 28, '#A8CFF0');
	drawSparkle(ctx, heroCx - heroW / 2 - 60, heroCy + heroH / 2 - 100, 24, '#E8D5FF');

	// --- STAT clave (debajo de la foto, compacto) ---
	const statY = 1480;
	// pill background
	ctx.save();
	ctx.fillStyle = 'rgba(255,255,255,0.78)';
	ctx.shadowColor = 'rgba(127,184,232,0.32)';
	ctx.shadowBlur = 24;
	roundedPath(ctx, 180, statY, CARD_W - 360, 140, 70);
	ctx.fill();
	ctx.restore();
	drawText(ctx, 'tu trivia ♡', CARD_W / 2, statY + 55, {
		font: '38px "Nanum Pen Script", cursive',
		color: '#7FB8E8',
		align: 'center'
	});
	drawGradientText(
		ctx,
		`${data.stats.correct}/${data.stats.total} correctas`,
		CARD_W / 2,
		statY + 115,
		'700 60px "Caveat", cursive',
		['#4F8FD0', '#7FB8E8', '#4F8FD0']
	);

	// --- TEAM strip mini polaroids ---
	const teamY = 1700;
	drawText(ctx, 'el equipo de la fiesta', CARD_W / 2, teamY - 30, {
		font: '38px "Nanum Pen Script", cursive',
		color: '#4F8FD0',
		align: 'center'
	});
	const teamCount = Math.min(data.team.length, 5);
	const pw = 145;
	const ph = 145;
	const gap = 20;
	const totalW = teamCount * pw + (teamCount - 1) * gap;
	const startX = (CARD_W - totalW) / 2 + pw / 2;
	for (let i = 0; i < teamCount; i++) {
		const p = data.team[i];
		const cx = startX + i * (pw + gap);
		const rot = (i % 2 === 0 ? -1 : 1) * (4 + (i % 3));
		drawPolaroid(ctx, cx, teamY + 80, pw, ph, photos.get(p.id) ?? null, p.name, rot, p.color);
	}

	// Stickers en esquinas inferiores (footer)
	for (const sp of FOOTER_STICKER_LAYOUT) {
		drawSticker(ctx, stickers.get(sp.id), sp.x, sp.y, sp.size, sp.rotate);
	}

	// --- FOOTER: watermark estilo coreano "venti b-day" ---
	drawGradientText(ctx, '벤띠 생일', CARD_W / 2, CARD_H - 65, '700 64px "Nanum Pen Script", "Cafe24 Oneprettynight", cursive', [
		'#4F8FD0',
		'#7FB8E8',
		'#4F8FD0'
	]);
	drawText(ctx, 'venti b-day ・ 2026', CARD_W / 2, CARD_H - 20, {
		font: '30px "Caveat", cursive',
		color: '#7FB8E8',
		align: 'center'
	});

	const blob = await new Promise<Blob | null>((resolve) =>
		canvas.toBlob((b) => resolve(b), 'image/png')
	);
	if (!blob) throw new Error('No se pudo generar la imagen');
	return { blob, mime: 'image/png', extension: 'png' };
}

// -------------------- VIDEO cinem tico --------------------

const VIDEO_W = 720;
const VIDEO_H = 1280;
const FPS = 30;

type RenderCtx = {
	photos: Map<string, HTMLImageElement>;
	stickers: Map<string, HTMLImageElement>;
};

type SlideRenderer = (
	ctx: CanvasRenderingContext2D,
	w: number,
	h: number,
	t: number,
	r: RenderCtx
) => void;

type Slide = { duration: number; render: SlideRenderer };

function easeOutCubic(x: number): number {
	return 1 - Math.pow(1 - x, 3);
}
function easeInOutCubic(x: number): number {
	return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}
function easeOutBack(x: number): number {
	const c1 = 1.70158;
	const c3 = c1 + 1;
	return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

function fadeInOut(t: number, holdRatio = 0.7): number {
	const fade = (1 - holdRatio) / 2;
	if (t < fade) return easeOutCubic(t / fade);
	if (t > 1 - fade) return easeOutCubic((1 - t) / fade);
	return 1;
}

// Stickers flotando con animaci n sinusoidal sutil
type FloatingSticker = {
	id: string;
	x: number; // base position
	y: number;
	size: number;
	rotate: number; // base rotation
	floatAmp: number; // amplitud de vaiv n vertical px
	rotAmp: number; // amplitud de rotaci n
	phase: number; // offset de fase
};

function drawFloatingStickers(
	ctx: CanvasRenderingContext2D,
	stickers: Map<string, HTMLImageElement>,
	items: FloatingSticker[],
	t: number,
	globalT: number, // tiempo global continuo para vaiv n
	alpha = 1
) {
	for (const s of items) {
		const phase = s.phase + globalT * 1.6;
		const dy = Math.sin(phase) * s.floatAmp;
		const drot = Math.sin(phase * 0.8) * s.rotAmp;
		// reveal anim: aparece con scale + fade
		const reveal = easeOutBack(Math.min(t * 1.4, 1));
		ctx.save();
		ctx.globalAlpha = alpha;
		ctx.translate(s.x, s.y + dy);
		ctx.rotate(((s.rotate + drot) * Math.PI) / 180);
		ctx.scale(reveal, reveal);
		const img = stickers.get(s.id);
		if (img) {
			ctx.shadowColor = 'rgba(31,58,92,0.18)';
			ctx.shadowBlur = 14;
			ctx.shadowOffsetY = 5;
			const iw = img.naturalWidth;
			const ih = img.naturalHeight;
			const sc = s.size / Math.max(iw, ih);
			ctx.drawImage(img, (-iw * sc) / 2, (-ih * sc) / 2, iw * sc, ih * sc);
		}
		ctx.restore();
	}
}

function buildSlides(data: ShareData): Slide[] {
	const slides: Slide[] = [];

	// ---------- 1. INTRO: t tulo aparece con stickers entrando ----------
	slides.push({
		duration: 4.5,
		render: (ctx, w, h, t, r) => {
			fillBackground(ctx, w, h, 'sunset');
			drawConfetti(ctx, w, h, 17, 18);
			const a = fadeInOut(t, 0.78);

			// stickers entrando desde los lados con bounce
			const inAnim = easeOutBack(Math.min(t * 1.5, 1));
			ctx.save();
			ctx.globalAlpha = a;
			drawSticker(ctx, r.stickers.get('kitty'), 100 - (1 - inAnim) * 200, 200, 130, -15);
			drawSticker(ctx, r.stickers.get('ateez'), w - 110 + (1 - inAnim) * 200, 220, 150, 12);
			drawSticker(ctx, r.stickers.get('rauw'), 110 - (1 - inAnim) * 250, h - 280, 130, 15);
			drawSticker(ctx, r.stickers.get('mymelody'), w - 100 + (1 - inAnim) * 250, h - 250, 120, -10);
			ctx.restore();

			// t tulo
			ctx.save();
			ctx.globalAlpha = a;
			drawText(ctx, '벤띠 생일', w / 2, h * 0.34, {
				font: '40px "Nanum Pen Script", cursive',
				color: '#7FB8E8',
				align: 'center'
			});
			const scale = 0.88 + 0.12 * easeOutBack(Math.min(t * 1.5, 1));
			ctx.translate(w / 2, h * 0.5);
			ctx.scale(scale, scale);
			drawGradientText(ctx, 'venti b-day ♡', 0, 0, '700 80px "Caveat", cursive', [
				'#7FB8E8',
				'#4F8FD0',
				'#7FB8E8'
			]);
			drawGradientText(ctx, 'wrapped', 0, 92, '700 80px "Caveat", cursive', [
				'#A8CFF0',
				'#7FB8E8',
				'#4F8FD0'
			]);
			ctx.restore();

			// sparkles pulsando (sin corazones)
			ctx.save();
			ctx.globalAlpha = a;
			const sparkleBeat = 1 + Math.sin(t * Math.PI * 4) * 0.18;
			drawSparkle(ctx, w / 2 - 180, h * 0.66, 22 * sparkleBeat, '#7FB8E8');
			drawSparkle(ctx, w / 2 + 180, h * 0.66, 22 * sparkleBeat, '#4F8FD0');
			drawSparkle(ctx, w / 2 - 110, h * 0.72, 16, '#A8CFF0');
			drawSparkle(ctx, w / 2 + 110, h * 0.72, 16, '#A8CFF0');
			ctx.restore();
		}
	});

	// ---------- 2. HERO PERSONAL: foto del jugador como protagonista (zoom-in lento) ----------
	slides.push({
		duration: 6.5,
		render: (ctx, w, h, t, r) => {
			fillBackground(ctx, w, h, 'cream');
			drawConfetti(ctx, w, h, 88, 16);
			const a = fadeInOut(t, 0.82);

			// stickers flotantes alrededor
			const floats: FloatingSticker[] = [
				{ id: 'kitty', x: 90, y: 280, size: 110, rotate: -14, floatAmp: 8, rotAmp: 3, phase: 0 },
				{ id: 'ateez', x: w - 100, y: 320, size: 130, rotate: 12, floatAmp: 10, rotAmp: 4, phase: 1.2 },
				{ id: 'rauw', x: 100, y: h - 380, size: 115, rotate: 16, floatAmp: 9, rotAmp: 3.5, phase: 2.4 },
				{ id: 'mymelody', x: w - 110, y: h - 360, size: 105, rotate: -10, floatAmp: 7, rotAmp: 3, phase: 0.6 }
			];
			drawFloatingStickers(ctx, r.stickers, floats, t, t, a);

			// hint script arriba
			ctx.save();
			ctx.globalAlpha = a;
			drawText(ctx, 'esta eres tú ♡', w / 2, h * 0.13, {
				font: '38px "Nanum Pen Script", cursive',
				color: '#7FB8E8',
				align: 'center'
			});
			ctx.restore();

			// FOTO HERO POLAROID grande (zoom-in cinem tico)
			const zoom = 0.92 + 0.1 * easeInOutCubic(Math.min(t * 1.2, 1));
			const tilt = -3 + Math.sin(t * 1.2) * 1.5;
			const pw = 430 * zoom;
			const ph = 540 * zoom;
			const cx = w / 2;
			const cy = h * 0.5;
			ctx.save();
			ctx.globalAlpha = a;
			drawPolaroid(
				ctx,
				cx,
				cy,
				pw,
				ph,
				r.photos.get(data.me.id) ?? null,
				data.me.name,
				tilt,
				data.me.color,
				{ showCaption: true, tapeColor: '#A8CFF0' }
			);
			ctx.restore();

			// sparkles sutiles alrededor de la foto (sin corazones)
			ctx.save();
			ctx.globalAlpha = a;
			const sBeat = 1 + Math.sin(t * Math.PI * 5) * 0.2;
			drawSparkle(ctx, cx - pw / 2 - 40, cy + ph / 3, 20 * sBeat, '#7FB8E8');
			drawSparkle(ctx, cx + pw / 2 + 40, cy - ph / 3, 24 * sBeat, '#4F8FD0');
			ctx.restore();

			// Nombre debajo, aparece despu s
			ctx.save();
			ctx.globalAlpha = a * easeOutCubic(Math.max(0, Math.min((t - 0.3) * 2, 1)));
			drawGradientText(
				ctx,
				'protagonista del día',
				w / 2,
				h * 0.92,
				'700 36px "Caveat", cursive',
				['#4F8FD0', '#7FB8E8', '#4F8FD0']
			);
			ctx.restore();
		}
	});

	// ---------- 3. STAT TRIVIA: n mero gigante revealing con foto chiquita ----------
	if (data.stats.total > 0) {
		slides.push({
			duration: 5.0,
			render: (ctx, w, h, t, r) => {
				fillBackground(ctx, w, h, 'sunset');
				drawConfetti(ctx, w, h, 31, 18);
				const a = fadeInOut(t, 0.82);

				// stickers laterales flotando
				const floats: FloatingSticker[] = [
					{ id: 'pompompurin', x: 90, y: 250, size: 95, rotate: 14, floatAmp: 8, rotAmp: 3, phase: 0 },
					{ id: 'gato-meme', x: w - 90, y: 270, size: 85, rotate: -12, floatAmp: 7, rotAmp: 3, phase: 1.5 },
					{ id: 'pastel', x: 80, y: h - 250, size: 80, rotate: -10, floatAmp: 6, rotAmp: 3, phase: 0.8 },
					{ id: 'san', x: w - 85, y: h - 270, size: 80, rotate: 16, floatAmp: 7, rotAmp: 4, phase: 2.2 }
				];
				drawFloatingStickers(ctx, r.stickers, floats, t, t, a);

				ctx.save();
				ctx.globalAlpha = a;
				drawText(ctx, 'tu trivia ♡', w / 2, h * 0.16, {
					font: '40px "Nanum Pen Script", cursive',
					color: '#7FB8E8',
					align: 'center'
				});
				ctx.restore();

				// Foto chiquita en c rculo arriba (te conecta con la stat)
				const photo = r.photos.get(data.me.id);
				if (photo) {
					ctx.save();
					ctx.globalAlpha = a;
					drawCircleImage(ctx, photo, w / 2, h * 0.3, 90, { color: data.me.color.ring, width: 8 });
					ctx.restore();
				}

				// N mero gigante con bounce reveal
				const reveal = easeOutBack(Math.min(t * 1.5, 1));
				ctx.save();
				ctx.globalAlpha = a;
				ctx.translate(w / 2, h * 0.56);
				ctx.scale(0.5 + 0.5 * reveal, 0.5 + 0.5 * reveal);
				drawGradientText(ctx, `${data.stats.correct}`, 0, 0, '700 260px "Caveat", cursive', [
					'#4F8FD0',
					'#7FB8E8',
					'#4F8FD0'
				]);
				ctx.restore();

				ctx.save();
				ctx.globalAlpha = a * easeOutCubic(Math.max(0, Math.min((t - 0.3) * 2, 1)));
				drawText(ctx, `de ${data.stats.total} correctas`, w / 2, h * 0.72, {
					font: '46px "Caveat", cursive',
					color: '#1F3A5C',
					align: 'center'
				});
				const pct = Math.round((data.stats.correct / data.stats.total) * 100);
				drawText(ctx, `${pct}% de aciertos ♡`, w / 2, h * 0.8, {
					font: '40px "Nanum Pen Script", cursive',
					color: '#4F8FD0',
					align: 'center'
				});
				ctx.restore();
			}
		});
	}

	// ---------- 4. WML HIGHLIGHT: foto winner + prompt (parallax) ----------
	if (data.highlight) {
		slides.push({
			duration: 6.0,
			render: (ctx, w, h, t, r) => {
				fillBackground(ctx, w, h, 'cream');
				drawConfetti(ctx, w, h, 55, 16);
				const a = fadeInOut(t, 0.85);

				// stickers din micos
				const floats: FloatingSticker[] = [
					{ id: 'gato-meme', x: 90, y: 200, size: 95, rotate: -16, floatAmp: 9, rotAmp: 4, phase: 0 },
					{ id: 'rauw', x: w - 90, y: 220, size: 110, rotate: 14, floatAmp: 10, rotAmp: 3, phase: 1.4 },
					{ id: 'percy', x: w - 80, y: h - 260, size: 95, rotate: -10, floatAmp: 7, rotAmp: 3, phase: 0.7 },
					{ id: 'san2', x: 85, y: h - 280, size: 85, rotate: 16, floatAmp: 8, rotAmp: 4, phase: 2.0 }
				];
				drawFloatingStickers(ctx, r.stickers, floats, t, t, a);

				ctx.save();
				ctx.globalAlpha = a;
				drawText(ctx, 'momento cute ♡', w / 2, h * 0.1, {
					font: '40px "Nanum Pen Script", cursive',
					color: '#7FB8E8',
					align: 'center'
				});
				ctx.restore();

				// Prompt card (slide-in desde abajo)
				const cardReveal = easeOutCubic(Math.min(t * 1.5, 1));
				ctx.save();
				ctx.globalAlpha = a * cardReveal;
				const cardY = h * 0.2 + (1 - cardReveal) * 30;
				ctx.fillStyle = 'rgba(255,255,255,0.82)';
				ctx.shadowColor = 'rgba(127,184,232,0.4)';
				ctx.shadowBlur = 28;
				roundedPath(ctx, 40, cardY, w - 80, 200, 24);
				ctx.fill();
				ctx.shadowColor = 'transparent';
				ctx.font = '30px "Gowun Dodum", system-ui, sans-serif';
				const lines = wrapLines(ctx, data.highlight!.prompt, w - 140);
				let cy = cardY + 50;
				for (const ln of lines.slice(0, 4)) {
					drawText(ctx, ln, w / 2, cy, {
						font: '30px "Gowun Dodum", system-ui, sans-serif',
						color: '#1F3A5C',
						align: 'center'
					});
					cy += 42;
				}
				ctx.restore();

				// Reveal del winner con polaroid (delay)
				const winnerT = Math.max(0, Math.min((t - 0.35) * 1.8, 1));
				if (winnerT > 0) {
					const reveal = easeOutBack(winnerT);
					ctx.save();
					ctx.globalAlpha = a * reveal;
					const arrow = h * 0.55;
					drawText(ctx, '→', w / 2, arrow, {
						font: '54px "Caveat", cursive',
						color: '#7FB8E8',
						align: 'center'
					});
					ctx.restore();

					// Buscar la foto del winner por nombre
					const winnerPlayer = data.team.find((p) => p.name === data.highlight!.winnerName);
					const winnerPhoto = winnerPlayer ? r.photos.get(winnerPlayer.id) : null;

					ctx.save();
					ctx.globalAlpha = a * reveal;
					const pw = 280 * (0.85 + 0.15 * reveal);
					const ph = 340 * (0.85 + 0.15 * reveal);
					drawPolaroid(
						ctx,
						w / 2,
						h * 0.78,
						pw,
						ph,
						winnerPhoto ?? null,
						data.highlight!.winnerName,
						5,
						winnerPlayer?.color ?? data.me.color,
						{ showCaption: true, tapeColor: '#4F8FD0' }
					);
					ctx.restore();
				}
			}
		});
	}

	// ---------- 5. TEAM COLLAGE: cascada de polaroids con stickers ----------
	slides.push({
		duration: 7.0,
		render: (ctx, w, h, t, r) => {
			fillBackground(ctx, w, h, 'sunset');
			drawConfetti(ctx, w, h, 11, 18);
			const a = fadeInOut(t, 0.85);

			// stickers de fondo flotando lento
			const floats: FloatingSticker[] = [
				{ id: 'snoopy', x: 80, y: 180, size: 90, rotate: -10, floatAmp: 6, rotAmp: 3, phase: 0 },
				{ id: 'cinnamoroll', x: w - 80, y: 200, size: 85, rotate: 12, floatAmp: 7, rotAmp: 3, phase: 1.6 }
			];
			drawFloatingStickers(ctx, r.stickers, floats, t, t, a * 0.85);

			ctx.save();
			ctx.globalAlpha = a;
			drawText(ctx, 'el equipo de la fiesta ♡', w / 2, h * 0.1, {
				font: '38px "Nanum Pen Script", cursive',
				color: '#4F8FD0',
				align: 'center'
			});
			ctx.restore();

			const teamCount = Math.min(data.team.length, 8);
			const pw = 230;
			const ph = 230;
			const cols = 2;
			const rows = Math.ceil(teamCount / cols);
			const cellW = w / cols;
			const totalH = h * 0.7;
			const cellH = totalH / rows;
			const offsetY = h * 0.18;
			const tapeColors = ['#A8CFF0', '#E8D5FF', '#FFD9C4', '#C7E3FF'];
			for (let i = 0; i < teamCount; i++) {
				const col = i % cols;
				const row = Math.floor(i / cols);
				const cx = cellW * col + cellW / 2;
				const cy = offsetY + cellH * row + cellH / 2;
				const p = data.team[i];
				// cada polaroid cae con delay
				const delay = i * 0.12;
				const localT = Math.max(0, Math.min(1, (t - delay) * 1.6));
				const reveal = easeOutBack(localT);
				const rot = (i % 2 === 0 ? -1 : 1) * (4 + (i % 3));
				ctx.save();
				ctx.globalAlpha = a * reveal;
				ctx.translate(cx, cy - (1 - reveal) * 40);
				ctx.scale(0.85 + 0.15 * reveal, 0.85 + 0.15 * reveal);
				drawPolaroid(
					ctx,
					0,
					0,
					pw,
					ph,
					r.photos.get(p.id) ?? null,
					p.name,
					rot,
					p.color,
					{ showCaption: true, tapeColor: tapeColors[i % tapeColors.length] }
				);
				ctx.restore();
			}
		}
	});

	// ---------- 6. OUTRO: foto user + heart explosion + texto ----------
	slides.push({
		duration: 6.5,
		render: (ctx, w, h, t, r) => {
			fillBackground(ctx, w, h, 'sunset');
			drawConfetti(ctx, w, h, 99, 22);
			const a = fadeInOut(t, 0.85);

			// stickers en cuatro esquinas flotando
			const floats: FloatingSticker[] = [
				{ id: 'kitty', x: 90, y: 200, size: 110, rotate: -12, floatAmp: 8, rotAmp: 3, phase: 0 },
				{ id: 'ateez', x: w - 90, y: 230, size: 130, rotate: 10, floatAmp: 9, rotAmp: 4, phase: 1.3 },
				{ id: 'rauw', x: 100, y: h - 320, size: 115, rotate: 14, floatAmp: 8, rotAmp: 3, phase: 2.5 },
				{ id: 'mymelody', x: w - 100, y: h - 300, size: 110, rotate: -10, floatAmp: 7, rotAmp: 3, phase: 0.8 }
			];
			drawFloatingStickers(ctx, r.stickers, floats, t, t, a);

			// foto del user circular en el centro con ring
			const heroR = 130 + 8 * easeOutCubic(Math.min(t * 1.5, 1));
			ctx.save();
			ctx.globalAlpha = a;
			const photo = r.photos.get(data.me.id);
			if (photo) {
				drawCircleImage(ctx, photo, w / 2, h * 0.36, heroR, {
					color: data.me.color.ring,
					width: 12
				});
			} else {
				drawInitialsAvatar(ctx, data.me.initials, w / 2, h * 0.36, heroR, data.me.color);
			}
			ctx.restore();

			// sparkles orbitando alrededor (en lugar de corazones explotando)
			ctx.save();
			ctx.globalAlpha = a;
			const beat = 1 + Math.sin(t * Math.PI * 5) * 0.22;
			const r0 = heroR + 60;
			for (let i = 0; i < 6; i++) {
				const ang = (i / 6) * Math.PI * 2 + t * 0.3;
				const dist = r0 + Math.sin(t * Math.PI * 4 + i) * 18;
				const sz = 18 * beat;
				const col = i % 2 === 0 ? '#7FB8E8' : '#4F8FD0';
				drawSparkle(
					ctx,
					w / 2 + Math.cos(ang) * dist,
					h * 0.36 + Math.sin(ang) * dist,
					sz,
					col,
					(ang * 180) / Math.PI
				);
			}
			ctx.restore();

			// Watermark estilo coreano: "venti b-day" + traducción 벤띠 생일
			ctx.save();
			ctx.globalAlpha = a;
			const scale = 0.9 + 0.1 * easeOutBack(Math.min(t * 1.2, 1));
			ctx.translate(w / 2, h * 0.68);
			ctx.scale(scale, scale);
			// Korean grande arriba (como marca de agua principal)
			drawGradientText(ctx, '벤띠 생일', 0, -10, '700 86px "Nanum Pen Script", "Cafe24 Oneprettynight", cursive', [
				'#4F8FD0',
				'#7FB8E8',
				'#4F8FD0'
			]);
			// English debajo (más pequeño, complementa)
			drawGradientText(ctx, 'venti b-day', 0, 70, '700 56px "Caveat", cursive', [
				'#7FB8E8',
				'#4F8FD0',
				'#7FB8E8'
			]);
			ctx.restore();

			// línea fina decorativa abajo
			ctx.save();
			ctx.globalAlpha = a * 0.85;
			drawText(ctx, '・ 2026 ・', w / 2, h * 0.94, {
				font: '24px "Nanum Pen Script", cursive',
				color: '#4F8FD0',
				align: 'center'
			});
			ctx.restore();
		}
	});

	return slides;
}

type MimeOption = { mimeType: string; extension: string };

function pickRecorderMime(): MimeOption | null {
	if (typeof MediaRecorder === 'undefined') return null;
	const candidates: MimeOption[] = [
		{ mimeType: 'video/mp4;codecs=avc1.42E01F', extension: 'mp4' },
		{ mimeType: 'video/mp4;codecs=avc1.42E01E', extension: 'mp4' },
		{ mimeType: 'video/mp4', extension: 'mp4' },
		{ mimeType: 'video/webm;codecs=vp9', extension: 'webm' },
		{ mimeType: 'video/webm;codecs=vp8', extension: 'webm' },
		{ mimeType: 'video/webm', extension: 'webm' }
	];
	for (const c of candidates) {
		try {
			if (MediaRecorder.isTypeSupported(c.mimeType)) return c;
		} catch {
			/* ignore */
		}
	}
	return null;
}

export function isVideoExportSupported(): boolean {
	if (typeof document === 'undefined') return false;
	const canvas = document.createElement('canvas');
	if (typeof canvas.captureStream !== 'function') return false;
	return pickRecorderMime() !== null;
}

export async function buildShareVideo(
	data: ShareData,
	onProgress?: (ratio: number) => void
): Promise<{ blob: Blob; mime: string; extension: string }> {
	const mimeOpt = pickRecorderMime();
	if (!mimeOpt) throw new Error('Tu navegador no soporta grabar video');

	await ensureFontsReady();
	const [photos, stickers] = await Promise.all([
		preloadPhotos(data),
		preloadStickers([
			'kitty',
			'ateez',
			'rauw',
			'mymelody',
			'gato-meme',
			'pastel',
			'snoopy',
			'percy',
			'cinnamoroll',
			'pompompurin',
			'san',
			'san2'
		])
	]);
	const renderCtx: RenderCtx = { photos, stickers };
	const slides = buildSlides(data);
	const totalDuration = slides.reduce((s, sl) => s + sl.duration, 0);

	const canvas = document.createElement('canvas');
	canvas.width = VIDEO_W;
	canvas.height = VIDEO_H;
	const ctx = canvas.getContext('2d', { alpha: false });
	if (!ctx) throw new Error('Canvas no soportado');

	slides[0].render(ctx, VIDEO_W, VIDEO_H, 0, renderCtx);

	const stream = canvas.captureStream(FPS);
	const chunks: BlobPart[] = [];
	let recorder: MediaRecorder;
	try {
		recorder = new MediaRecorder(stream, {
			mimeType: mimeOpt.mimeType,
			videoBitsPerSecond: 4_500_000
		});
	} catch {
		recorder = new MediaRecorder(stream);
	}
	recorder.ondataavailable = (e) => {
		if (e.data && e.data.size > 0) chunks.push(e.data);
	};
	const stopped = new Promise<void>((resolve) => {
		recorder.onstop = () => resolve();
	});

	recorder.start(250);

	const startTs = performance.now();
	await new Promise<void>((resolve) => {
		const tick = () => {
			const elapsed = (performance.now() - startTs) / 1000;
			if (elapsed >= totalDuration) {
				const last = slides[slides.length - 1];
				last.render(ctx, VIDEO_W, VIDEO_H, 1, renderCtx);
				if (onProgress) onProgress(1);
				resolve();
				return;
			}
			let acc = 0;
			let current = slides[0];
			let localT = 0;
			for (const s of slides) {
				if (elapsed < acc + s.duration) {
					current = s;
					localT = (elapsed - acc) / s.duration;
					break;
				}
				acc += s.duration;
			}
			current.render(ctx, VIDEO_W, VIDEO_H, Math.max(0, Math.min(1, localT)), renderCtx);
			if (onProgress) onProgress(elapsed / totalDuration);
			requestAnimationFrame(tick);
		};
		requestAnimationFrame(tick);
	});

	await new Promise((r) => setTimeout(r, 250));
	recorder.requestData();
	recorder.stop();
	await stopped;
	for (const track of stream.getTracks()) track.stop();

	if (chunks.length === 0) {
		throw new Error('No se generó contenido de video');
	}
	const blob = new Blob(chunks, { type: mimeOpt.mimeType.split(';')[0] });
	return { blob, mime: mimeOpt.mimeType.split(';')[0], extension: mimeOpt.extension };
}
