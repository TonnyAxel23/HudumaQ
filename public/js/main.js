// Utility Functions
const displayMessage = (element, message, isSuccess = true) => {
  element.textContent = message;
  element.style.color = isSuccess ? '#4cc9f0' : '#f72585';
  element.style.display = 'block';
  
  if (isSuccess) {
    setTimeout(() => {
      element.style.display = 'none';
    }, 5000);
  }
};

const formatTime = (timeString) => {
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  return `${hour > 12 ? hour - 12 : hour}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`;
};

const formatDate = (dateString) => {
  const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-KE', options);
};

// Set minimum date for booking form (today)
const setMinDate = () => {
  const dateInput = document.getElementById('appointment_date');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
  }
};

// Booking Form Handler
const handleBookingForm = () => {
  const form = document.getElementById('bookingForm');
  const message = document.getElementById('bookingMessage');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = {
        fullname: document.getElementById('fullname').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        service_type: document.getElementById('service_type').value,
        location: document.getElementById('location').value,
        appointment_date: document.getElementById('appointment_date').value,
        appointment_time: document.getElementById('appointment_time').value
      };

      // Validate phone number
      if (!/^07\d{8}$/.test(formData.phone)) {
        displayMessage(message, 'Please enter a valid Kenyan phone number (07XXXXXXXX)', false);
        return;
      }

      try {
        const response = await fetch('../backend/appointments/book.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (response.ok) {
          displayMessage(message, `✅ ${result.message} Your queue number is ${result.queue_number}`, true);
          form.reset();
          
          // Update user's position in queue if on queue page
          if (document.getElementById('yourPosition')) {
            document.getElementById('yourPosition').textContent = result.queue_number;
          }
        } else {
          displayMessage(message, `❌ ${result.message}`, false);
        }
      } catch (error) {
        displayMessage(message, '⚠️ Network error. Please check your connection and try again.', false);
      }
    });
  }
};

// Queue Page Logic
const handleQueuePage = () => {
  const queueBody = document.getElementById('queueTableBody');
  const serviceFilter = document.getElementById('filterService');
  const locationFilter = document.getElementById('filterLocation');
  const queueMessage = document.getElementById('queueMessage');
  const totalInQueue = document.getElementById('totalInQueue');
  const avgWaitTime = document.getElementById('avgWaitTime');

  const updateQueueStats = (data) => {
    if (totalInQueue) totalInQueue.textContent = data.length;
    if (avgWaitTime) {
      const avgTime = data.length > 0 ? Math.round(data.length * 3.5) : 0;
      avgWaitTime.textContent = `${avgTime} min`;
    }
  };

  const loadQueue = async () => {
    const service = serviceFilter?.value || '';
    const location = locationFilter?.value || '';
    
    let url = '../backend/appointments/queue.php?';
    if (service) url += `service_type=${encodeURIComponent(service)}&`;
    if (location) url += `location=${encodeURIComponent(location)}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      queueBody.innerHTML = '';
      
      if (!response.ok || data.error) {
        throw new Error(data.message || 'Failed to load queue');
      }

      if (data.length === 0) {
        queueBody.innerHTML = `
          <tr>
            <td colspan="6" class="text-center py-4">
              <i class="fas fa-inbox"></i> No appointments in the queue
            </td>
          </tr>
        `;
        updateQueueStats([]);
        return;
      }

      updateQueueStats(data);
      
      data.forEach((item, index) => {
        const row = document.createElement('tr');
        row.className = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';
        row.innerHTML = `
          <td class="font-semibold">${item.queue_number}</td>
          <td>${item.fullname}</td>
          <td>
            <span class="service-tag ${item.service_type.replace(/\s+/g, '-').toLowerCase()}">
              ${item.service_type}
            </span>
          </td>
          <td>${item.location}</td>
          <td>${formatTime(item.appointment_time)}</td>
          <td>
            <span class="status-badge ${index < 3 ? 'almost-ready' : 'waiting'}">
              ${index < 3 ? 'Almost Ready' : 'Waiting'}
            </span>
          </td>
        `;
        queueBody.appendChild(row);
      });
    } catch (error) {
      queueBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-4 text-red-500">
            <i class="fas fa-exclamation-triangle"></i> ${error.message}
          </td>
        </tr>
      `;
      updateQueueStats([]);
    }
  };

  if (queueBody) {
    loadQueue();
    serviceFilter?.addEventListener('change', loadQueue);
    locationFilter?.addEventListener('change', loadQueue);
    
    // Real-time updates with WebSocket (simulated with setInterval)
    setInterval(loadQueue, 10000);
    
    // Check for user's queue position in localStorage
    const userQueueNumber = localStorage.getItem('userQueueNumber');
    if (userQueueNumber && document.getElementById('yourPosition')) {
      document.getElementById('yourPosition').textContent = userQueueNumber;
    }
  }
};

