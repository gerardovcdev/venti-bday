/**
 * Renderizado pixel-perfect del wrapped a una imagen estática (PNG) y a
 * un video corto (MP4/WebM). Todo se dibuja sobre <canvas> programáticamente,
 * sin tocar HTML — evita los problemas de fidelidad de html-to-image
 * (gradients, bg-clip-text, fuentes coreanas, backdrop-blur).
 *
 * Las dimensiones y duraciones están afinadas para historias verticales 9:16
 * tipo Spotify Wrapped / Instagram stories.
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

// -------------------- carga de imágenes --------------------

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
	const loaded = await Promise.all(urls.map((u) => loadImage(u.url).then((img) => ({ id: u.id, img }))));
	for (const { id, img } of loaded) {
		if (img) map.set(id, img);
	}
	return map;
}

// -------------------- primitivas --------------------

function roundedPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
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
	// cover behavior
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

function drawRoundedImage(
	ctx: CanvasRenderingContext2D,
	img: HTMLImageElement,
	x: number,
	y: number,
	w: number,
	h: number,
	r: number
) {
	ctx.save();
	roundedPath(ctx, x, y, w, h, r);
	ctx.clip();
	const iw = img.naturalWidth;
	const ih = img.naturalHeight;
	const scale = Math.max(w / iw, h / ih);
	const dw = iw * scale;
	const dh = ih * scale;
	ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
	ctx.restore();
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
	ctx.shadowColor = 'rgba(224,102,142,0.18)';
	ctx.shadowBlur = 18;
	ctx.shadowOffsetY = 4;
	ctx.fillText(text, x, y);
	ctx.restore();
	return { width: w, height: h };
}

function drawHeart(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string) {
	ctx.save();
	ctx.fillStyle = color;
	ctx.translate(cx, cy);
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

function drawSparkle(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string) {
	ctx.save();
	ctx.fillStyle = color;
	ctx.translate(cx, cy);
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

function drawPolaroid(
	ctx: CanvasRenderingContext2D,
	cx: number,
	cy: number,
	w: number,
	h: number,
	img: HTMLImageElement | null,
	caption: string,
	rotate: number,
	color: { bg: string; fg: string; ring: string }
) {
	ctx.save();
	ctx.translate(cx, cy);
	ctx.rotate((rotate * Math.PI) / 180);
	// shadow
	ctx.shadowColor = 'rgba(107,44,74,0.25)';
	ctx.shadowBlur = 18;
	ctx.shadowOffsetY = 6;
	// frame
	ctx.fillStyle = '#FFFFFF';
	const frameW = w;
	const frameH = h + 28; // caption strip
	roundedPath(ctx, -frameW / 2, -frameH / 2, frameW, frameH, 8);
	ctx.fill();
	ctx.shadowColor = 'transparent';
	// inner photo area
	const innerX = -w / 2 + 8;
	const innerY = -frameH / 2 + 8;
	const innerW = w - 16;
	const innerH = h - 16;
	if (img) {
		ctx.save();
		roundedPath(ctx, innerX, innerY, innerW, innerH, 4);
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
		roundedPath(ctx, innerX, innerY, innerW, innerH, 4);
		ctx.fill();
		ctx.fillStyle = color.fg;
		ctx.font = `bold ${Math.round(innerW * 0.35)}px "Caveat", system-ui, sans-serif`;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText('♡', innerX + innerW / 2, innerY + innerH / 2);
	}
	// caption
	ctx.fillStyle = '#E0668E';
	ctx.font = `${Math.round(w * 0.13)}px "Nanum Pen Script", "Caveat", cursive`;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillText(caption, 0, h / 2 + 14);
	ctx.restore();
}

function fillBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
	const grad = ctx.createLinearGradient(0, 0, w, h);
	grad.addColorStop(0, '#FFF5F9');
	grad.addColorStop(0.5, '#FFE0EC');
	grad.addColorStop(1, '#F5E8FF');
	ctx.fillStyle = grad;
	ctx.fillRect(0, 0, w, h);
}

function drawDecorations(ctx: CanvasRenderingContext2D, w: number, h: number, seed: number) {
	// soft pink confetti dots, deterministic by seed
	let s = seed;
	const rand = () => {
		s = (s * 9301 + 49297) % 233280;
		return s / 233280;
	};
	for (let i = 0; i < 24; i++) {
		const x = rand() * w;
		const y = rand() * h;
		const r = 4 + rand() * 8;
		const c = ['#FFB6D5', '#FFCFE0', '#E8D5FF', '#FFD9E8'][Math.floor(rand() * 4)];
		ctx.save();
		ctx.globalAlpha = 0.45;
		ctx.fillStyle = c;
		ctx.beginPath();
		ctx.arc(x, y, r, 0, Math.PI * 2);
		ctx.fill();
		ctx.restore();
	}
	// corner sparkles
	drawSparkle(ctx, w - 50, 70, 22, '#FFB6D5');
	drawSparkle(ctx, 50, h - 90, 18, '#E8D5FF');
}

async function ensureFontsReady() {
	if (typeof document === 'undefined' || !document.fonts) return;
	try {
		await Promise.race([
			document.fonts.ready,
			new Promise<void>((resolve) => setTimeout(resolve, 2000))
		]);
		// Touch fonts so they're definitely loaded.
		const probes = [
			'40px "Caveat"',
			'40px "Nanum Pen Script"',
			'30px "Gowun Dodum"'
		];
		await Promise.all(probes.map((f) => document.fonts.load(f, 'venti ♡').catch(() => null)));
	} catch {
		/* ignore */
	}
}

