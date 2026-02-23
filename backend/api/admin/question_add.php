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
$stmt = $conn->prepare("INSERT INTO questions(survey_id, text, qtype, created_at) VALUES(?,?,?,?)");
$stmt->bind_param("isss", $survey_id, $text, $qtype, $created);
$stmt->execute();
$qid = $conn->insert_id;

if ($qtype === 'single') {
  if (!is_array($options) || count($options) < 2) json_out(['ok'=>false,'message'=>'Opciones insuficientes'], 400);
  $stmt2 = $conn->prepare("INSERT INTO options(question_id, label, created_at) VALUES(?,?,?)");
  foreach ($options as $opt) {
    $label = trim((string)$opt);
    if (!$label) continue;
    $stmt2->bind_param("iss", $qid, $label, $created);
    $stmt2->execute();
  }
}
json_out(['ok'=>true,'question_id'=>$qid]);
