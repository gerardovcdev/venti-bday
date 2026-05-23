import posesData from '$lib/content/photo_poses.json';

export type Pose = {
	id: string;
	prompt: string;
	emoji: string;
};

const POSES = posesData as Pose[];

function hashSeed(seed: string): number {
	let h = 5381;
	for (let i = 0; i < seed.length; i++) {
		h = ((h << 5) + h + seed.charCodeAt(i)) | 0;
	}
	return Math.abs(h);
}

/**
 * Asigna deterministicamente una pose a un jugador. La misma persona
 * siempre obtiene la misma pose en el mismo juego.
 */
export function poseForPlayer(playerId: string, gameId: string): Pose {
	const idx = hashSeed(playerId + gameId) % POSES.length;
	return POSES[idx];
}

export { POSES };
