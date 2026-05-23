import { browser } from '$app/environment';
import { STORAGE_KEYS } from '$lib/config';

type SfxName = 'pop' | 'sparkle' | 'reveal' | 'chime' | 'camera' | 'tick';

let ctx: AudioContext | null = null;

class SfxState {
	muted = $state(false);

	constructor() {
		if (browser) {
			this.muted = localStorage.getItem(STORAGE_KEYS.SFX_MUTED) === '1';
		}
	}

	toggle() {
		this.muted = !this.muted;
		if (browser) localStorage.setItem(STORAGE_KEYS.SFX_MUTED, this.muted ? '1' : '0');
	}
}

export const sfx = new SfxState();

function getCtx(): AudioContext | null {
	if (!browser) return null;
	if (!ctx) {
		try {
			const AC =
				window.AudioContext ||
				(window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
			ctx = new AC();
		} catch {
			return null;
		}
	}
	if (ctx.state === 'suspended') {
		void ctx.resume();
	}
	return ctx;
}

function tone(opts: {
	freq: number;
	endFreq?: number;
	duration: number;
	type?: OscillatorType;
	volume?: number;
	delay?: number;
}) {
	const c = getCtx();
	if (!c) return;
	const now = c.currentTime + (opts.delay ?? 0);
	const osc = c.createOscillator();
	const gain = c.createGain();
	osc.type = opts.type ?? 'sine';
	osc.frequency.setValueAtTime(opts.freq, now);
	if (opts.endFreq) osc.frequency.exponentialRampToValueAtTime(opts.endFreq, now + opts.duration);
	const vol = opts.volume ?? 0.2;
	gain.gain.setValueAtTime(0, now);
	gain.gain.linearRampToValueAtTime(vol, now + 0.01);
	gain.gain.exponentialRampToValueAtTime(0.001, now + opts.duration);
	osc.connect(gain).connect(c.destination);
	osc.start(now);
	osc.stop(now + opts.duration);
}

export function play(name: SfxName) {
	if (!browser || sfx.muted) return;
	switch (name) {
		case 'pop':
			tone({ freq: 880, endFreq: 1320, duration: 0.08, type: 'sine', volume: 0.18 });
			break;
		case 'sparkle':
			tone({ freq: 1320, endFreq: 1760, duration: 0.1, type: 'triangle', volume: 0.15 });
			tone({
				freq: 1760,
				endFreq: 2200,
				duration: 0.1,
				type: 'triangle',
				volume: 0.12,
				delay: 0.06
			});
			break;
		case 'reveal':
			tone({ freq: 660, endFreq: 990, duration: 0.18, type: 'triangle', volume: 0.2 });
			tone({ freq: 990, endFreq: 1320, duration: 0.18, type: 'triangle', volume: 0.18, delay: 0.12 });
			tone({ freq: 1320, endFreq: 1760, duration: 0.22, type: 'sine', volume: 0.2, delay: 0.24 });
			break;
		case 'chime':
			tone({ freq: 1046, duration: 0.18, type: 'sine', volume: 0.18 });
			tone({ freq: 1318, duration: 0.18, type: 'sine', volume: 0.16, delay: 0.08 });
			tone({ freq: 1567, duration: 0.28, type: 'sine', volume: 0.16, delay: 0.16 });
			break;
		case 'camera':
			tone({ freq: 220, endFreq: 110, duration: 0.06, type: 'square', volume: 0.18 });
			tone({ freq: 1760, endFreq: 880, duration: 0.06, type: 'sine', volume: 0.12, delay: 0.04 });
			break;
		case 'tick':
			tone({ freq: 1100, duration: 0.04, type: 'square', volume: 0.1 });
			break;
	}
}
