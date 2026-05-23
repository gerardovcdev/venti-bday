import { supabase } from './client';
import { GAME_ID, STORAGE_BUCKET } from '$lib/config';
import type { Player } from './types';
import triviaData from '$lib/content/trivia.json';
import wmlData from '$lib/content/whos_most_likely.json';

function shuffle<T>(arr: T[], seedFn: () => number = Math.random): T[] {
	const out = [...arr];
	for (let i = out.length - 1; i > 0; i--) {
		const j = Math.floor(seedFn() * (i + 1));
		[out[i], out[j]] = [out[j], out[i]];
	}
	return out;
}

export async function ensureGame(): Promise<void> {
	const sb = supabase();
	const { data: existing } = await sb
		.from('game')
		.select('id, config')
		.eq('id', GAME_ID)
		.maybeSingle();
	if (existing) {
		// Si la fila existe pero le falta config (caso típico de seed via migración),
		// completarla sin reiniciar el juego.
		const cfg = (existing.config ?? {}) as {
			trivia_order?: string[];
			wml_order?: string[];
		};
		if (!cfg.trivia_order || !cfg.wml_order) {
			const trivia_order = cfg.trivia_order ?? shuffle(triviaData.map((q) => q.id));
			const wml_order = cfg.wml_order ?? shuffle(wmlData.map((w) => w.id));
			await sb
				.from('game')
				.update({
					config: {
						trivia_order,
						wml_order,
						num_trivia: trivia_order.length,
						num_wml: wml_order.length
					}
				})
				.eq('id', GAME_ID);
		}
		return;
	}
	const trivia_order = shuffle(triviaData.map((q) => q.id));
	const wml_order = shuffle(wmlData.map((w) => w.id));
	await sb.from('game').insert({
		id: GAME_ID,
		phase: 'lobby',
		current_round: 0,
		reveal: false,
		config: {
			trivia_order,
			wml_order,
			num_trivia: trivia_order.length,
			num_wml: wml_order.length
		}
	});
}

/**
 * Reinicia completamente el juego: borra TODOS los jugadores, respuestas,
 * votos y fotos. Vuelve la fase a lobby con un nuevo orden barajado.
 *
 * Los clientes detectan que su player fue borrado (vía realtime) y se
 * autoredirigen a la landing, limpiando su localStorage.
 */
export async function resetGame(): Promise<void> {
	const sb = supabase();
	const trivia_order = shuffle(triviaData.map((q) => q.id));
	const wml_order = shuffle(wmlData.map((w) => w.id));

	// Borrar todo lo dependiente de jugadores PRIMERO, para evitar problemas
	// de foreign key cuando se borren los jugadores.
	await Promise.all([
		sb.from('trivia_answers').delete().neq('player_id', '00000000-0000-0000-0000-000000000000'),
		sb.from('wml_votes').delete().neq('voter_id', '00000000-0000-0000-0000-000000000000'),
		sb.from('photos').delete().neq('player_id', '00000000-0000-0000-0000-000000000000')
	]);

	// Borrar TODOS los jugadores - los clientes se redirigirán solos
	await sb.from('players').delete().eq('game_id', GAME_ID);

	// Reset game state
	await sb
		.from('game')
		.update({
			phase: 'lobby',
			current_round: 0,
			reveal: false,
			started_at: null,
			finished_at: null,
			config: {
				trivia_order,
				wml_order,
				num_trivia: trivia_order.length,
				num_wml: wml_order.length
			}
		})
		.eq('id', GAME_ID);
}

/**
 * Borra solo a un jugador del juego (para "salir" o limpiar fantasmas).
 */
export async function leaveGame(playerId: string): Promise<void> {
	const sb = supabase();
	await sb.from('players').delete().eq('id', playerId);
}

const STALE_PLAYER_MS = 3 * 60_000; // 3 minutos sin actualizar = fantasma

/**
 * Borra jugadores cuyo last_seen_at sea más viejo que el umbral.
 * Llamada antes de insertar / al entrar al juego para limpiar fantasmas.
 */
export async function pruneStalePlayers(): Promise<void> {
	const sb = supabase();
	const threshold = new Date(Date.now() - STALE_PLAYER_MS).toISOString();
	await sb
		.from('players')
		.delete()
		.eq('game_id', GAME_ID)
		.lt('last_seen_at', threshold);
}

