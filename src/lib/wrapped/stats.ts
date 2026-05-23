import type { Player, TriviaAnswer, WmlVote } from '$lib/supabase/types';
import { pickWinnerFromVotes, type WmlWinner } from './tie-breaker';

export function correctByPlayer(answers: TriviaAnswer[]): Map<string, number> {
	const map = new Map<string, number>();
	for (const a of answers) {
		if (a.is_correct) map.set(a.player_id, (map.get(a.player_id) ?? 0) + 1);
	}
	return map;
}

export function totalByPlayer(answers: TriviaAnswer[]): Map<string, number> {
	const map = new Map<string, number>();
	for (const a of answers) {
		map.set(a.player_id, (map.get(a.player_id) ?? 0) + 1);
	}
	return map;
}

/**
 * Jugador con más respuestas correctas. Empate → primero por joined_at.
 */
export function findCerebrito(players: Player[], answers: TriviaAnswer[]): string | null {
	const correct = correctByPlayer(answers);
	let max = -1;
	let winnerId: string | null = null;
	for (const p of players) {
		const c = correct.get(p.id) ?? 0;
		if (c > max) {
			max = c;
			winnerId = p.id;
		}
	}
	return winnerId;
}

/**
 * Jugador con menos respuestas correctas. Si es la misma persona que cerebrito,
 * o no hay nadie con un mínimo distinto, devuelve null.
 */
export function findDespistada(
	players: Player[],
	answers: TriviaAnswer[],
	excludeId?: string
): string | null {
	const correct = correctByPlayer(answers);
	let min = Infinity;
	let id: string | null = null;
	for (const p of players) {
		if (p.id === excludeId) continue;
		const c = correct.get(p.id) ?? 0;
		if (c < min) {
			min = c;
			id = p.id;
		}
	}
	return id;
}

export type HardestQuestion = {
	id: string;
	wrong: number;
	total: number;
};

export function findHardestQuestion(answers: TriviaAnswer[]): HardestQuestion | null {
	const counts = new Map<string, { total: number; wrong: number }>();
	for (const a of answers) {
		const cur = counts.get(a.question_id) ?? { total: 0, wrong: 0 };
		cur.total++;
		if (!a.is_correct) cur.wrong++;
		counts.set(a.question_id, cur);
	}
	let max = 0;
	let id: string | null = null;
	let totalForId = 0;
	for (const [qid, c] of counts) {
		if (c.wrong > max) {
			max = c.wrong;
			id = qid;
			totalForId = c.total;
		}
	}
	return id ? { id, wrong: max, total: totalForId } : null;
}

export type WmlSummaryItem = WmlWinner & { roundId: string };

/**
 * Resumen de todas las rondas de WML con winner ya resuelto (incluye tie-break).
 */
export function summarizeWml(votes: WmlVote[], roundIds: string[]): WmlSummaryItem[] {
	const out: WmlSummaryItem[] = [];
	for (const rid of roundIds) {
		const w = pickWinnerFromVotes(votes, rid);
		if (w) out.push({ ...w, roundId: rid });
	}
	return out;
}

/**
 * Rondas donde un jugador específico fue el ganador (o uno de los empatados).
 */
export function wmlRoundsWhereVoted(
	votes: WmlVote[],
	playerId: string
): { roundId: string; voters: string[] }[] {
	const byRound = new Map<string, string[]>();
	for (const v of votes) {
		if (v.voted_for_id !== playerId) continue;
		const arr = byRound.get(v.round_id) ?? [];
		arr.push(v.voter_id);
		byRound.set(v.round_id, arr);
	}
	return [...byRound.entries()].map(([roundId, voters]) => ({ roundId, voters }));
}
