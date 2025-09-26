<?php
require_once 'database.php';

function validateInput($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data);
    return $data;
}

function generateQueueNumber($location) {
    $prefix = substr(strtoupper($location), 0, 3);
    $random = mt_rand(100, 999);
    return $prefix . '-' . date('Ymd') . '-' . $random;
}

function sendResponse($success, $message = '', $data = []) {
    header('Content-Type: application/json');
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data' => $data
    ]);
    exit;
}

function authenticateAdmin() {
    if (!isset($_SERVER['HTTP_AUTHORIZATION'])) {
        sendResponse(false, 'Authorization header missing');
    }

    $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
    $token = str_replace('Bearer ', '', $authHeader);

    if (empty($token)) {
        sendResponse(false, 'Authentication token missing');
    }

    $db = new Database();
    $conn = $db->connect();

    $query = "SELECT * FROM admin_tokens WHERE token = :token AND expires_at > NOW()";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':token', $token);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        sendResponse(false, 'Invalid or expired token');
    }

    return $token;
}
?>
