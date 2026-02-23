<?php
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';
require_once __DIR__ . '/../../config/database.php';

require_method('POST');
require_token('admin');
$in = read_json();
$title = trim($in['title'] ?? '');
$description = trim($in['description'] ?? '');
if (!$title) json_out(['ok'=>false,'message'=>'Título obligatorio'], 400);

$conn = db();
$active = 1;
$created = now_utc();
$stmt = $conn->prepare("INSERT INTO surveys(title, description, is_active, created_at) VALUES(?,?,?,?)");
$stmt->bind_param("ssis", $title, $description, $active, $created);
$stmt->execute();
json_out(['ok'=>true,'id'=>$conn->insert_id]);
