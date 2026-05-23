import { supabase } from './client';
import { GAME_ID } from '$lib/config';
import type { Game, Player, TriviaAnswer, WmlVote, Photo } from './types';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type RealtimeHandlers = {
	onGame?: (game: Game) => void;
	onPlayer?: (player: Player, event: 'INSERT' | 'UPDATE' | 'DELETE') => void;
	onAnswer?: (answer: TriviaAnswer, event: 'INSERT' | 'UPDATE') => void;
	onVote?: (vote: WmlVote, event: 'INSERT' | 'UPDATE') => void;
	onPhoto?: (photo: Photo, event: 'INSERT' | 'UPDATE') => void;
	onPresence?: (online: Set<string>) => void;
};

export function subscribeAll(handlers: RealtimeHandlers, playerId?: string): () => void {
	const sb = supabase();
	const channel: RealtimeChannel = sb.channel(`game:${GAME_ID}`, {
		config: { presence: { key: playerId ?? crypto.randomUUID() } }
	});

	channel
		.on(
			'postgres_changes',
			{ event: '*', schema: 'public', table: 'game', filter: `id=eq.${GAME_ID}` },
			(payload) => {
				if (payload.new) handlers.onGame?.(payload.new as Game);
			}
		)
		.on(
			'postgres_changes',
			{ event: '*', schema: 'public', table: 'players', filter: `game_id=eq.${GAME_ID}` },
			(payload) => {
				const event = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
				const row = (payload.new ?? payload.old) as Player;
				if (row) handlers.onPlayer?.(row, event);
			}
		)
		.on('postgres_changes', { event: '*', schema: 'public', table: 'trivia_answers' }, (payload) => {
			if (payload.new)
				handlers.onAnswer?.(
					payload.new as TriviaAnswer,
					payload.eventType as 'INSERT' | 'UPDATE'
				);
		})
		.on('postgres_changes', { event: '*', schema: 'public', table: 'wml_votes' }, (payload) => {
			if (payload.new)
				handlers.onVote?.(payload.new as WmlVote, payload.eventType as 'INSERT' | 'UPDATE');
		})
		.on('postgres_changes', { event: '*', schema: 'public', table: 'photos' }, (payload) => {
			if (payload.new)
				handlers.onPhoto?.(payload.new as Photo, payload.eventType as 'INSERT' | 'UPDATE');
		});

	if (handlers.onPresence) {
		channel.on('presence', { event: 'sync' }, () => {
			const state = channel.presenceState();
			const online = new Set<string>();
			for (const key of Object.keys(state)) online.add(key);
			handlers.onPresence?.(online);
		});
	}

	channel.subscribe(async (status) => {
		if (status === 'SUBSCRIBED' && playerId && handlers.onPresence) {
			await channel.track({ player_id: playerId });
		}
	});

	return () => {
		void sb.removeChannel(channel);
	};
}

export async function fetchInitialState() {
	const sb = supabase();
	const [gameRes, playersRes, answersRes, votesRes, photosRes] = await Promise.all([
		sb.from('game').select('*').eq('id', GAME_ID).maybeSingle(),
		sb.from('players').select('*').eq('game_id', GAME_ID),
		sb.from('trivia_answers').select('*'),
		sb.from('wml_votes').select('*'),
		sb.from('photos').select('*')
	]);
	return {
		game: gameRes.data as Game | null,
		players: (playersRes.data ?? []) as Player[],
		answers: (answersRes.data ?? []) as TriviaAnswer[],
		votes: (votesRes.data ?? []) as WmlVote[],
		photos: (photosRes.data ?? []) as Photo[]
	};
}
