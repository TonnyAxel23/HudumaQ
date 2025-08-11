<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../config/functions.php';

$service_type = isset($_GET['service_type']) ? validateInput($_GET['service_type']) : '';
$location = isset($_GET['location']) ? validateInput($_GET['location']) : '';
$today = date('Y-m-d');

try {
    $db = new Database();
    $conn = $db->connect();

    $query = "SELECT * FROM appointments 
              WHERE appointment_date = :today";
    
    $params = [':today' => $today];

    if (!empty($service_type)) {
        $query .= " AND service_type = :service_type";
        $params[':service_type'] = $service_type;
    }

    if (!empty($location)) {
        $query .= " AND location = :location";
        $params[':location'] = $location;
    }

    $query .= " ORDER BY appointment_time ASC";

    $stmt = $conn->prepare($query);
    
    foreach ($params as $key => &$val) {
        $stmt->bindParam($key, $val);
    }

    $stmt->execute();
    $appointments = $stmt->fetchAll(PDO::FETCH_ASSOC);

    sendResponse(true, 'Queue data retrieved', $appointments);
} catch (PDOException $e) {
    sendResponse(false, 'Database error: ' . $e->getMessage());
}
?>