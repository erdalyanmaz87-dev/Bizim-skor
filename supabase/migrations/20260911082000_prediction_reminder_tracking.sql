create table if not exists public.prediction_reminder_events (
  id bigserial primary key,
  player_name text not null,
  competition text not null check (competition in ('super','champions','nations')),
  week integer not null,
  reminder_key text not null,
  event_type text not null check (event_type in ('view','yes','later','completed')),
  seconds_to_complete integer,
  occurred_at timestamptz not null default now()
);

create index if not exists prediction_reminder_events_player_idx on public.prediction_reminder_events(player_name, occurred_at desc);
create index if not exists prediction_reminder_events_event_idx on public.prediction_reminder_events(event_type, occurred_at desc);
alter table public.prediction_reminder_events enable row level security;
revoke all on public.prediction_reminder_events from anon, authenticated;

create or replace function public.get_prediction_reminder_status(p_token text, p_now timestamptz default now())
returns table(competition text, week integer, label text, deadline timestamptz, fixture_count integer, saved_count integer, reminder_key text)
language plpgsql security definer set search_path=public,extensions as $$
declare v_player text := public.friend_session_player(p_token);
begin
  if v_player is null then raise exception 'Oturum geçersiz veya süresi dolmuş'; end if;
  return query
  with candidates as (
    select 'super'::text competition,f.week,(f.week::text||'. Hafta')::text label,min(f.kickoff) deadline,count(*)::integer fixture_count,count(p.fixture_id)::integer saved_count
    from public.fixtures f left join public.predictions p on p.fixture_id=f.id and lower(p.player_name)=lower(v_player)
    group by f.season,f.week having min(f.kickoff)>p_now and min(f.kickoff)<=p_now+interval '24 hours' and count(p.fixture_id)<count(*)
    union all
    select 'champions',f.week,'Şampiyonlar Ligi',min(f.kickoff),count(*)::integer,count(p.fixture_id)::integer
    from public.champions_league_fixtures f left join public.champions_league_predictions p on p.fixture_id=f.id and lower(p.player_name)=lower(v_player)
    group by f.season,f.week having min(f.kickoff)>p_now and min(f.kickoff)<=p_now+interval '24 hours' and count(p.fixture_id)<count(*)
    union all
    select 'nations',f.week,'Uluslar Ligi',min(f.kickoff),count(*)::integer,count(p.fixture_id)::integer
    from public.nations_league_fixtures f left join public.nations_league_predictions p on p.fixture_id=f.id and lower(p.player_name)=lower(v_player)
    group by f.season,f.week having min(f.kickoff)>p_now and min(f.kickoff)<=p_now+interval '24 hours' and count(p.fixture_id)<count(*)
  )
  select c.competition,c.week,c.label,c.deadline,c.fixture_count,c.saved_count,(c.competition||':'||c.week::text||':'||extract(epoch from c.deadline)::bigint::text)::text
  from candidates c order by c.deadline;
end $$;
revoke all on function public.get_prediction_reminder_status(text,timestamptz) from public;
grant execute on function public.get_prediction_reminder_status(text,timestamptz) to anon,authenticated;

create or replace function public.log_prediction_reminder_event(p_token text,p_competition text,p_week integer,p_reminder_key text,p_event_type text,p_seconds_to_complete integer default null)
returns boolean language plpgsql security definer set search_path=public,extensions as $$
declare v_player text := public.friend_session_player(p_token);
begin
  if v_player is null then raise exception 'Oturum geçersiz veya süresi dolmuş'; end if;
  if p_competition not in ('super','champions','nations') then raise exception 'Geçersiz yarışma'; end if;
  if p_event_type not in ('view','yes','later','completed') then raise exception 'Geçersiz olay'; end if;
  insert into public.prediction_reminder_events(player_name,competition,week,reminder_key,event_type,seconds_to_complete)
  values(v_player,p_competition,p_week,p_reminder_key,p_event_type,p_seconds_to_complete);
  return true;
end $$;
revoke all on function public.log_prediction_reminder_event(text,text,integer,text,text,integer) from public;
grant execute on function public.log_prediction_reminder_event(text,text,integer,text,text,integer) to anon,authenticated;

create or replace function public.get_prediction_completion(p_token text,p_competition text,p_week integer)
returns table(is_complete boolean,fixture_count integer,saved_count integer)
language plpgsql security definer set search_path=public,extensions as $$
declare v_player text := public.friend_session_player(p_token);
begin
  if v_player is null then raise exception 'Oturum geçersiz veya süresi dolmuş'; end if;
  if p_competition='super' then
    return query select count(*)>0 and count(p.fixture_id)=count(*),count(*)::integer,count(p.fixture_id)::integer from public.fixtures f left join public.predictions p on p.fixture_id=f.id and lower(p.player_name)=lower(v_player) where f.week=p_week;
  elsif p_competition='champions' then
    return query select count(*)>0 and count(p.fixture_id)=count(*),count(*)::integer,count(p.fixture_id)::integer from public.champions_league_fixtures f left join public.champions_league_predictions p on p.fixture_id=f.id and lower(p.player_name)=lower(v_player) where f.week=p_week;
  elsif p_competition='nations' then
    return query select count(*)>0 and count(p.fixture_id)=count(*),count(*)::integer,count(p.fixture_id)::integer from public.nations_league_fixtures f left join public.nations_league_predictions p on p.fixture_id=f.id and lower(p.player_name)=lower(v_player) where f.week=p_week;
  else raise exception 'Geçersiz yarışma'; end if;
end $$;
revoke all on function public.get_prediction_completion(text,text,integer) from public;
grant execute on function public.get_prediction_completion(text,text,integer) to anon,authenticated;
