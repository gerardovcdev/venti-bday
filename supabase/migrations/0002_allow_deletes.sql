-- Permisos de DELETE faltantes en la migración inicial.
-- Sin esto, resetGame() y pruneStalePlayers() no pueden borrar nada
-- (RLS rechaza silenciosamente).

create policy "anyone can delete players" on public.players for delete using (true);
create policy "anyone can delete answers" on public.trivia_answers for delete using (true);
create policy "anyone can delete votes" on public.wml_votes for delete using (true);
create policy "anyone can delete photos" on public.photos for delete using (true);

-- Permitir borrar archivos de Storage también (para limpiar fotos viejas)
create policy "anyone can delete photo files" on storage.objects for delete
	to anon using (bucket_id = 'photos');
