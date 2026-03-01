<?php
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';
require_once __DIR__ . '/../../config/database.php';

require_method('GET');
require_token('admin');

$conn = db();
$res = $conn->query("SELECT id, code, created_at FROM participants ORDER BY id DESC LIMIT 500");

$items = [];
while ($r = $res->fetch_assoc()) $items[] = $r;

json_out(['ok'=>true,'items'=>$items]);
