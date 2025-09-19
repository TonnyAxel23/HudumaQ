<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../../config/functions.php';

// Authenticate admin
$token = authenticateAdmin();

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->id) || !isset($data->status)) {
    sendResponse(false, 'Appointment ID and status are required');
}

$id = validateInput($data->id);
$status = validateInput($data->status);

// Validate status
if (!in_array($status, ['Waiting', 'In Progress', 'Completed'])) {
    sendResponse(false, 'Invalid status value');
}

try {
    $db = new Database();
    $conn = $db->connect();

    // For completed appointments, calculate processing time
    $processing_time = null;
    if ($status === 'Completed') {
        // Get appointment creation time
        $getQuery = "SELECT created_at FROM appointments WHERE id = :id";
        $getStmt = $conn->prepare($getQuery);
        $getStmt->bindParam(':id', $id);
        $getStmt->execute();
        
        if ($getStmt->rowCount() === 0) {
            sendResponse(false, 'Appointment not found');
        }
        
        $row = $getStmt->fetch(PDO::FETCH_ASSOC);
        $created_at = strtotime($row['created_at']);
        $now = time();
        $processing_time = round(($now - $created_at) / 60); // in minutes
    }

    $query = "UPDATE appointments SET 
              status = :status,
              processing_time = :processing_time,
              updated_at = NOW()
              WHERE id = :id";

    $stmt = $conn->prepare($query);
    $stmt->bindParam(':status', $status);
    $stmt->bindParam(':processing_time', $processing_time);
    $stmt->bindParam(':id', $id);

    if ($stmt->execute()) {
        sendResponse(true, 'Appointment status updated');
    } else {
        sendResponse(false, 'Unable to update appointment status');
    }
} catch (PDOException $e) {
    sendResponse(false, 'Database error: ' . $e->getMessage());
}
?>
