-- ManoAmiga · esquema inicial
-- pg_trgm acelera las búsquedas por nombre/ciudad con ILIKE '%texto%'.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ── Usuarios ────────────────────────────────────────────────────────────────
-- El uso de la app es anónimo. Los usuarios sólo existen para que alguien
-- pueda administrar (editar/cerrar/eliminar) sus propias publicaciones.
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  name          TEXT,
  password_hash TEXT,
  google_sub    TEXT UNIQUE,
  role          TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Reportes ────────────────────────────────────────────────────────────────
-- Una sola tabla para los cuatro formularios (persona/mascota ×
-- desaparecida/encontrada). Simplifica el listado, el buscador y los filtros.
CREATE TABLE IF NOT EXISTS reports (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  kind               TEXT NOT NULL CHECK (kind IN ('person', 'pet')),
  status             TEXT NOT NULL CHECK (status IN ('missing', 'found')),

  -- Datos comunes
  name               TEXT,
  description        TEXT,
  photo_url          TEXT,
  photo_public_id    TEXT,

  -- Ubicación
  city               TEXT NOT NULL,
  neighborhood       TEXT,
  location_detail    TEXT,        -- última ubicación conocida / lugar donde fue encontrada
  event_at           TIMESTAMPTZ, -- fecha y hora de la desaparición o del hallazgo

  -- Específicos de persona
  approx_age         INTEGER CHECK (approx_age IS NULL OR (approx_age >= 0 AND approx_age <= 120)),
  clothing           TEXT,
  health_status      TEXT,

  -- Específicos de mascota
  species            TEXT,
  color              TEXT,

  -- Contacto de quien reporta
  contact_name       TEXT NOT NULL,
  contact_email      TEXT,
  contact_phone      TEXT,

  -- Ciclo de vida y moderación
  user_id            UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at        TIMESTAMPTZ,
  is_hidden          BOOLEAN NOT NULL DEFAULT FALSE,

  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Debe existir al menos una forma de contactar a quien publica
  CONSTRAINT reports_contact_required CHECK (contact_email IS NOT NULL OR contact_phone IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS reports_created_at_idx  ON reports (created_at DESC);
CREATE INDEX IF NOT EXISTS reports_kind_status_idx ON reports (kind, status);
CREATE INDEX IF NOT EXISTS reports_user_idx        ON reports (user_id);
CREATE INDEX IF NOT EXISTS reports_name_trgm_idx   ON reports USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS reports_city_trgm_idx   ON reports USING GIN (city gin_trgm_ops);

-- ── Muro comunitario ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS community_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city        TEXT NOT NULL,
  author_name TEXT,
  category    TEXT NOT NULL DEFAULT 'info'
                CHECK (category IN ('water', 'food', 'shelter', 'medical', 'volunteers', 'transport', 'info')),
  content     TEXT NOT NULL,
  contact     TEXT,
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  is_hidden   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS community_created_at_idx ON community_messages (created_at DESC);
CREATE INDEX IF NOT EXISTS community_city_idx       ON community_messages (lower(city));
CREATE INDEX IF NOT EXISTS community_category_idx   ON community_messages (category);

-- ── updated_at automático ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_set_updated_at ON users;
CREATE TRIGGER users_set_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS reports_set_updated_at ON reports;
CREATE TRIGGER reports_set_updated_at BEFORE UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
