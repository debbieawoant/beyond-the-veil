-- Run once in the Supabase SQL Editor as the project owner. No secrets required.
-- Application data is private; the browser can only call the RPCs granted below.
begin;

create schema btv_private;
revoke all on schema btv_private from public, anon, authenticated;

create table btv_private.rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  host_id uuid not null references auth.users(id) on delete cascade,
  chart boolean not null default false,
  runes text[] not null default '{}',
  unlocked boolean not null default false,
  revision bigint not null default 0,
  generation integer not null default 0,
  created_at timestamptz not null default clock_timestamp(),
  expires_at timestamptz not null default clock_timestamp() + interval '24 hours'
);
create table btv_private.members (
  room_id uuid not null references btv_private.rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 24),
  character_class text not null check (character_class in ('Mage','Paladin','Warrior','Rogue')),
  slot integer not null check (slot between 0 and 3),
  last_seen timestamptz not null default clock_timestamp(),
  last_ping timestamptz,
  completed_generation integer not null default -1,
  primary key (room_id, user_id),
  unique (room_id, slot)
);
create table btv_private.guests (
  user_id uuid primary key references auth.users(id) on delete cascade,
  last_join timestamptz,
  last_create timestamptz
);
alter table btv_private.rooms enable row level security;
alter table btv_private.members enable row level security;
alter table btv_private.guests enable row level security;
revoke all on all tables in schema btv_private from public, anon, authenticated;

create function btv_private.snapshot(p_room uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'room', jsonb_build_object('id', r.id, 'code', r.code, 'hostId', r.host_id,
      'revision', r.revision, 'generation', r.generation, 'expiresAt', r.expires_at),
    'state', jsonb_build_object('chartDiscovered', r.chart, 'activated', to_jsonb(r.runes),
      'unlocked', r.unlocked, 'completed', me.completed_generation = r.generation),
    'members', (select coalesce(jsonb_agg(jsonb_build_object(
      'id', m.user_id, 'name', m.name, 'characterClass', m.character_class,
      'slot', m.slot, 'lastSeen', m.last_seen,
      'completed', m.completed_generation = r.generation) order by m.slot), '[]'::jsonb)
      from btv_private.members m where m.room_id = r.id))
  from btv_private.rooms r
  join btv_private.members me on me.room_id = r.id and me.user_id = auth.uid()
  where r.id = p_room and r.expires_at > clock_timestamp();
$$;

-- Only members may receive server-originated messages. There is deliberately
-- no INSERT policy: clients cannot forge state notifications or another ping.
create function public.btv_can_receive(p_topic text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from btv_private.rooms r
    join btv_private.members m on m.room_id = r.id
    where m.user_id = auth.uid() and r.expires_at > clock_timestamp()
    and p_topic = 'btv:' || r.id::text);
$$;
create policy btv_receive on realtime.messages for select to authenticated
using (public.btv_can_receive(realtime.topic()));

create function btv_private.notify_room() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform realtime.send(jsonb_build_object('revision', new.revision),
    'refresh', 'btv:' || new.id::text, true);
  return new;
end;
$$;
create trigger btv_room_changed after update on btv_private.rooms
for each row execute function btv_private.notify_room();