// Admin Login Handler
const handleAdminLogin = () => {
  const loginForm = document.getElementById('loginForm');
  const loginMessage = document.getElementById('loginMessage');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const username = document.getElementById('username').value.trim();
      const password = document.getElementById('password').value.trim();

      if (!username || !password) {
        displayMessage(loginMessage, 'Please enter both username and password', false);
        return;
      }

      try {
        const response = await fetch('../backend/admin/login.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username, password })
        });

        const result = await response.json();

        if (response.ok) {
          displayMessage(loginMessage, '✅ Login successful! Redirecting...', true);
          
          // Store admin token (in a real app, you'd use HttpOnly cookies)
          localStorage.setItem('adminToken', result.token);
          
          setTimeout(() => {
            window.location.href = 'admin.html';
          }, 1500);
        } else {
          displayMessage(loginMessage, `❌ ${result.message}`, false);
        }
      } catch (error) {
        displayMessage(loginMessage, '⚠️ Network error. Please try again.', false);
      }
    });
  }
};

// Admin Dashboard Logic
const handleAdminDashboard = () => {
  const adminQueueBody = document.getElementById('adminQueueTableBody');
  const serviceFilter = document.getElementById('adminServiceFilter');
  const centerFilter = document.getElementById('adminCenterFilter');
  const statusFilter = document.getElementById('statusFilter');
  const adminMessage = document.getElementById('adminQueueMessage');
  const totalAppointments = document.getElementById('totalAppointments');
  const completedToday = document.getElementById('completedToday');
  const avgProcessingTime = document.getElementById('avgProcessingTime');

  // Check admin authentication
  const adminToken = localStorage.getItem('adminToken');
  if (!adminToken && window.location.pathname.includes('admin.html')) {
    window.location.href = 'login.html';
    return;
  }

  const updateAdminStats = (data) => {
    if (totalAppointments) totalAppointments.textContent = data.length;
    
    const completed = data.filter(item => item.status === 'Completed').length;
    if (completedToday) completedToday.textContent = completed;
    
    if (avgProcessingTime) {
      const avgTime = data.length > 0 ? 
        Math.round(data.reduce((sum, item) => sum + (item.processing_time || 10), 0) / data.length) : 
        0;
      avgProcessingTime.textContent = `${avgTime} min`;
    }
  };

  const loadAdminQueue = async () => {
    const service = serviceFilter?.value || '';
    const center = centerFilter?.value || '';
    const status = statusFilter?.value || '';
    
    let url = '../backend/admin/fetch_appointments.php?';
    if (service) url += `service_type=${encodeURIComponent(service)}&`;
    if (center) url += `location=${encodeURIComponent(center)}&`;
    if (status) url += `status=${encodeURIComponent(status)}`;

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });
      
      const data = await response.json();

      adminQueueBody.innerHTML = '';
      
      if (!response.ok || data.error) {
        throw new Error(data.message || 'Failed to load appointments');
      }

      if (data.length === 0) {
        adminQueueBody.innerHTML = `
          <tr>
            <td colspan="8" class="text-center py-4">
              <i class="fas fa-inbox"></i> No appointments found
            </td>
          </tr>
        `;
        updateAdminStats([]);
        return;
      }

      updateAdminStats(data);
      
      data.forEach(item => {
        const row = document.createElement('tr');
        row.className = `status-${item.status.toLowerCase().replace(' ', '-')}`;
        row.innerHTML = `
          <td class="font-semibold">${item.queue_number}</td>
          <td>${item.fullname}</td>
          <td>${item.phone}</td>
          <td>
            <span class="service-tag ${item.service_type.replace(/\s+/g, '-').toLowerCase()}">
              ${item.service_type}
            </span>
          </td>
          <td>${item.location}</td>
          <td>${formatDate(item.appointment_date)} at ${formatTime(item.appointment_time)}</td>
          <td>
            <span class="status-badge ${item.status.toLowerCase().replace(' ', '-')}">
              ${item.status}
            </span>
          </td>
          <td class="actions">
            <button class="btn-action edit" data-id="${item.id}">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn-action complete" data-id="${item.id}">
              <i class="fas fa-check"></i>
            </button>
          </td>
        `;
        adminQueueBody.appendChild(row);
      });

      // Add event listeners to action buttons
      document.querySelectorAll('.btn-action.complete').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const appointmentId = e.currentTarget.getAttribute('data-id');
          await updateAppointmentStatus(appointmentId, 'Completed');
        });
      });

    } catch (error) {
      adminQueueBody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center py-4 text-red-500">
            <i class="fas fa-exclamation-triangle"></i> ${error.message}
          </td>
        </tr>
      `;
      updateAdminStats([]);
    }
  };

  const updateAppointmentStatus = async (id, status) => {
    try {
      const response = await fetch('../backend/admin/update_status.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ id, status })
      });

      const result = await response.json();

      if (response.ok) {
        displayMessage(adminMessage, `✅ Appointment marked as ${status}`, true);
        loadAdminQueue();
      } else {
        displayMessage(adminMessage, `❌ ${result.message}`, false);
      }
    } catch (error) {
      displayMessage(adminMessage, '⚠️ Failed to update status', false);
    }
  };

  if (adminQueueBody) {
    loadAdminQueue();
    serviceFilter?.addEventListener('change', loadAdminQueue);
    centerFilter?.addEventListener('change', loadAdminQueue);
    statusFilter?.addEventListener('change', loadAdminQueue);
    
    // Export data functionality
    document.getElementById('exportData')?.addEventListener('click', async () => {
      try {
        const response = await fetch('../backend/admin/export.php', {
          headers: {
            'Authorization': `Bearer ${adminToken}`
          }
        });
        
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `hudumaq-export-${new Date().toISOString().split('T')[0]}.csv`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        } else {
          const result = await response.json();
          displayMessage(adminMessage, `❌ ${result.message}`, false);
        }
      } catch (error) {
        displayMessage(adminMessage, '⚠️ Failed to export data', false);
      }
    });

    // Auto-refresh every 15 seconds
    setInterval(loadAdminQueue, 15000);
  }
};

// Admin Registration Handler
const handleAdminRegistration = () => {
  const registerForm = document.getElementById('registerForm');
  const registerMessage = document.getElementById('registerMessage');

  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const username = document.getElementById('username').value.trim();
      const password = document.getElementById('password').value.trim();
      const confirmPassword = document.getElementById('confirmPassword').value.trim();

      // Validation
      if (!username || !password || !confirmPassword) {
        displayMessage(registerMessage, 'All fields are required', false);
        return;
      }

      if (password !== confirmPassword) {
        displayMessage(registerMessage, 'Passwords do not match', false);
        return;
      }

      if (password.length < 8) {
        displayMessage(registerMessage, 'Password must be at least 8 characters', false);
        return;
      }

      try {
        const response = await fetch('/HudumaQ/backend/admin/register.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username, password })
        });

        const result = await response.json();

        if (response.ok) {
          displayMessage(registerMessage, '✅ Admin registered successfully! Redirecting...', true);
          registerForm.reset();
          
          setTimeout(() => {
            window.location.href = 'login.html';
          }, 1500);
        } else {
          displayMessage(registerMessage, `❌ ${result.message}`, false);
        }
      } catch (error) {
        displayMessage(registerMessage, '⚠️ Network error. Please try again.', false);
      }
    });
  }
};

// Logout Functionality
const handleLogout = () => {
  const logoutLinks = document.querySelectorAll('a[href="login.html"]');
  
  logoutLinks.forEach(link => {
    if (link.textContent.includes('Logout')) {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('adminToken');
        window.location.href = 'login.html';
      });
    }
  });
};

// Initialize all handlers when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  setMinDate();
  handleBookingForm();
  handleQueuePage();
  handleAdminLogin();
  handleAdminDashboard();
  handleAdminRegistration();
  handleLogout();
  
  // Add service icons dynamically
  document.querySelectorAll('#service_type option, #filterService option').forEach(option => {
    if (option.value) {
      const icon = getServiceIcon(option.value);
      option.innerHTML = `${icon} ${option.text}`;
    }
  });
});

// Helper function to get service icons
const getServiceIcon = (service) => {
  const icons = {
    'ID Replacement': '🆔',
    'Birth & Death Certificates': '👶',
    'NHIF Services': '🏥',
    'NSSF Services': '🏦',
    'KRA Services': '💰',
    'Helb Services': '🎓',
    'Police Abstracts': '👮',
    'E-Citizen Services': '💻',
    'Good Conduct': '📜',
    'Job Application': '💼'
  };

  for (const [key, icon] of Object.entries(icons)) {
    if (service.includes(key)) return icon;
  }
  return '📋';
};