export async function joinGame(input: {
	id: string;
	name: string;
	initials: string;
	color: string;
}): Promise<Player> {
	const sb = supabase();
	await ensureGame();
	// Limpiar fantasmas ANTES de insertar (no borra al jugador actual porque
	// todavía no existe, y no borra a otros activos porque tienen last_seen_at reciente).
	await pruneStalePlayers();
	const { data, error } = await sb
		.from('players')
		.upsert({
			id: input.id,
			game_id: GAME_ID,
			name: input.name,
			initials: input.initials,
			color: input.color,
			is_ready: false,
			last_seen_at: new Date().toISOString()
		})
		.select()
		.single();
	if (error) throw error;
	return data as Player;
}

export async function setReady(playerId: string, ready: boolean): Promise<void> {
	const { error } = await supabase()
		.from('players')
		.update({ is_ready: ready, last_seen_at: new Date().toISOString() })
		.eq('id', playerId);
	if (error) throw error;
}

export async function touchPresence(playerId: string): Promise<void> {
	await supabase()
		.from('players')
		.update({ last_seen_at: new Date().toISOString() })
		.eq('id', playerId);
}

export async function submitTriviaAnswer(input: {
	playerId: string;
	questionId: string;
	answer: string;
	isCorrect: boolean;
}): Promise<void> {
	const { error } = await supabase()
		.from('trivia_answers')
		.upsert({
			player_id: input.playerId,
			question_id: input.questionId,
			answer: input.answer,
			is_correct: input.isCorrect,
			answered_at: new Date().toISOString()
		});
	if (error) throw error;
}

export async function submitWmlVote(input: {
	voterId: string;
	roundId: string;
	votedForId: string;
}): Promise<void> {
	const { error } = await supabase()
		.from('wml_votes')
		.upsert({
			voter_id: input.voterId,
			round_id: input.roundId,
			voted_for_id: input.votedForId,
			voted_at: new Date().toISOString()
		});
	if (error) throw error;
}

export async function uploadPhoto(input: { playerId: string; blob: Blob }): Promise<string> {
	const sb = supabase();
	const path = `${GAME_ID}/${input.playerId}.jpg`;
	const { error: uploadErr } = await sb.storage
		.from(STORAGE_BUCKET)
		.upload(path, input.blob, { upsert: true, contentType: 'image/jpeg' });
	if (uploadErr) throw uploadErr;
	const { error: dbErr } = await sb
		.from('photos')
		.upsert({
			player_id: input.playerId,
			storage_path: path,
			uploaded_at: new Date().toISOString()
		});
	if (dbErr) throw dbErr;
	return path;
}

export function getPhotoPublicUrl(path: string): string {
	const sb = supabase();
	const { data } = sb.storage.from(STORAGE_BUCKET).getPublicUrl(path);
	return data.publicUrl;
}

export type AdvanceAction =
	| 'start_game'
	| 'skip_intro'
	| 'reveal_trivia'
	| 'next_trivia'
	| 'start_wml'
	| 'reveal_wml'
	| 'next_wml'
	| 'start_photo'
	| 'finish_photo';

/**
 * Resetea is_ready=false para todos los jugadores del juego.
 * Se usa al entrar/salir de un intro.
 */
async function resetReadyFlags(): Promise<void> {
	await supabase()
		.from('players')
		.update({ is_ready: false })
		.eq('game_id', GAME_ID);
}

const PRESENCE_THRESHOLD_MS = 90_000;

async function fetchGameAndPlayers() {
	const sb = supabase();
	const [gameRes, playersRes] = await Promise.all([
		sb.from('game').select('*').eq('id', GAME_ID).single(),
		sb.from('players').select('id, is_ready, last_seen_at').eq('game_id', GAME_ID)
	]);
	if (gameRes.error) throw gameRes.error;
	if (playersRes.error) throw playersRes.error;
	const players = (playersRes.data ?? []) as {
		id: string;
		is_ready: boolean;
		last_seen_at: string;
	}[];
	const now = Date.now();
	const activePlayers = players.filter(
		(p) => now - new Date(p.last_seen_at).getTime() < PRESENCE_THRESHOLD_MS
	);
	return {
		game: gameRes.data,
		players,
		activePlayers
	};
}

async function applyGameUpdate(update: Record<string, unknown>): Promise<void> {
	const { error } = await supabase().from('game').update(update).eq('id', GAME_ID);
	if (error) throw error;
}

