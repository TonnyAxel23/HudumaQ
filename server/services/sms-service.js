const AfricasTalking = require('africastalking');

// Initialize Africa's Talking
const africastalking = AfricasTalking({
  apiKey: process.env.AFRICAS_TALKING_API_KEY,
  username: process.env.AFRICAS_TALKING_USERNAME
});

const sms = africastalking.SMS;

class SMSService {
  static async sendSMS(phoneNumber, message) {
    try {
      if (!phoneNumber.startsWith('+')) {
        phoneNumber = `+254${phoneNumber.substring(1)}`; // Convert 07... to +2547...
      }

      const options = {
        to: [phoneNumber],
        message: message,
        from: process.env.AFRICAS_TALKING_SENDER_ID || 'HudumaQ'
      };

      const response = await sms.send(options);
      console.log('SMS sent:', response);
      return response;
    } catch (error) {
      console.error('Error sending SMS:', error);
      throw error;
    }
  }
}

module.exports = SMSService;