create function public.btv_create_room(p_name text, p_class text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_room uuid;
  v_code text;
  v_last timestamptz;
begin
  if v_user is null then raise exception 'Sign in before creating a room.'; end if;
  if p_name is null or char_length(btrim(p_name)) not between 1 and 24
    or p_name ~ '[[:cntrl:]]' or p_class is null
    or p_class not in ('Mage','Paladin','Warrior','Rogue') then
    raise exception 'Enter a name (1–24 characters) and choose a class.';
  end if;
  insert into btv_private.guests(user_id) values(v_user) on conflict do nothing;
  select last_create into v_last from btv_private.guests where user_id = v_user for update;
  if v_last > clock_timestamp() - interval '10 seconds' then
    return jsonb_build_object('error', 'Wait 10 seconds before creating another room.');
  end if;
  if (select count(*) from btv_private.members m join btv_private.rooms r on r.id = m.room_id
    where m.user_id = v_user and r.expires_at > clock_timestamp()) >= 3 then
    return jsonb_build_object('error', 'Leave an existing room first (maximum three per guest).');
  end if;
  loop
    v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    begin
      insert into btv_private.rooms(code, host_id) values(v_code, v_user) returning id into v_room;
      exit;
    exception when unique_violation then null;
    end;
  end loop;
  insert into btv_private.members(room_id, user_id, name, character_class, slot)
    values(v_room, v_user, btrim(p_name), p_class, 0);
  update btv_private.guests set last_create = clock_timestamp() where user_id = v_user;
  return btv_private.snapshot(v_room);
end;
$$;

create function public.btv_join_room(p_code text, p_name text, p_class text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_room uuid;
  v_slot integer;
  v_last timestamptz;
begin
  if v_user is null then raise exception 'Sign in before joining a room.'; end if;
  if p_name is null or char_length(btrim(p_name)) not between 1 and 24
    or p_name ~ '[[:cntrl:]]' or p_class is null
    or p_class not in ('Mage','Paladin','Warrior','Rogue') then
    raise exception 'Enter a name (1–24 characters) and choose a class.';
  end if;
  insert into btv_private.guests(user_id) values(v_user) on conflict do nothing;
  select last_join into v_last from btv_private.guests where user_id = v_user for update;
  if v_last > clock_timestamp() - interval '1 second' then
    return jsonb_build_object('error', 'Wait a second before trying another code.');
  end if;
  -- Return, rather than raise, so failed guesses still consume the cooldown.
  update btv_private.guests set last_join = clock_timestamp() where user_id = v_user;
  select id into v_room from btv_private.rooms
    where code = upper(btrim(p_code)) and expires_at > clock_timestamp() for update;
  if v_room is null then return jsonb_build_object('error', 'Room code not found or expired.'); end if;
  if exists(select 1 from btv_private.members where room_id = v_room and user_id = v_user) then
    update btv_private.members set name = btrim(p_name), character_class = p_class,
      last_seen = clock_timestamp() where room_id = v_room and user_id = v_user;
  else
    if (select count(*) from btv_private.members m join btv_private.rooms r on r.id = m.room_id
      where m.user_id = v_user and r.expires_at > clock_timestamp()) >= 3 then
      return jsonb_build_object('error', 'Leave an existing room first (maximum three per guest).');
    end if;
    select s into v_slot from generate_series(0,3) s where not exists
      (select 1 from btv_private.members where room_id = v_room and slot = s) order by s limit 1;
    if v_slot is null then return jsonb_build_object('error', 'Room is full (four players).'); end if;
    insert into btv_private.members(room_id, user_id, name, character_class, slot)
      values(v_room, v_user, btrim(p_name), p_class, v_slot);
  end if;
  update btv_private.rooms set revision = revision + 1 where id = v_room;
  return btv_private.snapshot(v_room);
end;
$$;

create function public.btv_snapshot(p_room uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_snapshot jsonb;
begin
  -- Heartbeats do not touch shared revision or flood Realtime broadcasts.
  update btv_private.members set last_seen = clock_timestamp()
    where room_id = p_room and user_id = auth.uid();
  v_snapshot := btv_private.snapshot(p_room);
  if v_snapshot is null then raise exception 'Room unavailable. Leave and create or join a room.'; end if;
  return v_snapshot;
end;
$$;

create function public.btv_act(p_room uuid, p_revision bigint, p_action text, p_rune text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  r btv_private.rooms;
  m btv_private.members;
  v_type text;
  v_sequence text[] := array['crown','river','gate'];
begin
  -- Serialize room actions, joins, leaves and resets in a single lock order.
  select * into r from btv_private.rooms where id = p_room and expires_at > clock_timestamp() for update;
  select * into m from btv_private.members where room_id = p_room and user_id = auth.uid();
  if r.id is null or m.user_id is null then raise exception 'Room unavailable or not a member.'; end if;
  if p_revision is distinct from r.revision then
    return jsonb_build_object('type', 'stale', 'snapshot', btv_private.snapshot(p_room));
  end if;
  case p_action
    when 'reset' then
      if r.host_id <> auth.uid() then raise exception 'Only the host can restart the shared puzzle.'; end if;
      r.chart := false; r.runes := '{}'; r.unlocked := false; r.generation := r.generation + 1;
      v_type := 'reset';
    when 'exit' then
      if not r.unlocked then v_type := 'locked';
      else
        update btv_private.members set completed_generation = r.generation
          where room_id = p_room and user_id = auth.uid();
        v_type := 'completed';
      end if;
    when 'read-chart' then r.chart := true; v_type := 'chart-discovered';
    when 'activate-rune' then
      if p_rune is null or not (p_rune = any(v_sequence)) then v_type := 'invalid';
      elsif not r.chart then v_type := 'need-chart';
      elsif r.unlocked then v_type := 'already-unlocked';
      elsif p_rune = any(r.runes) then v_type := 'already-active';
      elsif p_rune <> v_sequence[cardinality(r.runes) + 1] then r.runes := '{}'; v_type := 'wrong-order';
      else
        r.runes := array_append(r.runes, p_rune);
        v_type := case when cardinality(r.runes) = 3 then 'ready' else 'rune-activated' end;
      end if;
    when 'align-orrery' then
      if r.unlocked then v_type := 'already-unlocked';
      elsif not r.chart then v_type := 'need-chart';
      elsif cardinality(r.runes) <> 3 then v_type := 'not-ready';
      else r.unlocked := true; v_type := 'unlocked'; end if;
    else v_type := 'invalid';
  end case;
  update btv_private.rooms set chart = r.chart, runes = r.runes, unlocked = r.unlocked,
    generation = r.generation, revision = revision + 1 where id = p_room;
  update btv_private.members set last_seen = clock_timestamp() where room_id = p_room and user_id = auth.uid();
  return jsonb_build_object('type', v_type, 'snapshot', btv_private.snapshot(p_room));
end;
$$;

create function public.btv_ping(p_room uuid, p_generation integer, p_x double precision,
  p_y double precision, p_z double precision, p_target text default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  r btv_private.rooms;
  m btv_private.members;
  v_payload jsonb;
begin
  select * into r from btv_private.rooms where id = p_room and expires_at > clock_timestamp() for update;
  select * into m from btv_private.members where room_id = p_room and user_id = auth.uid() for update;
  if r.id is null or m.user_id is null then raise exception 'Room unavailable or not a member.'; end if;
  if p_generation is distinct from r.generation then raise exception 'Puzzle restarted. Try pinging again.'; end if;
  if p_x is null or p_y is null or p_z is null
    or not (p_x between -6 and 6 and p_y between 0 and 5 and p_z between -7.5 and 6)
    or (p_target is not null and p_target not in ('chart','crown','river','gate','orrery','exit')) then
    raise exception 'Invalid ping location or target.';
  end if;
  if m.last_ping > clock_timestamp() - interval '1 second' then raise exception 'Ping cooldown: wait a second.'; end if;
  update btv_private.members set last_ping = clock_timestamp(), last_seen = clock_timestamp()
    where room_id = p_room and user_id = auth.uid();
  v_payload := jsonb_build_object('id', gen_random_uuid(), 'senderId', auth.uid(),
    'generation', r.generation, 'position', jsonb_build_array(p_x,p_y,p_z),
    'target', p_target, 'sentAt', clock_timestamp());
  perform realtime.send(v_payload, 'ping', 'btv:' || p_room::text, true);
  return v_payload;
end;
$$;

create function public.btv_leave_room(p_room uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare r btv_private.rooms; v_host uuid;
begin
  select * into r from btv_private.rooms where id = p_room for update;
  if not exists(select 1 from btv_private.members where room_id = p_room and user_id = auth.uid()) then return; end if;
  delete from btv_private.members where room_id = p_room and user_id = auth.uid();
  select user_id into v_host from btv_private.members where room_id = p_room order by slot limit 1;
  update btv_private.rooms set
    host_id = case when host_id = auth.uid() then coalesce(v_host, host_id) else host_id end,
    expires_at = case when v_host is null then clock_timestamp() else expires_at end,
    revision = revision + 1 where id = p_room;
end;
$$;

-- SECURITY DEFINER functions otherwise inherit EXECUTE for PUBLIC by default.
revoke all on all functions in schema btv_private from public, anon, authenticated;
revoke all on function public.btv_can_receive(text) from public, anon;
revoke all on function public.btv_create_room(text,text) from public, anon;
revoke all on function public.btv_join_room(text,text,text) from public, anon;
revoke all on function public.btv_snapshot(uuid) from public, anon;
revoke all on function public.btv_act(uuid,bigint,text,text) from public, anon;
revoke all on function public.btv_ping(uuid,integer,double precision,double precision,double precision,text) from public, anon;
revoke all on function public.btv_leave_room(uuid) from public, anon;
grant execute on function public.btv_can_receive(text), public.btv_create_room(text,text),
  public.btv_join_room(text,text,text), public.btv_snapshot(uuid), public.btv_act(uuid,bigint,text,text),
  public.btv_ping(uuid,integer,double precision,double precision,double precision,text), public.btv_leave_room(uuid)
  to authenticated;

commit;