export async function advancePhase(action: AdvanceAction, force = false): Promise<void> {
	const sb = supabase();
	const { game, players, activePlayers } = await fetchGameAndPlayers();
	const required = force ? activePlayers : players;
	const requiredIds = required.map((p) => p.id);
	const requiredCount = required.length;

	switch (action) {
		case 'start_game': {
			const readyCount = required.filter((p) => p.is_ready).length;
			if (readyCount < 2 || readyCount < requiredCount) {
				throw new Error('Faltan jugadores listos');
			}
			// Garantizar que el config tenga las órdenes (idempotente, sirve para juegos
			// creados antes de tener este código).
			const cfg = (game.config ?? {}) as {
				trivia_order?: string[];
				wml_order?: string[];
			};
			const trivia_order =
				cfg.trivia_order && cfg.trivia_order.length > 0
					? cfg.trivia_order
					: shuffle(triviaData.map((q) => q.id));
			const wml_order =
				cfg.wml_order && cfg.wml_order.length > 0
					? cfg.wml_order
					: shuffle(wmlData.map((w) => w.id));
			// Entrar al INTRO de trivia (no a la trivia real). Cuando todos
			// acepten, skip_intro avanza al gameplay real.
			await applyGameUpdate({
				phase: 'trivia',
				current_round: 0,
				reveal: false,
				started_at: new Date().toISOString(),
				config: {
					trivia_order,
					wml_order,
					num_trivia: trivia_order.length,
					num_wml: wml_order.length,
					intro_phase: 'trivia'
				}
			});
			await resetReadyFlags();
			return;
		}
		case 'skip_intro': {
			// Verificar que todos los activos hayan aceptado el intro
			const readyCount = required.filter((p) => p.is_ready).length;
			if (readyCount < requiredCount) {
				throw new Error('Faltan jugadores en aceptar el intro');
			}
			const cfg = (game.config ?? {}) as { intro_phase?: string };
			await applyGameUpdate({
				config: { ...cfg, intro_phase: null }
			});
			await resetReadyFlags();
			return;
		}
		case 'reveal_trivia': {
			const order = (game.config?.trivia_order ?? []) as string[];
			const qid = order[game.current_round];
			if (!qid) throw new Error('Sin pregunta actual');
			const { count } = await sb
				.from('trivia_answers')
				.select('player_id', { count: 'exact', head: true })
				.eq('question_id', qid)
				.in('player_id', requiredIds);
			if ((count ?? 0) < requiredCount) throw new Error('Esperando respuestas');
			await applyGameUpdate({ reveal: true });
			return;
		}
		case 'next_trivia': {
			const order = (game.config?.trivia_order ?? []) as string[];
			if (game.current_round + 1 >= order.length) {
				// trivia → intro de wml
				const cfg = (game.config ?? {}) as { intro_phase?: string };
				await applyGameUpdate({
					phase: 'wml',
					current_round: 0,
					reveal: false,
					config: { ...cfg, intro_phase: 'wml' }
				});
				await resetReadyFlags();
			} else {
				await applyGameUpdate({ current_round: game.current_round + 1, reveal: false });
			}
			return;
		}
		case 'start_wml': {
			const cfg = (game.config ?? {}) as { intro_phase?: string };
			await applyGameUpdate({
				phase: 'wml',
				current_round: 0,
				reveal: false,
				config: { ...cfg, intro_phase: 'wml' }
			});
			await resetReadyFlags();
			return;
		}
		case 'reveal_wml': {
			const order = (game.config?.wml_order ?? []) as string[];
			const rid = order[game.current_round];
			if (!rid) throw new Error('Sin ronda actual');
			const { count } = await sb
				.from('wml_votes')
				.select('voter_id', { count: 'exact', head: true })
				.eq('round_id', rid)
				.in('voter_id', requiredIds);
			if ((count ?? 0) < requiredCount) throw new Error('Esperando votos');
			await applyGameUpdate({ reveal: true });
			return;
		}
		case 'next_wml': {
			const order = (game.config?.wml_order ?? []) as string[];
			if (game.current_round + 1 >= order.length) {
				// wml → intro de photo
				const cfg = (game.config ?? {}) as { intro_phase?: string };
				await applyGameUpdate({
					phase: 'photo',
					current_round: 0,
					reveal: false,
					config: { ...cfg, intro_phase: 'photo' }
				});
				await resetReadyFlags();
			} else {
				await applyGameUpdate({ current_round: game.current_round + 1, reveal: false });
			}
			return;
		}
		case 'start_photo': {
			const cfg = (game.config ?? {}) as { intro_phase?: string };
			await applyGameUpdate({
				phase: 'photo',
				current_round: 0,
				reveal: false,
				config: { ...cfg, intro_phase: 'photo' }
			});
			await resetReadyFlags();
			return;
		}
		case 'finish_photo': {
			const { count } = await sb
				.from('photos')
				.select('player_id', { count: 'exact', head: true })
				.in('player_id', requiredIds);
			if ((count ?? 0) < requiredCount) throw new Error('Esperando fotos');
			await applyGameUpdate({
				phase: 'wrapped',
				reveal: true,
				finished_at: new Date().toISOString()
			});
			return;
		}
	}
}
