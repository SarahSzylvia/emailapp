/**
 * Reschedule Appointment Widget for Zoho CRM
 * Handles appointment rescheduling functionality with popup modal
 */

class RescheduleAppointmentWidget {
    constructor() {
        this.currentAppointment = null;
        this.modal = null;
        this.form = null;
        this.isLoading = false;
        
        // Initialize the widget
        this.init();
    }

    /**
     * Initialize the widget
     */
    init() {
        this.bindEvents();
        this.loadCurrentAppointmentData();
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        const rescheduleBtn = document.getElementById('rescheduleBtn');
        const closeModal = document.getElementById('closeModal');
        const cancelBtn = document.getElementById('cancelBtn');
        const confirmBtn = document.getElementById('confirmReschedule');
        const modal = document.getElementById('rescheduleModal');

        if (rescheduleBtn) {
            rescheduleBtn.addEventListener('click', () => this.openModal());
        }

        if (closeModal) {
            closeModal.addEventListener('click', () => this.closeModal());
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.closeModal());
        }

        if (confirmBtn) {
            confirmBtn.addEventListener('click', (e) => this.handleReschedule(e));
        }

        // Close modal when clicking outside
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        }

        // Handle ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isModalOpen()) {
                this.closeModal();
            }
        });

        // Form validation
        const form = document.getElementById('rescheduleForm');
        if (form) {
            form.addEventListener('input', () => this.validateForm());
        }
    }

    /**
     * Load current appointment data from Zoho CRM
     */
    async loadCurrentAppointmentData() {
        try {
            // Get current record ID from Zoho CRM context
            const recordId = await this.getCurrentRecordId();
            
            if (!recordId) {
                this.showMessage('Unable to get current record ID', 'error');
                return;
            }

            // Fetch appointment data
            const appointmentData = await this.fetchAppointmentData(recordId);
            
            if (appointmentData) {
                this.currentAppointment = appointmentData;
                this.populateCurrentAppointmentData();
            }
        } catch (error) {
            console.error('Error loading appointment data:', error);
            this.showMessage('Error loading appointment data', 'error');
        }
    }

    /**
     * Get current record ID from Zoho CRM
     */
    async getCurrentRecordId() {
        try {
            // For Zoho CRM widget context
            if (typeof ZOHO !== 'undefined' && ZOHO.CRM) {
                const entity = await ZOHO.CRM.UI.Record.get();
                return entity.data[0].id;
            }
            
            // Fallback: try to get from URL parameters
            const urlParams = new URLSearchParams(window.location.search);
            return urlParams.get('recordId') || urlParams.get('id');
        } catch (error) {
            console.error('Error getting record ID:', error);
            return null;
        }
    }

    /**
     * Fetch appointment data from Zoho CRM
     */
    async fetchAppointmentData(recordId) {
        try {
            if (typeof ZOHO !== 'undefined' && ZOHO.CRM) {
                const response = await ZOHO.CRM.API.getRecord({
                    Entity: 'Appointment_Bookings',
                    RecordID: recordId
                });
                
                if (response.data && response.data.length > 0) {
                    return response.data[0];
                }
            }
            
            // Mock data for testing purposes
            return {
                id: recordId,
                Appointment_Start_Date_Time: '2025-09-08T14:00:00',
                Name: 'BOOK-001',
                Appointment_For: 'John Doe',
                Doctor_Name: 'Dr. Smith'
            };
        } catch (error) {
            console.error('Error fetching appointment data:', error);
            throw error;
        }
    }

    /**
     * Populate current appointment data in the form
     */
    populateCurrentAppointmentData() {
        if (!this.currentAppointment) return;

        const rescheduleFromField = document.getElementById('rescheduleFrom');
        if (rescheduleFromField && this.currentAppointment.Appointment_Start_Date_Time) {
            const formattedDate = this.formatDateTimeForDisplay(this.currentAppointment.Appointment_Start_Date_Time);
            rescheduleFromField.value = formattedDate;
        }
    }

    /**
     * Format date time for display (Sep 8, 2025 02:00 PM format)
     */
    formatDateTimeForDisplay(dateTimeString) {
        try {
            const date = new Date(dateTimeString);
            
            const options = {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            };
            
            return date.toLocaleDateString('en-US', options);
        } catch (error) {
            console.error('Error formatting date:', error);
            return dateTimeString;
        }
    }

    /**
     * Format date time for Zoho CRM API (ISO format)
     */
    formatDateTimeForAPI(dateTimeString) {
        try {
            const date = new Date(dateTimeString);
            return date.toISOString();
        } catch (error) {
            console.error('Error formatting date for API:', error);
            return dateTimeString;
        }
    }

    /**
     * Open the reschedule modal
     */
    openModal() {
        const modal = document.getElementById('rescheduleModal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Focus on first input field
            const firstInput = modal.querySelector('input:not([readonly]), select, textarea');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }
    }

    /**
     * Close the reschedule modal
     */
    closeModal() {
        const modal = document.getElementById('rescheduleModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
            this.resetForm();
        }
    }

    /**
     * Check if modal is open
     */
    isModalOpen() {
        const modal = document.getElementById('rescheduleModal');
        return modal && modal.classList.contains('active');
    }

    /**
     * Reset the form
     */
    resetForm() {
        const form = document.getElementById('rescheduleForm');
        if (form) {
            form.reset();
            // Repopulate the reschedule from field
            this.populateCurrentAppointmentData();
        }
    }

    /**
     * Validate the form
     */
    validateForm() {
        const newDateTime = document.getElementById('newAppointmentDateTime').value;
        const rescheduleReason = document.getElementById('rescheduleReason').value;
        const confirmBtn = document.getElementById('confirmReschedule');
        
        const isValid = newDateTime && rescheduleReason;
        
        if (confirmBtn) {
            confirmBtn.disabled = !isValid;
        }
        
        return isValid;
    }

    /**
     * Handle reschedule appointment
     */
    async handleReschedule(event) {
        event.preventDefault();
        
        if (!this.validateForm()) {
            this.showMessage('Please fill in all required fields', 'error');
            return;
        }

        if (this.isLoading) return;

        try {
            this.setLoading(true);

            const formData = this.getFormData();
            const result = await this.updateAppointment(formData);

            if (result.success) {
                this.showMessage('Appointment rescheduled successfully!', 'success');
                this.closeModal();
                
                // Refresh the page to show updated data
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                this.showMessage(result.message || 'Failed to reschedule appointment', 'error');
            }
        } catch (error) {
            console.error('Error rescheduling appointment:', error);
            this.showMessage('An error occurred while rescheduling the appointment', 'error');
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Get form data
     */
    getFormData() {
        const newDateTime = document.getElementById('newAppointmentDateTime').value;
        const rescheduleReason = document.getElementById('rescheduleReason').value;
        const rescheduleNote = document.getElementById('rescheduleNote').value;

        return {
            recordId: this.currentAppointment.id,
            originalDateTime: this.currentAppointment.Appointment_Start_Date_Time,
            newDateTime: newDateTime,
            rescheduleReason: rescheduleReason,
            rescheduleNote: rescheduleNote
        };
    }

    /**
     * Update appointment in Zoho CRM
     */
    async updateAppointment(formData) {
        try {
            const updateData = {
                // Update existing fields
                Appointment_Start_Date_Time: this.formatDateTimeForAPI(formData.newDateTime),
                
                // Add new fields for tracking reschedule history
                Rescheduled_From: this.formatDateTimeForAPI(formData.originalDateTime),
                Rescheduled_To: this.formatDateTimeForAPI(formData.newDateTime),
                Reschedule_Reason: formData.rescheduleReason,
                Rescheduled_By: formData.rescheduleNote
            };

            if (typeof ZOHO !== 'undefined' && ZOHO.CRM) {
                const response = await ZOHO.CRM.API.updateRecord({
                    Entity: 'Appointment_Bookings',
                    RecordID: formData.recordId,
                    APIData: updateData
                });

                return {
                    success: response.data && response.data[0] && response.data[0].code === 'SUCCESS',
                    message: response.data && response.data[0] ? response.data[0].message : 'Unknown error'
                };
            }

            // Mock success for testing
            console.log('Mock update data:', updateData);
            return { success: true, message: 'Appointment updated successfully' };

        } catch (error) {
            console.error('Error updating appointment:', error);
            return { success: false, message: error.message || 'Failed to update appointment' };
        }
    }

    /**
     * Set loading state
     */
    setLoading(loading) {
        this.isLoading = loading;
        const loadingOverlay = document.getElementById('loadingOverlay');
        const confirmBtn = document.getElementById('confirmReschedule');

        if (loadingOverlay) {
            if (loading) {
                loadingOverlay.classList.add('active');
            } else {
                loadingOverlay.classList.remove('active');
            }
        }

        if (confirmBtn) {
            confirmBtn.disabled = loading;
        }
    }

    /**
     * Show message to user
     */
    showMessage(message, type = 'info') {
        const container = document.getElementById('messageContainer');
        if (!container) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        messageDiv.innerHTML = `
            ${message}
            <button class="message-close" onclick="this.parentElement.remove()">&times;</button>
        `;

        container.appendChild(messageDiv);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentElement) {
                messageDiv.remove();
            }
        }, 5000);
    }

    /**
     * Initialize Zoho CRM widget
     */
    static async initZohoWidget() {
        try {
            if (typeof ZOHO !== 'undefined' && ZOHO.embeddedApp) {
                await ZOHO.embeddedApp.init();
                
                // Set widget dimensions
                ZOHO.embeddedApp.on('PageLoad', function(data) {
                    console.log('Zoho widget loaded:', data);
                });
            }
        } catch (error) {
            console.error('Error initializing Zoho widget:', error);
        }
    }
}

