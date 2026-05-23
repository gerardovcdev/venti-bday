import { browser } from '$app/environment';
import { STORAGE_KEYS } from '$lib/config';
import { getInitials, PLAYER_PALETTE, type PlayerColor } from '$lib/design/colors';

export type LocalPlayer = {
	id: string;
	name: string;
	initials: string;
	color: PlayerColor;
};

function randomId(): string {
	if (browser && 'randomUUID' in crypto) return crypto.randomUUID();
	return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function loadLocalPlayer(): LocalPlayer | null {
	if (!browser) return null;
	const id = localStorage.getItem(STORAGE_KEYS.PLAYER_ID);
	const name = localStorage.getItem(STORAGE_KEYS.PLAYER_NAME);
	const colorName = localStorage.getItem(STORAGE_KEYS.PLAYER_COLOR);
	if (!id || !name) return null;
	const color = PLAYER_PALETTE.find((c) => c.name === colorName) ?? PLAYER_PALETTE[0];
	return { id, name, initials: getInitials(name), color };
}

export function createLocalPlayer(name: string, knownNames: string[] = []): LocalPlayer {
	const trimmed = name.trim();
	const initials = getInitials(trimmed);
	const usedColors = new Set(knownNames);
	const color =
		PLAYER_PALETTE.find((c) => !usedColors.has(c.name)) ??
		PLAYER_PALETTE[Math.floor(Math.random() * PLAYER_PALETTE.length)];
	const player: LocalPlayer = {
		id: randomId(),
		name: trimmed,
		initials,
		color
	};
	if (browser) {
		localStorage.setItem(STORAGE_KEYS.PLAYER_ID, player.id);
		localStorage.setItem(STORAGE_KEYS.PLAYER_NAME, player.name);
		localStorage.setItem(STORAGE_KEYS.PLAYER_COLOR, player.color.name);
	}
	return player;
}

export function clearLocalPlayer(): void {
	if (!browser) return;
	localStorage.removeItem(STORAGE_KEYS.PLAYER_ID);
	localStorage.removeItem(STORAGE_KEYS.PLAYER_NAME);
	localStorage.removeItem(STORAGE_KEYS.PLAYER_COLOR);
}
