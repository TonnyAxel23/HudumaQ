<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../config/functions.php';

// Get the raw POST data
$json = file_get_contents('php://input');
$data = json_decode($json);

if (!$data || !isset($data->username) || !isset($data->password)) {
    sendResponse(false, 'Username and password are required');
    exit;
}

$username = validateInput($data->username);
$password = validateInput($data->password);

try {
    $db = new Database();
    $conn = $db->connect();

    $query = "SELECT id, password_hash FROM admin_users WHERE username = :username LIMIT 1";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':username', $username);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        sendResponse(false, 'Invalid username or password');
    }

    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    $admin_id = $row['id'];
    $password_hash = $row['password_hash'];

    if (!password_verify($password, $password_hash)) {
        sendResponse(false, 'Invalid username or password');
    }

    // Generate token
    $token = bin2hex(random_bytes(32));
    $expires_at = date('Y-m-d H:i:s', strtotime('+8 hours'));

    // Store token
    $tokenQuery = "INSERT INTO admin_tokens (admin_id, token, expires_at) VALUES (:admin_id, :token, :expires_at)";
    $tokenStmt = $conn->prepare($tokenQuery);
    $tokenStmt->bindParam(':admin_id', $admin_id);
    $tokenStmt->bindParam(':token', $token);
    $tokenStmt->bindParam(':expires_at', $expires_at);

    if ($tokenStmt->execute()) {
        sendResponse(true, 'Login successful', ['token' => $token]);
    } else {
        sendResponse(false, 'Unable to generate authentication token');
    }
} catch (PDOException $e) {
    sendResponse(false, 'Database error: ' . $e->getMessage());
}
?>