// -------------------- share card (PNG estático) --------------------

const CARD_W = 1080;
const CARD_H = 1920;

export async function buildShareImage(
	data: ShareData
): Promise<{ blob: Blob; mime: string; extension: string }> {
	await ensureFontsReady();
	const photos = await preloadPhotos(data);
	const canvas = document.createElement('canvas');
	canvas.width = CARD_W;
	canvas.height = CARD_H;
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('Canvas no soportado');

	// fondo
	fillBackground(ctx, CARD_W, CARD_H);
	drawDecorations(ctx, CARD_W, CARD_H, 42);

	// Header script subtítulo
	drawText(ctx, '벤띠 생일 축하해 ♡', CARD_W / 2, 130, {
		font: '54px "Nanum Pen Script", "Caveat", cursive',
		color: '#FF8FB8',
		align: 'center',
		shadow: { color: 'rgba(255,255,255,0.7)', blur: 4 }
	});
	// Title
	drawGradientText(ctx, 'venti b-day ♡ wrapped', CARD_W / 2, 230, '700 78px "Caveat", cursive', [
		'#FF8FB8',
		'#E0668E',
		'#FF8FB8'
	]);

	// Hero name del jugador
	drawGradientText(ctx, data.me.name, CARD_W / 2, 380, '700 150px "Caveat", cursive', [
		'#E0668E',
		'#FF8FB8',
		'#E0668E'
	]);

	drawText(ctx, 'tu resumen lindo', CARD_W / 2, 450, {
		font: '46px "Nanum Pen Script", cursive',
		color: '#E0668E',
		align: 'center'
	});

	// Hero photo grande (circular)
	const heroR = 240;
	const heroCx = CARD_W / 2;
	const heroCy = 750;
	const heroPhoto = photos.get(data.me.id);
	if (heroPhoto) {
		drawCircleImage(ctx, heroPhoto, heroCx, heroCy, heroR, {
			color: data.me.color.ring,
			width: 14
		});
	} else {
		drawInitialsAvatar(ctx, data.me.initials, heroCx, heroCy, heroR, data.me.color);
	}

	// hearts decorativos alrededor del hero
	drawHeart(ctx, heroCx - heroR - 40, heroCy - heroR + 30, 38, '#FF8FB8');
	drawHeart(ctx, heroCx + heroR + 30, heroCy + heroR - 60, 32, '#E0668E');

	// Stats card
	const statsY = 1080;
	const statsH = 220;
	const statsPad = 60;
	ctx.save();
	ctx.fillStyle = 'rgba(255,255,255,0.78)';
	ctx.shadowColor = 'rgba(255,143,184,0.35)';
	ctx.shadowBlur = 30;
	roundedPath(ctx, statsPad, statsY, CARD_W - statsPad * 2, statsH, 32);
	ctx.fill();
	ctx.restore();

	const colW = (CARD_W - statsPad * 2) / 2;
	// columna 1: trivia
	drawText(ctx, 'trivia', statsPad + colW / 2, statsY + 60, {
		font: '40px "Nanum Pen Script", cursive',
		color: '#FF8FB8',
		align: 'center'
	});
	drawGradientText(
		ctx,
		`${data.stats.correct}/${data.stats.total}`,
		statsPad + colW / 2,
		statsY + 150,
		'700 96px "Caveat", cursive',
		['#E0668E', '#FF8FB8']
	);
	// separador
	ctx.save();
	ctx.strokeStyle = '#FFCFE0';
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.moveTo(statsPad + colW, statsY + 50);
	ctx.lineTo(statsPad + colW, statsY + statsH - 50);
	ctx.stroke();
	ctx.restore();
	// columna 2: votos
	drawText(ctx, 'votos recibidos', statsPad + colW + colW / 2, statsY + 60, {
		font: '40px "Nanum Pen Script", cursive',
		color: '#FF8FB8',
		align: 'center'
	});
	drawGradientText(
		ctx,
		`${data.stats.votesReceived}`,
		statsPad + colW + colW / 2,
		statsY + 150,
		'700 96px "Caveat", cursive',
		['#E0668E', '#FF8FB8']
	);

	// Highlight WML
	if (data.highlight) {
		const hY = 1380;
		ctx.save();
		ctx.fillStyle = 'rgba(255,176,213,0.30)';
		roundedPath(ctx, statsPad, hY, CARD_W - statsPad * 2, 200, 28);
		ctx.fill();
		ctx.restore();
		drawText(ctx, 'momento picante ♡', CARD_W / 2, hY + 50, {
			font: '38px "Nanum Pen Script", cursive',
			color: '#E0668E',
			align: 'center'
		});
		ctx.font = '34px "Gowun Dodum", system-ui, sans-serif';
		const lines = wrapLines(ctx, data.highlight.prompt, CARD_W - statsPad * 2 - 80);
		drawText(ctx, lines.slice(0, 2).join(' '), CARD_W / 2, hY + 110, {
			font: '34px "Gowun Dodum", system-ui, sans-serif',
			color: '#6B2C4A',
			align: 'center'
		});
		drawText(ctx, `→ ${data.highlight.winnerName}`, CARD_W / 2, hY + 170, {
			font: '48px "Caveat", cursive',
			color: '#E0668E',
			align: 'center'
		});
	}

	// Team strip al fondo (polaroids pequeñas)
	const teamY = 1680;
	drawText(ctx, 'el equipo de la fiesta', CARD_W / 2, teamY - 40, {
		font: '42px "Nanum Pen Script", cursive',
		color: '#FF8FB8',
		align: 'center'
	});
	const teamCount = Math.min(data.team.length, 6);
	const pw = 130;
	const ph = 130;
	const gap = 16;
	const totalW = teamCount * pw + (teamCount - 1) * gap;
	const startX = (CARD_W - totalW) / 2 + pw / 2;
	for (let i = 0; i < teamCount; i++) {
		const p = data.team[i];
		const cx = startX + i * (pw + gap);
		const rot = ((i % 2 === 0 ? -1 : 1) * (3 + (i % 3))) ;
		drawPolaroid(ctx, cx, teamY + 60, pw, ph, photos.get(p.id) ?? null, p.name, rot, p.color);
	}

	// Footer
	drawText(ctx, 'para Venti, con todo el cariño ♡', CARD_W / 2, CARD_H - 80, {
		font: '40px "Nanum Pen Script", cursive',
		color: '#E0668E',
		align: 'center'
	});
	drawText(ctx, '사랑해', CARD_W / 2, CARD_H - 35, {
		font: '32px "Caveat", cursive',
		color: '#FF8FB8',
		align: 'center'
	});

	const blob = await new Promise<Blob | null>((resolve) =>
		canvas.toBlob((b) => resolve(b), 'image/png')
	);
	if (!blob) throw new Error('No se pudo generar la imagen');
	return { blob, mime: 'image/png', extension: 'png' };
}

