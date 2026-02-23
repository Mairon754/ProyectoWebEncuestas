<?php
require_once __DIR__ . '/config.php';
function db(): mysqli {
  static $conn = null;
  if ($conn instanceof mysqli) return $conn;
  $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
  if ($conn->connect_error) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok'=>false,'message'=>'Error de conexión a MySQL. Revisa backend/config/config.php y que la BD exista.']);
    exit;
  }
  $conn->set_charset('utf8mb4');
  return $conn;
}
