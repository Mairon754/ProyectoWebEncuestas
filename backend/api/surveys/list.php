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

$res = $conn->query("SELECT id, title, description FROM surveys WHERE is_active=1 ORDER BY id DESC");
$surveys = [];
while ($r = $res->fetch_assoc()) $surveys[] = $r;
json_out(['ok'=>true,'surveys'=>$surveys]);
