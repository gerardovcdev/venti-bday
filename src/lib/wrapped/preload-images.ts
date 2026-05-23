/**
 * Convierte un Blob a dataURL string. Útil para meter imágenes
 * cross-origin (Supabase Storage) dentro del DOM antes de capturar
 * con html-to-image, evitando errores de canvas tainted.
 */
async function blobToDataURL(blob: Blob): Promise<string> {
	return new Promise<string>((resolve, reject) => {
		const fr = new FileReader();
		fr.onload = () => resolve(typeof fr.result === 'string' ? fr.result : '');
		fr.onerror = () => reject(fr.error);
		fr.readAsDataURL(blob);
	});
}

/**
 * Cache simple para no reconvertir la misma URL varias veces durante
 * un export PNG + GIF en la misma sesión.
 */
const dataUrlCache = new Map<string, string>();

async function urlToDataURL(url: string): Promise<string | null> {
	if (dataUrlCache.has(url)) return dataUrlCache.get(url)!;
	try {
		const resp = await fetch(url, { mode: 'cors', credentials: 'omit' });
		if (!resp.ok) return null;
		const blob = await resp.blob();
		const dataUrl = await blobToDataURL(blob);
		dataUrlCache.set(url, dataUrl);
		return dataUrl;
	} catch {
		return null;
	}
}

/**
 * Reemplaza los src de todos los <img> dentro del contenedor por
 * dataURLs in-line. Devuelve un restore() que revierte los cambios.
 *
 * Necesario porque html-to-image falla al embeber imágenes
 * cross-origin si CORS no está perfectamente configurado.
 */
export async function preloadImagesAsDataURL(
	container: HTMLElement
): Promise<() => void> {
	const imgs = Array.from(container.querySelectorAll('img')) as HTMLImageElement[];
	const originals = new Map<HTMLImageElement, string>();

	await Promise.all(
		imgs.map(async (img) => {
			const src = img.getAttribute('src');
			if (!src || src.startsWith('data:')) return;
			// Solo convertimos imágenes que claramente vienen de un dominio externo
			// (las locales /stickers/, /favicon, etc. ya las maneja html-to-image bien
			// porque son mismo origen).
			const isCrossOrigin =
				src.startsWith('http://') ||
				src.startsWith('https://') ||
				src.startsWith('//');
			if (!isCrossOrigin) return;

			const dataUrl = await urlToDataURL(src);
			if (dataUrl) {
				originals.set(img, src);
				img.setAttribute('crossorigin', 'anonymous');
				img.src = dataUrl;
			}
		})
	);

	return () => {
		for (const [img, src] of originals) {
			img.src = src;
		}
	};
}
