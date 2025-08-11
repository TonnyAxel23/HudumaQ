<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../config/functions.php';

$data = json_decode(file_get_contents("php://input"));

if (
    !isset($data->fullname) ||
    !isset($data->phone) ||
    !isset($data->service_type) ||
    !isset($data->location) ||
    !isset($data->appointment_date) ||
    !isset($data->appointment_time)
) {
    sendResponse(false, 'All fields are required');
}

// Validate input
$fullname = validateInput($data->fullname);
$phone = validateInput($data->phone);
$service_type = validateInput($data->service_type);
$location = validateInput($data->location);
$appointment_date = validateInput($data->appointment_date);
$appointment_time = validateInput($data->appointment_time);

// Validate phone number format (Kenyan)
if (!preg_match('/^07\d{8}$/', $phone)) {
    sendResponse(false, 'Please enter a valid Kenyan phone number (07XXXXXXXX)');
}

// Generate queue number
$queue_number = generateQueueNumber($location);

try {
    $db = new Database();
    $conn = $db->connect();

    $query = "INSERT INTO appointments SET
                queue_number = :queue_number,
                fullname = :fullname,
                phone = :phone,
                service_type = :service_type,
                location = :location,
                appointment_date = :appointment_date,
                appointment_time = :appointment_time,
                status = 'Waiting'";

    $stmt = $conn->prepare($query);

    $stmt->bindParam(':queue_number', $queue_number);
    $stmt->bindParam(':fullname', $fullname);
    $stmt->bindParam(':phone', $phone);
    $stmt->bindParam(':service_type', $service_type);
    $stmt->bindParam(':location', $location);
    $stmt->bindParam(':appointment_date', $appointment_date);
    $stmt->bindParam(':appointment_time', $appointment_time);

    if ($stmt->execute()) {
        // Get the ID of the newly created appointment
        $id = $conn->lastInsertId();
        
        // Prepare the full appointment data to return
        $newAppointment = [
            'id' => $id,
            'queue_number' => $queue_number,
            'fullname' => $fullname,
            'phone' => $phone,
            'service_type' => $service_type,
            'location' => $location,
            'appointment_date' => $appointment_date,
            'appointment_time' => $appointment_time,
            'status' => 'Waiting'
        ];
        
        // Broadcast to WebSocket server (if implemented)
        if (function_exists('broadcastNewAppointment')) {
            broadcastNewAppointment($newAppointment);
        }
        
        sendResponse(true, 'Appointment booked successfully', $newAppointment);
    } else {
        sendResponse(false, 'Unable to book appointment');
    }
} catch (PDOException $e) {
    sendResponse(false, 'Database error: ' . $e->getMessage());
}

// Simple WebSocket broadcast function (would need proper implementation)
function broadcastNewAppointment($appointment) {
    $context = new ZMQContext();
    $socket = $context->getSocket(ZMQ::SOCKET_PUSH, 'appointment_publisher');
    $socket->connect("tcp://localhost:5555");
    $socket->send(json_encode([
        'type' => 'new_appointment',
        'appointment' => $appointment
    ]));
}
?>