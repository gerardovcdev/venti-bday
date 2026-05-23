import { get, set, del } from 'idb-keyval';
import type { GamePhase } from '$lib/supabase/types';

export type Checkpoint = {
	updatedAt: number;
	phase: GamePhase;
	currentRound: number;
	reveal: boolean;
	playerId: string;
	playerName: string;
};

const KEY = 'venti.checkpoint';
const PHOTO_KEY = 'venti.pending_photo';

export async function saveCheckpoint(cp: Omit<Checkpoint, 'updatedAt'>): Promise<void> {
	try {
		await set(KEY, { ...cp, updatedAt: Date.now() });
	} catch {
		// IndexedDB might be blocked in private mode, ignore
	}
}

export async function loadCheckpoint(): Promise<Checkpoint | null> {
	try {
		const cp = (await get(KEY)) as Checkpoint | undefined;
		return cp ?? null;
	} catch {
		return null;
	}
}

export async function clearCheckpoint(): Promise<void> {
	try {
		await del(KEY);
	} catch {
		// ignore
	}
}

export async function savePendingPhoto(blob: Blob): Promise<void> {
	try {
		await set(PHOTO_KEY, blob);
	} catch {
		// ignore
	}
}

export async function loadPendingPhoto(): Promise<Blob | null> {
	try {
		return ((await get(PHOTO_KEY)) as Blob | undefined) ?? null;
	} catch {
		return null;
	}
}

export async function clearPendingPhoto(): Promise<void> {
	try {
		await del(PHOTO_KEY);
	} catch {
		// ignore
	}
}
