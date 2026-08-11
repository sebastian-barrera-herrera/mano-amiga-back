-- Datos de ejemplo para desarrollo. No ejecutar en producción.
-- Uso: npm run db:seed

DELETE FROM community_messages;
DELETE FROM reports;

INSERT INTO reports
  (kind, status, name, approx_age, city, neighborhood, location_detail, event_at, description, clothing,
   health_status, contact_name, contact_email, contact_phone)
VALUES
  ('person', 'missing', 'Carlos Andrés Molina', 34, 'Armenia', 'La Fachada',
   'Cerca del parque principal, edificio Torres del Café', now() - INTERVAL '2 days',
   'Estatura media, cabello oscuro, cicatriz en la ceja derecha.', 'Camisa azul y jean',
   'Asmático, necesita inhalador', 'Luisa Molina', 'luisa.molina@example.com', '+57 310 000 0001'),
  ('person', 'missing', 'María Fernanda Ríos', 7, 'Pereira', 'Cuba',
   'Salió del colegio San José y no llegó a casa', now() - INTERVAL '18 hours',
   'Niña de contextura delgada, cabello rizado y largo.', 'Uniforme escolar gris y blanco',
   NULL, 'Jorge Ríos', NULL, '+57 320 000 0002'),
  ('person', 'found', 'Adulto mayor sin identificar', 78, 'Armenia', 'Centro',
   'Encontrado en el albergue temporal del coliseo del sur', now() - INTERVAL '6 hours',
   'Se encuentra desorientado, no recuerda su nombre completo. Está estable y acompañado.',
   'Suéter café', 'Estable, atendido por brigada de salud', 'Brigada Cruz Roja',
   'albergue.sur@example.com', '+57 300 000 0003');

INSERT INTO reports
  (kind, status, name, species, color, city, neighborhood, location_detail, event_at, description,
   contact_name, contact_email, contact_phone)
VALUES
  ('pet', 'missing', 'Nube', 'Perro', 'Blanco con manchas cafés', 'Armenia', 'Laureles',
   'Se escapó durante la réplica de la madrugada', now() - INTERVAL '1 day',
   'Perra mestiza mediana, muy asustadiza, lleva collar rojo sin placa.',
   'Daniel Ospina', 'daniel.ospina@example.com', '+57 311 000 0004'),
  ('pet', 'found', 'Gato naranja', 'Gato', 'Naranja', 'Calarcá', 'El Prado',
   'Encontrado en el techo de una casa evacuada de la carrera 24', now() - INTERVAL '5 hours',
   'Gato adulto, muy dócil, sin collar. Está en resguardo temporal.',
   'Ana Villegas', NULL, '+57 312 000 0005');

INSERT INTO community_messages (city, author_name, category, content, contact)
VALUES
  ('Armenia', 'Junta de acción comunal', 'water',
   'Hay agua potable en el parque de La Fachada. Llevar recipientes propios. Disponible de 7am a 6pm.', NULL),
  ('Armenia', NULL, 'shelter',
   'Refugio habilitado en el Coliseo del Sur con capacidad para 200 personas. Reciben familias con niños y mascotas.',
   '+57 300 000 0010'),
  ('Pereira', 'Fundación Manos', 'volunteers',
   'Necesitamos voluntarios para clasificar donaciones en la bodega de la avenida 30 de Agosto. Turnos de 4 horas.',
   'voluntarios@example.com'),
  ('Calarcá', 'Farmacia solidaria', 'medical',
   'Tenemos medicamentos básicos disponibles: analgésicos, suero oral y vendajes. Entrega gratuita.', NULL);
