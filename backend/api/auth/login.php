<?php
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';
require_once __DIR__ . '/../../config/database.php';

require_method('POST');
$in = read_json();
$email = trim($in['email'] ?? '');
$password = $in['password'] ?? '';
if (!$email || !$password) json_out(['ok'=>false,'message'=>'Correo y contraseña son obligatorios'], 400);

$conn = db();
$stmt = $conn->prepare("SELECT id, password_hash FROM admin_users WHERE email=? LIMIT 1");
$stmt->bind_param("s", $email);
$stmt->execute();
$row = $stmt->get_result()->fetch_assoc();
if (!$row || !password_verify($password, $row['password_hash'])) json_out(['ok'=>false,'message'=>'Credenciales inválidas'], 401);

$token = create_token('admin', intval($row['id']));
json_out(['ok'=>true,'token'=>$token]);
