<?php
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';
require_once __DIR__ . '/../../config/database.php';

require_method('POST');
require_token('admin');

$in = read_json();

$survey_id = intval($in['survey_id'] ?? 0);
$text = trim($in['text'] ?? '');
$qtype = trim($in['qtype'] ?? 'single');
$options = $in['options'] ?? [];

if (!$survey_id) json_out(['ok'=>false,'message'=>'Falta survey_id'], 400);
if (!$text) json_out(['ok'=>false,'message'=>'Falta texto'], 400);
if (!in_array($qtype, ['single','text','number'], true)) $qtype = 'single';

$conn = db();
$created = now_utc();

/* 1) Verificar que la encuesta existe */
$chk = $conn->prepare("SELECT id FROM surveys WHERE id=? LIMIT 1");
$chk->bind_param("i", $survey_id);
if (!$chk->execute()) json_out(['ok'=>false,'message'=>'Error MySQL: '.$conn->error], 500);
$exists = $chk->get_result()->fetch_assoc();
if (!$exists) json_out(['ok'=>false,'message'=>'La encuesta no existe (survey_id inválido)'], 404);

/* 2) Insert de pregunta con validación real */
$stmt = $conn->prepare("INSERT INTO questions(survey_id, text, qtype, created_at) VALUES(?,?,?,?)");
if (!$stmt) json_out(['ok'=>false,'message'=>'Error prepare: '.$conn->error], 500);

$stmt->bind_param("isss", $survey_id, $text, $qtype, $created);

$ok = $stmt->execute();
if (!$ok) {
  json_out(['ok'=>false,'message'=>'No se pudo insertar la pregunta: '.$conn->error], 500);
}

$qid = $conn->insert_id;
if (!$qid) json_out(['ok'=>false,'message'=>'No se generó ID de pregunta (insert_id vacío).'], 500);

/* 3) Opciones (solo selección única) */
if ($qtype === 'single') {
  if (!is_array($options) || count($options) < 2) {
    json_out(['ok'=>false,'message'=>'Opciones insuficientes (mínimo 2)'], 400);
  }

  $stmt2 = $conn->prepare("INSERT INTO options(question_id, label, created_at) VALUES(?,?,?)");
  if (!$stmt2) json_out(['ok'=>false,'message'=>'Error prepare options: '.$conn->error], 500);

  foreach ($options as $opt) {
    $label = trim((string)$opt);
    if (!$label) continue;
    $stmt2->bind_param("iss", $qid, $label, $created);
    $ok2 = $stmt2->execute();
    if (!$ok2) {
      json_out(['ok'=>false,'message'=>'No se pudo insertar opción: '.$conn->error], 500);
    }
  }
}

json_out(['ok'=>true,'question_id'=>$qid]);