import { browser } from '$app/environment';
import { PUBLIC_GAME_ID, PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

export const GAME_ID = PUBLIC_GAME_ID || 'venti-bday-2026';
export const SUPABASE_URL = PUBLIC_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = PUBLIC_SUPABASE_ANON_KEY || '';

export const HAS_BACKEND = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const STORAGE_BUCKET = 'photos';
export const PHOTOS_PER_PLAYER = 1;
export const PHOTO_COUNTDOWN_SECONDS = 10;
export const MIN_PLAYERS_TO_START = 2;
export const PHASE_ADVANCE_TIMEOUT_MS = 60_000;

export const STORAGE_KEYS = {
	PLAYER_ID: 'venti.player_id',
	PLAYER_NAME: 'venti.player_name',
	PLAYER_COLOR: 'venti.player_color',
	SFX_MUTED: 'venti.sfx_muted',
	LAST_CHECKPOINT: 'venti.last_checkpoint'
} as const;

export function isBrowser(): boolean {
	return browser;
}
