-- =============================================================
-- ProdeFC — Función de scoring automático
-- Se ejecuta cuando un partido pasa a status = 'finished'
-- =============================================================

create or replace function score_predictions_for_match(p_match_id uuid)
returns void language plpgsql security definer as $$
declare
  v_match   matches%rowtype;
  v_pred    predictions%rowtype;
  v_points  integer;
  pred_diff integer;
  res_diff  integer;
begin
  select * into v_match from matches where id = p_match_id;

  if v_match.status != 'finished' then
    raise exception 'El partido % no está finalizado', p_match_id;
  end if;

  if v_match.home_score is null or v_match.away_score is null then
    raise exception 'El partido % no tiene resultado cargado', p_match_id;
  end if;

  for v_pred in select * from predictions where match_id = p_match_id loop
    v_points := 0;

    -- Resultado exacto
    if v_pred.home_pred = v_match.home_score and v_pred.away_pred = v_match.away_score then
      v_points := 3;
    else
      pred_diff := v_pred.home_pred - v_pred.away_pred;
      res_diff  := v_match.home_score - v_match.away_score;

      -- Ganador correcto + diferencia
      if sign(pred_diff) = sign(res_diff) and pred_diff = res_diff then
        v_points := 2;
      -- Solo ganador correcto
      elsif sign(pred_diff) = sign(res_diff) then
        v_points := 1;
      end if;
    end if;

    update predictions set points = v_points where id = v_pred.id;
  end loop;
end;
$$;

-- Trigger automático al cerrar un partido
create or replace function trigger_score_on_finish()
returns trigger language plpgsql as $$
begin
  if new.status = 'finished' and old.status != 'finished'
     and new.home_score is not null and new.away_score is not null then
    perform score_predictions_for_match(new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists match_finished_scoring on matches;
create trigger match_finished_scoring
  after update on matches
  for each row execute procedure trigger_score_on_finish();