// -------------------- video (slides animados) --------------------

const VIDEO_W = 720;
const VIDEO_H = 1280;
const FPS = 30;

type SlideRenderer = (ctx: CanvasRenderingContext2D, w: number, h: number, t: number, photos: Map<string, HTMLImageElement>) => void;

type Slide = {
	duration: number; // segundos
	render: SlideRenderer;
};

function easeOutCubic(x: number): number {
	return 1 - Math.pow(1 - x, 3);
}
function easeInOutCubic(x: number): number {
	return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function fadeInOut(t: number, holdRatio = 0.7): number {
	// t in [0,1]; 0..(1-hold)/2 fade in, ... fade out
	const fade = (1 - holdRatio) / 2;
	if (t < fade) return easeOutCubic(t / fade);
	if (t > 1 - fade) return easeOutCubic((1 - t) / fade);
	return 1;
}

function buildSlides(data: ShareData): Slide[] {
	const slides: Slide[] = [];

	// 1. Title intro
	slides.push({
		duration: 3.5,
		render: (ctx, w, h, t) => {
			fillBackground(ctx, w, h);
			drawDecorations(ctx, w, h, 17);
			const a = fadeInOut(t, 0.65);
			ctx.save();
			ctx.globalAlpha = a;
			drawText(ctx, '벤띠 생일 축하해 ♡', w / 2, h * 0.32, {
				font: '40px "Nanum Pen Script", cursive',
				color: '#FF8FB8',
				align: 'center'
			});
			const scale = 0.92 + 0.08 * easeOutCubic(Math.min(t * 2, 1));
			ctx.translate(w / 2, h * 0.46);
			ctx.scale(scale, scale);
			drawGradientText(ctx, 'venti b-day ♡', 0, 0, '700 72px "Caveat", cursive', [
				'#FF8FB8',
				'#E0668E',
				'#FF8FB8'
			]);
			drawGradientText(ctx, 'wrapped', 0, 80, '700 72px "Caveat", cursive', [
				'#FFB6D5',
				'#FF8FB8',
				'#E0668E'
			]);
			ctx.restore();
			ctx.save();
			ctx.globalAlpha = a;
			drawHeart(ctx, w / 2 - 180, h * 0.62, 28, '#FF8FB8');
			drawHeart(ctx, w / 2 + 180, h * 0.62, 28, '#E0668E');
			drawSparkle(ctx, w / 2 - 120, h * 0.66, 18, '#FFB6D5');
			drawSparkle(ctx, w / 2 + 120, h * 0.66, 18, '#FFB6D5');
			ctx.restore();
		}
	});

	// 2. Personal hero
	slides.push({
		duration: 4.0,
		render: (ctx, w, h, t, photos) => {
			fillBackground(ctx, w, h);
			drawDecorations(ctx, w, h, 88);
			const a = fadeInOut(t, 0.75);
			ctx.save();
			ctx.globalAlpha = a;
			drawText(ctx, 'esta eres tú ♡', w / 2, h * 0.18, {
				font: '36px "Nanum Pen Script", cursive',
				color: '#FF8FB8',
				align: 'center'
			});
			const heroR = 170 + 6 * easeOutCubic(Math.min(t * 1.5, 1));
			const cy = h * 0.42;
			const photo = photos.get(data.me.id);
			if (photo) {
				drawCircleImage(ctx, photo, w / 2, cy, heroR, {
					color: data.me.color.ring,
					width: 10
				});
			} else {
				drawInitialsAvatar(ctx, data.me.initials, w / 2, cy, heroR, data.me.color);
			}
			drawGradientText(ctx, data.me.name, w / 2, h * 0.68, '700 96px "Caveat", cursive', [
				'#E0668E',
				'#FF8FB8',
				'#E0668E'
			]);
			drawText(ctx, 'protagonista del día', w / 2, h * 0.76, {
				font: '32px "Nanum Pen Script", cursive',
				color: '#E0668E',
				align: 'center'
			});
			ctx.restore();
		}
	});

	// 3. Stats trivia
	if (data.stats.total > 0) {
		slides.push({
			duration: 3.5,
			render: (ctx, w, h, t) => {
				fillBackground(ctx, w, h);
				drawDecorations(ctx, w, h, 31);
				const a = fadeInOut(t, 0.75);
				ctx.save();
				ctx.globalAlpha = a;
				drawText(ctx, 'tu trivia', w / 2, h * 0.22, {
					font: '38px "Nanum Pen Script", cursive',
					color: '#FF8FB8',
					align: 'center'
				});
				// número grande
				const reveal = easeOutCubic(Math.min(t * 1.6, 1));
				ctx.save();
				ctx.translate(w / 2, h * 0.45);
				ctx.scale(0.7 + 0.3 * reveal, 0.7 + 0.3 * reveal);
				drawGradientText(ctx, `${data.stats.correct}`, 0, 0, '700 220px "Caveat", cursive', [
					'#E0668E',
					'#FF8FB8',
					'#E0668E'
				]);
				ctx.restore();
				drawText(ctx, `de ${data.stats.total} correctas`, w / 2, h * 0.58, {
					font: '42px "Caveat", cursive',
					color: '#6B2C4A',
					align: 'center'
				});
				const pct = Math.round((data.stats.correct / data.stats.total) * 100);
				drawText(ctx, `${pct}% de aciertos ♡`, w / 2, h * 0.68, {
					font: '38px "Nanum Pen Script", cursive',
					color: '#E0668E',
					align: 'center'
				});
				ctx.restore();
			}
		});
	}

	// 4. WML highlight
	if (data.highlight) {
		slides.push({
			duration: 4.5,
			render: (ctx, w, h, t) => {
				fillBackground(ctx, w, h);
				drawDecorations(ctx, w, h, 55);
				const a = fadeInOut(t, 0.78);
				ctx.save();
				ctx.globalAlpha = a;
				drawText(ctx, 'momento picante ♡', w / 2, h * 0.18, {
					font: '40px "Nanum Pen Script", cursive',
					color: '#FF8FB8',
					align: 'center'
				});
				// prompt card
				ctx.fillStyle = 'rgba(255,255,255,0.78)';
				ctx.shadowColor = 'rgba(255,143,184,0.35)';
				ctx.shadowBlur = 24;
				roundedPath(ctx, 40, h * 0.27, w - 80, h * 0.32, 24);
				ctx.fill();
				ctx.shadowColor = 'transparent';
				ctx.font = '32px "Gowun Dodum", system-ui, sans-serif';
				const lines = wrapLines(ctx, data.highlight!.prompt, w - 140);
				let cy = h * 0.32;
				for (const ln of lines.slice(0, 4)) {
					drawText(ctx, ln, w / 2, cy, {
						font: '32px "Gowun Dodum", system-ui, sans-serif',
						color: '#6B2C4A',
						align: 'center'
					});
					cy += 44;
				}
				drawText(ctx, '→', w / 2, h * 0.66, {
					font: '54px "Caveat", cursive',
					color: '#FF8FB8',
					align: 'center'
				});
				drawGradientText(
					ctx,
					data.highlight!.winnerName,
					w / 2,
					h * 0.76,
					'700 84px "Caveat", cursive',
					['#E0668E', '#FF8FB8', '#E0668E']
				);
				ctx.restore();
			}
		});
	}

	// 5. Group polaroids
	slides.push({
		duration: 5.0,
		render: (ctx, w, h, t, photos) => {
			fillBackground(ctx, w, h);
			drawDecorations(ctx, w, h, 11);
			const a = fadeInOut(t, 0.8);
			ctx.save();
			ctx.globalAlpha = a;
			drawText(ctx, 'el equipo ♡', w / 2, h * 0.13, {
				font: '40px "Nanum Pen Script", cursive',
				color: '#FF8FB8',
				align: 'center'
			});
			const teamCount = Math.min(data.team.length, 8);
			const pw = 200;
			const ph = 200;
			const cols = Math.min(teamCount, 2);
			const rows = Math.ceil(teamCount / cols);
			const cellW = w / cols;
			const cellH = (h * 0.7) / rows;
			const offsetY = h * 0.2;
			for (let i = 0; i < teamCount; i++) {
				const col = i % cols;
				const row = Math.floor(i / cols);
				const cx = cellW * col + cellW / 2;
				const cy = offsetY + cellH * row + cellH / 2;
				const p = data.team[i];
				// reveal en cascada
				const delay = i * 0.08;
				const localT = Math.max(0, Math.min(1, (t - delay) * 2));
				const reveal = easeOutCubic(localT);
				const rot = (i % 2 === 0 ? -1 : 1) * (4 + (i % 3));
				ctx.save();
				ctx.globalAlpha = a * reveal;
				ctx.translate(cx, cy + (1 - reveal) * 20);
				ctx.scale(0.85 + 0.15 * reveal, 0.85 + 0.15 * reveal);
				drawPolaroid(ctx, 0, 0, pw, ph, photos.get(p.id) ?? null, p.name, rot, p.color);
				ctx.restore();
			}
			ctx.restore();
		}
	});

	// 6. Outro
	slides.push({
		duration: 4.5,
		render: (ctx, w, h, t) => {
			fillBackground(ctx, w, h);
			drawDecorations(ctx, w, h, 99);
			const a = fadeInOut(t, 0.78);
			ctx.save();
			ctx.globalAlpha = a;
			const scale = 0.9 + 0.1 * easeInOutCubic(Math.min(t * 1.2, 1));
			ctx.translate(w / 2, h * 0.42);
			ctx.scale(scale, scale);
			drawText(ctx, 'para Venti', 0, -40, {
				font: '48px "Nanum Pen Script", cursive',
				color: '#FF8FB8',
				align: 'center'
			});
			drawGradientText(ctx, '¡feliz cumpleaños! ♡', 0, 60, '700 78px "Caveat", cursive', [
				'#E0668E',
				'#FF8FB8',
				'#E0668E'
			]);
			drawText(ctx, '사랑해', 0, 140, {
				font: '44px "Caveat", cursive',
				color: '#E0668E',
				align: 'center'
			});
			ctx.restore();
			ctx.save();
			ctx.globalAlpha = a;
			drawHeart(ctx, w / 2 - 200, h * 0.7, 30, '#FF8FB8');
			drawHeart(ctx, w / 2 + 200, h * 0.7, 30, '#E0668E');
			drawHeart(ctx, w / 2, h * 0.75, 36, '#FFB6D5');
			drawSparkle(ctx, w / 2 - 120, h * 0.78, 16, '#E0668E');
			drawSparkle(ctx, w / 2 + 120, h * 0.78, 16, '#E0668E');
			drawText(ctx, 'venti b-day ♡ 2026', w / 2, h * 0.92, {
				font: '28px "Nanum Pen Script", cursive',
				color: '#E0668E',
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
	const photos = await preloadPhotos(data);
	const slides = buildSlides(data);
	const totalDuration = slides.reduce((s, sl) => s + sl.duration, 0);

	const canvas = document.createElement('canvas');
	canvas.width = VIDEO_W;
	canvas.height = VIDEO_H;
	const ctx = canvas.getContext('2d', { alpha: false });
	if (!ctx) throw new Error('Canvas no soportado');

	// Render frame 0 antes de capturar stream, garantizando bytes válidos.
	slides[0].render(ctx, VIDEO_W, VIDEO_H, 0, photos);

	const stream = canvas.captureStream(FPS);
	const chunks: BlobPart[] = [];
	let recorder: MediaRecorder;
	try {
		recorder = new MediaRecorder(stream, {
			mimeType: mimeOpt.mimeType,
			videoBitsPerSecond: 4_000_000
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
				// render último frame (t=1 dentro del último slide)
				const last = slides[slides.length - 1];
				last.render(ctx, VIDEO_W, VIDEO_H, 1, photos);
				if (onProgress) onProgress(1);
				resolve();
				return;
			}
			// determine current slide
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
			current.render(ctx, VIDEO_W, VIDEO_H, Math.max(0, Math.min(1, localT)), photos);
			if (onProgress) onProgress(elapsed / totalDuration);
			requestAnimationFrame(tick);
		};
		requestAnimationFrame(tick);
	});

	// pequeño buffer para que MediaRecorder capture los últimos frames
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
