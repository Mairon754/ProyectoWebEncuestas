<?php
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';
require_once __DIR__ . '/../../config/database.php';

require_method('POST');
$auth = require_token('participant');
$conn = db();
$pid = $auth['user_id'];

$stmt = $conn->prepare("SELECT accepted FROM consentimientos WHERE participant_id=? LIMIT 1");
$stmt->bind_param("i", $pid);
$stmt->execute();
$row = $stmt->get_result()->fetch_assoc();
if (!$row || intval($row['accepted']) !== 1) json_out(['ok'=>false,'message'=>'Primero debes aceptar el consentimiento'], 403);

$in = read_json();
$items = $in['items'] ?? [];
if (!is_array($items) || count($items) === 0) json_out(['ok'=>true,'received'=>[]]);

$received = [];
$stSessSel = $conn->prepare("SELECT id FROM sessions WHERE session_uuid=? LIMIT 1");
$stSessIns = $conn->prepare("INSERT INTO sessions(session_uuid, participant_id, survey_id, started_at) VALUES(?,?,?,?)");
$stRespIns = $conn->prepare("INSERT IGNORE INTO responses(uuid, session_id, survey_id, question_id, option_id, text_value, number_value, answered_at) VALUES(?,?,?,?,?,?,?,?)");

foreach ($items as $it) {
  $uuid = trim($it['uuid'] ?? '');
  $session_uuid = trim($it['session_uuid'] ?? '');
  $survey_id = intval($it['survey_id'] ?? 0);
  $question_id = intval($it['question_id'] ?? 0);
  $option_id = isset($it['option_id']) ? intval($it['option_id']) : 0;
  $text_value = isset($it['text_value']) ? trim((string)$it['text_value']) : '';
  $number_value = isset($it['number_value']) ? floatval($it['number_value']) : 0.0;
  $answered_at = trim($it['answered_at'] ?? '');
  if (!$answered_at) $answered_at = now_utc();

  if (!$uuid || !$session_uuid || !$survey_id || !$question_id) continue;

  $stSessSel->bind_param("s", $session_uuid);
  $stSessSel->execute();
  $srow = $stSessSel->get_result()->fetch_assoc();
  if ($srow) $session_id = intval($srow['id']);
  else {
    $started = now_utc();
    $stSessIns->bind_param("siis", $session_uuid, $pid, $survey_id, $started);
    $stSessIns->execute();
    $session_id = $conn->insert_id;
  }

  $stRespIns->bind_param("siiiisds", $uuid, $session_id, $survey_id, $question_id, $option_id, $text_value, $number_value, $answered_at);
  $stRespIns->execute();
  $received[] = $uuid;
}
json_out(['ok'=>true,'received'=>$received]);
