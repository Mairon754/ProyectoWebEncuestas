<?php
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';
require_once __DIR__ . '/../../config/database.php';

require_method('POST');
$auth = require_token('participant');
$in = read_json();
$accepted = !empty($in['accepted']);
$version = trim($in['version'] ?? 'v1');
if (!$accepted) json_out(['ok'=>false,'message'=>'Debes aceptar el consentimiento para continuar'], 400);

$conn = db();
$pid = $auth['user_id'];
$ts = now_utc();

$stmt = $conn->prepare("SELECT id FROM consentimientos WHERE participant_id=? LIMIT 1");
$stmt->bind_param("i", $pid);
$stmt->execute();
$exists = $stmt->get_result()->fetch_assoc();

if ($exists) {
  $stmt = $conn->prepare("UPDATE consentimientos SET accepted=1, version=?, updated_at=? WHERE participant_id=?");
  $stmt->bind_param("ssi", $version, $ts, $pid);
  $stmt->execute();
} else {
  $stmt = $conn->prepare("INSERT INTO consentimientos(participant_id, accepted, version, created_at) VALUES(?,?,?,?)");
  $one = 1;
  $stmt->bind_param("iiss", $pid, $one, $version, $ts);
  $stmt->execute();
}
json_out(['ok'=>true]);
