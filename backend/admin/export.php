<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: text/csv; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../../config/functions.php';

// Authenticate admin
$token = authenticateAdmin();

$date = isset($_GET['date']) ? validateInput($_GET['date']) : date('Y-m-d');

try {
    $db = new Database();
    $conn = $db->connect();

    $query = "SELECT * FROM appointments WHERE appointment_date = :date ORDER BY appointment_time ASC";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':date', $date);
    $stmt->execute();
    $appointments = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($appointments)) {
        sendResponse(false, 'No appointments found for the selected date');
    }

    // Set headers for CSV download
    header('Content-Disposition: attachment; filename="hudumaq_appointments_' . $date . '.csv"');

    // Open output stream
    $output = fopen('php://output', 'w');

    // Add CSV headers
    fputcsv($output, array_keys($appointments[0]));

    // Add data rows
    foreach ($appointments as $appointment) {
        fputcsv($output, $appointment);
    }

    fclose($output);
    exit;
} catch (PDOException $e) {
    sendResponse(false, 'Database error: ' . $e->getMessage());
}
?>