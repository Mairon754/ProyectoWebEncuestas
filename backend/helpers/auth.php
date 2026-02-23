<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/response.php';

function require_token(string $type): array {
  $token = bearer_token();
  if (!$token) json_out(['ok'=>false,'message'=>'Falta token'], 401);

  $conn = db();
  $stmt = $conn->prepare("SELECT user_type, user_id, expires_at FROM auth_tokens WHERE token=? LIMIT 1");
  $stmt->bind_param("s", $token);
  $stmt->execute();
  $res = $stmt->get_result()->fetch_assoc();
  if (!$res) json_out(['ok'=>false,'message'=>'Token inválido'], 401);
  if (($res['user_type'] ?? '') !== $type) json_out(['ok'=>false,'message'=>'No autorizado'], 403);
  if (strtotime($res['expires_at']) < time()) json_out(['ok'=>false,'message'=>'Token expirado'], 401);
  return ['token'=>$token, 'user_id'=>intval($res['user_id'])];
}

function create_token(string $type, int $user_id): string {
  $conn = db();
  $token = bin2hex(random_bytes(24));
  $expires = gmdate('Y-m-d H:i:s', time() + TOKEN_TTL_SECONDS);
  $created = now_utc();
  $stmt = $conn->prepare("INSERT INTO auth_tokens(token, user_type, user_id, expires_at, created_at) VALUES(?,?,?,?,?)");
  $stmt->bind_param("ssiss", $token, $type, $user_id, $expires, $created);
  $stmt->execute();
  return $token;
}

function revoke_token(string $token): void {
  $conn = db();
  $stmt = $conn->prepare("DELETE FROM auth_tokens WHERE token=?");
  $stmt->bind_param("s", $token);
  $stmt->execute();
}
