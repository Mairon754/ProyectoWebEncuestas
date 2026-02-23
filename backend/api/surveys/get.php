<?php
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';
require_once __DIR__ . '/../../config/database.php';

require_method('GET');
$auth = require_token('participant');
$conn = db();
$pid = $auth['user_id'];

$stmt = $conn->prepare("SELECT accepted FROM consentimientos WHERE participant_id=? LIMIT 1");
$stmt->bind_param("i", $pid);
$stmt->execute();
$row = $stmt->get_result()->fetch_assoc();
if (!$row || intval($row['accepted']) !== 1) json_out(['ok'=>false,'message'=>'Primero debes aceptar el consentimiento'], 403);

$id = intval($_GET['id'] ?? 0);
if (!$id) json_out(['ok'=>false,'message'=>'Falta id'], 400);

$stmt = $conn->prepare("SELECT id, title, description FROM surveys WHERE id=? AND is_active=1 LIMIT 1");
$stmt->bind_param("i", $id);
$stmt->execute();
$survey = $stmt->get_result()->fetch_assoc();
if (!$survey) json_out(['ok'=>false,'message'=>'Encuesta no encontrada'], 404);

$stmt = $conn->prepare("SELECT id, text, qtype FROM questions WHERE survey_id=? ORDER BY id ASC");
$stmt->bind_param("i", $id);
$stmt->execute();
$qres = $stmt->get_result();

$questions = [];
while ($q = $qres->fetch_assoc()) {
  $qid = intval($q['id']);
  $q['id'] = $qid;
  $q['options'] = [];
  if ($q['qtype'] === 'single') {
    $st2 = $conn->prepare("SELECT id, label FROM options WHERE question_id=? ORDER BY id ASC");
    $st2->bind_param("i", $qid);
    $st2->execute();
    $ores = $st2->get_result();
    $opts = [];
    while ($o = $ores->fetch_assoc()) { $o['id'] = intval($o['id']); $opts[] = $o; }
    $q['options'] = $opts;
  }
  $questions[] = $q;
}
json_out(['ok'=>true,'survey'=>$survey,'questions'=>$questions]);
