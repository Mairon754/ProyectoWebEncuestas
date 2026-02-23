<?php
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';
require_once __DIR__ . '/../../config/database.php';

require_method('GET');
require_token('admin');

$conn = db();
$sql = "SELECT s.id, s.title, s.description,
  (SELECT COUNT(*) FROM questions q WHERE q.survey_id=s.id) AS question_count
  FROM surveys s ORDER BY s.id DESC";
$res = $conn->query($sql);
$surveys = [];
while ($r = $res->fetch_assoc()) $surveys[] = $r;
json_out(['ok'=>true,'surveys'=>$surveys]);
