--
-- PostgreSQL database dump
--

\restrict Av4poa6FavdFVJd1ydO2f8StBS4xP7gcCrWPwWp9be1EjLwkuhNS7aaAD2VXfI8

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

-- Started on 2026-02-05 18:59:53

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 35 (class 2615 OID 16494)
-- Name: auth; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA auth;


--
-- TOC entry 24 (class 2615 OID 16388)
-- Name: extensions; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA extensions;


--
-- TOC entry 33 (class 2615 OID 16574)
-- Name: graphql; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA graphql;


--
-- TOC entry 32 (class 2615 OID 16563)
-- Name: graphql_public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA graphql_public;


--
-- TOC entry 14 (class 2615 OID 16386)
-- Name: pgbouncer; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA pgbouncer;


--
-- TOC entry 15 (class 2615 OID 16555)
-- Name: realtime; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA realtime;


--
-- TOC entry 36 (class 2615 OID 16542)
-- Name: storage; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA storage;


--
-- TOC entry 30 (class 2615 OID 16603)
-- Name: vault; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA vault;


--
-- TOC entry 7 (class 3079 OID 32857)
-- Name: hypopg; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS hypopg WITH SCHEMA extensions;


--
-- TOC entry 4505 (class 0 OID 0)
-- Dependencies: 7
-- Name: EXTENSION hypopg; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION hypopg IS 'Hypothetical indexes for PostgreSQL';


--
-- TOC entry 8 (class 3079 OID 32879)
-- Name: index_advisor; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS index_advisor WITH SCHEMA extensions;


--
-- TOC entry 4506 (class 0 OID 0)
-- Dependencies: 8
-- Name: EXTENSION index_advisor; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION index_advisor IS 'Query index advisor';


--
-- TOC entry 6 (class 3079 OID 16639)
-- Name: pg_graphql; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_graphql WITH SCHEMA graphql;


--
-- TOC entry 4507 (class 0 OID 0)
-- Dependencies: 6
-- Name: EXTENSION pg_graphql; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_graphql IS 'pg_graphql: GraphQL support';


--
-- TOC entry 2 (class 3079 OID 16389)
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;


--
-- TOC entry 4508 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


--
-- TOC entry 4 (class 3079 OID 16443)
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;


--
-- TOC entry 4509 (class 0 OID 0)
-- Dependencies: 4
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- TOC entry 5 (class 3079 OID 16604)
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;


--
-- TOC entry 4510 (class 0 OID 0)
-- Dependencies: 5
-- Name: EXTENSION supabase_vault; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION supabase_vault IS 'Supabase Vault Extension';


--
-- TOC entry 3 (class 3079 OID 16432)
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;


--
-- TOC entry 4511 (class 0 OID 0)
-- Dependencies: 3
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- TOC entry 1204 (class 1247 OID 16738)
-- Name: aal_level; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.aal_level AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


--
-- TOC entry 1228 (class 1247 OID 16879)
-- Name: code_challenge_method; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.code_challenge_method AS ENUM (
    's256',
    'plain'
);


--
-- TOC entry 1201 (class 1247 OID 16732)
-- Name: factor_status; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_status AS ENUM (
    'unverified',
    'verified'
);


--
-- TOC entry 1198 (class 1247 OID 16727)
-- Name: factor_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_type AS ENUM (
    'totp',
    'webauthn',
    'phone'
);


--
-- TOC entry 1246 (class 1247 OID 16982)
-- Name: oauth_authorization_status; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_authorization_status AS ENUM (
    'pending',
    'approved',
    'denied',
    'expired'
);


--
-- TOC entry 1258 (class 1247 OID 17055)
-- Name: oauth_client_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_client_type AS ENUM (
    'public',
    'confidential'
);


--
-- TOC entry 1240 (class 1247 OID 16960)
-- Name: oauth_registration_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_registration_type AS ENUM (
    'dynamic',
    'manual'
);


--
-- TOC entry 1249 (class 1247 OID 16992)
-- Name: oauth_response_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_response_type AS ENUM (
    'code'
);


--
-- TOC entry 1234 (class 1247 OID 16921)
-- Name: one_time_token_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.one_time_token_type AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);


--
-- TOC entry 1285 (class 1247 OID 17122)
-- Name: action; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.action AS ENUM (
    'INSERT',
    'UPDATE',
    'DELETE',
    'TRUNCATE',
    'ERROR'
);


--
-- TOC entry 1267 (class 1247 OID 17082)
-- Name: equality_op; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.equality_op AS ENUM (
    'eq',
    'neq',
    'lt',
    'lte',
    'gt',
    'gte',
    'in'
);


--
-- TOC entry 1270 (class 1247 OID 17097)
-- Name: user_defined_filter; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.user_defined_filter AS (
	column_name text,
	op realtime.equality_op,
	value text
);


--
-- TOC entry 1300 (class 1247 OID 17221)
-- Name: wal_column; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.wal_column AS (
	name text,
	type_name text,
	type_oid oid,
	value jsonb,
	is_pkey boolean,
	is_selectable boolean
);


--
-- TOC entry 1288 (class 1247 OID 17135)
-- Name: wal_rls; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.wal_rls AS (
	wal jsonb,
	is_rls_enabled boolean,
	subscription_ids uuid[],
	errors text[]
);


--
-- TOC entry 1318 (class 1247 OID 17417)
-- Name: buckettype; Type: TYPE; Schema: storage; Owner: -
--

CREATE TYPE storage.buckettype AS ENUM (
    'STANDARD',
    'ANALYTICS',
    'VECTOR'
);


