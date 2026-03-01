<?php
function json_out($data, int $status=200): void {
  http_response_code($status);
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode($data, JSON_UNESCAPED_UNICODE);
  exit;
}
function require_method(string $method): void {
  if (strtoupper($_SERVER['REQUEST_METHOD'] ?? '') !== strtoupper($method)) {
    json_out(['ok'=>false,'message'=>'Método no permitido'], 405);
  }
}
function read_json(): array {
  $raw = file_get_contents('php://input');
  $data = json_decode($raw ?: '{}', true);
  return is_array($data) ? $data : [];
}
function bearer_token(): ?string {
  // 1) La forma más confiable en Apache/WAMP:
  $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';

  // 2) A veces llega aquí:
  if (!$auth) {
    $auth = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
  }

  // 3) Fallback:
  if (!$auth) {
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    $auth = $headers['Authorization'] ?? $headers['authorization'] ?? '';
  }

  if (!$auth) return null;

  if (preg_match('/Bearer\s+(.+)$/i', $auth, $m)) {
    return trim($m[1]);
  }
  return null;
}
function now_utc(): string { return gmdate('Y-m-d H:i:s'); }
