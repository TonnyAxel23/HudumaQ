<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../config/functions.php';

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->username) || !isset($data->password)) {
    sendResponse(false, 'Username and password are required');
}

$username = validateInput($data->username);
$password = validateInput($data->password);

if (strlen($password) < 8) {
    sendResponse(false, 'Password must be at least 8 characters');
}

try {
    $db = new Database();
    $conn = $db->connect();

    // Check if username exists
    $checkQuery = "SELECT id FROM admin_users WHERE username = :username";
    $checkStmt = $conn->prepare($checkQuery);
    $checkStmt->bindParam(':username', $username);
    $checkStmt->execute();

    if ($checkStmt->rowCount() > 0) {
        sendResponse(false, 'Username already exists');
    }

    // Hash password
    $password_hash = password_hash($password, PASSWORD_BCRYPT);

    // Insert new admin
    $insertQuery = "INSERT INTO admin_users SET
                    username = :username,
                    password_hash = :password_hash";

    $insertStmt = $conn->prepare($insertQuery);

    $insertStmt->bindParam(':username', $username);
    $insertStmt->bindParam(':password_hash', $password_hash);

    if ($insertStmt->execute()) {
        sendResponse(true, 'Admin registered successfully');
    } else {
        sendResponse(false, 'Unable to register admin');
    }
} catch (PDOException $e) {
    sendResponse(false, 'Database error: ' . $e->getMessage());
}
?>        