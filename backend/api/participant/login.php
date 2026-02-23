<?php
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';
require_once __DIR__ . '/../../config/database.php';

require_method('POST');
$in = read_json();
$code = strtoupper(trim($in['code'] ?? ''));
$pin = trim($in['pin'] ?? '');
if (!$code || !$pin) json_out(['ok'=>false,'message'=>'Código y PIN son obligatorios'], 400);

$conn = db();
$stmt = $conn->prepare("SELECT id, pin_hash FROM participants WHERE code=? LIMIT 1");
$stmt->bind_param("s", $code);
$stmt->execute();
$row = $stmt->get_result()->fetch_assoc();
if (!$row || !password_verify($pin, $row['pin_hash'])) json_out(['ok'=>false,'message'=>'Credenciales inválidas'], 401);

$token = create_token('participant', intval($row['id']));
json_out(['ok'=>true,'token'=>$token,'code'=>$code]);
