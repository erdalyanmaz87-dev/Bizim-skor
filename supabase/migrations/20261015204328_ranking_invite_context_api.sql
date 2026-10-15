CREATE OR REPLACE FUNCTION public.get_ranking_invite_context(p_token text, p_competition text DEFAULT 'super_lig'::text, p_season text DEFAULT '2026/27'::text, p_exclude_fixture bigint DEFAULT NULL::bigint)
 RETURNS TABLE(week integer, player_name text, invite_count bigint)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$ begin if public.friend_session_player(p_token) is null then raise exception 'Oturum geçersiz veya süresi dolmuş';end if;if p_competition not in('super_lig','champions_league','nations_league') then raise exception 'Geçersiz müsabaka';end if;return query with contexts as(select null::integer wk union select distinct e.week from invite_ranking_private.result_events() e where e.competition=p_competition and e.season=p_season) select c.wk,i.inviter_name,count(distinct lower(i.invited_name))::bigint from contexts c cross join lateral invite_ranking_private.eligible(invite_ranking_private.cutoff(p_competition,p_season,c.wk,p_exclude_fixture)) i group by c.wk,i.inviter_name;end $function$
;
revoke all on function public.get_ranking_invite_context(text,text,text,bigint) from public;
grant execute on function public.get_ranking_invite_context(text,text,text,bigint) to anon,authenticated;

