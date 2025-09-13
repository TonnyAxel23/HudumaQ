const express = require('express');
const router = express.Router();
const SMSService = require('../services/sms-service');

// Booking endpoint
router.post('/bookings', async (req, res) => {
  try {
    const { fullName, phone, service, location, date, time, queueNumber } = req.body;

    // Create booking objects (matching your frontend structure)
    const bookingData = {
      queueNumber,
      fullName,
      service,
      center: location,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: "Waiting"
    };

    const appointment = {
      id: `AP-${new Date().getFullYear()}-${1000 + Math.floor(Math.random() * 9000)}`,
      clientName: fullName,
      phone: phone,
      service: service,
      center: location,
      dateTime: `${date} ${time}`,
      status: "Pending",
      queueNumber: queueNumber
    };

    // Send SMS confirmation
    const message = `Hello ${fullName}, your HudumaQ appointment is confirmed.\n\nService: ${service}\nCenter: ${location}\nDate: ${date}\nTime: ${time}\nQueue No: ${queueNumber}\n\nThank you for using HudumaQ!`;
    await SMSService.sendSMS(phone, message);

    // Return the data to be stored in localStorage
    res.status(201).json({
      success: true,
      data: {
        bookingData,
        appointment,
        userBooking: bookingData // Matching your frontend localStorage key
      },
      message: 'Booking successful'
    });

  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing booking'
    });
  }
});

module.exports = router;
