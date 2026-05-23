// Supabase Edge Function: advance-phase
// Validates that all players have completed the current phase/round
// and atomically advances the game state.
//
// Deploy with: supabase functions deploy advance-phase --no-verify-jwt

import { createClient } from 'jsr:@supabase/supabase-js@2';

type AdvancePayload = {
	game_id: string;
	action:
		| 'start_game'
		| 'reveal_trivia'
		| 'next_trivia'
		| 'start_wml'
		| 'reveal_wml'
		| 'next_wml'
		| 'start_photo'
		| 'finish_photo';
};

Deno.serve(async (req) => {
	if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

	const { game_id, action } = (await req.json()) as AdvancePayload;
	const supabase = createClient(
		Deno.env.get('SUPABASE_URL')!,
		Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
	);

	const { data: game, error: gameErr } = await supabase
		.from('game')
		.select('*')
		.eq('id', game_id)
		.single();
	if (gameErr || !game) {
		return Response.json({ error: 'game not found' }, { status: 404 });
	}

	const { data: players } = await supabase.from('players').select('id').eq('game_id', game_id);
	const playerIds = (players ?? []).map((p) => p.id);
	const playerCount = playerIds.length;

	const update: Record<string, unknown> = {};

	switch (action) {
		case 'start_game': {
			const { data: readyPlayers } = await supabase
				.from('players')
				.select('id')
				.eq('game_id', game_id)
				.eq('is_ready', true);
			if (!readyPlayers || readyPlayers.length < 2 || readyPlayers.length < playerCount) {
				return Response.json({ error: 'not all ready' }, { status: 400 });
			}
			update.phase = 'trivia';
			update.current_round = 0;
			update.reveal = false;
			update.started_at = new Date().toISOString();
			break;
		}
		case 'reveal_trivia': {
			const currentQuestionId = (game.config?.trivia_order as string[] | undefined)?.[
				game.current_round
			];
			if (!currentQuestionId) {
				return Response.json({ error: 'no current question' }, { status: 400 });
			}
			const { data: answers } = await supabase
				.from('trivia_answers')
				.select('player_id')
				.eq('question_id', currentQuestionId)
				.in('player_id', playerIds);
			if (!answers || answers.length < playerCount) {
				return Response.json({ error: 'waiting for answers' }, { status: 400 });
			}
			update.reveal = true;
			break;
		}
		case 'next_trivia': {
			const order = (game.config?.trivia_order as string[] | undefined) ?? [];
			if (game.current_round + 1 >= order.length) {
				update.phase = 'wml';
				update.current_round = 0;
				update.reveal = false;
			} else {
				update.current_round = game.current_round + 1;
				update.reveal = false;
			}
			break;
		}
		case 'start_wml': {
			update.phase = 'wml';
			update.current_round = 0;
			update.reveal = false;
			break;
		}
		case 'reveal_wml': {
			const currentRoundId = (game.config?.wml_order as string[] | undefined)?.[
				game.current_round
			];
			if (!currentRoundId) {
				return Response.json({ error: 'no current round' }, { status: 400 });
			}
			const { data: votes } = await supabase
				.from('wml_votes')
				.select('voter_id')
				.eq('round_id', currentRoundId)
				.in('voter_id', playerIds);
			if (!votes || votes.length < playerCount) {
				return Response.json({ error: 'waiting for votes' }, { status: 400 });
			}
			update.reveal = true;
			break;
		}
		case 'next_wml': {
			const order = (game.config?.wml_order as string[] | undefined) ?? [];
			if (game.current_round + 1 >= order.length) {
				update.phase = 'photo';
				update.current_round = 0;
				update.reveal = false;
			} else {
				update.current_round = game.current_round + 1;
				update.reveal = false;
			}
			break;
		}
		case 'finish_photo': {
			const { data: photos } = await supabase
				.from('photos')
				.select('player_id')
				.in('player_id', playerIds);
			if (!photos || photos.length < playerCount) {
				return Response.json({ error: 'waiting for photos' }, { status: 400 });
			}
			update.phase = 'wrapped';
			update.reveal = true;
			update.finished_at = new Date().toISOString();
			break;
		}
		default:
			return Response.json({ error: 'unknown action' }, { status: 400 });
	}

	const { error: updateErr } = await supabase.from('game').update(update).eq('id', game_id);
	if (updateErr) return Response.json({ error: updateErr.message }, { status: 500 });

	return Response.json({ ok: true, update });
});