// Utility functions
const Utils = {
    /**
     * Debounce function
     */
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Format date for datetime-local input
     */
    formatDateForInput: (dateString) => {
        try {
            const date = new Date(dateString);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            
            return `${year}-${month}-${day}T${hours}:${minutes}`;
        } catch (error) {
            console.error('Error formatting date for input:', error);
            return '';
        }
    },

    /**
     * Validate date is in the future
     */
    isDateInFuture: (dateString) => {
        try {
            const date = new Date(dateString);
            const now = new Date();
            return date > now;
        } catch (error) {
            return false;
        }
    }
};

// Initialize the widget when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Initialize Zoho widget if available
        await RescheduleAppointmentWidget.initZohoWidget();
        
        // Create widget instance
        window.rescheduleWidget = new RescheduleAppointmentWidget();
        
        console.log('Reschedule Appointment Widget initialized successfully');
    } catch (error) {
        console.error('Error initializing widget:', error);
    }
});

// Add additional validation for new appointment date
document.addEventListener('DOMContentLoaded', () => {
    const newDateTimeInput = document.getElementById('newAppointmentDateTime');
    
    if (newDateTimeInput) {
        newDateTimeInput.addEventListener('change', (e) => {
            const selectedDate = e.target.value;
            
            if (selectedDate && !Utils.isDateInFuture(selectedDate)) {
                alert('Please select a future date and time for the appointment.');
                e.target.value = '';
                return;
            }
            
            // Additional validation: Check if it's during business hours (optional)
            if (selectedDate) {
                const date = new Date(selectedDate);
                const hour = date.getHours();
                const day = date.getDay(); // 0 = Sunday, 6 = Saturday
                
                // Example: Only allow appointments Monday-Friday, 9 AM - 5 PM
                if (day === 0 || day === 6) {
                    if (confirm('The selected date is on a weekend. Do you want to continue?')) {
                        return;
                    } else {
                        e.target.value = '';
                        return;
                    }
                }
                
                if (hour < 9 || hour >= 17) {
                    if (confirm('The selected time is outside business hours (9 AM - 5 PM). Do you want to continue?')) {
                        return;
                    } else {
                        e.target.value = '';
                        return;
                    }
                }
            }
        });
    }
});

// Export for use in other scripts if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RescheduleAppointmentWidget, Utils };
}