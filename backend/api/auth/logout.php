<?php
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';

require_method('POST');
$token = bearer_token();
if (!$token) json_out(['ok'=>true]);
revoke_token($token);
json_out(['ok'=>true]);
