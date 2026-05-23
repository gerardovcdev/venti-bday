export type CaptureResult = {
	blob: Blob;
	dataUrl: string;
};

export async function startCameraStream(): Promise<MediaStream> {
	if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
		throw new Error('Cámara no disponible en este navegador');
	}
	return await navigator.mediaDevices.getUserMedia({
		video: {
			facingMode: 'user',
			width: { ideal: 720 },
			height: { ideal: 1280 }
		},
		audio: false
	});
}

export function stopStream(stream: MediaStream | null) {
	if (!stream) return;
	for (const track of stream.getTracks()) track.stop();
}

/**
 * Espera a que el video tenga un frame decodificado y dimensiones reales.
 * Combina readyState >= 2 (HAVE_CURRENT_DATA), videoWidth/Height > 0,
 * y requestVideoFrameCallback cuando esté disponible.
 */
async function waitForVideoFrame(video: HTMLVideoElement, timeoutMs = 1500): Promise<void> {
	const ready = () =>
		video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0;
	if (ready()) return;

	const deadline = Date.now() + timeoutMs;
	type VideoWithFrameCb = HTMLVideoElement & {
		requestVideoFrameCallback?: (cb: () => void) => number;
	};
	const v = video as VideoWithFrameCb;

	while (Date.now() < deadline) {
		if (v.requestVideoFrameCallback) {
			await new Promise<void>((resolve) => {
				const id = setTimeout(resolve, 200);
				v.requestVideoFrameCallback!(() => {
					clearTimeout(id);
					resolve();
				});
			});
		} else {
			await new Promise((r) => setTimeout(r, 80));
		}
		if (ready()) return;
	}
	if (!ready()) {
		throw new Error('La cámara no envió un frame a tiempo');
	}
}

export async function captureFrame(
	video: HTMLVideoElement,
	mirror = true,
	maxAttempts = 3
): Promise<CaptureResult> {
	let lastError: unknown = null;
	for (let attempt = 0; attempt < maxAttempts; attempt++) {
		try {
			await waitForVideoFrame(video);
			const w = video.videoWidth;
			const h = video.videoHeight;
			if (w === 0 || h === 0) throw new Error('Dimensiones del video inválidas');

			const canvas = document.createElement('canvas');
			canvas.width = w;
			canvas.height = h;
			const ctx = canvas.getContext('2d');
			if (!ctx) throw new Error('Canvas no soportado');
			if (mirror) {
				ctx.translate(w, 0);
				ctx.scale(-1, 1);
			}
			ctx.drawImage(video, 0, 0, w, h);

			const blob = await new Promise<Blob | null>((resolve) =>
				canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.85)
			);
			if (!blob || blob.size === 0) throw new Error('toBlob devolvió vacío');

			const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
			return { blob, dataUrl };
		} catch (e) {
			lastError = e;
			if (attempt < maxAttempts - 1) {
				await new Promise((r) => setTimeout(r, 150));
			}
		}
	}
	throw new Error(
		lastError instanceof Error
			? `No se pudo capturar la foto: ${lastError.message}`
			: 'No se pudo capturar la foto'
	);
}

export async function downscaleIfNeeded(blob: Blob, maxBytes = 500_000): Promise<Blob> {
	if (blob.size <= maxBytes) return blob;
	const img = await createImageBitmap(blob);
	const scale = Math.sqrt(maxBytes / blob.size);
	const w = Math.round(img.width * scale);
	const h = Math.round(img.height * scale);
	const canvas = document.createElement('canvas');
	canvas.width = w;
	canvas.height = h;
	const ctx = canvas.getContext('2d');
	if (!ctx) return blob;
	ctx.drawImage(img, 0, 0, w, h);
	return new Promise<Blob>((resolve) =>
		canvas.toBlob((b) => resolve(b ?? blob), 'image/jpeg', 0.8)
	);
}
