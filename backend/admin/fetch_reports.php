<?php
header('Content-Type: application/json');
require_once __DIR__ . '/config/function.php';
require_once __DIR__ . '/config/database.php';

// Authenticate the admin
$auth = new Auth();
if (!$auth->authenticate()) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// Connect to database
$db = new Database();
$conn = $db->getConnection();

if (!$conn) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

try {
    // Get stats data
    $stats = [
        'total_appointments' => 0,
        'completed_services' => 0,
        'avg_wait_time' => 0,
        'cancellation_rate' => 0,
        'appointments_change' => 0,
        'completed_change' => 0,
        'wait_time_change' => 0,
        'cancellation_change' => 0
    ];

    // Query for total appointments
    $query = "SELECT COUNT(*) as total FROM appointments";
    $stmt = $conn->prepare($query);
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    $stats['total_appointments'] = (int)$result['total'];

    // Query for completed services
    $query = "SELECT COUNT(*) as completed FROM appointments WHERE status = 'Completed'";
    $stmt = $conn->prepare($query);
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    $stats['completed_services'] = (int)$result['completed'];

    // Query for average wait time
    $query = "SELECT AVG(TIMESTAMPDIFF(MINUTE, appointment_time, processed_at)) as avg_wait 
              FROM appointments WHERE status = 'Completed'";
    $stmt = $conn->prepare($query);
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    $stats['avg_wait_time'] = round($result['avg_wait'] ?? 0) . ' min';

    // Query for cancellation rate (with protection against division by zero)
    $query = "SELECT 
                CASE 
                    WHEN COUNT(*) = 0 THEN 0
                    ELSE (COUNT(CASE WHEN status = 'Cancelled' THEN 1 END) / COUNT(*) * 100 
                END as cancellation_rate 
              FROM appointments";
    $stmt = $conn->prepare($query);
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    $stats['cancellation_rate'] = round($result['cancellation_rate'] ?? 0, 1) . '%';

    // Rest of your code remains the same...
    // [Previous chart and report queries remain unchanged]

    // Return all data
    echo json_encode([
        'success' => true,
        'stats' => $stats,
        'charts' => $charts,
        'reports' => $reports
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}