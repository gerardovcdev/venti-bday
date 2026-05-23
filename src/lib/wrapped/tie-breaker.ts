import type { WmlVote } from '$lib/supabase/types';

/**
 * Hash determinístico simple sobre un string. djb2.
 */
function hashSeed(seed: string): number {
	let h = 5381;
	for (let i = 0; i < seed.length; i++) {
		h = ((h << 5) + h + seed.charCodeAt(i)) | 0;
	}
	return Math.abs(h);
}

export type WmlWinner = {
	winnerId: string;
	tiedWith: string[];
	voters: string[]; // ids de quienes votaron por el ganador
	totalVotes: number; // votos para el ganador
};

/**
 * Determina el ganador de una ronda de "quién es más probable".
 * Si hay empate, hace un pick determinístico (mismo resultado en todos los
 * dispositivos) usando `roundId` como seed.
 */
export function pickWinnerFromVotes(
	votes: WmlVote[],
	roundId: string
): WmlWinner | null {
	const roundVotes = votes.filter((v) => v.round_id === roundId);
	if (roundVotes.length === 0) return null;

	const tally = new Map<string, number>();
	const votersByCandidate = new Map<string, string[]>();
	for (const v of roundVotes) {
		tally.set(v.voted_for_id, (tally.get(v.voted_for_id) ?? 0) + 1);
		const arr = votersByCandidate.get(v.voted_for_id) ?? [];
		arr.push(v.voter_id);
		votersByCandidate.set(v.voted_for_id, arr);
	}

	const max = Math.max(...tally.values());
	const tied = [...tally.entries()]
		.filter(([, c]) => c === max)
		.map(([id]) => id)
		.sort(); // sort para que el orden sea estable

	if (tied.length === 1) {
		return {
			winnerId: tied[0],
			tiedWith: [],
			voters: votersByCandidate.get(tied[0]) ?? [],
			totalVotes: max
		};
	}

	const idx = hashSeed(roundId) % tied.length;
	const winnerId = tied[idx];
	return {
		winnerId,
		tiedWith: tied.filter((id) => id !== winnerId),
		voters: votersByCandidate.get(winnerId) ?? [],
		totalVotes: max
	};
}
