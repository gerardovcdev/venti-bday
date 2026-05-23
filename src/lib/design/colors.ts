export const PLAYER_PALETTE = [
	{ name: 'rose', bg: '#A8CFF0', fg: '#1F3A5C', ring: '#7FB8E8' },
	{ name: 'lilac', bg: '#E8D5FF', fg: '#5B3A7A', ring: '#C9A8F0' },
	{ name: 'peach', bg: '#FFD9C4', fg: '#7A3E1F', ring: '#FFB893' },
	{ name: 'mint', bg: '#D4F1E0', fg: '#2F5E45', ring: '#A8DCBE' },
	{ name: 'butter', bg: '#FFF1B8', fg: '#7A5A1F', ring: '#F5D77E' },
	{ name: 'sky', bg: '#C7E3FF', fg: '#234D7A', ring: '#9CC9F5' },
	{ name: 'bubble', bg: '#FFC0E2', fg: '#7A2E5C', ring: '#FF9FCB' },
	{ name: 'sage', bg: '#DDEAD2', fg: '#3F5A2D', ring: '#B5CFA1' },
	{ name: 'coral', bg: '#FFCBC1', fg: '#7A2F22', ring: '#FFA28F' },
	{ name: 'lemon', bg: '#FFF4CC', fg: '#7A6010', ring: '#F5E08A' },
	{ name: 'orchid', bg: '#F0CFEA', fg: '#5C2A52', ring: '#D8A0CD' },
	{ name: 'sand', bg: '#FFE9D6', fg: '#7A4A1F', ring: '#F5C998' }
] as const;

export type PlayerColor = (typeof PLAYER_PALETTE)[number];

export function pickColorByIndex(index: number): PlayerColor {
	return PLAYER_PALETTE[index % PLAYER_PALETTE.length];
}

export function getInitials(name: string): string {
	const cleaned = name.trim();
	if (!cleaned) return '??';
	const letters = cleaned.replace(/[^\p{L}]/gu, '');
	if (letters.length === 0) return cleaned.slice(0, 3);
	const first = letters[0].toUpperCase();
	const rest = letters.slice(1, 3).toLowerCase();
	return first + rest;
}
