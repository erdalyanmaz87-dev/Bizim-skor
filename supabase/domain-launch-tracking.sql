
alter table public.player_launch_events add column source_host text;
create or replace function public.capture_launch_source_host()
returns trigger language plpgsql set search_path='' as $$
declare h jsonb; origin text;
begin
 h:=coalesce(nullif(current_setting('request.headers',true),'')::jsonb,'{}'::jsonb);
 origin:=lower(coalesce(h->>'origin',''));
 new.source_host:=case when origin in ('https://bizimskor.com','https://www.bizimskor.com','https://bizim-skor-live.vercel.app') then split_part(origin,'/',3) else null end;
 return new;
end $$;
revoke all on function public.capture_launch_source_host() from public,anon,authenticated;
create trigger capture_launch_source_host before insert on public.player_launch_events for each row execute function public.capture_launch_source_host();
create or replace function public.get_admin_domain_launch_stats(p_token text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 if not public.is_support_admin(p_token) then raise exception 'Yetkisiz işlem'; end if;
 with grouped as (
 select lower(trim(player_name)) as player_key,min(player_name) as player_name,
 count(*) as launch_count,max(launched_at) as last_launch,
 count(*) filter(where (launched_at at time zone 'Europe/Istanbul')::date=(now() at time zone 'Europe/Istanbul')::date) as today_count,
 count(*) filter(where launched_at>=now()-interval '7 days') as week_count
 from public.player_launch_events where source_host in ('bizimskor.com','www.bizimskor.com')
 group by lower(trim(player_name))
 )
 select jsonb_build_object('today_players',count(*) filter(where today_count>0),
 'week_players',count(*) filter(where week_count>0),'total_players',count(*),
 'players',coalesce(jsonb_agg(to_jsonb(grouped)-'player_key' order by last_launch desc),'[]'::jsonb),
 'tracking_since','2026-10-27','historical_note','Alan adı takibi 27 Ekim 2026 tarihinde başladı; önceki girişler ayrıştırılamaz.')
 into result from grouped;
 return result;
end $$;
revoke all on function public.get_admin_domain_launch_stats(text) from public;
grant execute on function public.get_admin_domain_launch_stats(text) to anon,authenticated;
