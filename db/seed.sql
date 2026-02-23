
USE proyecto_web_db;

INSERT INTO admin_users(email, password_hash, created_at)
VALUES ('admin@proyecto.com', '$2b$12$x2wrNU2/QKcTPKJCKYedleNRXYHdsh5yadwGUrQNoAGPmFFEz9/Li', UTC_TIMESTAMP())
ON DUPLICATE KEY UPDATE email=email;

INSERT INTO surveys(title, description, is_active, created_at)
VALUES ('Caracterización rápida', 'Preguntas generales (demo).', 1, UTC_TIMESTAMP());

SET @sid1 = LAST_INSERT_ID();

INSERT INTO questions(survey_id, text, qtype, created_at) VALUES
(@sid1, '¿Cuál es tu jornada?', 'single', UTC_TIMESTAMP()),
(@sid1, 'En una frase: ¿qué te gustaría estudiar?', 'text', UTC_TIMESTAMP()),
(@sid1, '¿Qué tan seguro(a) te sientes de tu elección? (0 a 10)', 'number', UTC_TIMESTAMP());

SET @q1 = (SELECT id FROM questions WHERE survey_id=@sid1 ORDER BY id ASC LIMIT 1);
INSERT INTO options(question_id, label, created_at) VALUES
(@q1, 'Mañana', UTC_TIMESTAMP()),
(@q1, 'Tarde', UTC_TIMESTAMP()),
(@q1, 'Noche', UTC_TIMESTAMP());

INSERT INTO surveys(title, description, is_active, created_at)
VALUES ('Mini RIASEC (demo)', 'Selección única con afirmaciones rápidas.', 1, UTC_TIMESTAMP());

SET @sid2 = LAST_INSERT_ID();

INSERT INTO questions(survey_id, text, qtype, created_at) VALUES
(@sid2, 'Prefiero tareas prácticas (arreglar, construir, usar herramientas).', 'single', UTC_TIMESTAMP()),
(@sid2, 'Me gusta investigar, analizar y resolver problemas complejos.', 'single', UTC_TIMESTAMP()),
(@sid2, 'Disfruto crear (dibujar, escribir, diseñar) y expresarme.', 'single', UTC_TIMESTAMP());

SET @likertA = 'Totalmente en desacuerdo';
SET @likertB = 'En desacuerdo';
SET @likertC = 'Neutral';
SET @likertD = 'De acuerdo';
SET @likertE = 'Totalmente de acuerdo';

SET @q21 = (SELECT id FROM questions WHERE survey_id=@sid2 ORDER BY id ASC LIMIT 1);
INSERT INTO options(question_id, label, created_at) VALUES
(@q21, @likertA, UTC_TIMESTAMP()),
(@q21, @likertB, UTC_TIMESTAMP()),
(@q21, @likertC, UTC_TIMESTAMP()),
(@q21, @likertD, UTC_TIMESTAMP()),
(@q21, @likertE, UTC_TIMESTAMP());

SET @q22 = (SELECT id FROM questions WHERE survey_id=@sid2 ORDER BY id ASC LIMIT 1 OFFSET 1);
INSERT INTO options(question_id, label, created_at) VALUES
(@q22, @likertA, UTC_TIMESTAMP()),
(@q22, @likertB, UTC_TIMESTAMP()),
(@q22, @likertC, UTC_TIMESTAMP()),
(@q22, @likertD, UTC_TIMESTAMP()),
(@q22, @likertE, UTC_TIMESTAMP());

SET @q23 = (SELECT id FROM questions WHERE survey_id=@sid2 ORDER BY id ASC LIMIT 1 OFFSET 2);
INSERT INTO options(question_id, label, created_at) VALUES
(@q23, @likertA, UTC_TIMESTAMP()),
(@q23, @likertB, UTC_TIMESTAMP()),
(@q23, @likertC, UTC_TIMESTAMP()),
(@q23, @likertD, UTC_TIMESTAMP()),
(@q23, @likertE, UTC_TIMESTAMP());
