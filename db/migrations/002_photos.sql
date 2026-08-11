-- Almacenamiento de fotos en la propia base de datos.
--
-- Es el respaldo para cuando no hay credenciales de Cloudinary: así la app
-- nunca se queda sin fotos, que en la búsqueda de una persona son lo que más
-- ayuda a reconocerla. El navegador ya comprime la imagen antes de subirla
-- (máx. 1280 px, JPEG), así que cada foto ronda los 150-300 KB.
CREATE TABLE IF NOT EXISTS photos (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mime       TEXT NOT NULL CHECK (mime IN ('image/jpeg', 'image/png', 'image/webp')),
  bytes      BYTEA NOT NULL,
  size_bytes INTEGER NOT NULL CHECK (size_bytes > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS photos_created_at_idx ON photos (created_at);
