-- Ensure role & database exist (idempotent)
DO $$
BEGIN
	IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'baruser') THEN
		CREATE USER baruser WITH PASSWORD 'barpass';
	END IF;

	IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'barapp_db') THEN
		CREATE DATABASE barapp_db OWNER baruser;
	END IF;
END
$$;

