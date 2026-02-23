<?php
require_once __DIR__ . '/../../config/database.php';

$token = trim($_GET['token'] ?? '');
if (!$token) { http_response_code(401); echo "Falta token"; exit; }

$conn = db();
$stmt = $conn->prepare("SELECT user_type, user_id, expires_at FROM auth_tokens WHERE token=? LIMIT 1");
$stmt->bind_param("s", $token);
$stmt->execute();
$row = $stmt->get_result()->fetch_assoc();
if (!$row || $row['user_type'] !== 'admin' || strtotime($row['expires_at']) < time()) {
  http_response_code(403); echo "No autorizado"; exit;
}

header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename="dataset_respuestas.csv"');

$out = fopen('php://output', 'w');
fputcsv($out, ['uuid','session_uuid','participant_code','survey_id','question_id','option_id','text_value','number_value','answered_at']);

$sql = "SELECT r.uuid, s.session_uuid, p.code AS participant_code, r.survey_id, r.question_id, r.option_id, r.text_value, r.number_value, r.answered_at
  FROM responses r
  JOIN sessions s ON s.id = r.session_id
  JOIN participants p ON p.id = s.participant_id
  ORDER BY r.answered_at ASC";
$res = $conn->query($sql);
while ($r = $res->fetch_assoc()) fputcsv($out, $r);
fclose($out);
exit;
