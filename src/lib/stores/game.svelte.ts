import type { Game, Player, TriviaAnswer, WmlVote, Photo, GamePhase } from '$lib/supabase/types';
import { subscribeAll, fetchInitialState } from '$lib/supabase/realtime';
import { saveCheckpoint, loadCheckpoint } from '$lib/persistence/idb';
import { hasBackend } from '$lib/supabase/client';
import { play } from '$lib/audio/sfx.svelte';

class GameStore {
	game = $state<Game | null>(null);
	players = $state<Player[]>([]);
	answers = $state<TriviaAnswer[]>([]);
	votes = $state<WmlVote[]>([]);
	photos = $state<Photo[]>([]);
	presence = $state<Set<string>>(new Set());
	connected = $state(false);
	error = $state<string | null>(null);
	lastUpdateAt = $state(Date.now());
	testMode = $state(false);

	private unsub: (() => void) | null = null;
	private lastPhase: GamePhase | null = null;

	seedTest(data: {
		game: Game;
		players: Player[];
		answers: TriviaAnswer[];
		votes: WmlVote[];
		photos: Photo[];
	}): void {
		this.testMode = true;
		this.game = data.game;
		this.players = data.players;
		this.answers = data.answers;
		this.votes = data.votes;
		this.photos = data.photos;
		this.presence = new Set(data.players.map((p) => p.id));
		this.connected = true;
		this.error = null;
		this.lastUpdateAt = Date.now();
	}

	clearTest(): void {
		this.testMode = false;
		this.game = null;
		this.players = [];
		this.answers = [];
		this.votes = [];
		this.photos = [];
		this.presence = new Set();
		this.connected = false;
	}

	get phase(): GamePhase {
		return this.game?.phase ?? 'lobby';
	}

	get currentRound(): number {
		return this.game?.current_round ?? 0;
	}

	get reveal(): boolean {
		return this.game?.reveal ?? false;
	}

	playerById(id: string): Player | undefined {
		return this.players.find((p) => p.id === id);
	}

	async hydrateFromCheckpoint(): Promise<GamePhase | null> {
		const cp = await loadCheckpoint();
		if (!cp) return null;
		return cp.phase;
	}

	async start(playerId?: string): Promise<void> {
		if (!hasBackend()) {
			this.error = 'Supabase no configurado. Revisa el archivo .env';
			return;
		}
		try {
			const initial = await fetchInitialState();
			if (initial.game) {
				this.game = initial.game;
				this.lastPhase = initial.game.phase;
			}
			this.players = initial.players;
			this.answers = initial.answers;
			this.votes = initial.votes;
			this.photos = initial.photos;
			this.connected = true;
			this.lastUpdateAt = Date.now();

			this.unsub = subscribeAll(
				{
					onGame: (g) => {
						const prevPhase = this.lastPhase;
						this.game = g;
						this.lastUpdateAt = Date.now();
						if (prevPhase && prevPhase !== g.phase) {
							play('chime');
						}
						this.lastPhase = g.phase;
						this.snapshotCheckpoint(playerId);
					},
					onPlayer: (p, event) => {
						if (event === 'DELETE') {
							this.players = this.players.filter((x) => x.id !== p.id);
						} else {
							const i = this.players.findIndex((x) => x.id === p.id);
							if (i >= 0) this.players[i] = p;
							else this.players = [...this.players, p];
						}
					},
					onAnswer: (a) => {
						const i = this.answers.findIndex(
							(x) => x.player_id === a.player_id && x.question_id === a.question_id
						);
						if (i >= 0) this.answers[i] = a;
						else this.answers = [...this.answers, a];
						this.lastUpdateAt = Date.now();
					},
					onVote: (v) => {
						const i = this.votes.findIndex(
							(x) => x.voter_id === v.voter_id && x.round_id === v.round_id
						);
						if (i >= 0) this.votes[i] = v;
						else this.votes = [...this.votes, v];
						this.lastUpdateAt = Date.now();
					},
					onPhoto: (p) => {
						const i = this.photos.findIndex((x) => x.player_id === p.player_id);
						if (i >= 0) this.photos[i] = p;
						else this.photos = [...this.photos, p];
						this.lastUpdateAt = Date.now();
					},
					onPresence: (online) => {
						this.presence = online;
						this.lastUpdateAt = Date.now();
					}
				},
				playerId
			);
		} catch (e) {
			this.error = e instanceof Error ? e.message : String(e);
			this.connected = false;
		}
	}

	stop(): void {
		this.unsub?.();
		this.unsub = null;
		this.connected = false;
	}

	private snapshotCheckpoint(playerId?: string) {
		if (!playerId || !this.game) return;
		const p = this.playerById(playerId);
		if (!p) return;
		void saveCheckpoint({
			phase: this.game.phase,
			currentRound: this.game.current_round,
			reveal: this.game.reveal,
			playerId,
			playerName: p.name
		});
	}
}

export const gameStore = new GameStore();