--
-- TOC entry 442 (class 1255 OID 16540)
-- Name: email(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.email() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;


--
-- TOC entry 4512 (class 0 OID 0)
-- Dependencies: 442
-- Name: FUNCTION email(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.email() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';


--
-- TOC entry 535 (class 1255 OID 16709)
-- Name: jwt(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.jwt() RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;


--
-- TOC entry 401 (class 1255 OID 16539)
-- Name: role(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.role() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;


--
-- TOC entry 4513 (class 0 OID 0)
-- Dependencies: 401
-- Name: FUNCTION role(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.role() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';


--
-- TOC entry 418 (class 1255 OID 16538)
-- Name: uid(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;


--
-- TOC entry 4514 (class 0 OID 0)
-- Dependencies: 418
-- Name: FUNCTION uid(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.uid() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';


--
-- TOC entry 438 (class 1255 OID 16547)
-- Name: grant_pg_cron_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_cron_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_cron'
  )
  THEN
    grant usage on schema cron to postgres with grant option;

    alter default privileges in schema cron grant all on tables to postgres with grant option;
    alter default privileges in schema cron grant all on functions to postgres with grant option;
    alter default privileges in schema cron grant all on sequences to postgres with grant option;

    alter default privileges for user supabase_admin in schema cron grant all
        on sequences to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on tables to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on functions to postgres with grant option;

    grant all privileges on all tables in schema cron to postgres with grant option;
    revoke all on table cron.job from postgres;
    grant select on table cron.job to postgres with grant option;
  END IF;
END;
$$;


--
-- TOC entry 4515 (class 0 OID 0)
-- Dependencies: 438
-- Name: FUNCTION grant_pg_cron_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_cron_access() IS 'Grants access to pg_cron';


--
-- TOC entry 520 (class 1255 OID 16568)
-- Name: grant_pg_graphql_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_graphql_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
DECLARE
    func_is_graphql_resolve bool;
BEGIN
    func_is_graphql_resolve = (
        SELECT n.proname = 'resolve'
        FROM pg_event_trigger_ddl_commands() AS ev
        LEFT JOIN pg_catalog.pg_proc AS n
        ON ev.objid = n.oid
    );

    IF func_is_graphql_resolve
    THEN
        -- Update public wrapper to pass all arguments through to the pg_graphql resolve func
        DROP FUNCTION IF EXISTS graphql_public.graphql;
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language sql
        as $$
            select graphql.resolve(
                query := query,
                variables := coalesce(variables, '{}'),
                "operationName" := "operationName",
                extensions := extensions
            );
        $$;

        -- This hook executes when `graphql.resolve` is created. That is not necessarily the last
        -- function in the extension so we need to grant permissions on existing entities AND
        -- update default permissions to any others that are created after `graphql.resolve`
        grant usage on schema graphql to postgres, anon, authenticated, service_role;
        grant select on all tables in schema graphql to postgres, anon, authenticated, service_role;
        grant execute on all functions in schema graphql to postgres, anon, authenticated, service_role;
        grant all on all sequences in schema graphql to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on tables to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on functions to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on sequences to postgres, anon, authenticated, service_role;

        -- Allow postgres role to allow granting usage on graphql and graphql_public schemas to custom roles
        grant usage on schema graphql_public to postgres with grant option;
        grant usage on schema graphql to postgres with grant option;
    END IF;

END;
$_$;


--
-- TOC entry 4516 (class 0 OID 0)
-- Dependencies: 520
-- Name: FUNCTION grant_pg_graphql_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_graphql_access() IS 'Grants access to pg_graphql';


--
-- TOC entry 394 (class 1255 OID 16549)
-- Name: grant_pg_net_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_net_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_net'
  )
  THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_roles
      WHERE rolname = 'supabase_functions_admin'
    )
    THEN
      CREATE USER supabase_functions_admin NOINHERIT CREATEROLE LOGIN NOREPLICATION;
    END IF;

    GRANT USAGE ON SCHEMA net TO supabase_functions_admin, postgres, anon, authenticated, service_role;

    IF EXISTS (
      SELECT FROM pg_extension
      WHERE extname = 'pg_net'
      -- all versions in use on existing projects as of 2025-02-20
      -- version 0.12.0 onwards don't need these applied
      AND extversion IN ('0.2', '0.6', '0.7', '0.7.1', '0.8', '0.10.0', '0.11.0')
    ) THEN
      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;

      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;

      REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
      REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;

      GRANT EXECUTE ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
      GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
    END IF;
  END IF;
END;
$$;


--
-- TOC entry 4517 (class 0 OID 0)
-- Dependencies: 394
-- Name: FUNCTION grant_pg_net_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_net_access() IS 'Grants access to pg_net';


--
-- TOC entry 545 (class 1255 OID 16559)
-- Name: pgrst_ddl_watch(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.pgrst_ddl_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF cmd.command_tag IN (
      'CREATE SCHEMA', 'ALTER SCHEMA'
    , 'CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO', 'ALTER TABLE'
    , 'CREATE FOREIGN TABLE', 'ALTER FOREIGN TABLE'
    , 'CREATE VIEW', 'ALTER VIEW'
    , 'CREATE MATERIALIZED VIEW', 'ALTER MATERIALIZED VIEW'
    , 'CREATE FUNCTION', 'ALTER FUNCTION'
    , 'CREATE TRIGGER'
    , 'CREATE TYPE', 'ALTER TYPE'
    , 'CREATE RULE'
    , 'COMMENT'
    )
    -- don't notify in case of CREATE TEMP table or other objects created on pg_temp
    AND cmd.schema_name is distinct from 'pg_temp'
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


--
-- TOC entry 536 (class 1255 OID 16560)
-- Name: pgrst_drop_watch(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.pgrst_drop_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()
  LOOP
    IF obj.object_type IN (
      'schema'
    , 'table'
    , 'foreign table'
    , 'view'
    , 'materialized view'
    , 'function'
    , 'trigger'
    , 'type'
    , 'rule'
    )
    AND obj.is_temporary IS false -- no pg_temp objects
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


--
-- TOC entry 515 (class 1255 OID 16570)
-- Name: set_graphql_placeholder(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.set_graphql_placeholder() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
    DECLARE
    graphql_is_dropped bool;
    BEGIN
    graphql_is_dropped = (
        SELECT ev.schema_name = 'graphql_public'
        FROM pg_event_trigger_dropped_objects() AS ev
        WHERE ev.schema_name = 'graphql_public'
    );

    IF graphql_is_dropped
    THEN
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language plpgsql
        as $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;
    END IF;

    END;
$_$;


--
-- TOC entry 4518 (class 0 OID 0)
-- Dependencies: 515
-- Name: FUNCTION set_graphql_placeholder(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.set_graphql_placeholder() IS 'Reintroduces placeholder function for graphql_public.graphql';


--
-- TOC entry 446 (class 1255 OID 16387)
-- Name: get_auth(text); Type: FUNCTION; Schema: pgbouncer; Owner: -
--

CREATE FUNCTION pgbouncer.get_auth(p_usename text) RETURNS TABLE(username text, password text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $_$
  BEGIN
      RAISE DEBUG 'PgBouncer auth request: %', p_usename;

      RETURN QUERY
      SELECT
          rolname::text,
          CASE WHEN rolvaliduntil < now()
              THEN null
              ELSE rolpassword::text
          END
      FROM pg_authid
      WHERE rolname=$1 and rolcanlogin;
  END;
  $_$;


--
-- TOC entry 496 (class 1255 OID 19888)
-- Name: dd_take_golden_slot(date, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.dd_take_golden_slot(p_day date, p_cap integer) RETURNS TABLE(allowed boolean, new_count integer)
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$

declare

  c int;

begin

  insert into public.dd_tg_golden_daily(day, count, updated_at)

  values (p_day, 0, now())

  on conflict (day) do nothing;



  select count into c from public.dd_tg_golden_daily where day = p_day for update;



  if c >= p_cap then

    allowed := false;

    new_count := c;

    return next;

    return;

  end if;



  update public.dd_tg_golden_daily

    set count = c + 1,

        updated_at = now()

    where day = p_day;



  allowed := true;

  new_count := c + 1;

  return next;

end;

$$;


--
-- TOC entry 421 (class 1255 OID 29219)
-- Name: dd_take_golden_slot(date, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.dd_take_golden_slot(p_day date, p_cap integer, p_min_gap_seconds integer) RETURNS TABLE(allowed boolean, new_count integer, next_allowed_at timestamp with time zone)
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$

declare

  v_now  timestamptz := now();

  v_count int;

  v_next  timestamptz;

  v_jitter_seconds int;

begin

  insert into dd_tg_golden_daily(day, count, last_golden_at, next_allowed_at)

  values (p_day, 0, null, null)

  on conflict (day) do nothing;



  select d.count, d.next_allowed_at

    into v_count, v_next

  from dd_tg_golden_daily d

  where d.day = p_day

  for update;



  if v_count >= p_cap then

    allowed := false;

    new_count := v_count;

    next_allowed_at := v_next;

    return next;

    return;

  end if;



  if v_next is not null and v_now < v_next then

    allowed := false;

    new_count := v_count;

    next_allowed_at := v_next;

    return next;

    return;

  end if;



  v_count := v_count + 1;



  -- add 0..2 hours jitter to break timing predictability

  v_jitter_seconds := floor(random() * 7200)::int;



  v_next := v_now

    + make_interval(secs => greatest(0, p_min_gap_seconds))

    + make_interval(secs => v_jitter_seconds);



  update dd_tg_golden_daily d

     set count = v_count,

         last_golden_at = v_now,

         next_allowed_at = v_next

   where d.day = p_day;



  allowed := true;

  new_count := v_count;

  next_allowed_at := v_next;

  return next;

  return;

end;

$$;


--
-- TOC entry 399 (class 1255 OID 26876)
-- Name: dd_touch_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.dd_touch_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$

begin

  new.updated_at = now();

  return new;

end $$;


--
-- TOC entry 551 (class 1255 OID 32892)
-- Name: enforce_box_ledger_pause(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.enforce_box_ledger_pause() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$

declare

  f record;

begin

  select pause_all, pause_reserve

    into f

  from public.dd_admin_flags

  limit 1;



  if coalesce(f.pause_all, false) then

    raise exception 'maintenance: pause_all is enabled';

  end if;



  if new.entry_type = 'claim_reserve'

     and coalesce(f.pause_reserve, false) then

    raise exception 'maintenance: pause_reserve is enabled';

  end if;



  return new;

end;

$$;


--
-- TOC entry 470 (class 1255 OID 32890)
-- Name: enforce_stats_events_pause(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.enforce_stats_events_pause() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$

declare

  f record;

begin

  select pause_all, pause_stats_ingest

    into f

  from public.dd_admin_flags

  limit 1;



  if coalesce(f.pause_all, false) then

    raise exception 'maintenance: pause_all is enabled';

  end if;



  if coalesce(f.pause_stats_ingest, false) then

    raise exception 'maintenance: pause_stats_ingest is enabled';

  end if;



  return new;

end;

$$;


--
-- TOC entry 432 (class 1255 OID 32894)
-- Name: enforce_treasure_claims_pause(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.enforce_treasure_claims_pause() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$

declare

  f record;

begin

  select pause_all

    into f

  from public.dd_admin_flags

  limit 1;



  if coalesce(f.pause_all, false) then

    raise exception 'maintenance: pause_all is enabled';

  end if;



  return new;

end;

$$;


--
-- TOC entry 466 (class 1255 OID 32896)
-- Name: rpc_admin_flags(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rpc_admin_flags() RETURNS TABLE(pause_all boolean, pause_reserve boolean, pause_stats_ingest boolean, updated_at timestamp with time zone, updated_by text)
    LANGUAGE sql STABLE
    SET search_path TO 'public'
    AS $$

  select

    pause_all,

    pause_reserve,

    pause_stats_ingest,

    updated_at,

    updated_by

  from public.dd_admin_flags

  limit 1;

$$;


--
-- TOC entry 500 (class 1255 OID 41447)
-- Name: rpc_admin_integrity_24h(timestamp with time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rpc_admin_integrity_24h(p_since timestamp with time zone) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$

declare

  reserves_without_claim bigint;

  reserves_without_claim_amount numeric;

  claims_without_reserve bigint;

  claims_without_reserve_amount numeric;

  amount_mismatch_count bigint;

  top_boxes jsonb;

begin

  -- reserves without claim (by dig_id)

  with r as (

    select

      box_id,

      (meta->>'dig_id') as dig_id,

      amount

    from dd_box_ledger

    where entry_type = 'claim_reserve'

      and created_at >= p_since

      and meta ? 'dig_id'

  ),

  c as (

    select box_id, dig_id

    from dd_treasure_claims

    where created_at >= p_since

      and dig_id is not null

  )

  select

    count(*)::bigint,

    coalesce(sum(r.amount),0)

  into reserves_without_claim, reserves_without_claim_amount

  from r

  left join c on c.box_id = r.box_id and c.dig_id = r.dig_id

  where c.dig_id is null;



  -- claims without reserve (by dig_id)

  with c as (

    select box_id, dig_id, amount

    from dd_treasure_claims

    where created_at >= p_since

      and dig_id is not null

  ),

  r as (

    select box_id, (meta->>'dig_id') as dig_id

    from dd_box_ledger

    where entry_type = 'claim_reserve'

      and created_at >= p_since

      and meta ? 'dig_id'

  )

  select

    count(*)::bigint,

    coalesce(sum(c.amount),0)

  into claims_without_reserve, claims_without_reserve_amount

  from c

  left join r on r.box_id = c.box_id and r.dig_id = c.dig_id

  where r.dig_id is null;



  -- amount mismatches (should be 0 with your new dig_id linkage)

  with c as (

    select box_id, dig_id, amount

    from dd_treasure_claims

    where created_at >= p_since

      and dig_id is not null

  ),

  r as (

    select box_id, (meta->>'dig_id') as dig_id, amount

    from dd_box_ledger

    where entry_type = 'claim_reserve'

      and created_at >= p_since

      and meta ? 'dig_id'

  )

  select count(*)::bigint

  into amount_mismatch_count

  from c

  join r on r.box_id = c.box_id and r.dig_id = c.dig_id

  where r.amount <> c.amount;



  -- top boxes for reserves_without_claim

  with r as (

    select box_id, (meta->>'dig_id') as dig_id, amount

    from dd_box_ledger

    where entry_type = 'claim_reserve'

      and created_at >= p_since

      and meta ? 'dig_id'

  ),

  c as (

    select box_id, dig_id

    from dd_treasure_claims

    where created_at >= p_since

      and dig_id is not null

  )

  select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)

  into top_boxes

  from (

    select r.box_id,

           count(*)::bigint as cnt,

           coalesce(sum(r.amount),0) as amount_sum

    from r

    left join c on c.box_id = r.box_id and c.dig_id = r.dig_id

    where c.dig_id is null

    group by r.box_id

    order by cnt desc

    limit 10

  ) t;



  return jsonb_build_object(

    'reserves_without_claim', jsonb_build_object(

      'count', reserves_without_claim,

      'amount', reserves_without_claim_amount

    ),

    'claims_without_reserve', jsonb_build_object(

      'count', claims_without_reserve,

      'amount', claims_without_reserve_amount

    ),

    'amount_mismatch', jsonb_build_object(

      'count', amount_mismatch_count

    ),

    'top_boxes_reserves_without_claim', top_boxes

  );

end $$;


--
-- TOC entry 543 (class 1255 OID 41483)
-- Name: rpc_airdrop_register_wallet(text, text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rpc_airdrop_register_wallet(p_address text, p_source text DEFAULT 'usddd_scan'::text, p_ip_hash text DEFAULT NULL::text, p_user_agent text DEFAULT NULL::text) RETURNS TABLE(ok boolean, already boolean, count bigint)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$

declare

  v_exists boolean;

  v_addr text;

begin

  v_addr := lower(trim(coalesce(p_address, '')));



  -- sanity

  if v_addr = '' then

    return query select false, false, (select count(*) from public.dd_airdrop_wallets);

    return;

  end if;



  select exists(

    select 1 from public.dd_airdrop_wallets

    where lower(address) = v_addr

  ) into v_exists;



  if v_exists then

    return query select true, true, (select count(*) from public.dd_airdrop_wallets);

    return;

  end if;



  insert into public.dd_airdrop_wallets(address, source, ip_hash, user_agent)

  values (trim(p_address), coalesce(p_source,'usddd_scan'), p_ip_hash, p_user_agent);



  return query select true, false, (select count(*) from public.dd_airdrop_wallets);

end;

$$;


--
-- TOC entry 429 (class 1255 OID 41484)
-- Name: rpc_airdrop_stats(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rpc_airdrop_stats(p_limit integer DEFAULT 30) RETURNS TABLE(count bigint, latest_masked text[])
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$

begin

  return query

  select

    (select count(*) from public.dd_airdrop_wallets) as count,

    array(

      select left(address, 6) || '...' || right(address, 4)

      from public.dd_airdrop_wallets

      order by created_at desc

      limit greatest(1, least(p_limit, 100))

    ) as latest_masked;

end;

$$;


--
-- TOC entry 497 (class 1255 OID 32888)
-- Name: rpc_box_balances(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rpc_box_balances(p_box_id text) RETURNS TABLE(box_id text, chain_id text, token_address text, funded_units numeric, reserved_units numeric, adjust_units numeric, available_units numeric)
    LANGUAGE sql STABLE
    SET search_path TO 'public'
    AS $$

  select

    l.box_id,

    l.chain_id,

    l.token_address,

    sum(case when l.entry_type = 'fund_in' then l.amount else 0 end) as funded_units,

    sum(case when l.entry_type = 'claim_reserve' then l.amount else 0 end) as reserved_units,

    sum(case when l.entry_type = 'adjust' then l.amount else 0 end) as adjust_units,

    sum(

      case

        when l.entry_type = 'fund_in' then l.amount

        when l.entry_type = 'adjust' then l.amount

        when l.entry_type = 'claim_reserve' then -l.amount

        else 0

      end

    ) as available_units

  from public.dd_box_ledger l

  where l.box_id = p_box_id

  group by l.box_id, l.chain_id, l.token_address;

$$;


--
-- TOC entry 459 (class 1255 OID 37895)
-- Name: rpc_dig_reserve(text, text, text, numeric, integer, numeric, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rpc_dig_reserve(p_username text, p_box_id text, p_dig_id text, p_amount numeric, p_cmc_id integer DEFAULT NULL::integer, p_price_usd_at_dig numeric DEFAULT NULL::numeric, p_price_at timestamp with time zone DEFAULT now()) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$

declare

  v_user_id uuid;

  v_box record;

  v_exists int;

  v_deposited numeric;

  v_withdrawn numeric;

  v_reserved numeric;

  v_available numeric;



  v_cost numeric;



  v_alloc numeric;

  v_acq numeric;



  v_alloc_debit numeric;

  v_acq_debit numeric;



  v_finds_inc int := 0;

begin

  -- basic validation

  if p_username is null or length(trim(p_username)) = 0 then

    return jsonb_build_object('ok', false, 'error', 'missing_username');

  end if;



  if p_box_id is null or length(trim(p_box_id)) = 0 then

    return jsonb_build_object('ok', false, 'error', 'missing_box_id');

  end if;



  if p_dig_id is null or length(trim(p_dig_id)) = 0 then

    return jsonb_build_object('ok', false, 'error', 'missing_dig_id');

  end if;



  if p_amount is null or p_amount <= 0 then

    return jsonb_build_object('ok', false, 'error', 'invalid_amount');

  end if;



  -- resolve user

  select id into v_user_id

  from public.dd_terminal_users

  where username = p_username

  limit 1;



  if v_user_id is null then

    return jsonb_build_object('ok', false, 'error', 'user_not_found');

  end if;



  -- resolve box (includes cost_usddd)

  select id, status, deploy_chain_id, token_address, token_symbol, cost_usddd, meta

  into v_box

  from public.dd_boxes

  where id = p_box_id

  limit 1;



  if v_box.id is null then

    return jsonb_build_object('ok', false, 'error', 'box_not_found');

  end if;



  if v_box.status <> 'ACTIVE' then

    return jsonb_build_object('ok', false, 'error', 'box_inactive');

  end if;



  v_cost := coalesce(v_box.cost_usddd, 0);

  if v_cost <= 0 then

    return jsonb_build_object('ok', false, 'error', 'box_cost_invalid');

  end if;



  -- idempotency: if reserve already exists for dig_id, no-op

  select count(*) into v_exists

  from public.dd_box_ledger

  where box_id = p_box_id

    and entry_type = 'claim_reserve'

    and meta @> jsonb_build_object('dig_id', p_dig_id);



  if v_exists > 0 then

    return jsonb_build_object('ok', true, 'already', true);

  end if;



  -- sanity: check box available using dd_box_accounting (must exist, used by your code)

  select deposited_total, withdrawn_total, claimed_unwithdrawn

  into v_deposited, v_withdrawn, v_reserved

  from public.dd_box_accounting

  where box_id = p_box_id

  limit 1;



  v_deposited := coalesce(v_deposited, 0);

  v_withdrawn := coalesce(v_withdrawn, 0);

  v_reserved := coalesce(v_reserved, 0);

  v_available := v_deposited - v_withdrawn - v_reserved;



  if p_amount > v_available + 1e-9 then

    return jsonb_build_object('ok', false, 'error', 'insufficient_box_balance', 'available', v_available);

  end if;



  -- lock user state row (create if missing)

  insert into public.dd_user_state (user_id, username, usddd_allocated, usddd_acquired, treasury_usddd, acquired_total)

  values (v_user_id, p_username, 0, 0, 0, 0)

  on conflict (user_id) do nothing;



  select usddd_allocated, usddd_acquired

  into v_alloc, v_acq

  from public.dd_user_state

  where user_id = v_user_id

  for update;



  v_alloc := coalesce(v_alloc, 0);

  v_acq := coalesce(v_acq, 0);



  if (v_alloc + v_acq) + 1e-9 < v_cost then

    return jsonb_build_object('ok', false, 'error', 'insufficient_usddd', 'needed', v_cost, 'have', (v_alloc+v_acq));

  end if;



  -- debit allocated first, then acquired

  v_alloc_debit := least(v_alloc, v_cost);

  v_acq_debit := greatest(0, v_cost - v_alloc_debit);



  -- update user state atomically

  update public.dd_user_state

  set

    usddd_allocated = v_alloc - v_alloc_debit,

    usddd_acquired  = v_acq - v_acq_debit,

    treasury_usddd  = coalesce(treasury_usddd,0) + v_cost,

    digs_count      = coalesce(digs_count,0) + 1,

    -- finds_count remains controlled elsewhere; keep as-is for now

    updated_at      = now()

  where user_id = v_user_id;



  -- write canonical spend ledger (idempotent by spend_key)

  insert into public.dd_usddd_spend_ledger

    (spend_key, install_id, terminal_user_id, box_id, spend_type, usddd_amount, from_bucket,

     allocated_debit, acquired_debit, created_at, meta)

  values

    ('dig:' || p_dig_id, null, v_user_id, p_box_id, 'dig_success', v_cost,

     case when v_acq_debit > 0 then 'acquired' else 'allocated' end,

     v_alloc_debit, v_acq_debit, now(),

     jsonb_build_object(

       'username', p_username,

       'dig_id', p_dig_id,

       'source', 'rpc_dig_reserve'

     ))

  on conflict (spend_key) do nothing;



  -- write claim reserve ledger (token reserve)

  insert into public.dd_box_ledger

    (box_id, entry_type, amount, chain_id, token_address, meta)

  values

    (p_box_id, 'claim_reserve', p_amount,

     coalesce(v_box.deploy_chain_id::text, null),

     coalesce(v_box.token_address::text, null),

     jsonb_build_object(

       'dig_id', p_dig_id,

       'username', p_username,

       'user_id', v_user_id,

       'source', 'dig',

       'token_symbol', coalesce(v_box.token_symbol, null),

       'cmc_id', p_cmc_id,

       'price_source', case when p_cmc_id is not null then 'cmc' else null end,

       'price_usd_at_dig', p_price_usd_at_dig,

       'price_at', p_price_at

     ));



  return jsonb_build_object('ok', true, 'already', false, 'cost_usddd', v_cost);

end;

$$;


--
-- TOC entry 483 (class 1255 OID 41564)
-- Name: rpc_price_events_batch(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rpc_price_events_batch(p_limit integer DEFAULT 5000) RETURNS TABLE(updated_rows integer)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$

declare

  v_updated int := 0;

begin

  with latest_prices as (

    select distinct on (token_symbol, chain_id)

      token_symbol,

      chain_id,

      price_usd

    from dd_token_price_snapshots

    order by token_symbol, chain_id, as_of desc

  ),

  to_fix as (

    select

      se.id,

      se.reward_amount,

      se.token_symbol,

      se.chain as chain_id,

      coalesce(b.token_decimals, 0) as token_decimals,

      lp.price_usd

    from stats_events se

    join dd_boxes b on b.id = se.box_id

    join latest_prices lp

      on lp.token_symbol = se.token_symbol

     and lp.chain_id = se.chain

    where se.event = 'dig_success'

      and se.created_at >= now() - interval '24 hours'

      and (se.priced is not true or se.reward_value_usd is null)

      and se.reward_amount is not null

      and coalesce(b.token_decimals, 0) >= 0

    order by se.created_at desc

    limit p_limit

  ),

  upd as (

    update stats_events se

    set

      reward_price_usd = tf.price_usd,

      reward_value_usd = (se.reward_amount / power(10, tf.token_decimals)) * tf.price_usd,

      priced = true

    from to_fix tf

    where se.id = tf.id

      -- Safety clamp: never allow absurd per-dig USD values into stats

      and ((se.reward_amount / power(10, tf.token_decimals)) * tf.price_usd) <= 50

    returning 1

  )

  select count(*) into v_updated from upd;



  return query select v_updated as updated_rows;

end $$;


--
-- TOC entry 513 (class 1255 OID 41577)
-- Name: rpc_price_events_batch_v2(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rpc_price_events_batch_v2(p_limit integer DEFAULT 5000) RETURNS TABLE(updated_rows integer)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$

declare

  v_updated int := 0;

begin

  with latest_addr_prices as (

    select distinct on (chain_id, token_address)

      chain_id,

      token_address,

      price_usd

    from dd_token_price_snapshots_addr

    order by chain_id, token_address, as_of desc

  ),

  to_fix as (

    select

      se.id,

      se.reward_amount,

      b.token_decimals,

      p.price_usd

    from stats_events se

    join dd_boxes b

      on b.id = se.box_id

    join latest_addr_prices p

      on p.chain_id = b.token_chain_id

     and p.token_address = b.token_address

    where se.event = 'dig_success'

      and se.created_at >= now() - interval '24 hours'

      and (se.priced is not true or se.reward_value_usd is null)

      and se.reward_amount is not null

      and b.status = 'ACTIVE'

      and b.token_decimals is not null

    order by se.created_at desc

    limit p_limit

  ),

  upd as (

    update stats_events se

    set

      reward_price_usd = tf.price_usd,

      reward_value_usd = (se.reward_amount / power(10, tf.token_decimals)) * tf.price_usd,

      priced = true

    from to_fix tf

    where se.id = tf.id

      -- hard safety clamp (prevents future explosions)

      and ((se.reward_amount / power(10, tf.token_decimals)) * tf.price_usd) <= 50

    returning 1

  )

  select count(*) into v_updated from upd;



  return query select v_updated as updated_rows;

end $$;


--
-- TOC entry 531 (class 1255 OID 36731)
-- Name: rpc_rollup_stats_events_1m(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rpc_rollup_stats_events_1m(last_minutes integer DEFAULT 10) RETURNS void
    LANGUAGE sql SECURITY DEFINER
    AS $$

  insert into public.stats_events_rollup_1m

    (bucket_minute, dig_success_count, usddd_spent, reward_usd, updated_at)

  select

    date_trunc('minute', created_at) as bucket_minute,

    count(*)::bigint as dig_success_count,

    coalesce(sum(usddd_cost), 0)::numeric as usddd_spent,

    coalesce(sum(reward_value_usd), 0)::numeric as reward_usd,

    now() as updated_at

  from public.stats_events

  where event = 'dig_success'

    and created_at >= now() - make_interval(mins => greatest(1, last_minutes))

  group by 1

  on conflict (bucket_minute) do update set

    dig_success_count = excluded.dig_success_count,

    usddd_spent       = excluded.usddd_spent,

    reward_usd        = excluded.reward_usd,

    updated_at        = now();

$$;


--
-- TOC entry 449 (class 1255 OID 37900)
-- Name: rpc_scan_activity_24h(timestamp with time zone, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rpc_scan_activity_24h(p_start timestamp with time zone, p_end timestamp with time zone) RETURNS jsonb
    LANGUAGE sql SECURITY DEFINER
    AS $$

  with

  spend as (

    select

      count(*)::bigint as finds_24h,

      coalesce(sum(usddd_amount),0)::numeric as usddd_spent_24h,

      count(distinct terminal_user_id)::bigint as unique_claimers_24h

    from public.dd_usddd_spend_ledger

    where spend_key like 'dig:%'

      and created_at >= p_start

      and created_at <  p_end

  ),



  latest_prices as (

    select distinct on (token_symbol, chain_id)

      token_symbol,

      chain_id,

      price_usd,

      as_of

    from public.dd_token_price_snapshots

    order by token_symbol, chain_id, as_of desc

  ),



  claims_value as (

    select

      coalesce(sum(c.amount * coalesce(p.price_usd,0)),0)::numeric as value_distributed_usd_24h

    from public.dd_treasure_claims c

    left join latest_prices p

      on p.token_symbol = c.token_symbol

     and p.chain_id = c.chain_id

    where c.created_at >= p_start

      and c.created_at <  p_end

  )



  select jsonb_build_object(

    'finds_24h', (select finds_24h from spend),

    'usddd_spent_24h', (select usddd_spent_24h from spend),

    'unique_claimers_24h', (select unique_claimers_24h from spend),

    'value_distributed_usd_24h', (select value_distributed_usd_24h from claims_value)

  );

$$;


--
-- TOC entry 505 (class 1255 OID 35170)
-- Name: rpc_user_add_fuel(uuid, numeric, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rpc_user_add_fuel(p_user_id uuid, p_delta numeric, p_digs_inc integer DEFAULT 1, p_finds_inc integer DEFAULT 0) RETURNS void
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$

declare

  v_cost numeric;

  v_take_alloc numeric;

  v_take_acq numeric;

  v_spent numeric;

begin

  -- Ensure row exists (no-op if already there)

  insert into public.dd_user_state (

    user_id,

    usddd_allocated,

    usddd_acquired,

    treasury_usddd,

    digs_count,

    finds_count,

    acquired_total,

    updated_at

  )

  values (

    p_user_id,

    0, 0, 0,

    0, 0,

    0,

    now()

  )

  on conflict (user_id) do nothing;



  v_cost := greatest(coalesce(p_delta, 0), 0);



  -- Atomic spend + counters + fuel used

  update public.dd_user_state s

  set

    -- spend priority: allocated -> acquired (clamped)

    usddd_allocated = s.usddd_allocated - least(s.usddd_allocated, v_cost),

    usddd_acquired  = s.usddd_acquired  - least(s.usddd_acquired, greatest(v_cost - least(s.usddd_allocated, v_cost), 0)),



    -- treasury increases by actual spent (allocated spent + acquired spent)

    treasury_usddd  = s.treasury_usddd + (

      least(s.usddd_allocated, v_cost) +

      least(s.usddd_acquired, greatest(v_cost - least(s.usddd_allocated, v_cost), 0))

    ),



    digs_count  = s.digs_count + greatest(coalesce(p_digs_inc, 0), 0),

    finds_count = s.finds_count + greatest(coalesce(p_finds_inc, 0), 0),

    updated_at  = now()

  where s.user_id = p_user_id;



end;

$$;


--
-- TOC entry 506 (class 1255 OID 32882)
-- Name: scan_activity_24h_v2(timestamp with time zone, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.scan_activity_24h_v2(start_ts timestamp with time zone, end_ts timestamp with time zone) RETURNS jsonb
    LANGUAGE sql STABLE
    SET search_path TO 'public'
    SET statement_timeout TO '120s'
    AS $$

WITH

-- current window

claims AS (

  SELECT

    count(*)                AS claims_executed,

    count(DISTINCT user_id) AS unique_claimers

  FROM public.dd_treasure_claims

  WHERE created_at >= start_ts

    AND created_at <  end_ts

),

ledger AS (

  SELECT

    count(*) AS ledger_entries

  FROM public.dd_box_ledger

  WHERE created_at >= start_ts

    AND created_at <  end_ts

),

golden AS (

  SELECT

    count(*) AS golden_events

  FROM public.dd_tg_golden_claims

  WHERE claimed_at >= start_ts

    AND claimed_at <  end_ts

),

sessions AS (

  SELECT

    count(DISTINCT session_id) AS sessions_24h

  FROM public.dd_sessions

  WHERE created_at >= start_ts

    AND created_at <  end_ts

),

money_now AS (

  SELECT public.scan_activity_money_24h(start_ts, end_ts) AS money

),



-- previous window (same duration)

prev_window AS (

  SELECT

    (start_ts - (end_ts - start_ts))::timestamptz AS p_start,

    (end_ts   - (end_ts - start_ts))::timestamptz AS p_end

),

money_prev AS (

  SELECT public.scan_activity_money_24h(p_start, p_end) AS money

  FROM prev_window

),



-- extract numbers (now)

nums_now AS (

  SELECT

    COALESCE((money->>'claims_value_usd')::numeric, 0) AS claims_value_usd,

    COALESCE((money->>'usddd_spent')::numeric, 0)      AS usddd_spent

  FROM money_now

),

-- extract numbers (prev)

nums_prev AS (

  SELECT

    COALESCE((money->>'claims_value_usd')::numeric, 0) AS claims_value_usd,

    COALESCE((money->>'usddd_spent')::numeric, 0)      AS usddd_spent

  FROM money_prev

),



-- efficiency (now/prev) = value distributed / usddd utilized

eff AS (

  SELECT

    CASE WHEN n.usddd_spent > 0 THEN (n.claims_value_usd / n.usddd_spent) ELSE 0 END AS eff_now,

    CASE WHEN p.usddd_spent > 0 THEN (p.claims_value_usd / p.usddd_spent) ELSE 0 END AS eff_prev

  FROM nums_now n

  CROSS JOIN nums_prev p

),



-- monetary policy constants

policy AS (

  SELECT

    3::numeric   AS accrual_scaling_pct,

    10::numeric  AS accrual_floor_pct,

    25::numeric  AS accrual_cap_pct,

    99.98::numeric AS network_performance_cap_pct

),



-- derived model

model AS (

  SELECT

    e.eff_now                                    AS reward_efficiency_usd_per_usddd,

    e.eff_prev                                   AS reward_efficiency_prev_usd_per_usddd,

    (e.eff_now - e.eff_prev)                     AS efficiency_delta_usd_per_usddd,



    p.accrual_scaling_pct                        AS accrual_scaling_pct,

    p.accrual_floor_pct                          AS accrual_floor_pct,

    p.accrual_cap_pct                            AS accrual_cap_pct,



    (e.eff_now * p.accrual_scaling_pct)          AS accrual_potential_pct,



    LEAST(

      p.accrual_cap_pct,

      GREATEST(p.accrual_floor_pct, (e.eff_now * p.accrual_scaling_pct))

    )                                            AS applied_accrual_pct,



    -- normalized 0..cap (based on applied accrual within floor..cap)

    LEAST(

      p.network_performance_cap_pct,

      GREATEST(

        0,

        (

          (LEAST(p.accrual_cap_pct, GREATEST(p.accrual_floor_pct, (e.eff_now * p.accrual_scaling_pct))) - p.accrual_floor_pct)

          / NULLIF((p.accrual_cap_pct - p.accrual_floor_pct), 0)

        ) * 100

      )

    )                                            AS network_performance_pct,



    p.network_performance_cap_pct                AS network_performance_cap_pct

  FROM eff e

  CROSS JOIN policy p

)



SELECT jsonb_build_object(

  'ok', true,

  'mode', 'rpc_v2',

  'start_ts', start_ts,

  'end_ts', end_ts,



  'counts', jsonb_build_object(

    'claims_executed', (SELECT claims_executed FROM claims),

    'unique_claimers', (SELECT unique_claimers FROM claims),

    'ledger_entries',  (SELECT ledger_entries  FROM ledger),

    'golden_events',   (SELECT golden_events   FROM golden),

    'claim_reserves',  0,

    'sessions_24h',    (SELECT sessions_24h    FROM sessions),



    -- Protocol Actions (24h) = computed global activity

    'protocol_actions',

      COALESCE((SELECT claims_executed FROM claims), 0)

    + COALESCE((SELECT ledger_entries  FROM ledger), 0)

    + COALESCE((SELECT golden_events   FROM golden), 0)

    + COALESCE((SELECT sessions_24h    FROM sessions), 0)

    + 0

  ),



  'money', (SELECT money FROM money_now),



  'model', jsonb_build_object(

    'reward_efficiency_usd_per_usddd',        (SELECT reward_efficiency_usd_per_usddd        FROM model),

    'reward_efficiency_prev_usd_per_usddd',   (SELECT reward_efficiency_prev_usd_per_usddd   FROM model),

    'efficiency_delta_usd_per_usddd',         (SELECT efficiency_delta_usd_per_usddd         FROM model),



    'accrual_scaling_pct',                    (SELECT accrual_scaling_pct                    FROM model),

    'accrual_floor_pct',                      (SELECT accrual_floor_pct                      FROM model),

    'accrual_cap_pct',                        (SELECT accrual_cap_pct                        FROM model),

    'accrual_potential_pct',                  (SELECT accrual_potential_pct                  FROM model),

    'applied_accrual_pct',                    (SELECT applied_accrual_pct                    FROM model),



    'network_performance_pct',                (SELECT network_performance_pct                FROM model),

    'network_performance_cap_pct',            (SELECT network_performance_cap_pct            FROM model)

  )

);

$$;


--
-- TOC entry 464 (class 1255 OID 28093)
-- Name: scan_activity_money_24h(timestamp with time zone, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.scan_activity_money_24h(start_ts timestamp with time zone, end_ts timestamp with time zone) RETURNS jsonb
    LANGUAGE sql STABLE
    SET search_path TO 'public'
    AS $$

  select jsonb_build_object(

    'claims_value_usd',

      coalesce(sum(reward_value_usd), 0)::numeric,

    'usddd_spent',

      coalesce(sum(usddd_cost), 0)::numeric

  )

  from public.stats_events

  where event = 'dig_success'

    and priced = true

    and created_at >= start_ts

    and created_at < end_ts;

$$;


--
-- TOC entry 489 (class 1255 OID 34000)
-- Name: scan_box_balances_v1(text[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.scan_box_balances_v1(box_ids text[]) RETURNS TABLE(box_id text, deposited_total numeric, claimed_total numeric, withdrawn_total numeric)
    LANGUAGE sql STABLE
    SET search_path TO 'public'
    AS $$

  SELECT

    l.box_id::text AS box_id,

    COALESCE(SUM(CASE WHEN l.entry_type IN ('fund_in','adjust') THEN l.amount ELSE 0 END), 0)::numeric AS deposited_total,

    COALESCE(SUM(CASE WHEN l.entry_type = 'claim_reserve' THEN l.amount ELSE 0 END), 0)::numeric      AS claimed_total,

    0::numeric                                                                               AS withdrawn_total

  FROM public.dd_box_ledger l

  WHERE l.box_id = ANY(box_ids)

  GROUP BY l.box_id;

$$;


--
-- TOC entry 533 (class 1255 OID 17494)
-- Name: stats_summary(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.stats_summary() RETURNS jsonb
    LANGUAGE sql STABLE
    SET search_path TO 'public'
    AS $$

with

  sessions as (

    select count(*)::bigint as total

    from public.stats_events

    where event = 'session_start'

  ),

  digs_attempted as (

    select count(*)::bigint as attempted

    from public.stats_events

    where event = 'dig_attempt'

  ),

  digs_succeeded as (

    select count(*)::bigint as succeeded

    from public.stats_events

    where event = 'dig_success'

  ),

  usddd_spent as (

    select coalesce(sum(usddd_cost), 0)::numeric as spent

    from public.stats_events

    where event = 'dig_success'

  ),

  withdrawals as (

    select count(*)::bigint as cnt

    from public.stats_events

    where event = 'withdraw'

  ),

  daily as (

    select count(distinct install_id)::bigint as daily_active

    from public.stats_events

    where created_at >= date_trunc('day', now())

  ),

  active5 as (

    select count(distinct install_id)::bigint as active_now

    from public.stats_events

    where created_at >= now() - interval '5 minutes'

  ),

  pricecov as (

    select

      count(*) filter (where priced is true)::bigint as priced_cnt,

      count(*) filter (where priced is false)::bigint as na_cnt

    from public.stats_events

    where event = 'dig_success'

  ),

  rewards_usd as (

    select

      coalesce(sum(reward_value_usd), 0)::numeric as total_usd

    from public.stats_events

    where event = 'dig_success'

      and reward_value_usd is not null

  ),

  top_boxes as (

    select

      box_id,

      chain,

      token_symbol,

      count(*)::bigint as digs

    from public.stats_events

    where event = 'dig_success'

    group by box_id, chain, token_symbol

    order by digs desc nulls last

    limit 5

  )

select jsonb_build_object(

  'total_sessions', (select total from sessions),

  'active_now_5m', (select active_now from active5),

  'daily_active', (select daily_active from daily),

  'digs_attempted', (select attempted from digs_attempted),

  'digs_succeeded', (select succeeded from digs_succeeded),

  'usddd_spent', (select spent from usddd_spent),

  'withdrawals', (select cnt from withdrawals),

  'price_priced', (select priced_cnt from pricecov),

  'price_na', (select na_cnt from pricecov),

  'rewards_with_price_usd', (select total_usd from rewards_usd),

  'top_boxes', (

    select coalesce(

      jsonb_agg(

        jsonb_build_object(

          'box_id', box_id,

          'chain', chain,

          'token', token_symbol,

          'digs', digs

        )

      ),

      '[]'::jsonb

    )

    from top_boxes

  )

);

$$;


--
-- TOC entry 400 (class 1255 OID 17157)
-- Name: apply_rls(jsonb, integer); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer DEFAULT (1024 * 1024)) RETURNS SETOF realtime.wal_rls
    LANGUAGE plpgsql
    AS $$
declare
-- Regclass of the table e.g. public.notes
entity_ regclass = (quote_ident(wal ->> 'schema') || '.' || quote_ident(wal ->> 'table'))::regclass;

-- I, U, D, T: insert, update ...
action realtime.action = (
    case wal ->> 'action'
        when 'I' then 'INSERT'
        when 'U' then 'UPDATE'
        when 'D' then 'DELETE'
        else 'ERROR'
    end
);

-- Is row level security enabled for the table
is_rls_enabled bool = relrowsecurity from pg_class where oid = entity_;

subscriptions realtime.subscription[] = array_agg(subs)
    from
        realtime.subscription subs
    where
        subs.entity = entity_
        -- Filter by action early - only get subscriptions interested in this action
        -- action_filter column can be: '*' (all), 'INSERT', 'UPDATE', or 'DELETE'
        and (subs.action_filter = '*' or subs.action_filter = action::text);

-- Subscription vars
roles regrole[] = array_agg(distinct us.claims_role::text)
    from
        unnest(subscriptions) us;

working_role regrole;
claimed_role regrole;
claims jsonb;

subscription_id uuid;
subscription_has_access bool;
visible_to_subscription_ids uuid[] = '{}';

-- structured info for wal's columns
columns realtime.wal_column[];
-- previous identity values for update/delete
old_columns realtime.wal_column[];

error_record_exceeds_max_size boolean = octet_length(wal::text) > max_record_bytes;

-- Primary jsonb output for record
output jsonb;

begin
perform set_config('role', null, true);

columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'columns') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

old_columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'identity') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

for working_role in select * from unnest(roles) loop

    -- Update `is_selectable` for columns and old_columns
    columns =
        array_agg(
            (
                c.name,
                c.type_name,
                c.type_oid,
                c.value,
                c.is_pkey,
                pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
            )::realtime.wal_column
        )
        from
            unnest(columns) c;

    old_columns =
            array_agg(
                (
                    c.name,
                    c.type_name,
                    c.type_oid,
                    c.value,
                    c.is_pkey,
                    pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                )::realtime.wal_column
            )
            from
                unnest(old_columns) c;

    if action <> 'DELETE' and count(1) = 0 from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            -- subscriptions is already filtered by entity
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 400: Bad Request, no primary key']
        )::realtime.wal_rls;

    -- The claims role does not have SELECT permission to the primary key of entity
    elsif action <> 'DELETE' and sum(c.is_selectable::int) <> count(1) from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 401: Unauthorized']
        )::realtime.wal_rls;

    else
        output = jsonb_build_object(
            'schema', wal ->> 'schema',
            'table', wal ->> 'table',
            'type', action,
            'commit_timestamp', to_char(
                ((wal ->> 'timestamp')::timestamptz at time zone 'utc'),
                'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
            ),
            'columns', (
                select
                    jsonb_agg(
                        jsonb_build_object(
                            'name', pa.attname,
                            'type', pt.typname
                        )
                        order by pa.attnum asc
                    )
                from
                    pg_attribute pa
                    join pg_type pt
                        on pa.atttypid = pt.oid
                where
                    attrelid = entity_
                    and attnum > 0
                    and pg_catalog.has_column_privilege(working_role, entity_, pa.attname, 'SELECT')
            )
        )
        -- Add "record" key for insert and update
        || case
            when action in ('INSERT', 'UPDATE') then
                jsonb_build_object(
                    'record',
                    (
                        select
                            jsonb_object_agg(
                                -- if unchanged toast, get column name and value from old record
                                coalesce((c).name, (oc).name),
                                case
                                    when (c).name is null then (oc).value
                                    else (c).value
                                end
                            )
                        from
                            unnest(columns) c
                            full outer join unnest(old_columns) oc
                                on (c).name = (oc).name
                        where
                            coalesce((c).is_selectable, (oc).is_selectable)
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                    )
                )
            else '{}'::jsonb
        end
        -- Add "old_record" key for update and delete
        || case
            when action = 'UPDATE' then
                jsonb_build_object(
                        'old_record',
                        (
                            select jsonb_object_agg((c).name, (c).value)
                            from unnest(old_columns) c
                            where
                                (c).is_selectable
                                and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                        )
                    )
            when action = 'DELETE' then
                jsonb_build_object(
                    'old_record',
                    (
                        select jsonb_object_agg((c).name, (c).value)
                        from unnest(old_columns) c
                        where
                            (c).is_selectable
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                            and ( not is_rls_enabled or (c).is_pkey ) -- if RLS enabled, we can't secure deletes so filter to pkey
                    )
                )
            else '{}'::jsonb
        end;

        -- Create the prepared statement
        if is_rls_enabled and action <> 'DELETE' then
            if (select 1 from pg_prepared_statements where name = 'walrus_rls_stmt' limit 1) > 0 then
                deallocate walrus_rls_stmt;
            end if;
            execute realtime.build_prepared_statement_sql('walrus_rls_stmt', entity_, columns);
        end if;

        visible_to_subscription_ids = '{}';

        for subscription_id, claims in (
                select
                    subs.subscription_id,
                    subs.claims
                from
                    unnest(subscriptions) subs
                where
                    subs.entity = entity_
                    and subs.claims_role = working_role
                    and (
                        realtime.is_visible_through_filters(columns, subs.filters)
                        or (
                          action = 'DELETE'
                          and realtime.is_visible_through_filters(old_columns, subs.filters)
                        )
                    )
        ) loop

            if not is_rls_enabled or action = 'DELETE' then
                visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
            else
                -- Check if RLS allows the role to see the record
                perform
                    -- Trim leading and trailing quotes from working_role because set_config
                    -- doesn't recognize the role as valid if they are included
                    set_config('role', trim(both '"' from working_role::text), true),
                    set_config('request.jwt.claims', claims::text, true);

                execute 'execute walrus_rls_stmt' into subscription_has_access;

                if subscription_has_access then
                    visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
                end if;
            end if;
        end loop;

        perform set_config('role', null, true);

        return next (
            output,
            is_rls_enabled,
            visible_to_subscription_ids,
            case
                when error_record_exceeds_max_size then array['Error 413: Payload Too Large']
                else '{}'
            end
        )::realtime.wal_rls;

    end if;
end loop;

perform set_config('role', null, true);
end;
$$;


--
-- TOC entry 507 (class 1255 OID 17386)
-- Name: broadcast_changes(text, text, text, text, text, record, record, text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text DEFAULT 'ROW'::text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    -- Declare a variable to hold the JSONB representation of the row
    row_data jsonb := '{}'::jsonb;
BEGIN
    IF level = 'STATEMENT' THEN
        RAISE EXCEPTION 'function can only be triggered for each row, not for each statement';
    END IF;
    -- Check the operation type and handle accordingly
    IF operation = 'INSERT' OR operation = 'UPDATE' OR operation = 'DELETE' THEN
        row_data := jsonb_build_object('old_record', OLD, 'record', NEW, 'operation', operation, 'table', table_name, 'schema', table_schema);
        PERFORM realtime.send (row_data, event_name, topic_name);
    ELSE
        RAISE EXCEPTION 'Unexpected operation type: %', operation;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to process the row: %', SQLERRM;
END;

$$;


--
-- TOC entry 510 (class 1255 OID 17236)
-- Name: build_prepared_statement_sql(text, regclass, realtime.wal_column[]); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) RETURNS text
    LANGUAGE sql
    AS $$
      /*
      Builds a sql string that, if executed, creates a prepared statement to
      tests retrive a row from *entity* by its primary key columns.
      Example
          select realtime.build_prepared_statement_sql('public.notes', '{"id"}'::text[], '{"bigint"}'::text[])
      */
          select
      'prepare ' || prepared_statement_name || ' as
          select
              exists(
                  select
                      1
                  from
                      ' || entity || '
                  where
                      ' || string_agg(quote_ident(pkc.name) || '=' || quote_nullable(pkc.value #>> '{}') , ' and ') || '
              )'
          from
              unnest(columns) pkc
          where
              pkc.is_pkey
          group by
              entity
      $$;


--
-- TOC entry 451 (class 1255 OID 17119)
-- Name: cast(text, regtype); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime."cast"(val text, type_ regtype) RETURNS jsonb
    LANGUAGE plpgsql IMMUTABLE
    AS $$
    declare
      res jsonb;
    begin
      execute format('select to_jsonb(%L::'|| type_::text || ')', val)  into res;
      return res;
    end
    $$;


--
-- TOC entry 511 (class 1255 OID 17114)
-- Name: check_equality_op(realtime.equality_op, regtype, text, text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) RETURNS boolean
    LANGUAGE plpgsql IMMUTABLE
    AS $$
      /*
      Casts *val_1* and *val_2* as type *type_* and check the *op* condition for truthiness
      */
      declare
          op_symbol text = (
              case
                  when op = 'eq' then '='
                  when op = 'neq' then '!='
                  when op = 'lt' then '<'
                  when op = 'lte' then '<='
                  when op = 'gt' then '>'
                  when op = 'gte' then '>='
                  when op = 'in' then '= any'
                  else 'UNKNOWN OP'
              end
          );
          res boolean;
      begin
          execute format(
              'select %L::'|| type_::text || ' ' || op_symbol
              || ' ( %L::'
              || (
                  case
                      when op = 'in' then type_::text || '[]'
                      else type_::text end
              )
              || ')', val_1, val_2) into res;
          return res;
      end;
      $$;


--
-- TOC entry 499 (class 1255 OID 17222)
-- Name: is_visible_through_filters(realtime.wal_column[], realtime.user_defined_filter[]); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $_$
    /*
    Should the record be visible (true) or filtered out (false) after *filters* are applied
    */
        select
            -- Default to allowed when no filters present
            $2 is null -- no filters. this should not happen because subscriptions has a default
            or array_length($2, 1) is null -- array length of an empty array is null
            or bool_and(
                coalesce(
                    realtime.check_equality_op(
                        op:=f.op,
                        type_:=coalesce(
                            col.type_oid::regtype, -- null when wal2json version <= 2.4
                            col.type_name::regtype
                        ),
                        -- cast jsonb to text
                        val_1:=col.value #>> '{}',
                        val_2:=f.value
                    ),
                    false -- if null, filter does not match
                )
            )
        from
            unnest(filters) f
            join unnest(columns) col
                on f.column_name = col.name;
    $_$;


--
-- TOC entry 417 (class 1255 OID 17326)
-- Name: list_changes(name, name, integer, integer); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) RETURNS SETOF realtime.wal_rls
    LANGUAGE sql
    SET log_min_messages TO 'fatal'
    AS $$
      with pub as (
        select
          concat_ws(
            ',',
            case when bool_or(pubinsert) then 'insert' else null end,
            case when bool_or(pubupdate) then 'update' else null end,
            case when bool_or(pubdelete) then 'delete' else null end
          ) as w2j_actions,
          coalesce(
            string_agg(
              realtime.quote_wal2json(format('%I.%I', schemaname, tablename)::regclass),
              ','
            ) filter (where ppt.tablename is not null and ppt.tablename not like '% %'),
            ''
          ) w2j_add_tables
        from
          pg_publication pp
          left join pg_publication_tables ppt
            on pp.pubname = ppt.pubname
        where
          pp.pubname = publication
        group by
          pp.pubname
        limit 1
      ),
      w2j as (
        select
          x.*, pub.w2j_add_tables
        from
          pub,
          pg_logical_slot_get_changes(
            slot_name, null, max_changes,
            'include-pk', 'true',
            'include-transaction', 'false',
            'include-timestamp', 'true',
            'include-type-oids', 'true',
            'format-version', '2',
            'actions', pub.w2j_actions,
            'add-tables', pub.w2j_add_tables
          ) x
      )
      select
        xyz.wal,
        xyz.is_rls_enabled,
        xyz.subscription_ids,
        xyz.errors
      from
        w2j,
        realtime.apply_rls(
          wal := w2j.data::jsonb,
          max_record_bytes := max_record_bytes
        ) xyz(wal, is_rls_enabled, subscription_ids, errors)
      where
        w2j.w2j_add_tables <> ''
        and xyz.subscription_ids[1] is not null
    $$;


--
-- TOC entry 461 (class 1255 OID 17113)
-- Name: quote_wal2json(regclass); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.quote_wal2json(entity regclass) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
      select
        (
          select string_agg('' || ch,'')
          from unnest(string_to_array(nsp.nspname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
        )
        || '.'
        || (
          select string_agg('' || ch,'')
          from unnest(string_to_array(pc.relname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
          )
      from
        pg_class pc
        join pg_namespace nsp
          on pc.relnamespace = nsp.oid
      where
        pc.oid = entity
    $$;


--
-- TOC entry 501 (class 1255 OID 17385)
-- Name: send(jsonb, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  generated_id uuid;
  final_payload jsonb;
BEGIN
  BEGIN
    -- Generate a new UUID for the id
    generated_id := gen_random_uuid();

    -- Check if payload has an 'id' key, if not, add the generated UUID
    IF payload ? 'id' THEN
      final_payload := payload;
    ELSE
      final_payload := jsonb_set(payload, '{id}', to_jsonb(generated_id));
    END IF;

    -- Set the topic configuration
    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    -- Attempt to insert the message
    INSERT INTO realtime.messages (id, payload, event, topic, private, extension)
    VALUES (generated_id, final_payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      -- Capture and notify the error
      RAISE WARNING 'ErrorSendingBroadcastMessage: %', SQLERRM;
  END;
END;
$$;


--
-- TOC entry 487 (class 1255 OID 17111)
-- Name: subscription_check_filters(); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.subscription_check_filters() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    /*
    Validates that the user defined filters for a subscription:
    - refer to valid columns that the claimed role may access
    - values are coercable to the correct column type
    */
    declare
        col_names text[] = coalesce(
                array_agg(c.column_name order by c.ordinal_position),
                '{}'::text[]
            )
            from
                information_schema.columns c
            where
                format('%I.%I', c.table_schema, c.table_name)::regclass = new.entity
                and pg_catalog.has_column_privilege(
                    (new.claims ->> 'role'),
                    format('%I.%I', c.table_schema, c.table_name)::regclass,
                    c.column_name,
                    'SELECT'
                );
        filter realtime.user_defined_filter;
        col_type regtype;

        in_val jsonb;
    begin
        for filter in select * from unnest(new.filters) loop
            -- Filtered column is valid
            if not filter.column_name = any(col_names) then
                raise exception 'invalid column for filter %', filter.column_name;
            end if;

            -- Type is sanitized and safe for string interpolation
            col_type = (
                select atttypid::regtype
                from pg_catalog.pg_attribute
                where attrelid = new.entity
                      and attname = filter.column_name
            );
            if col_type is null then
                raise exception 'failed to lookup type for column %', filter.column_name;
            end if;

            -- Set maximum number of entries for in filter
            if filter.op = 'in'::realtime.equality_op then
                in_val = realtime.cast(filter.value, (col_type::text || '[]')::regtype);
                if coalesce(jsonb_array_length(in_val), 0) > 100 then
                    raise exception 'too many values for `in` filter. Maximum 100';
                end if;
            else
                -- raises an exception if value is not coercable to type
                perform realtime.cast(filter.value, col_type);
            end if;

        end loop;

        -- Apply consistent order to filters so the unique constraint on
        -- (subscription_id, entity, filters) can't be tricked by a different filter order
        new.filters = coalesce(
            array_agg(f order by f.column_name, f.op, f.value),
            '{}'
        ) from unnest(new.filters) f;

        return new;
    end;
    $$;


--
-- TOC entry 415 (class 1255 OID 17146)
-- Name: to_regrole(text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.to_regrole(role_name text) RETURNS regrole
    LANGUAGE sql IMMUTABLE
    AS $$ select role_name::regrole $$;


--
-- TOC entry 512 (class 1255 OID 17379)
-- Name: topic(); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.topic() RETURNS text
    LANGUAGE sql STABLE
    AS $$
select nullif(current_setting('realtime.topic', true), '')::text;
$$;


--
-- TOC entry 414 (class 1255 OID 17310)
-- Name: add_prefixes(text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.add_prefixes(_bucket_id text, _name text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    prefixes text[];
BEGIN
    prefixes := "storage"."get_prefixes"("_name");

    IF array_length(prefixes, 1) > 0 THEN
        INSERT INTO storage.prefixes (name, bucket_id)
        SELECT UNNEST(prefixes) as name, "_bucket_id" ON CONFLICT DO NOTHING;
    END IF;
END;
$$;


--
-- TOC entry 544 (class 1255 OID 17232)
-- Name: can_insert_object(text, text, uuid, jsonb); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$$;


--
-- TOC entry 524 (class 1255 OID 17435)
-- Name: delete_leaf_prefixes(text[], text[]); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.delete_leaf_prefixes(bucket_ids text[], names text[]) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_rows_deleted integer;
BEGIN
    LOOP
        WITH candidates AS (
            SELECT DISTINCT
                t.bucket_id,
                unnest(storage.get_prefixes(t.name)) AS name
            FROM unnest(bucket_ids, names) AS t(bucket_id, name)
        ),
        uniq AS (
             SELECT
                 bucket_id,
                 name,
                 storage.get_level(name) AS level
             FROM candidates
             WHERE name <> ''
             GROUP BY bucket_id, name
        ),
        leaf AS (
             SELECT
                 p.bucket_id,
                 p.name,
                 p.level
             FROM storage.prefixes AS p
                  JOIN uniq AS u
                       ON u.bucket_id = p.bucket_id
                           AND u.name = p.name
                           AND u.level = p.level
             WHERE NOT EXISTS (
                 SELECT 1
                 FROM storage.objects AS o
                 WHERE o.bucket_id = p.bucket_id
                   AND o.level = p.level + 1
                   AND o.name COLLATE "C" LIKE p.name || '/%'
             )
             AND NOT EXISTS (
                 SELECT 1
                 FROM storage.prefixes AS c
                 WHERE c.bucket_id = p.bucket_id
                   AND c.level = p.level + 1
                   AND c.name COLLATE "C" LIKE p.name || '/%'
             )
        )
        DELETE
        FROM storage.prefixes AS p
            USING leaf AS l
        WHERE p.bucket_id = l.bucket_id
          AND p.name = l.name
          AND p.level = l.level;

        GET DIAGNOSTICS v_rows_deleted = ROW_COUNT;
        EXIT WHEN v_rows_deleted = 0;
    END LOOP;
END;
$$;


--
-- TOC entry 541 (class 1255 OID 17311)
-- Name: delete_prefix(text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.delete_prefix(_bucket_id text, _name text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    -- Check if we can delete the prefix
    IF EXISTS(
        SELECT FROM "storage"."prefixes"
        WHERE "prefixes"."bucket_id" = "_bucket_id"
          AND level = "storage"."get_level"("_name") + 1
          AND "prefixes"."name" COLLATE "C" LIKE "_name" || '/%'
        LIMIT 1
    )
    OR EXISTS(
        SELECT FROM "storage"."objects"
        WHERE "objects"."bucket_id" = "_bucket_id"
          AND "storage"."get_level"("objects"."name") = "storage"."get_level"("_name") + 1
          AND "objects"."name" COLLATE "C" LIKE "_name" || '/%'
        LIMIT 1
    ) THEN
    -- There are sub-objects, skip deletion
    RETURN false;
    ELSE
        DELETE FROM "storage"."prefixes"
        WHERE "prefixes"."bucket_id" = "_bucket_id"
          AND level = "storage"."get_level"("_name")
          AND "prefixes"."name" = "_name";
        RETURN true;
    END IF;
END;
$$;


--
-- TOC entry 502 (class 1255 OID 17314)
-- Name: delete_prefix_hierarchy_trigger(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.delete_prefix_hierarchy_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    prefix text;
BEGIN
    prefix := "storage"."get_prefix"(OLD."name");

    IF coalesce(prefix, '') != '' THEN
        PERFORM "storage"."delete_prefix"(OLD."bucket_id", prefix);
    END IF;

    RETURN OLD;
END;
$$;


--
-- TOC entry 445 (class 1255 OID 17414)
-- Name: enforce_bucket_name_length(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.enforce_bucket_name_length() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
    if length(new.name) > 100 then
        raise exception 'bucket name "%" is too long (% characters). Max is 100.', new.name, length(new.name);
    end if;
    return new;
end;
$$;


--
-- TOC entry 538 (class 1255 OID 17197)
-- Name: extension(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.extension(name text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
    _filename text;
BEGIN
    SELECT string_to_array(name, '/') INTO _parts;
    SELECT _parts[array_length(_parts,1)] INTO _filename;
    RETURN reverse(split_part(reverse(_filename), '.', 1));
END
$$;


--
-- TOC entry 463 (class 1255 OID 17196)
-- Name: filename(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.filename(name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[array_length(_parts,1)];
END
$$;


--
-- TOC entry 478 (class 1255 OID 17195)
-- Name: foldername(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.foldername(name text) RETURNS text[]
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Return everything except the last segment
    RETURN _parts[1 : array_length(_parts,1) - 1];
END
$$;


--
-- TOC entry 428 (class 1255 OID 17292)
-- Name: get_level(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_level(name text) RETURNS integer
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
SELECT array_length(string_to_array("name", '/'), 1);
$$;


--
-- TOC entry 444 (class 1255 OID 17308)
-- Name: get_prefix(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_prefix(name text) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
SELECT
    CASE WHEN strpos("name", '/') > 0 THEN
             regexp_replace("name", '[\/]{1}[^\/]+\/?$', '')
         ELSE
             ''
        END;
$_$;


--
-- TOC entry 412 (class 1255 OID 17309)
-- Name: get_prefixes(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_prefixes(name text) RETURNS text[]
    LANGUAGE plpgsql IMMUTABLE STRICT
    AS $$
DECLARE
    parts text[];
    prefixes text[];
    prefix text;
BEGIN
    -- Split the name into parts by '/'
    parts := string_to_array("name", '/');
    prefixes := '{}';

    -- Construct the prefixes, stopping one level below the last part
    FOR i IN 1..array_length(parts, 1) - 1 LOOP
            prefix := array_to_string(parts[1:i], '/');
            prefixes := array_append(prefixes, prefix);
    END LOOP;

    RETURN prefixes;
END;
$$;


--
-- TOC entry 455 (class 1255 OID 17412)
-- Name: get_size_by_bucket(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_size_by_bucket() RETURNS TABLE(size bigint, bucket_id text)
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::bigint) as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;


--
-- TOC entry 408 (class 1255 OID 17273)
-- Name: list_multipart_uploads_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, next_key_token text DEFAULT ''::text, next_upload_token text DEFAULT ''::text) RETURNS TABLE(key text, id text, created_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$_$;


--
-- TOC entry 481 (class 1255 OID 17235)
-- Name: list_objects_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.list_objects_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, start_after text DEFAULT ''::text, next_token text DEFAULT ''::text) RETURNS TABLE(name text, id uuid, metadata jsonb, updated_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(name COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                        substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1)))
                    ELSE
                        name
                END AS name, id, metadata, updated_at
            FROM
                storage.objects
            WHERE
                bucket_id = $5 AND
                name ILIKE $1 || ''%'' AND
                CASE
                    WHEN $6 != '''' THEN
                    name COLLATE "C" > $6
                ELSE true END
                AND CASE
                    WHEN $4 != '''' THEN
                        CASE
                            WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                                substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                name COLLATE "C" > $4
                            END
                    ELSE
                        true
                END
            ORDER BY
                name COLLATE "C" ASC) as e order by name COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_token, bucket_id, start_after;
END;
$_$;


--
-- TOC entry 526 (class 1255 OID 17434)
-- Name: lock_top_prefixes(text[], text[]); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.lock_top_prefixes(bucket_ids text[], names text[]) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_bucket text;
    v_top text;
BEGIN
    FOR v_bucket, v_top IN
        SELECT DISTINCT t.bucket_id,
            split_part(t.name, '/', 1) AS top
        FROM unnest(bucket_ids, names) AS t(bucket_id, name)
        WHERE t.name <> ''
        ORDER BY 1, 2
        LOOP
            PERFORM pg_advisory_xact_lock(hashtextextended(v_bucket || '/' || v_top, 0));
        END LOOP;
END;
$$;


--
-- TOC entry 491 (class 1255 OID 17436)
-- Name: objects_delete_cleanup(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.objects_delete_cleanup() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_bucket_ids text[];
    v_names      text[];
BEGIN
    IF current_setting('storage.gc.prefixes', true) = '1' THEN
        RETURN NULL;
    END IF;

    PERFORM set_config('storage.gc.prefixes', '1', true);

    SELECT COALESCE(array_agg(d.bucket_id), '{}'),
           COALESCE(array_agg(d.name), '{}')
    INTO v_bucket_ids, v_names
    FROM deleted AS d
    WHERE d.name <> '';

    PERFORM storage.lock_top_prefixes(v_bucket_ids, v_names);
    PERFORM storage.delete_leaf_prefixes(v_bucket_ids, v_names);

    RETURN NULL;
END;
$$;


--
-- TOC entry 485 (class 1255 OID 17313)
-- Name: objects_insert_prefix_trigger(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.objects_insert_prefix_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    NEW.level := "storage"."get_level"(NEW."name");

    RETURN NEW;
END;
$$;


--
-- TOC entry 509 (class 1255 OID 17437)
-- Name: objects_update_cleanup(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.objects_update_cleanup() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    -- NEW - OLD (destinations to create prefixes for)
    v_add_bucket_ids text[];
    v_add_names      text[];

    -- OLD - NEW (sources to prune)
    v_src_bucket_ids text[];
    v_src_names      text[];
BEGIN
    IF TG_OP <> 'UPDATE' THEN
        RETURN NULL;
    END IF;

    -- 1) Compute NEWΓêÆOLD (added paths) and OLDΓêÆNEW (moved-away paths)
    WITH added AS (
        SELECT n.bucket_id, n.name
        FROM new_rows n
        WHERE n.name <> '' AND position('/' in n.name) > 0
        EXCEPT
        SELECT o.bucket_id, o.name FROM old_rows o WHERE o.name <> ''
    ),
    moved AS (
         SELECT o.bucket_id, o.name
         FROM old_rows o
         WHERE o.name <> ''
         EXCEPT
         SELECT n.bucket_id, n.name FROM new_rows n WHERE n.name <> ''
    )
    SELECT
        -- arrays for ADDED (dest) in stable order
        COALESCE( (SELECT array_agg(a.bucket_id ORDER BY a.bucket_id, a.name) FROM added a), '{}' ),
        COALESCE( (SELECT array_agg(a.name      ORDER BY a.bucket_id, a.name) FROM added a), '{}' ),
        -- arrays for MOVED (src) in stable order
        COALESCE( (SELECT array_agg(m.bucket_id ORDER BY m.bucket_id, m.name) FROM moved m), '{}' ),
        COALESCE( (SELECT array_agg(m.name      ORDER BY m.bucket_id, m.name) FROM moved m), '{}' )
    INTO v_add_bucket_ids, v_add_names, v_src_bucket_ids, v_src_names;

    -- Nothing to do?
    IF (array_length(v_add_bucket_ids, 1) IS NULL) AND (array_length(v_src_bucket_ids, 1) IS NULL) THEN
        RETURN NULL;
    END IF;

    -- 2) Take per-(bucket, top) locks: ALL prefixes in consistent global order to prevent deadlocks
    DECLARE
        v_all_bucket_ids text[];
        v_all_names text[];
    BEGIN
        -- Combine source and destination arrays for consistent lock ordering
        v_all_bucket_ids := COALESCE(v_src_bucket_ids, '{}') || COALESCE(v_add_bucket_ids, '{}');
        v_all_names := COALESCE(v_src_names, '{}') || COALESCE(v_add_names, '{}');

        -- Single lock call ensures consistent global ordering across all transactions
        IF array_length(v_all_bucket_ids, 1) IS NOT NULL THEN
            PERFORM storage.lock_top_prefixes(v_all_bucket_ids, v_all_names);
        END IF;
    END;

    -- 3) Create destination prefixes (NEWΓêÆOLD) BEFORE pruning sources
    IF array_length(v_add_bucket_ids, 1) IS NOT NULL THEN
        WITH candidates AS (
            SELECT DISTINCT t.bucket_id, unnest(storage.get_prefixes(t.name)) AS name
            FROM unnest(v_add_bucket_ids, v_add_names) AS t(bucket_id, name)
            WHERE name <> ''
        )
        INSERT INTO storage.prefixes (bucket_id, name)
        SELECT c.bucket_id, c.name
        FROM candidates c
        ON CONFLICT DO NOTHING;
    END IF;

    -- 4) Prune source prefixes bottom-up for OLDΓêÆNEW
    IF array_length(v_src_bucket_ids, 1) IS NOT NULL THEN
        -- re-entrancy guard so DELETE on prefixes won't recurse
        IF current_setting('storage.gc.prefixes', true) <> '1' THEN
            PERFORM set_config('storage.gc.prefixes', '1', true);
        END IF;

        PERFORM storage.delete_leaf_prefixes(v_src_bucket_ids, v_src_names);
    END IF;

    RETURN NULL;
END;
$$;


--
-- TOC entry 435 (class 1255 OID 17442)
-- Name: objects_update_level_trigger(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.objects_update_level_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Ensure this is an update operation and the name has changed
    IF TG_OP = 'UPDATE' AND (NEW."name" <> OLD."name" OR NEW."bucket_id" <> OLD."bucket_id") THEN
        -- Set the new level
        NEW."level" := "storage"."get_level"(NEW."name");
    END IF;
    RETURN NEW;
END;
$$;


--
-- TOC entry 420 (class 1255 OID 17413)
-- Name: objects_update_prefix_trigger(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.objects_update_prefix_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    old_prefixes TEXT[];
BEGIN
    -- Ensure this is an update operation and the name has changed
    IF TG_OP = 'UPDATE' AND (NEW."name" <> OLD."name" OR NEW."bucket_id" <> OLD."bucket_id") THEN
        -- Retrieve old prefixes
        old_prefixes := "storage"."get_prefixes"(OLD."name");

        -- Remove old prefixes that are only used by this object
        WITH all_prefixes as (
            SELECT unnest(old_prefixes) as prefix
        ),
        can_delete_prefixes as (
             SELECT prefix
             FROM all_prefixes
             WHERE NOT EXISTS (
                 SELECT 1 FROM "storage"."objects"
                 WHERE "bucket_id" = OLD."bucket_id"
                   AND "name" <> OLD."name"
                   AND "name" LIKE (prefix || '%')
             )
         )
        DELETE FROM "storage"."prefixes" WHERE name IN (SELECT prefix FROM can_delete_prefixes);

        -- Add new prefixes
        PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    END IF;
    -- Set the new level
    NEW."level" := "storage"."get_level"(NEW."name");

    RETURN NEW;
END;
$$;


--
-- TOC entry 465 (class 1255 OID 17290)
-- Name: operation(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.operation() RETURNS text
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


--
-- TOC entry 467 (class 1255 OID 17438)
-- Name: prefixes_delete_cleanup(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.prefixes_delete_cleanup() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_bucket_ids text[];
    v_names      text[];
BEGIN
    IF current_setting('storage.gc.prefixes', true) = '1' THEN
        RETURN NULL;
    END IF;

    PERFORM set_config('storage.gc.prefixes', '1', true);

    SELECT COALESCE(array_agg(d.bucket_id), '{}'),
           COALESCE(array_agg(d.name), '{}')
    INTO v_bucket_ids, v_names
    FROM deleted AS d
    WHERE d.name <> '';

    PERFORM storage.lock_top_prefixes(v_bucket_ids, v_names);
    PERFORM storage.delete_leaf_prefixes(v_bucket_ids, v_names);

    RETURN NULL;
END;
$$;


--
-- TOC entry 411 (class 1255 OID 17312)
-- Name: prefixes_insert_trigger(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.prefixes_insert_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    RETURN NEW;
END;
$$;


--
-- TOC entry 472 (class 1255 OID 17214)
-- Name: search(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql
    AS $$
declare
    can_bypass_rls BOOLEAN;
begin
    SELECT rolbypassrls
    INTO can_bypass_rls
    FROM pg_roles
    WHERE rolname = coalesce(nullif(current_setting('role', true), 'none'), current_user);

    IF can_bypass_rls THEN
        RETURN QUERY SELECT * FROM storage.search_v1_optimised(prefix, bucketname, limits, levels, offsets, search, sortcolumn, sortorder);
    ELSE
        RETURN QUERY SELECT * FROM storage.search_legacy_v1(prefix, bucketname, limits, levels, offsets, search, sortcolumn, sortorder);
    END IF;
end;
$$;


--
-- TOC entry 423 (class 1255 OID 17410)
-- Name: search_legacy_v1(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search_legacy_v1(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
declare
    v_order_by text;
    v_sort_order text;
begin
    case
        when sortcolumn = 'name' then
            v_order_by = 'name';
        when sortcolumn = 'updated_at' then
            v_order_by = 'updated_at';
        when sortcolumn = 'created_at' then
            v_order_by = 'created_at';
        when sortcolumn = 'last_accessed_at' then
            v_order_by = 'last_accessed_at';
        else
            v_order_by = 'name';
        end case;

    case
        when sortorder = 'asc' then
            v_sort_order = 'asc';
        when sortorder = 'desc' then
            v_sort_order = 'desc';
        else
            v_sort_order = 'asc';
        end case;

    v_order_by = v_order_by || ' ' || v_sort_order;

    return query execute
        'with folders as (
           select path_tokens[$1] as folder
           from storage.objects
             where objects.name ilike $2 || $3 || ''%''
               and bucket_id = $4
               and array_length(objects.path_tokens, 1) <> $1
           group by folder
           order by folder ' || v_sort_order || '
     )
     (select folder as "name",
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[$1] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where objects.name ilike $2 || $3 || ''%''
       and bucket_id = $4
       and array_length(objects.path_tokens, 1) = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$_$;


--
-- TOC entry 456 (class 1255 OID 17409)
-- Name: search_v1_optimised(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search_v1_optimised(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
declare
    v_order_by text;
    v_sort_order text;
begin
    case
        when sortcolumn = 'name' then
            v_order_by = 'name';
        when sortcolumn = 'updated_at' then
            v_order_by = 'updated_at';
        when sortcolumn = 'created_at' then
            v_order_by = 'created_at';
        when sortcolumn = 'last_accessed_at' then
            v_order_by = 'last_accessed_at';
        else
            v_order_by = 'name';
        end case;

    case
        when sortorder = 'asc' then
            v_sort_order = 'asc';
        when sortorder = 'desc' then
            v_sort_order = 'desc';
        else
            v_sort_order = 'asc';
        end case;

    v_order_by = v_order_by || ' ' || v_sort_order;

    return query execute
        'with folders as (
           select (string_to_array(name, ''/''))[level] as name
           from storage.prefixes
             where lower(prefixes.name) like lower($2 || $3) || ''%''
               and bucket_id = $4
               and level = $1
           order by name ' || v_sort_order || '
     )
     (select name,
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[level] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where lower(objects.name) like lower($2 || $3) || ''%''
       and bucket_id = $4
       and level = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$_$;


--
-- TOC entry 488 (class 1255 OID 17433)
-- Name: search_v2(text, text, integer, integer, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer DEFAULT 100, levels integer DEFAULT 1, start_after text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text, sort_column text DEFAULT 'name'::text, sort_column_after text DEFAULT ''::text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    sort_col text;
    sort_ord text;
    cursor_op text;
    cursor_expr text;
    sort_expr text;
BEGIN
    -- Validate sort_order
    sort_ord := lower(sort_order);
    IF sort_ord NOT IN ('asc', 'desc') THEN
        sort_ord := 'asc';
    END IF;

    -- Determine cursor comparison operator
    IF sort_ord = 'asc' THEN
        cursor_op := '>';
    ELSE
        cursor_op := '<';
    END IF;
    
    sort_col := lower(sort_column);
    -- Validate sort column  
    IF sort_col IN ('updated_at', 'created_at') THEN
        cursor_expr := format(
            '($5 = '''' OR ROW(date_trunc(''milliseconds'', %I), name COLLATE "C") %s ROW(COALESCE(NULLIF($6, '''')::timestamptz, ''epoch''::timestamptz), $5))',
            sort_col, cursor_op
        );
        sort_expr := format(
            'COALESCE(date_trunc(''milliseconds'', %I), ''epoch''::timestamptz) %s, name COLLATE "C" %s',
            sort_col, sort_ord, sort_ord
        );
    ELSE
        cursor_expr := format('($5 = '''' OR name COLLATE "C" %s $5)', cursor_op);
        sort_expr := format('name COLLATE "C" %s', sort_ord);
    END IF;

    RETURN QUERY EXECUTE format(
        $sql$
        SELECT * FROM (
            (
                SELECT
                    split_part(name, '/', $4) AS key,
                    name,
                    NULL::uuid AS id,
                    updated_at,
                    created_at,
                    NULL::timestamptz AS last_accessed_at,
                    NULL::jsonb AS metadata
                FROM storage.prefixes
                WHERE name COLLATE "C" LIKE $1 || '%%'
                    AND bucket_id = $2
                    AND level = $4
                    AND %s
                ORDER BY %s
                LIMIT $3
            )
            UNION ALL
            (
                SELECT
                    split_part(name, '/', $4) AS key,
                    name,
                    id,
                    updated_at,
                    created_at,
                    last_accessed_at,
                    metadata
                FROM storage.objects
                WHERE name COLLATE "C" LIKE $1 || '%%'
                    AND bucket_id = $2
                    AND level = $4
                    AND %s
                ORDER BY %s
                LIMIT $3
            )
        ) obj
        ORDER BY %s
        LIMIT $3
        $sql$,
        cursor_expr,    -- prefixes WHERE
        sort_expr,      -- prefixes ORDER BY
        cursor_expr,    -- objects WHERE
        sort_expr,      -- objects ORDER BY
        sort_expr       -- final ORDER BY
    )
    USING prefix, bucket_name, limits, levels, start_after, sort_column_after;
END;
$_$;


--
-- TOC entry 433 (class 1255 OID 17216)
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 324 (class 1259 OID 16525)
-- Name: audit_log_entries; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.audit_log_entries (
    instance_id uuid,
    id uuid NOT NULL,
    payload json,
    created_at timestamp with time zone,
    ip_address character varying(64) DEFAULT ''::character varying NOT NULL
);


--
-- TOC entry 4519 (class 0 OID 0)
-- Dependencies: 324
-- Name: TABLE audit_log_entries; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.audit_log_entries IS 'Auth: Audit trail for user actions.';


--
-- TOC entry 338 (class 1259 OID 16883)
-- Name: flow_state; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.flow_state (
    id uuid NOT NULL,
    user_id uuid,
    auth_code text,
    code_challenge_method auth.code_challenge_method,
    code_challenge text,
    provider_type text NOT NULL,
    provider_access_token text,
    provider_refresh_token text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    authentication_method text NOT NULL,
    auth_code_issued_at timestamp with time zone,
    invite_token text,
    referrer text,
    oauth_client_state_id uuid,
    linking_target_id uuid,
    email_optional boolean DEFAULT false NOT NULL
);


--
-- TOC entry 4520 (class 0 OID 0)
-- Dependencies: 338
-- Name: TABLE flow_state; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.flow_state IS 'Stores metadata for all OAuth/SSO login flows';


--
-- TOC entry 329 (class 1259 OID 16681)
-- Name: identities; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.identities (
    provider_id text NOT NULL,
    user_id uuid NOT NULL,
    identity_data jsonb NOT NULL,
    provider text NOT NULL,
    last_sign_in_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    email text GENERATED ALWAYS AS (lower((identity_data ->> 'email'::text))) STORED,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- TOC entry 4521 (class 0 OID 0)
-- Dependencies: 329
-- Name: TABLE identities; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.identities IS 'Auth: Stores identities associated to a user.';


--
-- TOC entry 4522 (class 0 OID 0)
-- Dependencies: 329
-- Name: COLUMN identities.email; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.identities.email IS 'Auth: Email is a generated column that references the optional email property in the identity_data';


--
-- TOC entry 323 (class 1259 OID 16518)
-- Name: instances; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.instances (
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- TOC entry 4523 (class 0 OID 0)
-- Dependencies: 323
-- Name: TABLE instances; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.instances IS 'Auth: Manages users across multiple sites.';


--
-- TOC entry 333 (class 1259 OID 16770)
-- Name: mfa_amr_claims; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_amr_claims (
    session_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    authentication_method text NOT NULL,
    id uuid NOT NULL
);


--
-- TOC entry 4524 (class 0 OID 0)
-- Dependencies: 333
-- Name: TABLE mfa_amr_claims; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_amr_claims IS 'auth: stores authenticator method reference claims for multi factor authentication';


--
-- TOC entry 332 (class 1259 OID 16758)
-- Name: mfa_challenges; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_challenges (
    id uuid NOT NULL,
    factor_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    ip_address inet NOT NULL,
    otp_code text,
    web_authn_session_data jsonb
);


--
-- TOC entry 4525 (class 0 OID 0)
-- Dependencies: 332
-- Name: TABLE mfa_challenges; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_challenges IS 'auth: stores metadata about challenge requests made';


--
-- TOC entry 331 (class 1259 OID 16745)
-- Name: mfa_factors; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_factors (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    friendly_name text,
    factor_type auth.factor_type NOT NULL,
    status auth.factor_status NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    secret text,
    phone text,
    last_challenged_at timestamp with time zone,
    web_authn_credential jsonb,
    web_authn_aaguid uuid,
    last_webauthn_challenge_data jsonb
);


--
-- TOC entry 4526 (class 0 OID 0)
-- Dependencies: 331
-- Name: TABLE mfa_factors; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_factors IS 'auth: stores metadata about factors';


--
-- TOC entry 4527 (class 0 OID 0)
-- Dependencies: 331
-- Name: COLUMN mfa_factors.last_webauthn_challenge_data; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.mfa_factors.last_webauthn_challenge_data IS 'Stores the latest WebAuthn challenge data including attestation/assertion for customer verification';


--
-- TOC entry 341 (class 1259 OID 16995)
-- Name: oauth_authorizations; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_authorizations (
    id uuid NOT NULL,
    authorization_id text NOT NULL,
    client_id uuid NOT NULL,
    user_id uuid,
    redirect_uri text NOT NULL,
    scope text NOT NULL,
    state text,
    resource text,
    code_challenge text,
    code_challenge_method auth.code_challenge_method,
    response_type auth.oauth_response_type DEFAULT 'code'::auth.oauth_response_type NOT NULL,
    status auth.oauth_authorization_status DEFAULT 'pending'::auth.oauth_authorization_status NOT NULL,
    authorization_code text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '00:03:00'::interval) NOT NULL,
    approved_at timestamp with time zone,
    nonce text,
    CONSTRAINT oauth_authorizations_authorization_code_length CHECK ((char_length(authorization_code) <= 255)),
    CONSTRAINT oauth_authorizations_code_challenge_length CHECK ((char_length(code_challenge) <= 128)),
    CONSTRAINT oauth_authorizations_expires_at_future CHECK ((expires_at > created_at)),
    CONSTRAINT oauth_authorizations_nonce_length CHECK ((char_length(nonce) <= 255)),
    CONSTRAINT oauth_authorizations_redirect_uri_length CHECK ((char_length(redirect_uri) <= 2048)),
    CONSTRAINT oauth_authorizations_resource_length CHECK ((char_length(resource) <= 2048)),
    CONSTRAINT oauth_authorizations_scope_length CHECK ((char_length(scope) <= 4096)),
    CONSTRAINT oauth_authorizations_state_length CHECK ((char_length(state) <= 4096))
);


--
-- TOC entry 343 (class 1259 OID 17068)
-- Name: oauth_client_states; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_client_states (
    id uuid NOT NULL,
    provider_type text NOT NULL,
    code_verifier text,
    created_at timestamp with time zone NOT NULL
);


--
-- TOC entry 4528 (class 0 OID 0)
-- Dependencies: 343
-- Name: TABLE oauth_client_states; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.oauth_client_states IS 'Stores OAuth states for third-party provider authentication flows where Supabase acts as the OAuth client.';


--
-- TOC entry 340 (class 1259 OID 16965)
-- Name: oauth_clients; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_clients (
    id uuid NOT NULL,
    client_secret_hash text,
    registration_type auth.oauth_registration_type NOT NULL,
    redirect_uris text NOT NULL,
    grant_types text NOT NULL,
    client_name text,
    client_uri text,
    logo_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    client_type auth.oauth_client_type DEFAULT 'confidential'::auth.oauth_client_type NOT NULL,
    token_endpoint_auth_method text NOT NULL,
    CONSTRAINT oauth_clients_client_name_length CHECK ((char_length(client_name) <= 1024)),
    CONSTRAINT oauth_clients_client_uri_length CHECK ((char_length(client_uri) <= 2048)),
    CONSTRAINT oauth_clients_logo_uri_length CHECK ((char_length(logo_uri) <= 2048)),
    CONSTRAINT oauth_clients_token_endpoint_auth_method_check CHECK ((token_endpoint_auth_method = ANY (ARRAY['client_secret_basic'::text, 'client_secret_post'::text, 'none'::text])))
);


--
-- TOC entry 342 (class 1259 OID 17028)
-- Name: oauth_consents; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_consents (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    client_id uuid NOT NULL,
    scopes text NOT NULL,
    granted_at timestamp with time zone DEFAULT now() NOT NULL,
    revoked_at timestamp with time zone,
    CONSTRAINT oauth_consents_revoked_after_granted CHECK (((revoked_at IS NULL) OR (revoked_at >= granted_at))),
    CONSTRAINT oauth_consents_scopes_length CHECK ((char_length(scopes) <= 2048)),
    CONSTRAINT oauth_consents_scopes_not_empty CHECK ((char_length(TRIM(BOTH FROM scopes)) > 0))
);


--
-- TOC entry 339 (class 1259 OID 16933)
-- Name: one_time_tokens; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.one_time_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_type auth.one_time_token_type NOT NULL,
    token_hash text NOT NULL,
    relates_to text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT one_time_tokens_token_hash_check CHECK ((char_length(token_hash) > 0))
);


--
-- TOC entry 322 (class 1259 OID 16507)
-- Name: refresh_tokens; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.refresh_tokens (
    instance_id uuid,
    id bigint NOT NULL,
    token character varying(255),
    user_id character varying(255),
    revoked boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    parent character varying(255),
    session_id uuid
);


--
-- TOC entry 4529 (class 0 OID 0)
-- Dependencies: 322
-- Name: TABLE refresh_tokens; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.refresh_tokens IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';


--
-- TOC entry 321 (class 1259 OID 16506)
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: auth; Owner: -
--

CREATE SEQUENCE auth.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4530 (class 0 OID 0)
-- Dependencies: 321
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: -
--

ALTER SEQUENCE auth.refresh_tokens_id_seq OWNED BY auth.refresh_tokens.id;


--
-- TOC entry 336 (class 1259 OID 16812)
-- Name: saml_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.saml_providers (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    entity_id text NOT NULL,
    metadata_xml text NOT NULL,
    metadata_url text,
    attribute_mapping jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    name_id_format text,
    CONSTRAINT "entity_id not empty" CHECK ((char_length(entity_id) > 0)),
    CONSTRAINT "metadata_url not empty" CHECK (((metadata_url = NULL::text) OR (char_length(metadata_url) > 0))),
    CONSTRAINT "metadata_xml not empty" CHECK ((char_length(metadata_xml) > 0))
);


--
-- TOC entry 4531 (class 0 OID 0)
-- Dependencies: 336
-- Name: TABLE saml_providers; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.saml_providers IS 'Auth: Manages SAML Identity Provider connections.';


--
-- TOC entry 337 (class 1259 OID 16830)
-- Name: saml_relay_states; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.saml_relay_states (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    request_id text NOT NULL,
    for_email text,
    redirect_to text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    flow_state_id uuid,
    CONSTRAINT "request_id not empty" CHECK ((char_length(request_id) > 0))
);


--
-- TOC entry 4532 (class 0 OID 0)
-- Dependencies: 337
-- Name: TABLE saml_relay_states; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.saml_relay_states IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';


--
-- TOC entry 325 (class 1259 OID 16533)
-- Name: schema_migrations; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.schema_migrations (
    version character varying(255) NOT NULL
);


--
-- TOC entry 4533 (class 0 OID 0)
-- Dependencies: 325
-- Name: TABLE schema_migrations; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.schema_migrations IS 'Auth: Manages updates to the auth system.';


--
-- TOC entry 330 (class 1259 OID 16711)
-- Name: sessions; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    factor_id uuid,
    aal auth.aal_level,
    not_after timestamp with time zone,
    refreshed_at timestamp without time zone,
    user_agent text,
    ip inet,
    tag text,
    oauth_client_id uuid,
    refresh_token_hmac_key text,
    refresh_token_counter bigint,
    scopes text,
    CONSTRAINT sessions_scopes_length CHECK ((char_length(scopes) <= 4096))
);


--
-- TOC entry 4534 (class 0 OID 0)
-- Dependencies: 330
-- Name: TABLE sessions; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sessions IS 'Auth: Stores session data associated to a user.';


--
-- TOC entry 4535 (class 0 OID 0)
-- Dependencies: 330
-- Name: COLUMN sessions.not_after; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.not_after IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';


--
-- TOC entry 4536 (class 0 OID 0)
-- Dependencies: 330
-- Name: COLUMN sessions.refresh_token_hmac_key; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.refresh_token_hmac_key IS 'Holds a HMAC-SHA256 key used to sign refresh tokens for this session.';


--
-- TOC entry 4537 (class 0 OID 0)
-- Dependencies: 330
-- Name: COLUMN sessions.refresh_token_counter; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.refresh_token_counter IS 'Holds the ID (counter) of the last issued refresh token.';


--
-- TOC entry 335 (class 1259 OID 16797)
-- Name: sso_domains; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sso_domains (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    domain text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK ((char_length(domain) > 0))
);


--
-- TOC entry 4538 (class 0 OID 0)
-- Dependencies: 335
-- Name: TABLE sso_domains; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sso_domains IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';


--
-- TOC entry 334 (class 1259 OID 16788)
-- Name: sso_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sso_providers (
    id uuid NOT NULL,
    resource_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    disabled boolean,
    CONSTRAINT "resource_id not empty" CHECK (((resource_id = NULL::text) OR (char_length(resource_id) > 0)))
);


--
-- TOC entry 4539 (class 0 OID 0)
-- Dependencies: 334
-- Name: TABLE sso_providers; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sso_providers IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';


--
-- TOC entry 4540 (class 0 OID 0)
-- Dependencies: 334
-- Name: COLUMN sso_providers.resource_id; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sso_providers.resource_id IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';


--
-- TOC entry 320 (class 1259 OID 16495)
-- Name: users; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.users (
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone text DEFAULT NULL::character varying,
    phone_confirmed_at timestamp with time zone,
    phone_change text DEFAULT ''::character varying,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying(255) DEFAULT ''::character varying,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    is_anonymous boolean DEFAULT false NOT NULL,
    CONSTRAINT users_email_change_confirm_status_check CHECK (((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2)))
);


--
-- TOC entry 4541 (class 0 OID 0)
-- Dependencies: 320
-- Name: TABLE users; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.users IS 'Auth: Stores user login data within a secure schema.';


--
-- TOC entry 4542 (class 0 OID 0)
-- Dependencies: 320
-- Name: COLUMN users.is_sso_user; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.users.is_sso_user IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';


--
-- TOC entry 382 (class 1259 OID 32832)
-- Name: dd_admin_flags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dd_admin_flags (
    id boolean DEFAULT true NOT NULL,
    pause_all boolean DEFAULT false NOT NULL,
    pause_reserve boolean DEFAULT false NOT NULL,
    pause_stats_ingest boolean DEFAULT false NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by text
);


--
-- TOC entry 391 (class 1259 OID 41471)
-- Name: dd_airdrop_wallets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dd_airdrop_wallets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    address text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    source text DEFAULT 'usddd_scan'::text NOT NULL,
    ip_hash text,
    user_agent text
);


--
-- TOC entry 377 (class 1259 OID 26834)
-- Name: dd_box_ledger; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dd_box_ledger (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    box_id text NOT NULL,
    entry_type text NOT NULL,
    amount numeric NOT NULL,
    chain_id text,
    token_address text,
    tx_hash text,
    meta jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 376 (class 1259 OID 26810)
-- Name: dd_boxes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dd_boxes (
    id text NOT NULL,
    owner_username text DEFAULT 'system'::text NOT NULL,
    deploy_chain_id text NOT NULL,
    deploy_fee_native_symbol text DEFAULT 'NATIVE'::text NOT NULL,
    deploy_fee_native_amount numeric DEFAULT 0 NOT NULL,
    token_address text,
    token_symbol text,
    token_decimals integer,
    token_chain_id text,
    meta jsonb DEFAULT '{}'::jsonb NOT NULL,
    cost_usddd numeric DEFAULT 0 NOT NULL,
    cooldown_hours numeric DEFAULT 0 NOT NULL,
    reward_mode text DEFAULT 'RANDOM'::text NOT NULL,
    fixed_reward numeric DEFAULT 0 NOT NULL,
    random_min numeric DEFAULT 0 NOT NULL,
    random_max numeric DEFAULT 0 NOT NULL,
    max_digs_per_user integer,
    stage text DEFAULT 'CONFIGURED'::text NOT NULL,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 385 (class 1259 OID 35196)
-- Name: dd_box_accounting; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.dd_box_accounting WITH (security_invoker='true') AS
 SELECT b.id AS box_id,
    COALESCE(sum(
        CASE
            WHEN (l.entry_type = ANY (ARRAY['fund_in'::text, 'adjust'::text])) THEN l.amount
            ELSE (0)::numeric
        END), (0)::numeric) AS deposited_total,
    COALESCE(sum(
        CASE
            WHEN (l.entry_type = 'withdraw_out'::text) THEN l.amount
            ELSE (0)::numeric
        END), (0)::numeric) AS withdrawn_total,
    COALESCE(sum(
        CASE
            WHEN (l.entry_type = 'claim_reserve'::text) THEN l.amount
            ELSE (0)::numeric
        END), (0)::numeric) AS claimed_unwithdrawn
   FROM (public.dd_boxes b
     LEFT JOIN public.dd_box_ledger l ON ((l.box_id = b.id)))
  GROUP BY b.id;


--
-- TOC entry 378 (class 1259 OID 26851)
-- Name: dd_box_dig_gate; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dd_box_dig_gate (
    box_id text NOT NULL,
    user_id uuid NOT NULL,
    count integer DEFAULT 0 NOT NULL,
    last_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 363 (class 1259 OID 19758)
-- Name: dd_install_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dd_install_sessions (
    install_id text NOT NULL,
    user_id uuid NOT NULL,
    username text NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 362 (class 1259 OID 19749)
-- Name: dd_installs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dd_installs (
    install_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    last_seen_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 379 (class 1259 OID 29267)
-- Name: dd_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dd_sessions (
    session_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    install_id text,
    user_id uuid,
    username text,
    source text DEFAULT 'terminal'::text NOT NULL
);


--
-- TOC entry 361 (class 1259 OID 19737)
-- Name: dd_terminal_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dd_terminal_users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    username text NOT NULL,
    pass_hash text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    twofa_enabled boolean DEFAULT false NOT NULL,
    twofa_seed text
);


--
-- TOC entry 366 (class 1259 OID 19817)
-- Name: dd_tg_chats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dd_tg_chats (
    chat_id bigint NOT NULL,
    chat_type text NOT NULL,
    title text,
    username text,
    last_seen_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 375 (class 1259 OID 21013)
-- Name: dd_tg_golden_claims; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dd_tg_golden_claims (
    id bigint NOT NULL,
    golden_event_id bigint NOT NULL,
    tg_user_id bigint NOT NULL,
    terminal_user_id uuid NOT NULL,
    claimed_at timestamp with time zone DEFAULT now() NOT NULL,
    payout_usdt_bep20 text,
    group_chat_id text,
    paid_at timestamp with time zone,
    paid_tx_hash text,
    paid_by_tg_user_id bigint
);


--
-- TOC entry 374 (class 1259 OID 21012)
-- Name: dd_tg_golden_claims_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.dd_tg_golden_claims_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4543 (class 0 OID 0)
-- Dependencies: 374
-- Name: dd_tg_golden_claims_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.dd_tg_golden_claims_id_seq OWNED BY public.dd_tg_golden_claims.id;


--
-- TOC entry 371 (class 1259 OID 19881)
-- Name: dd_tg_golden_daily; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dd_tg_golden_daily (
    day date NOT NULL,
    count integer DEFAULT 0 NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    last_golden_at timestamp with time zone,
    next_allowed_at timestamp with time zone
);


--
-- TOC entry 373 (class 1259 OID 20999)
-- Name: dd_tg_golden_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dd_tg_golden_events (
    id bigint NOT NULL,
    day date NOT NULL,
    claim_code text NOT NULL,
    terminal_user_id uuid NOT NULL,
    terminal_username text NOT NULL,
    tg_user_id bigint,
    token text NOT NULL,
    chain text NOT NULL,
    usd_value numeric NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    broadcasted_at timestamp with time zone
);


--
-- TOC entry 372 (class 1259 OID 20998)
-- Name: dd_tg_golden_events_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.dd_tg_golden_events_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4544 (class 0 OID 0)
-- Dependencies: 372
-- Name: dd_tg_golden_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.dd_tg_golden_events_id_seq OWNED BY public.dd_tg_golden_events.id;


--
-- TOC entry 370 (class 1259 OID 19852)
-- Name: dd_tg_pending_joins; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dd_tg_pending_joins (
    id bigint NOT NULL,
    group_chat_id bigint NOT NULL,
    tg_user_id bigint NOT NULL,
    joined_at timestamp with time zone DEFAULT now() NOT NULL,
    grace_expires_at timestamp with time zone NOT NULL,
    warned_at timestamp with time zone,
    checked_at timestamp with time zone,
    kicked_at timestamp with time zone,
    status text DEFAULT 'PENDING'::text NOT NULL,
    reminded_at timestamp with time zone
);


--
-- TOC entry 369 (class 1259 OID 19851)
-- Name: dd_tg_pending_joins_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.dd_tg_pending_joins_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4545 (class 0 OID 0)
-- Dependencies: 369
-- Name: dd_tg_pending_joins_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.dd_tg_pending_joins_id_seq OWNED BY public.dd_tg_pending_joins.id;


--
-- TOC entry 368 (class 1259 OID 19828)
-- Name: dd_tg_verify_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dd_tg_verify_codes (
    id bigint NOT NULL,
    tg_user_id bigint NOT NULL,
    code text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    used_at timestamp with time zone,
    terminal_user_id uuid
);


--
-- TOC entry 367 (class 1259 OID 19827)
-- Name: dd_tg_verify_codes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.dd_tg_verify_codes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4546 (class 0 OID 0)
-- Dependencies: 367
-- Name: dd_tg_verify_codes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.dd_tg_verify_codes_id_seq OWNED BY public.dd_tg_verify_codes.id;


--
-- TOC entry 390 (class 1259 OID 39126)
-- Name: dd_token_price_snapshots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dd_token_price_snapshots (
    id bigint NOT NULL,
    token_symbol text NOT NULL,
    chain_id text NOT NULL,
    price_usd numeric NOT NULL,
    source text DEFAULT 'cmc'::text NOT NULL,
    as_of timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 393 (class 1259 OID 41566)
-- Name: dd_token_price_snapshots_addr; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dd_token_price_snapshots_addr (
    id bigint NOT NULL,
    chain_id text NOT NULL,
    token_address text NOT NULL,
    price_usd numeric NOT NULL,
    source text DEFAULT 'cmc'::text NOT NULL,
    as_of timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 392 (class 1259 OID 41565)
-- Name: dd_token_price_snapshots_addr_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.dd_token_price_snapshots_addr_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4547 (class 0 OID 0)
-- Dependencies: 392
-- Name: dd_token_price_snapshots_addr_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.dd_token_price_snapshots_addr_id_seq OWNED BY public.dd_token_price_snapshots_addr.id;


--
-- TOC entry 389 (class 1259 OID 39125)
-- Name: dd_token_price_snapshots_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.dd_token_price_snapshots_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4548 (class 0 OID 0)
-- Dependencies: 389
-- Name: dd_token_price_snapshots_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.dd_token_price_snapshots_id_seq OWNED BY public.dd_token_price_snapshots.id;


--
-- TOC entry 365 (class 1259 OID 19793)
-- Name: dd_treasure_claims; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dd_treasure_claims (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    username text NOT NULL,
    box_id text NOT NULL,
    chain_id text NOT NULL,
    token_address text NOT NULL,
    token_symbol text NOT NULL,
    amount numeric NOT NULL,
    status text DEFAULT 'CLAIMED'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    withdrawn_at timestamp with time zone,
    dig_id text
);


--
-- TOC entry 387 (class 1259 OID 37869)
-- Name: dd_usddd_spend_ledger; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dd_usddd_spend_ledger (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    spend_key text NOT NULL,
    install_id text,
    terminal_user_id uuid,
    box_id text,
    spend_type text DEFAULT 'dig_success'::text NOT NULL,
    usddd_amount numeric NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    meta jsonb DEFAULT '{}'::jsonb NOT NULL,
    from_bucket text DEFAULT 'allocated'::text NOT NULL,
    allocated_debit numeric DEFAULT 0 NOT NULL,
    acquired_debit numeric DEFAULT 0 NOT NULL
);


--
-- TOC entry 388 (class 1259 OID 37903)
-- Name: dd_usddd_spend_ledger_legacy_archive; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dd_usddd_spend_ledger_legacy_archive (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    spend_key text NOT NULL,
    install_id text,
    terminal_user_id uuid,
    box_id text,
    spend_type text DEFAULT 'dig_success'::text NOT NULL,
    usddd_amount numeric NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    meta jsonb DEFAULT '{}'::jsonb NOT NULL,
    from_bucket text DEFAULT 'allocated'::text NOT NULL,
    allocated_debit numeric DEFAULT 0 NOT NULL,
    acquired_debit numeric DEFAULT 0 NOT NULL,
    archived_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 364 (class 1259 OID 19776)
-- Name: dd_user_state; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dd_user_state (
    user_id uuid NOT NULL,
    usddd_allocated numeric DEFAULT 10 NOT NULL,
    usddd_acquired numeric DEFAULT 0 NOT NULL,
    treasury_usddd numeric DEFAULT 0 NOT NULL,
    acquired_total numeric DEFAULT 0 NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    alloc_last_at timestamp with time zone,
    username text,
    digs_count integer DEFAULT 0 NOT NULL,
    finds_count integer DEFAULT 0 NOT NULL
);


--
-- TOC entry 381 (class 1259 OID 30463)
-- Name: fund_deposit_keys; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fund_deposit_keys (
    position_id uuid NOT NULL,
    enc_privkey text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 380 (class 1259 OID 30439)
-- Name: fund_positions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fund_positions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    position_ref text NOT NULL,
    issued_deposit_address text NOT NULL,
    chain text DEFAULT 'bsc'::text NOT NULL,
    token text DEFAULT 'usdt'::text NOT NULL,
    expected_min_usdt numeric NOT NULL,
    expected_max_usdt numeric NOT NULL,
    funded_usdt numeric DEFAULT 0,
    usddd_allocated numeric DEFAULT 0,
    usddd_accrued_display numeric DEFAULT 0,
    status text DEFAULT 'awaiting_funds'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    funded_at timestamp with time zone,
    locked boolean DEFAULT true NOT NULL,
    deposit_tx_hash text,
    treasury_sweep_tx_hash text,
    sweep_tx_hash text,
    swept_at timestamp with time zone,
    gas_topup_tx_hash text,
    gas_topup_bnb numeric DEFAULT 0,
    gas_topup_at timestamp with time zone,
    terminal_user_id uuid,
    usddd_mint_tx_hash text,
    usddd_minted_at timestamp with time zone,
    usddd_transfer_tx_hash text,
    usddd_transferred_at timestamp with time zone,
    usddd_accrual_started_at timestamp with time zone,
    usddd_burn_tx_hash text,
    usddd_burned_at timestamp with time zone
);


--
-- TOC entry 360 (class 1259 OID 17485)
-- Name: stats_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stats_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    install_id text NOT NULL,
    event text NOT NULL,
    box_id text,
    chain text,
    token_symbol text,
    usddd_cost numeric,
    reward_amount numeric,
    priced boolean,
    created_at timestamp with time zone DEFAULT now(),
    reward_price_usd numeric,
    reward_value_usd numeric,
    terminal_user_id uuid
);


--
-- TOC entry 386 (class 1259 OID 36721)
-- Name: stats_events_rollup_1m; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stats_events_rollup_1m (
    bucket_minute timestamp with time zone NOT NULL,
    dig_success_count bigint NOT NULL,
    usddd_spent numeric NOT NULL,
    reward_usd numeric NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 356 (class 1259 OID 17389)
-- Name: messages; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
)
PARTITION BY RANGE (inserted_at);


--
-- TOC entry 344 (class 1259 OID 17076)
-- Name: schema_migrations; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone
);


--
-- TOC entry 347 (class 1259 OID 17099)
-- Name: subscription; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.subscription (
    id bigint NOT NULL,
    subscription_id uuid NOT NULL,
    entity regclass NOT NULL,
    filters realtime.user_defined_filter[] DEFAULT '{}'::realtime.user_defined_filter[] NOT NULL,
    claims jsonb NOT NULL,
    claims_role regrole GENERATED ALWAYS AS (realtime.to_regrole((claims ->> 'role'::text))) STORED NOT NULL,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    action_filter text DEFAULT '*'::text,
    CONSTRAINT subscription_action_filter_check CHECK ((action_filter = ANY (ARRAY['*'::text, 'INSERT'::text, 'UPDATE'::text, 'DELETE'::text])))
);


--
-- TOC entry 346 (class 1259 OID 17098)
-- Name: subscription_id_seq; Type: SEQUENCE; Schema: realtime; Owner: -
--

ALTER TABLE realtime.subscription ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME realtime.subscription_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 350 (class 1259 OID 17167)
-- Name: buckets; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets (
    id text NOT NULL,
    name text NOT NULL,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[],
    owner_id text,
    type storage.buckettype DEFAULT 'STANDARD'::storage.buckettype NOT NULL
);


--
-- TOC entry 4549 (class 0 OID 0)
-- Dependencies: 350
-- Name: COLUMN buckets.owner; Type: COMMENT; Schema: storage; Owner: -
--

COMMENT ON COLUMN storage.buckets.owner IS 'Field is deprecated, use owner_id instead';


--
-- TOC entry 357 (class 1259 OID 17422)
-- Name: buckets_analytics; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets_analytics (
    name text NOT NULL,
    type storage.buckettype DEFAULT 'ANALYTICS'::storage.buckettype NOT NULL,
    format text DEFAULT 'ICEBERG'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    deleted_at timestamp with time zone
);


--
-- TOC entry 358 (class 1259 OID 17449)
-- Name: buckets_vectors; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets_vectors (
    id text NOT NULL,
    type storage.buckettype DEFAULT 'VECTOR'::storage.buckettype NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 349 (class 1259 OID 17159)
-- Name: migrations; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.migrations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    hash character varying(40) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 351 (class 1259 OID 17177)
-- Name: objects; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.objects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone DEFAULT now(),
    metadata jsonb,
    path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/'::text)) STORED,
    version text,
    owner_id text,
    user_metadata jsonb,
    level integer
);


--
-- TOC entry 4550 (class 0 OID 0)
-- Dependencies: 351
-- Name: COLUMN objects.owner; Type: COMMENT; Schema: storage; Owner: -
--

COMMENT ON COLUMN storage.objects.owner IS 'Field is deprecated, use owner_id instead';


--
-- TOC entry 355 (class 1259 OID 17293)
-- Name: prefixes; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.prefixes (
    bucket_id text NOT NULL,
    name text NOT NULL COLLATE pg_catalog."C",
    level integer GENERATED ALWAYS AS (storage.get_level(name)) STORED NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- TOC entry 353 (class 1259 OID 17238)
-- Name: s3_multipart_uploads; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.s3_multipart_uploads (
    id text NOT NULL,
    in_progress_size bigint DEFAULT 0 NOT NULL,
    upload_signature text NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    version text NOT NULL,
    owner_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_metadata jsonb
);


--
-- TOC entry 354 (class 1259 OID 17252)
-- Name: s3_multipart_uploads_parts; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.s3_multipart_uploads_parts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    upload_id text NOT NULL,
    size bigint DEFAULT 0 NOT NULL,
    part_number integer NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    etag text NOT NULL,
    owner_id text,
    version text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 359 (class 1259 OID 17459)
-- Name: vector_indexes; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.vector_indexes (
    id text DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL COLLATE pg_catalog."C",
    bucket_id text NOT NULL,
    data_type text NOT NULL,
    dimension integer NOT NULL,
    distance_metric text NOT NULL,
    metadata_configuration jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 3802 (class 2604 OID 16510)
-- Name: refresh_tokens id; Type: DEFAULT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass);


--
-- TOC entry 3889 (class 2604 OID 21016)
-- Name: dd_tg_golden_claims id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dd_tg_golden_claims ALTER COLUMN id SET DEFAULT nextval('public.dd_tg_golden_claims_id_seq'::regclass);


--
-- TOC entry 3887 (class 2604 OID 21002)
-- Name: dd_tg_golden_events id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dd_tg_golden_events ALTER COLUMN id SET DEFAULT nextval('public.dd_tg_golden_events_id_seq'::regclass);


--
-- TOC entry 3882 (class 2604 OID 19855)
-- Name: dd_tg_pending_joins id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dd_tg_pending_joins ALTER COLUMN id SET DEFAULT nextval('public.dd_tg_pending_joins_id_seq'::regclass);


--
-- TOC entry 3880 (class 2604 OID 19831)
-- Name: dd_tg_verify_codes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dd_tg_verify_codes ALTER COLUMN id SET DEFAULT nextval('public.dd_tg_verify_codes_id_seq'::regclass);


--
-- TOC entry 3943 (class 2604 OID 39129)
-- Name: dd_token_price_snapshots id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dd_token_price_snapshots ALTER COLUMN id SET DEFAULT nextval('public.dd_token_price_snapshots_id_seq'::regclass);


--
-- TOC entry 3949 (class 2604 OID 41569)
-- Name: dd_token_price_snapshots_addr id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dd_token_price_snapshots_addr ALTER COLUMN id SET DEFAULT nextval('public.dd_token_price_snapshots_addr_id_seq'::regclass);


--
-- TOC entry 4033 (class 2606 OID 16783)
-- Name: mfa_amr_claims amr_id_pk; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT amr_id_pk PRIMARY KEY (id);


--
-- TOC entry 4002 (class 2606 OID 16531)
-- Name: audit_log_entries audit_log_entries_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.audit_log_entries
    ADD CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id);


--
-- TOC entry 4056 (class 2606 OID 16889)
-- Name: flow_state flow_state_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.flow_state
    ADD CONSTRAINT flow_state_pkey PRIMARY KEY (id);


--
-- TOC entry 4011 (class 2606 OID 16907)
-- Name: identities identities_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_pkey PRIMARY KEY (id);


--
-- TOC entry 4013 (class 2606 OID 16917)
-- Name: identities identities_provider_id_provider_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_provider_id_provider_unique UNIQUE (provider_id, provider);


--
-- TOC entry 4000 (class 2606 OID 16524)
-- Name: instances instances_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.instances
    ADD CONSTRAINT instances_pkey PRIMARY KEY (id);


--
-- TOC entry 4035 (class 2606 OID 16776)
-- Name: mfa_amr_claims mfa_amr_claims_session_id_authentication_method_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_authentication_method_pkey UNIQUE (session_id, authentication_method);


--
-- TOC entry 4031 (class 2606 OID 16764)
-- Name: mfa_challenges mfa_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_pkey PRIMARY KEY (id);


--
-- TOC entry 4023 (class 2606 OID 16957)
-- Name: mfa_factors mfa_factors_last_challenged_at_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_last_challenged_at_key UNIQUE (last_challenged_at);


--
-- TOC entry 4025 (class 2606 OID 16751)
-- Name: mfa_factors mfa_factors_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_pkey PRIMARY KEY (id);


--
-- TOC entry 4069 (class 2606 OID 17016)
-- Name: oauth_authorizations oauth_authorizations_authorization_code_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_code_key UNIQUE (authorization_code);


--
-- TOC entry 4071 (class 2606 OID 17014)
-- Name: oauth_authorizations oauth_authorizations_authorization_id_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_id_key UNIQUE (authorization_id);


--
-- TOC entry 4073 (class 2606 OID 17012)
-- Name: oauth_authorizations oauth_authorizations_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_pkey PRIMARY KEY (id);


--
-- TOC entry 4083 (class 2606 OID 17074)
-- Name: oauth_client_states oauth_client_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_client_states
    ADD CONSTRAINT oauth_client_states_pkey PRIMARY KEY (id);


--
-- TOC entry 4066 (class 2606 OID 16976)
-- Name: oauth_clients oauth_clients_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_clients
    ADD CONSTRAINT oauth_clients_pkey PRIMARY KEY (id);


--
-- TOC entry 4077 (class 2606 OID 17038)
-- Name: oauth_consents oauth_consents_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_pkey PRIMARY KEY (id);


--
-- TOC entry 4079 (class 2606 OID 17040)
-- Name: oauth_consents oauth_consents_user_client_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_client_unique UNIQUE (user_id, client_id);


--
-- TOC entry 4060 (class 2606 OID 16942)
-- Name: one_time_tokens one_time_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_pkey PRIMARY KEY (id);


--
-- TOC entry 3994 (class 2606 OID 16514)
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- TOC entry 3997 (class 2606 OID 16694)
-- Name: refresh_tokens refresh_tokens_token_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_unique UNIQUE (token);


--
-- TOC entry 4045 (class 2606 OID 16823)
-- Name: saml_providers saml_providers_entity_id_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_entity_id_key UNIQUE (entity_id);


--
-- TOC entry 4047 (class 2606 OID 16821)
-- Name: saml_providers saml_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_pkey PRIMARY KEY (id);


--
-- TOC entry 4052 (class 2606 OID 16837)
-- Name: saml_relay_states saml_relay_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_pkey PRIMARY KEY (id);


--
-- TOC entry 4005 (class 2606 OID 16537)
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- TOC entry 4018 (class 2606 OID 16715)
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- TOC entry 4042 (class 2606 OID 16804)
-- Name: sso_domains sso_domains_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_pkey PRIMARY KEY (id);


--
-- TOC entry 4037 (class 2606 OID 16795)
-- Name: sso_providers sso_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_providers
    ADD CONSTRAINT sso_providers_pkey PRIMARY KEY (id);


--
-- TOC entry 3987 (class 2606 OID 16877)
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- TOC entry 3989 (class 2606 OID 16501)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4227 (class 2606 OID 32843)
-- Name: dd_admin_flags dd_admin_flags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dd_admin_flags
    ADD CONSTRAINT dd_admin_flags_pkey PRIMARY KEY (id);


--
-- TOC entry 4255 (class 2606 OID 41480)
-- Name: dd_airdrop_wallets dd_airdrop_wallets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dd_airdrop_wallets
    ADD CONSTRAINT dd_airdrop_wallets_pkey PRIMARY KEY (id);


--
-- TOC entry 4207 (class 2606 OID 26859)
-- Name: dd_box_dig_gate dd_box_dig_gate_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dd_box_dig_gate
    ADD CONSTRAINT dd_box_dig_gate_pkey PRIMARY KEY (box_id, user_id);


--
-- TOC entry 4202 (class 2606 OID 26842)
-- Name: dd_box_ledger dd_box_ledger_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dd_box_ledger
    ADD CONSTRAINT dd_box_ledger_pkey PRIMARY KEY (id);


--
-- TOC entry 4195 (class 2606 OID 26830)
-- Name: dd_boxes dd_boxes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dd_boxes
    ADD CONSTRAINT dd_boxes_pkey PRIMARY KEY (id);


--
-- TOC entry 4142 (class 2606 OID 19765)
-- Name: dd_install_sessions dd_install_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dd_install_sessions
    ADD CONSTRAINT dd_install_sessions_pkey PRIMARY KEY (install_id);


--
-- TOC entry 4140 (class 2606 OID 19757)
-- Name: dd_installs dd_installs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dd_installs
    ADD CONSTRAINT dd_installs_pkey PRIMARY KEY (install_id);


--
-- TOC entry 4212 (class 2606 OID 29275)
-- Name: dd_sessions dd_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dd_sessions
    ADD CONSTRAINT dd_sessions_pkey PRIMARY KEY (session_id);


--
-- TOC entry 4136 (class 2606 OID 19746)
-- Name: dd_terminal_users dd_terminal_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dd_terminal_users
    ADD CONSTRAINT dd_terminal_users_pkey PRIMARY KEY (id);


--
-- TOC entry 4138 (class 2606 OID 19748)
-- Name: dd_terminal_users dd_terminal_users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dd_terminal_users
    ADD CONSTRAINT dd_terminal_users_username_key UNIQUE (username);


--
-- TOC entry 4162 (class 2606 OID 19825)
-- Name: dd_tg_chats dd_tg_chats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dd_tg_chats
    ADD CONSTRAINT dd_tg_chats_pkey PRIMARY KEY (chat_id);


--
-- TOC entry 4186 (class 2606 OID 21021)
-- Name: dd_tg_golden_claims dd_tg_golden_claims_golden_event_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dd_tg_golden_claims
    ADD CONSTRAINT dd_tg_golden_claims_golden_event_id_key UNIQUE (golden_event_id);


--
-- TOC entry 4189 (class 2606 OID 21019)
-- Name: dd_tg_golden_claims dd_tg_golden_claims_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dd_tg_golden_claims
    ADD CONSTRAINT dd_tg_golden_claims_pkey PRIMARY KEY (id);


--
-- TOC entry 4176 (class 2606 OID 19887)
-- Name: dd_tg_golden_daily dd_tg_golden_daily_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dd_tg_golden_daily
    ADD CONSTRAINT dd_tg_golden_daily_pkey PRIMARY KEY (day);


--
-- TOC entry 4178 (class 2606 OID 21009)
-- Name: dd_tg_golden_events dd_tg_golden_events_claim_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dd_tg_golden_events
    ADD CONSTRAINT dd_tg_golden_events_claim_code_key UNIQUE (claim_code);


--
-- TOC entry 4182 (class 2606 OID 21007)
-- Name: dd_tg_golden_events dd_tg_golden_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dd_tg_golden_events
    ADD CONSTRAINT dd_tg_golden_events_pkey PRIMARY KEY (id);


--
-- TOC entry 4173 (class 2606 OID 19861)
-- Name: dd_tg_pending_joins dd_tg_pending_joins_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dd_tg_pending_joins
    ADD CONSTRAINT dd_tg_pending_joins_pkey PRIMARY KEY (id);


--
-- TOC entry 4164 (class 2606 OID 19838)
-- Name: dd_tg_verify_codes dd_tg_verify_codes_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dd_tg_verify_codes
    ADD CONSTRAINT dd_tg_verify_codes_code_key UNIQUE (code);


--
-- TOC entry 4167 (class 2606 OID 19836)
-- Name: dd_tg_verify_codes dd_tg_verify_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dd_tg_verify_codes
    ADD CONSTRAINT dd_tg_verify_codes_pkey PRIMARY KEY (id);


--
-- TOC entry 4258 (class 2606 OID 41575)
-- Name: dd_token_price_snapshots_addr dd_token_price_snapshots_addr_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dd_token_price_snapshots_addr
    ADD CONSTRAINT dd_token_price_snapshots_addr_pkey PRIMARY KEY (id);


--
-- TOC entry 4251 (class 2606 OID 39135)
-- Name: dd_token_price_snapshots dd_token_price_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dd_token_price_snapshots
    ADD CONSTRAINT dd_token_price_snapshots_pkey PRIMARY KEY (id);


--
-- TOC entry 4151 (class 2606 OID 19802)
-- Name: dd_treasure_claims dd_treasure_claims_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dd_treasure_claims
    ADD CONSTRAINT dd_treasure_claims_pkey PRIMARY KEY (id);


--
-- TOC entry 4244 (class 2606 OID 37916)
-- Name: dd_usddd_spend_ledger_legacy_archive dd_usddd_spend_ledger_legacy_archive_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dd_usddd_spend_ledger_legacy_archive
    ADD CONSTRAINT dd_usddd_spend_ledger_legacy_archive_pkey PRIMARY KEY (id);


--
-- TOC entry 4247 (class 2606 OID 37918)
-- Name: dd_usddd_spend_ledger_legacy_archive dd_usddd_spend_ledger_legacy_archive_spend_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dd_usddd_spend_ledger_legacy_archive
    ADD CONSTRAINT dd_usddd_spend_ledger_legacy_archive_spend_key_key UNIQUE (spend_key);


--
-- TOC entry 4235 (class 2606 OID 37879)
-- Name: dd_usddd_spend_ledger dd_usddd_spend_ledger_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dd_usddd_spend_ledger
    ADD CONSTRAINT dd_usddd_spend_ledger_pkey PRIMARY KEY (id);


--
-- TOC entry 4237 (class 2606 OID 37881)
-- Name: dd_usddd_spend_ledger dd_usddd_spend_ledger_spend_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dd_usddd_spend_ledger
    ADD CONSTRAINT dd_usddd_spend_ledger_spend_key_key UNIQUE (spend_key);


--
-- TOC entry 4144 (class 2606 OID 19787)
-- Name: dd_user_state dd_user_state_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dd_user_state
    ADD CONSTRAINT dd_user_state_pkey PRIMARY KEY (user_id);


--
-- TOC entry 4225 (class 2606 OID 30470)
-- Name: fund_deposit_keys fund_deposit_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fund_deposit_keys
    ADD CONSTRAINT fund_deposit_keys_pkey PRIMARY KEY (position_id);


--
-- TOC entry 4219 (class 2606 OID 30454)
-- Name: fund_positions fund_positions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fund_positions
    ADD CONSTRAINT fund_positions_pkey PRIMARY KEY (id);


--
-- TOC entry 4221 (class 2606 OID 30456)
-- Name: fund_positions fund_positions_position_ref_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fund_positions
    ADD CONSTRAINT fund_positions_position_ref_key UNIQUE (position_ref);


--
-- TOC entry 4133 (class 2606 OID 17493)
-- Name: stats_events stats_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stats_events
    ADD CONSTRAINT stats_events_pkey PRIMARY KEY (id);


--
-- TOC entry 4229 (class 2606 OID 36728)
-- Name: stats_events_rollup_1m stats_events_rollup_1m_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stats_events_rollup_1m
    ADD CONSTRAINT stats_events_rollup_1m_pkey PRIMARY KEY (bucket_minute);


--
-- TOC entry 4115 (class 2606 OID 17403)
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id, inserted_at);


--
-- TOC entry 4088 (class 2606 OID 17107)
-- Name: subscription pk_subscription; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.subscription
    ADD CONSTRAINT pk_subscription PRIMARY KEY (id);


--
-- TOC entry 4085 (class 2606 OID 17080)
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- TOC entry 4117 (class 2606 OID 17482)
-- Name: buckets_analytics buckets_analytics_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets_analytics
    ADD CONSTRAINT buckets_analytics_pkey PRIMARY KEY (id);


--
-- TOC entry 4096 (class 2606 OID 17175)
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets
    ADD CONSTRAINT buckets_pkey PRIMARY KEY (id);


--
-- TOC entry 4120 (class 2606 OID 17458)
-- Name: buckets_vectors buckets_vectors_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets_vectors
    ADD CONSTRAINT buckets_vectors_pkey PRIMARY KEY (id);


--
-- TOC entry 4091 (class 2606 OID 17166)
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);


--
-- TOC entry 4093 (class 2606 OID 17164)
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- TOC entry 4104 (class 2606 OID 17187)
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY (id);


--
-- TOC entry 4112 (class 2606 OID 17302)
-- Name: prefixes prefixes_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.prefixes
    ADD CONSTRAINT prefixes_pkey PRIMARY KEY (bucket_id, level, name);


--
-- TOC entry 4109 (class 2606 OID 17261)
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_pkey PRIMARY KEY (id);


--
-- TOC entry 4107 (class 2606 OID 17246)
-- Name: s3_multipart_uploads s3_multipart_uploads_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_pkey PRIMARY KEY (id);


--
-- TOC entry 4123 (class 2606 OID 17468)
-- Name: vector_indexes vector_indexes_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_pkey PRIMARY KEY (id);


--
-- TOC entry 4003 (class 1259 OID 16532)
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);


--
-- TOC entry 3977 (class 1259 OID 16704)
-- Name: confirmation_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text);


--
-- TOC entry 3978 (class 1259 OID 16706)
-- Name: email_change_token_current_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text);


--
-- TOC entry 3979 (class 1259 OID 16707)
-- Name: email_change_token_new_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text);


--
-- TOC entry 4021 (class 1259 OID 16785)
-- Name: factor_id_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at);


--
-- TOC entry 4054 (class 1259 OID 16893)
-- Name: flow_state_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC);


--
-- TOC entry 4009 (class 1259 OID 16873)
-- Name: identities_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops);


--
-- TOC entry 4551 (class 0 OID 0)
-- Dependencies: 4009
-- Name: INDEX identities_email_idx; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON INDEX auth.identities_email_idx IS 'Auth: Ensures indexed queries on the email column';


--
-- TOC entry 4014 (class 1259 OID 16701)
-- Name: identities_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id);


--
-- TOC entry 4057 (class 1259 OID 16890)
-- Name: idx_auth_code; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code);


--
-- TOC entry 4081 (class 1259 OID 17075)
-- Name: idx_oauth_client_states_created_at; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_oauth_client_states_created_at ON auth.oauth_client_states USING btree (created_at);


--
-- TOC entry 4058 (class 1259 OID 16891)
-- Name: idx_user_id_auth_method; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method);


--
-- TOC entry 4029 (class 1259 OID 16896)
-- Name: mfa_challenge_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC);


--
-- TOC entry 4026 (class 1259 OID 16757)
-- Name: mfa_factors_user_friendly_name_unique; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text);


--
-- TOC entry 4027 (class 1259 OID 16902)
-- Name: mfa_factors_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id);


--
-- TOC entry 4067 (class 1259 OID 17027)
-- Name: oauth_auth_pending_exp_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_auth_pending_exp_idx ON auth.oauth_authorizations USING btree (expires_at) WHERE (status = 'pending'::auth.oauth_authorization_status);


--
-- TOC entry 4064 (class 1259 OID 16980)
-- Name: oauth_clients_deleted_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_clients_deleted_at_idx ON auth.oauth_clients USING btree (deleted_at);


--
-- TOC entry 4074 (class 1259 OID 17053)
-- Name: oauth_consents_active_client_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_consents_active_client_idx ON auth.oauth_consents USING btree (client_id) WHERE (revoked_at IS NULL);


--
-- TOC entry 4075 (class 1259 OID 17051)
-- Name: oauth_consents_active_user_client_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_consents_active_user_client_idx ON auth.oauth_consents USING btree (user_id, client_id) WHERE (revoked_at IS NULL);


--
-- TOC entry 4080 (class 1259 OID 17052)
-- Name: oauth_consents_user_order_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_consents_user_order_idx ON auth.oauth_consents USING btree (user_id, granted_at DESC);


--
-- TOC entry 4061 (class 1259 OID 16949)
-- Name: one_time_tokens_relates_to_hash_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to);


--
-- TOC entry 4062 (class 1259 OID 16948)
-- Name: one_time_tokens_token_hash_hash_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash);


--
-- TOC entry 4063 (class 1259 OID 16950)
-- Name: one_time_tokens_user_id_token_type_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type);


--
-- TOC entry 3980 (class 1259 OID 16708)
-- Name: reauthentication_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text);


--
-- TOC entry 3981 (class 1259 OID 16705)
-- Name: recovery_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text);


--
-- TOC entry 3990 (class 1259 OID 16515)
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);


--
-- TOC entry 3991 (class 1259 OID 16516)
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);


--
-- TOC entry 3992 (class 1259 OID 16700)
-- Name: refresh_tokens_parent_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent);


--
-- TOC entry 3995 (class 1259 OID 16787)
-- Name: refresh_tokens_session_id_revoked_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked);


--
-- TOC entry 3998 (class 1259 OID 16892)
-- Name: refresh_tokens_updated_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC);


--
-- TOC entry 4048 (class 1259 OID 16829)
-- Name: saml_providers_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id);


--
-- TOC entry 4049 (class 1259 OID 16894)
-- Name: saml_relay_states_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC);


--
-- TOC entry 4050 (class 1259 OID 16844)
-- Name: saml_relay_states_for_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email);


--
-- TOC entry 4053 (class 1259 OID 16843)
-- Name: saml_relay_states_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id);


--
-- TOC entry 4015 (class 1259 OID 16895)
-- Name: sessions_not_after_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC);


--
-- TOC entry 4016 (class 1259 OID 17065)
-- Name: sessions_oauth_client_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_oauth_client_id_idx ON auth.sessions USING btree (oauth_client_id);


--
-- TOC entry 4019 (class 1259 OID 16786)
-- Name: sessions_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id);


--
-- TOC entry 4040 (class 1259 OID 16811)
-- Name: sso_domains_domain_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain));


--
-- TOC entry 4043 (class 1259 OID 16810)
-- Name: sso_domains_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id);


--
-- TOC entry 4038 (class 1259 OID 16796)
-- Name: sso_providers_resource_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id));


--
-- TOC entry 4039 (class 1259 OID 16958)
-- Name: sso_providers_resource_id_pattern_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sso_providers_resource_id_pattern_idx ON auth.sso_providers USING btree (resource_id text_pattern_ops);


--
-- TOC entry 4028 (class 1259 OID 16955)
-- Name: unique_phone_factor_per_user; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone);


--
-- TOC entry 4020 (class 1259 OID 16784)
-- Name: user_id_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at);


--
-- TOC entry 3982 (class 1259 OID 16864)
-- Name: users_email_partial_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false);


--
-- TOC entry 4552 (class 0 OID 0)
-- Dependencies: 3982
-- Name: INDEX users_email_partial_key; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON INDEX auth.users_email_partial_key IS 'Auth: A partial unique index that applies only when is_sso_user is false';


--
-- TOC entry 3983 (class 1259 OID 16702)
-- Name: users_instance_id_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text));


--
-- TOC entry 3984 (class 1259 OID 16505)
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);


--
-- TOC entry 3985 (class 1259 OID 16919)
-- Name: users_is_anonymous_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous);


--
-- TOC entry 4252 (class 1259 OID 41481)
-- Name: dd_airdrop_wallets_address_uniq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX dd_airdrop_wallets_address_uniq ON public.dd_airdrop_wallets USING btree (lower(address));


--
-- TOC entry 4253 (class 1259 OID 41482)
-- Name: dd_airdrop_wallets_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dd_airdrop_wallets_created_at_idx ON public.dd_airdrop_wallets USING btree (created_at DESC);


--
-- TOC entry 4208 (class 1259 OID 26870)
-- Name: dd_box_dig_gate_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dd_box_dig_gate_user_idx ON public.dd_box_dig_gate USING btree (user_id);


--
-- TOC entry 4197 (class 1259 OID 26848)
-- Name: dd_box_ledger_box_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dd_box_ledger_box_id_idx ON public.dd_box_ledger USING btree (box_id);


--
-- TOC entry 4198 (class 1259 OID 32887)
-- Name: dd_box_ledger_box_type_chain_token_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dd_box_ledger_box_type_chain_token_idx ON public.dd_box_ledger USING btree (box_id, entry_type, chain_id, token_address);


--
-- TOC entry 4199 (class 1259 OID 36649)
-- Name: dd_box_ledger_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dd_box_ledger_created_at_idx ON public.dd_box_ledger USING btree (created_at DESC);


--
-- TOC entry 4200 (class 1259 OID 26850)
-- Name: dd_box_ledger_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dd_box_ledger_created_idx ON public.dd_box_ledger USING btree (created_at);


--
-- TOC entry 4203 (class 1259 OID 41439)
-- Name: dd_box_ledger_reserve_box_dig_uniq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX dd_box_ledger_reserve_box_dig_uniq ON public.dd_box_ledger USING btree (box_id, ((meta ->> 'dig_id'::text))) WHERE ((entry_type = 'claim_reserve'::text) AND (meta ? 'dig_id'::text));


--
-- TOC entry 4204 (class 1259 OID 26849)
-- Name: dd_box_ledger_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dd_box_ledger_type_idx ON public.dd_box_ledger USING btree (entry_type);


--
-- TOC entry 4192 (class 1259 OID 26833)
-- Name: dd_boxes_deploy_chain_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dd_boxes_deploy_chain_idx ON public.dd_boxes USING btree (deploy_chain_id);


--
-- TOC entry 4193 (class 1259 OID 26832)
-- Name: dd_boxes_owner_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dd_boxes_owner_idx ON public.dd_boxes USING btree (owner_username);


--
-- TOC entry 4196 (class 1259 OID 26831)
-- Name: dd_boxes_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dd_boxes_status_idx ON public.dd_boxes USING btree (status);


--
-- TOC entry 4209 (class 1259 OID 29276)
-- Name: dd_sessions_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dd_sessions_created_at_idx ON public.dd_sessions USING btree (created_at DESC);


--
-- TOC entry 4210 (class 1259 OID 29277)
-- Name: dd_sessions_install_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dd_sessions_install_id_idx ON public.dd_sessions USING btree (install_id);


--
-- TOC entry 4213 (class 1259 OID 29278)
-- Name: dd_sessions_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dd_sessions_user_id_idx ON public.dd_sessions USING btree (user_id);


--
-- TOC entry 4134 (class 1259 OID 36740)
-- Name: dd_terminal_users_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dd_terminal_users_created_at_idx ON public.dd_terminal_users USING btree (created_at);


--
-- TOC entry 4160 (class 1259 OID 19826)
-- Name: dd_tg_chats_last_seen_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dd_tg_chats_last_seen_idx ON public.dd_tg_chats USING btree (last_seen_at DESC);


--
-- TOC entry 4184 (class 1259 OID 36667)
-- Name: dd_tg_golden_claims_claimed_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dd_tg_golden_claims_claimed_at_idx ON public.dd_tg_golden_claims USING btree (claimed_at DESC);


--
-- TOC entry 4187 (class 1259 OID 21037)
-- Name: dd_tg_golden_claims_payout_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dd_tg_golden_claims_payout_idx ON public.dd_tg_golden_claims USING btree (payout_usdt_bep20);


--
-- TOC entry 4190 (class 1259 OID 21027)
-- Name: dd_tg_golden_claims_tg_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dd_tg_golden_claims_tg_user_idx ON public.dd_tg_golden_claims USING btree (tg_user_id);


--
-- TOC entry 4179 (class 1259 OID 36739)
-- Name: dd_tg_golden_events_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dd_tg_golden_events_created_at_idx ON public.dd_tg_golden_events USING btree (created_at);


--
-- TOC entry 4180 (class 1259 OID 21010)
-- Name: dd_tg_golden_events_day_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dd_tg_golden_events_day_idx ON public.dd_tg_golden_events USING btree (day);


--
-- TOC entry 4183 (class 1259 OID 21011)
-- Name: dd_tg_golden_events_terminal_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dd_tg_golden_events_terminal_user_idx ON public.dd_tg_golden_events USING btree (terminal_user_id);


--
-- TOC entry 4170 (class 1259 OID 19863)
-- Name: dd_tg_pending_joins_grace_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dd_tg_pending_joins_grace_idx ON public.dd_tg_pending_joins USING btree (grace_expires_at);


--
-- TOC entry 4171 (class 1259 OID 19862)
-- Name: dd_tg_pending_joins_lookup_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dd_tg_pending_joins_lookup_idx ON public.dd_tg_pending_joins USING btree (group_chat_id, tg_user_id);


--
-- TOC entry 4174 (class 1259 OID 19864)
-- Name: dd_tg_pending_joins_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dd_tg_pending_joins_status_idx ON public.dd_tg_pending_joins USING btree (status);


--
-- TOC entry 4165 (class 1259 OID 19840)
-- Name: dd_tg_verify_codes_expires_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dd_tg_verify_codes_expires_at_idx ON public.dd_tg_verify_codes USING btree (expires_at);


--
-- TOC entry 4168 (class 1259 OID 19839)
-- Name: dd_tg_verify_codes_tg_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dd_tg_verify_codes_tg_user_id_idx ON public.dd_tg_verify_codes USING btree (tg_user_id);


--
-- TOC entry 4169 (class 1259 OID 19841)
-- Name: dd_tg_verify_codes_used_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dd_tg_verify_codes_used_at_idx ON public.dd_tg_verify_codes USING btree (used_at);


--
-- TOC entry 4256 (class 1259 OID 41576)
-- Name: dd_token_price_snapshots_addr_lookup; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dd_token_price_snapshots_addr_lookup ON public.dd_token_price_snapshots_addr USING btree (chain_id, token_address, as_of DESC);


--
-- TOC entry 4249 (class 1259 OID 39136)
-- Name: dd_token_price_snapshots_lookup; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dd_token_price_snapshots_lookup ON public.dd_token_price_snapshots USING btree (token_symbol, chain_id, as_of DESC);


--
-- TOC entry 4146 (class 1259 OID 41435)
-- Name: dd_treasure_claims_box_dig_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dd_treasure_claims_box_dig_id_idx ON public.dd_treasure_claims USING btree (box_id, dig_id);


--
-- TOC entry 4147 (class 1259 OID 41440)
-- Name: dd_treasure_claims_box_dig_uniq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX dd_treasure_claims_box_dig_uniq ON public.dd_treasure_claims USING btree (box_id, dig_id) WHERE (dig_id IS NOT NULL);


--
-- TOC entry 4148 (class 1259 OID 32850)
-- Name: dd_treasure_claims_created_at_desc_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dd_treasure_claims_created_at_desc_idx ON public.dd_treasure_claims USING btree (created_at DESC);


--
-- TOC entry 4149 (class 1259 OID 36663)
-- Name: dd_treasure_claims_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dd_treasure_claims_created_at_idx ON public.dd_treasure_claims USING btree (created_at DESC);


--
-- TOC entry 4152 (class 1259 OID 32889)
-- Name: dd_treasure_claims_status_created_desc_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dd_treasure_claims_status_created_desc_idx ON public.dd_treasure_claims USING btree (status, created_at DESC);


--
-- TOC entry 4153 (class 1259 OID 36737)
-- Name: dd_treasure_claims_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dd_treasure_claims_status_idx ON public.dd_treasure_claims USING btree (status);


--
-- TOC entry 4154 (class 1259 OID 41436)
-- Name: dd_treasure_claims_user_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dd_treasure_claims_user_created_idx ON public.dd_treasure_claims USING btree (user_id, created_at DESC);


--
-- TOC entry 4155 (class 1259 OID 36738)
-- Name: dd_treasure_claims_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dd_treasure_claims_user_id_idx ON public.dd_treasure_claims USING btree (user_id);


--
-- TOC entry 4156 (class 1259 OID 19808)
-- Name: dd_treasure_claims_user_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dd_treasure_claims_user_status_idx ON public.dd_treasure_claims USING btree (user_id, status, created_at DESC);


--
-- TOC entry 4157 (class 1259 OID 35202)
-- Name: dd_treasure_claims_username_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dd_treasure_claims_username_idx ON public.dd_treasure_claims USING btree (username);


--
-- TOC entry 4158 (class 1259 OID 36736)
-- Name: dd_treasure_claims_withdrawn_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dd_treasure_claims_withdrawn_at_idx ON public.dd_treasure_claims USING btree (withdrawn_at);


--
-- TOC entry 4230 (class 1259 OID 37883)
-- Name: dd_usddd_spend_ledger_box_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dd_usddd_spend_ledger_box_id_idx ON public.dd_usddd_spend_ledger USING btree (box_id);


--
-- TOC entry 4231 (class 1259 OID 37882)
-- Name: dd_usddd_spend_ledger_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dd_usddd_spend_ledger_created_at_idx ON public.dd_usddd_spend_ledger USING btree (created_at);


--
-- TOC entry 4232 (class 1259 OID 37945)
-- Name: dd_usddd_spend_ledger_created_at_spend_key_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dd_usddd_spend_ledger_created_at_spend_key_idx ON public.dd_usddd_spend_ledger USING btree (created_at, spend_key);


--
-- TOC entry 4233 (class 1259 OID 37893)
-- Name: dd_usddd_spend_ledger_from_bucket_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dd_usddd_spend_ledger_from_bucket_idx ON public.dd_usddd_spend_ledger USING btree (from_bucket);


--
-- TOC entry 4240 (class 1259 OID 37920)
-- Name: dd_usddd_spend_ledger_legacy_archive_box_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dd_usddd_spend_ledger_legacy_archive_box_id_idx ON public.dd_usddd_spend_ledger_legacy_archive USING btree (box_id);


--
-- TOC entry 4241 (class 1259 OID 37919)
-- Name: dd_usddd_spend_ledger_legacy_archive_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dd_usddd_spend_ledger_legacy_archive_created_at_idx ON public.dd_usddd_spend_ledger_legacy_archive USING btree (created_at);


--
-- TOC entry 4242 (class 1259 OID 37922)
-- Name: dd_usddd_spend_ledger_legacy_archive_from_bucket_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dd_usddd_spend_ledger_legacy_archive_from_bucket_idx ON public.dd_usddd_spend_ledger_legacy_archive USING btree (from_bucket);


--
-- TOC entry 4245 (class 1259 OID 37923)
-- Name: dd_usddd_spend_ledger_legacy_archive_spend_key_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dd_usddd_spend_ledger_legacy_archive_spend_key_created_at_idx ON public.dd_usddd_spend_ledger_legacy_archive USING btree (spend_key, created_at);


--
-- TOC entry 4248 (class 1259 OID 37921)
-- Name: dd_usddd_spend_ledger_legacy_archive_terminal_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dd_usddd_spend_ledger_legacy_archive_terminal_user_id_idx ON public.dd_usddd_spend_ledger_legacy_archive USING btree (terminal_user_id);


--
-- TOC entry 4238 (class 1259 OID 37899)
-- Name: dd_usddd_spend_ledger_spendkey_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dd_usddd_spend_ledger_spendkey_created_at_idx ON public.dd_usddd_spend_ledger USING btree (spend_key, created_at);


--
-- TOC entry 4239 (class 1259 OID 37884)
-- Name: dd_usddd_spend_ledger_terminal_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dd_usddd_spend_ledger_terminal_user_id_idx ON public.dd_usddd_spend_ledger USING btree (terminal_user_id);


--
-- TOC entry 4145 (class 1259 OID 34057)
-- Name: dd_user_state_username_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dd_user_state_username_idx ON public.dd_user_state USING btree (username);


--
-- TOC entry 4215 (class 1259 OID 30459)
-- Name: fund_positions_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX fund_positions_created_at_idx ON public.fund_positions USING btree (created_at);


--
-- TOC entry 4216 (class 1259 OID 31620)
-- Name: fund_positions_gas_topup_tx_hash_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX fund_positions_gas_topup_tx_hash_idx ON public.fund_positions USING btree (gas_topup_tx_hash);


--
-- TOC entry 4217 (class 1259 OID 30457)
-- Name: fund_positions_issued_deposit_address_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX fund_positions_issued_deposit_address_idx ON public.fund_positions USING btree (issued_deposit_address);


--
-- TOC entry 4222 (class 1259 OID 30458)
-- Name: fund_positions_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX fund_positions_status_idx ON public.fund_positions USING btree (status);


--
-- TOC entry 4223 (class 1259 OID 31630)
-- Name: fund_positions_terminal_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX fund_positions_terminal_user_id_idx ON public.fund_positions USING btree (terminal_user_id);


--
-- TOC entry 4205 (class 1259 OID 35234)
-- Name: idx_dd_box_ledger_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dd_box_ledger_created_at ON public.dd_box_ledger USING btree (created_at DESC);


--
-- TOC entry 4214 (class 1259 OID 35236)
-- Name: idx_dd_sessions_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dd_sessions_created_at ON public.dd_sessions USING btree (created_at DESC);


--
-- TOC entry 4191 (class 1259 OID 35235)
-- Name: idx_dd_tg_golden_claims_claimed_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dd_tg_golden_claims_claimed_at ON public.dd_tg_golden_claims USING btree (claimed_at DESC);


--
-- TOC entry 4159 (class 1259 OID 35233)
-- Name: idx_dd_treasure_claims_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dd_treasure_claims_created_at ON public.dd_treasure_claims USING btree (created_at DESC);


--
-- TOC entry 4124 (class 1259 OID 35232)
-- Name: idx_stats_events_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stats_events_created_at ON public.stats_events USING btree (created_at DESC);


--
-- TOC entry 4125 (class 1259 OID 35231)
-- Name: idx_stats_events_event_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stats_events_event_created_at ON public.stats_events USING btree (event, created_at DESC);


--
-- TOC entry 4126 (class 1259 OID 37885)
-- Name: stats_events_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX stats_events_created_at_idx ON public.stats_events USING btree (created_at);


--
-- TOC entry 4127 (class 1259 OID 34056)
-- Name: stats_events_dig_success_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX stats_events_dig_success_user_idx ON public.stats_events USING btree (terminal_user_id, created_at) WHERE ((event = 'dig_success'::text) AND (terminal_user_id IS NOT NULL));


--
-- TOC entry 4128 (class 1259 OID 32885)
-- Name: stats_events_event_created_at_desc_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX stats_events_event_created_at_desc_idx ON public.stats_events USING btree (event, created_at DESC);


--
-- TOC entry 4129 (class 1259 OID 32886)
-- Name: stats_events_event_created_at_desc_install_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX stats_events_event_created_at_desc_install_idx ON public.stats_events USING btree (event, created_at DESC, install_id);


--
-- TOC entry 4130 (class 1259 OID 36646)
-- Name: stats_events_event_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX stats_events_event_created_at_idx ON public.stats_events USING btree (event, created_at DESC);


--
-- TOC entry 4131 (class 1259 OID 35201)
-- Name: stats_events_install_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX stats_events_install_id_idx ON public.stats_events USING btree (install_id);


--
-- TOC entry 4086 (class 1259 OID 17404)
-- Name: ix_realtime_subscription_entity; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX ix_realtime_subscription_entity ON realtime.subscription USING btree (entity);


--
-- TOC entry 4113 (class 1259 OID 17405)
-- Name: messages_inserted_at_topic_index; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX messages_inserted_at_topic_index ON ONLY realtime.messages USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- TOC entry 4089 (class 1259 OID 40313)
-- Name: subscription_subscription_id_entity_filters_action_filter_key; Type: INDEX; Schema: realtime; Owner: -
--

CREATE UNIQUE INDEX subscription_subscription_id_entity_filters_action_filter_key ON realtime.subscription USING btree (subscription_id, entity, filters, action_filter);


--
-- TOC entry 4094 (class 1259 OID 17176)
-- Name: bname; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name);


--
-- TOC entry 4097 (class 1259 OID 17193)
-- Name: bucketid_objname; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX bucketid_objname ON storage.objects USING btree (bucket_id, name);


--
-- TOC entry 4118 (class 1259 OID 17483)
-- Name: buckets_analytics_unique_name_idx; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX buckets_analytics_unique_name_idx ON storage.buckets_analytics USING btree (name) WHERE (deleted_at IS NULL);


--
-- TOC entry 4105 (class 1259 OID 17272)
-- Name: idx_multipart_uploads_list; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at);


--
-- TOC entry 4098 (class 1259 OID 17322)
-- Name: idx_name_bucket_level_unique; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX idx_name_bucket_level_unique ON storage.objects USING btree (name COLLATE "C", bucket_id, level);


--
-- TOC entry 4099 (class 1259 OID 17237)
-- Name: idx_objects_bucket_id_name; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C");


--
-- TOC entry 4100 (class 1259 OID 17407)
-- Name: idx_objects_lower_name; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_objects_lower_name ON storage.objects USING btree ((path_tokens[level]), lower(name) text_pattern_ops, bucket_id, level);


--
-- TOC entry 4110 (class 1259 OID 17408)
-- Name: idx_prefixes_lower_name; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_prefixes_lower_name ON storage.prefixes USING btree (bucket_id, level, ((string_to_array(name, '/'::text))[level]), lower(name) text_pattern_ops);


--
-- TOC entry 4101 (class 1259 OID 17194)
-- Name: name_prefix_search; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops);


--
-- TOC entry 4102 (class 1259 OID 17406)
-- Name: objects_bucket_id_level_idx; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX objects_bucket_id_level_idx ON storage.objects USING btree (bucket_id, level, name COLLATE "C");


--
-- TOC entry 4121 (class 1259 OID 17474)
-- Name: vector_indexes_name_bucket_id_idx; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX vector_indexes_name_bucket_id_idx ON storage.vector_indexes USING btree (name, bucket_id);


--
-- TOC entry 4300 (class 2620 OID 26877)
-- Name: dd_boxes dd_boxes_touch; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER dd_boxes_touch BEFORE UPDATE ON public.dd_boxes FOR EACH ROW EXECUTE FUNCTION public.dd_touch_updated_at();


--
-- TOC entry 4301 (class 2620 OID 32893)
-- Name: dd_box_ledger trg_enforce_box_ledger_pause; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_enforce_box_ledger_pause BEFORE INSERT ON public.dd_box_ledger FOR EACH ROW EXECUTE FUNCTION public.enforce_box_ledger_pause();


--
-- TOC entry 4298 (class 2620 OID 32891)
-- Name: stats_events trg_enforce_stats_events_pause; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_enforce_stats_events_pause BEFORE INSERT ON public.stats_events FOR EACH ROW EXECUTE FUNCTION public.enforce_stats_events_pause();


--
-- TOC entry 4299 (class 2620 OID 32895)
-- Name: dd_treasure_claims trg_enforce_treasure_claims_pause; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_enforce_treasure_claims_pause BEFORE INSERT ON public.dd_treasure_claims FOR EACH ROW EXECUTE FUNCTION public.enforce_treasure_claims_pause();


--
-- TOC entry 4290 (class 2620 OID 17112)
-- Name: subscription tr_check_filters; Type: TRIGGER; Schema: realtime; Owner: -
--

CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters();


--
-- TOC entry 4291 (class 2620 OID 17415)
-- Name: buckets enforce_bucket_name_length_trigger; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length();


--
-- TOC entry 4292 (class 2620 OID 17445)
-- Name: objects objects_delete_delete_prefix; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER objects_delete_delete_prefix AFTER DELETE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger();


--
-- TOC entry 4293 (class 2620 OID 17316)
-- Name: objects objects_insert_create_prefix; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER objects_insert_create_prefix BEFORE INSERT ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.objects_insert_prefix_trigger();


--
-- TOC entry 4294 (class 2620 OID 17444)
-- Name: objects objects_update_create_prefix; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER objects_update_create_prefix BEFORE UPDATE ON storage.objects FOR EACH ROW WHEN (((new.name <> old.name) OR (new.bucket_id <> old.bucket_id))) EXECUTE FUNCTION storage.objects_update_prefix_trigger();


--
-- TOC entry 4296 (class 2620 OID 17411)
-- Name: prefixes prefixes_create_hierarchy; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER prefixes_create_hierarchy BEFORE INSERT ON storage.prefixes FOR EACH ROW WHEN ((pg_trigger_depth() < 1)) EXECUTE FUNCTION storage.prefixes_insert_trigger();


--
-- TOC entry 4297 (class 2620 OID 17446)
-- Name: prefixes prefixes_delete_hierarchy; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER prefixes_delete_hierarchy AFTER DELETE ON storage.prefixes FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger();


--
-- TOC entry 4295 (class 2620 OID 17217)
-- Name: objects update_objects_updated_at; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();


--
-- TOC entry 4260 (class 2606 OID 16688)
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- TOC entry 4265 (class 2606 OID 16777)
-- Name: mfa_amr_claims mfa_amr_claims_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- TOC entry 4264 (class 2606 OID 16765)
-- Name: mfa_challenges mfa_challenges_auth_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;


--
-- TOC entry 4263 (class 2606 OID 16752)
-- Name: mfa_factors mfa_factors_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- TOC entry 4271 (class 2606 OID 17017)
-- Name: oauth_authorizations oauth_authorizations_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- TOC entry 4272 (class 2606 OID 17022)
-- Name: oauth_authorizations oauth_authorizations_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- TOC entry 4273 (class 2606 OID 17046)
-- Name: oauth_consents oauth_consents_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- TOC entry 4274 (class 2606 OID 17041)
-- Name: oauth_consents oauth_consents_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- TOC entry 4270 (class 2606 OID 16943)
-- Name: one_time_tokens one_time_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- TOC entry 4259 (class 2606 OID 16721)
-- Name: refresh_tokens refresh_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- TOC entry 4267 (class 2606 OID 16824)
-- Name: saml_providers saml_providers_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- TOC entry 4268 (class 2606 OID 16897)
-- Name: saml_relay_states saml_relay_states_flow_state_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id) ON DELETE CASCADE;


--
-- TOC entry 4269 (class 2606 OID 16838)
-- Name: saml_relay_states saml_relay_states_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- TOC entry 4261 (class 2606 OID 17060)
-- Name: sessions sessions_oauth_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_oauth_client_id_fkey FOREIGN KEY (oauth_client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- TOC entry 4262 (class 2606 OID 16716)
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- TOC entry 4266 (class 2606 OID 16805)
-- Name: sso_domains sso_domains_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- TOC entry 4287 (class 2606 OID 26860)
-- Name: dd_box_dig_gate dd_box_dig_gate_box_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dd_box_dig_gate
    ADD CONSTRAINT dd_box_dig_gate_box_id_fkey FOREIGN KEY (box_id) REFERENCES public.dd_boxes(id) ON DELETE CASCADE;


--
-- TOC entry 4288 (class 2606 OID 26865)
-- Name: dd_box_dig_gate dd_box_dig_gate_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dd_box_dig_gate
    ADD CONSTRAINT dd_box_dig_gate_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.dd_terminal_users(id) ON DELETE CASCADE;


--
-- TOC entry 4286 (class 2606 OID 26843)
-- Name: dd_box_ledger dd_box_ledger_box_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dd_box_ledger
    ADD CONSTRAINT dd_box_ledger_box_id_fkey FOREIGN KEY (box_id) REFERENCES public.dd_boxes(id) ON DELETE CASCADE;


--
-- TOC entry 4281 (class 2606 OID 19766)
-- Name: dd_install_sessions dd_install_sessions_install_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dd_install_sessions
    ADD CONSTRAINT dd_install_sessions_install_id_fkey FOREIGN KEY (install_id) REFERENCES public.dd_installs(install_id) ON DELETE CASCADE;


--
-- TOC entry 4282 (class 2606 OID 19771)
-- Name: dd_install_sessions dd_install_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dd_install_sessions
    ADD CONSTRAINT dd_install_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.dd_terminal_users(id) ON DELETE CASCADE;


--
-- TOC entry 4285 (class 2606 OID 21022)
-- Name: dd_tg_golden_claims dd_tg_golden_claims_golden_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dd_tg_golden_claims
    ADD CONSTRAINT dd_tg_golden_claims_golden_event_id_fkey FOREIGN KEY (golden_event_id) REFERENCES public.dd_tg_golden_events(id) ON DELETE CASCADE;


--
-- TOC entry 4284 (class 2606 OID 19803)
-- Name: dd_treasure_claims dd_treasure_claims_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dd_treasure_claims
    ADD CONSTRAINT dd_treasure_claims_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.dd_terminal_users(id) ON DELETE CASCADE;


--
-- TOC entry 4283 (class 2606 OID 19788)
-- Name: dd_user_state dd_user_state_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dd_user_state
    ADD CONSTRAINT dd_user_state_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.dd_terminal_users(id) ON DELETE CASCADE;


--
-- TOC entry 4289 (class 2606 OID 30471)
-- Name: fund_deposit_keys fund_deposit_keys_position_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fund_deposit_keys
    ADD CONSTRAINT fund_deposit_keys_position_id_fkey FOREIGN KEY (position_id) REFERENCES public.fund_positions(id) ON DELETE CASCADE;


--
-- TOC entry 4275 (class 2606 OID 17188)
-- Name: objects objects_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- TOC entry 4279 (class 2606 OID 17303)
-- Name: prefixes prefixes_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.prefixes
    ADD CONSTRAINT "prefixes_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- TOC entry 4276 (class 2606 OID 17247)
-- Name: s3_multipart_uploads s3_multipart_uploads_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- TOC entry 4277 (class 2606 OID 17267)
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- TOC entry 4278 (class 2606 OID 17262)
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_upload_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE;


--
-- TOC entry 4280 (class 2606 OID 17469)
-- Name: vector_indexes vector_indexes_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets_vectors(id);


--
-- TOC entry 4456 (class 0 OID 16525)
-- Dependencies: 324
-- Name: audit_log_entries; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.audit_log_entries ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4467 (class 0 OID 16883)
-- Dependencies: 338
-- Name: flow_state; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.flow_state ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4458 (class 0 OID 16681)
-- Dependencies: 329
-- Name: identities; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.identities ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4455 (class 0 OID 16518)
-- Dependencies: 323
-- Name: instances; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.instances ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4462 (class 0 OID 16770)
-- Dependencies: 333
-- Name: mfa_amr_claims; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_amr_claims ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4461 (class 0 OID 16758)
-- Dependencies: 332
-- Name: mfa_challenges; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_challenges ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4460 (class 0 OID 16745)
-- Dependencies: 331
-- Name: mfa_factors; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_factors ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4468 (class 0 OID 16933)
-- Dependencies: 339
-- Name: one_time_tokens; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.one_time_tokens ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4454 (class 0 OID 16507)
-- Dependencies: 322
-- Name: refresh_tokens; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.refresh_tokens ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4465 (class 0 OID 16812)
-- Dependencies: 336
-- Name: saml_providers; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.saml_providers ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4466 (class 0 OID 16830)
-- Dependencies: 337
-- Name: saml_relay_states; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.saml_relay_states ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4457 (class 0 OID 16533)
-- Dependencies: 325
-- Name: schema_migrations; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.schema_migrations ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4459 (class 0 OID 16711)
-- Dependencies: 330
-- Name: sessions; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4464 (class 0 OID 16797)
-- Dependencies: 335
-- Name: sso_domains; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sso_domains ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4463 (class 0 OID 16788)
-- Dependencies: 334
-- Name: sso_providers; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sso_providers ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4453 (class 0 OID 16495)
-- Dependencies: 320
-- Name: users; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4497 (class 0 OID 32832)
-- Dependencies: 382
-- Name: dd_admin_flags; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dd_admin_flags ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4498 (class 0 OID 41471)
-- Dependencies: 391
-- Name: dd_airdrop_wallets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dd_airdrop_wallets ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4493 (class 0 OID 26851)
-- Dependencies: 378
-- Name: dd_box_dig_gate; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dd_box_dig_gate ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4492 (class 0 OID 26834)
-- Dependencies: 377
-- Name: dd_box_ledger; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dd_box_ledger ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4491 (class 0 OID 26810)
-- Dependencies: 376
-- Name: dd_boxes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dd_boxes ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4482 (class 0 OID 19758)
-- Dependencies: 363
-- Name: dd_install_sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dd_install_sessions ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4481 (class 0 OID 19749)
-- Dependencies: 362
-- Name: dd_installs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dd_installs ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4494 (class 0 OID 29267)
-- Dependencies: 379
-- Name: dd_sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dd_sessions ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4480 (class 0 OID 19737)
-- Dependencies: 361
-- Name: dd_terminal_users; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dd_terminal_users ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4485 (class 0 OID 19817)
-- Dependencies: 366
-- Name: dd_tg_chats; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dd_tg_chats ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4490 (class 0 OID 21013)
-- Dependencies: 375
-- Name: dd_tg_golden_claims; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dd_tg_golden_claims ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4488 (class 0 OID 19881)
-- Dependencies: 371
-- Name: dd_tg_golden_daily; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dd_tg_golden_daily ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4489 (class 0 OID 20999)
-- Dependencies: 373
-- Name: dd_tg_golden_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dd_tg_golden_events ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4487 (class 0 OID 19852)
-- Dependencies: 370
-- Name: dd_tg_pending_joins; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dd_tg_pending_joins ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4486 (class 0 OID 19828)
-- Dependencies: 368
-- Name: dd_tg_verify_codes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dd_tg_verify_codes ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4484 (class 0 OID 19793)
-- Dependencies: 365
-- Name: dd_treasure_claims; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dd_treasure_claims ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4483 (class 0 OID 19776)
-- Dependencies: 364
-- Name: dd_user_state; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dd_user_state ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4496 (class 0 OID 30463)
-- Dependencies: 381
-- Name: fund_deposit_keys; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fund_deposit_keys ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4495 (class 0 OID 30439)
-- Dependencies: 380
-- Name: fund_positions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fund_positions ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4479 (class 0 OID 17485)
-- Dependencies: 360
-- Name: stats_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.stats_events ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4475 (class 0 OID 17389)
-- Dependencies: 356
-- Name: messages; Type: ROW SECURITY; Schema: realtime; Owner: -
--

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4470 (class 0 OID 17167)
-- Dependencies: 350
-- Name: buckets; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4476 (class 0 OID 17422)
-- Dependencies: 357
-- Name: buckets_analytics; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets_analytics ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4477 (class 0 OID 17449)
-- Dependencies: 358
-- Name: buckets_vectors; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets_vectors ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4469 (class 0 OID 17159)
-- Dependencies: 349
-- Name: migrations; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.migrations ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4471 (class 0 OID 17177)
-- Dependencies: 351
-- Name: objects; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4474 (class 0 OID 17293)
-- Dependencies: 355
-- Name: prefixes; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.prefixes ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4472 (class 0 OID 17238)
-- Dependencies: 353
-- Name: s3_multipart_uploads; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4473 (class 0 OID 17252)
-- Dependencies: 354
-- Name: s3_multipart_uploads_parts; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads_parts ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4478 (class 0 OID 17459)
-- Dependencies: 359
-- Name: vector_indexes; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.vector_indexes ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4499 (class 6104 OID 16426)
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: -
--

CREATE PUBLICATION supabase_realtime WITH (publish = 'insert, update, delete, truncate');


--
-- TOC entry 3785 (class 3466 OID 16571)
-- Name: issue_graphql_placeholder; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_graphql_placeholder ON sql_drop
         WHEN TAG IN ('DROP EXTENSION')
   EXECUTE FUNCTION extensions.set_graphql_placeholder();


--
-- TOC entry 3790 (class 3466 OID 16650)
-- Name: issue_pg_cron_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_cron_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_cron_access();


--
-- TOC entry 3784 (class 3466 OID 16569)
-- Name: issue_pg_graphql_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_graphql_access ON ddl_command_end
         WHEN TAG IN ('CREATE FUNCTION')
   EXECUTE FUNCTION extensions.grant_pg_graphql_access();


--
-- TOC entry 3791 (class 3466 OID 16653)
-- Name: issue_pg_net_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_net_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_net_access();


--
-- TOC entry 3786 (class 3466 OID 16572)
-- Name: pgrst_ddl_watch; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER pgrst_ddl_watch ON ddl_command_end
   EXECUTE FUNCTION extensions.pgrst_ddl_watch();


--
-- TOC entry 3787 (class 3466 OID 16573)
-- Name: pgrst_drop_watch; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER pgrst_drop_watch ON sql_drop
   EXECUTE FUNCTION extensions.pgrst_drop_watch();


-- Completed on 2026-02-05 19:00:18

--
-- PostgreSQL database dump complete
--

\unrestrict Av4poa6FavdFVJd1ydO2f8StBS4xP7gcCrWPwWp9be1EjLwkuhNS7aaAD2VXfI8

