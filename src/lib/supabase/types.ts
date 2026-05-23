export type GamePhase = 'lobby' | 'trivia' | 'wml' | 'photo' | 'wrapped';

export type Game = {
	id: string;
	phase: GamePhase;
	current_round: number;
	reveal: boolean;
	started_at: string | null;
	finished_at: string | null;
	config: GameConfig;
};

export type GameConfig = {
	trivia_order?: string[];
	wml_order?: string[];
	num_trivia?: number;
	num_wml?: number;
	/**
	 * Cuando un valor está aquí, todos los jugadores están viendo el intro
	 * animado de esa fase. Cuando todos marcan is_ready, se setea a null
	 * y la fase real arranca.
	 */
	intro_phase?: GamePhase | null;
};

export type Player = {
	id: string;
	game_id: string;
	name: string;
	initials: string;
	color: string;
	is_ready: boolean;
	joined_at: string;
	last_seen_at: string;
};

export type TriviaAnswer = {
	player_id: string;
	question_id: string;
	answer: string;
	is_correct: boolean;
	answered_at: string;
};

export type WmlVote = {
	voter_id: string;
	round_id: string;
	voted_for_id: string;
	voted_at: string;
};

export type Photo = {
	player_id: string;
	storage_path: string;
	uploaded_at: string;
};
