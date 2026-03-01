<?php
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';
require_once __DIR__ . '/../../config/database.php';

require_method('POST');
require_token('admin');

$in = read_json();
$count  = intval($in['count'] ?? 1);
$prefix = strtoupper(trim($in['prefix'] ?? 'EST-'));

if ($count < 1 || $count > 200) json_out(['ok'=>false,'message'=>'count debe estar entre 1 y 200'], 400);
if (strlen($prefix) < 2) json_out(['ok'=>false,'message'=>'prefix inválido'], 400);

$conn = db();
$created = now_utc();

$generated = [];
$tries = 0;

while (count($generated) < $count && $tries < $count * 20) {
  $tries++;

  // Código: EST- + 4 dígitos aleatorios
  $code = $prefix . str_pad((string)random_int(0, 9999), 4, '0', STR_PAD_LEFT);

  // PIN: 6 dígitos
  $pin_plain = (string)random_int(100000, 999999);
  $pin_hash = password_hash($pin_plain, PASSWORD_BCRYPT);

  // Evitar duplicados por code UNIQUE
  $stmt = $conn->prepare("INSERT INTO participants(code, pin_hash, created_at) VALUES(?,?,?)");
  if (!$stmt) json_out(['ok'=>false,'message'=>'Error prepare: '.$conn->error], 500);

  $stmt->bind_param("sss", $code, $pin_hash, $created);
  $ok = $stmt->execute();

  if ($ok) {
    $generated[] = ['code' => $code, 'pin' => $pin_plain];
  }
}

if (count($generated) < $count) {
  json_out(['ok'=>false,'message'=>'No se pudieron generar todos los códigos. Intenta de nuevo.'], 500);
}

json_out(['ok'=>true,'items'=>$generated]);