<?php
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../config/database.php';

require_method('POST');
$in = read_json();
$code = strtoupper(trim($in['code'] ?? ''));
$pin = trim($in['pin'] ?? '');
if (!$code || !$pin) json_out(['ok'=>false,'message'=>'Código y PIN son obligatorios'], 400);
if (strlen($code) < 3) json_out(['ok'=>false,'message'=>'El código es muy corto'], 400);
if (strlen($pin) < 4) json_out(['ok'=>false,'message'=>'El PIN debe tener mínimo 4 caracteres'], 400);

$conn = db();
$stmt = $conn->prepare("SELECT id FROM participants WHERE code=? LIMIT 1");
$stmt->bind_param("s", $code);
$stmt->execute();
if ($stmt->get_result()->fetch_assoc()) json_out(['ok'=>false,'message'=>'Ese código ya existe.'], 409);

$hash = password_hash($pin, PASSWORD_BCRYPT);
$created = now_utc();
$stmt = $conn->prepare("INSERT INTO participants(code, pin_hash, created_at) VALUES(?,?,?)");
$stmt->bind_param("sss", $code, $hash, $created);
$stmt->execute();
json_out(['ok'=>true,'message'=>'Registrado']);
