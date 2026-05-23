import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { HAS_BACKEND, SUPABASE_URL, SUPABASE_ANON_KEY } from '$lib/config';

let _client: SupabaseClient | null = null;

export function supabase(): SupabaseClient {
	if (!HAS_BACKEND) {
		throw new Error(
			'Supabase no está configurado. Define PUBLIC_SUPABASE_URL y PUBLIC_SUPABASE_ANON_KEY en .env'
		);
	}
	if (!_client) {
		_client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
			auth: { persistSession: false },
			realtime: { params: { eventsPerSecond: 10 } }
		});
	}
	return _client;
}

export function hasBackend(): boolean {
	return HAS_BACKEND;
}
