/**
 * Reschedule Appointment Widget for Zoho CRM
 * Follows Zoho CRM widget structure pattern
 */

ZOHO.embeddedApp.on("PageLoad", function (data) {
    // DOM elements
    const rescheduleBtn = document.getElementById("rescheduleBtn");
    const rescheduleModal = document.getElementById("rescheduleModal");
    const closeModal = document.getElementById("closeModal");
    const cancelBtn = document.getElementById("cancelBtn");
    const confirmBtn = document.getElementById("confirmReschedule");
    const rescheduleForm = document.getElementById("rescheduleForm");
    const loadingOverlay = document.getElementById("loadingOverlay");
    const messageContainer = document.getElementById("messageContainer");
    
    // Form fields
    const rescheduleFromField = document.getElementById("rescheduleFrom");
    const newAppointmentDateTime = document.getElementById("newAppointmentDateTime");
    const rescheduleReason = document.getElementById("rescheduleReason");
    const rescheduleNote = document.getElementById("rescheduleNote");

    // State variables
    let currentAppointmentData = null;
    let currentRecordId = null;
    let isLoading = false;

    /**
     * Initialize the widget with current record data
     */
    function initializeWidget() {
        if (data.Entity === "Appointment_Bookings" && data.EntityId) {
            currentRecordId = data.EntityId;
            fetchCurrentAppointmentData();
        } else {
            showMessage("This widget should be used in Appointment_Bookings module", "error");
        }
    }

    /**
     * Fetch current appointment data from Zoho CRM
     */
    async function fetchCurrentAppointmentData() {
        try {
            const response = await ZOHO.CRM.API.getRecord({
                Entity: "Appointment_Bookings",
                RecordID: currentRecordId,
                fields: [
                    "Name", 
                    "Appointment_Start_Date_Time", 
                    "Appointment_End_Date_Time",
                    "Appointment_For",
                    "Doctor_Name",
                    "Service_Name",
                    "Duration",
                    "Appointment_Mode"
                ]
            });

            if (response.data && response.data.length > 0) {
                currentAppointmentData = response.data[0];
                populateRescheduleFromField();
                console.log("Current appointment data loaded:", currentAppointmentData);
            } else {
                showMessage("Unable to load appointment data", "error");
            }
        } catch (error) {
            console.error("Error fetching appointment data:", error);
            showMessage("Error loading appointment data", "error");
        }
    }

    /**
     * Populate the "Reschedule From" field with current appointment date
     */
    function populateRescheduleFromField() {
        if (currentAppointmentData && currentAppointmentData.Appointment_Start_Date_Time) {
            const formattedDate = formatDateTimeForDisplay(currentAppointmentData.Appointment_Start_Date_Time);
            rescheduleFromField.value = formattedDate;
        }
    }

    /**
     * Format date time for display (Sep 8, 2025 02:00 PM format)
     */
    function formatDateTimeForDisplay(dateTimeString) {
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
    function formatDateTimeForAPI(dateTimeString) {
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
    function openModal() {
        if (!currentAppointmentData) {
            showMessage("Please wait for appointment data to load", "error");
            return;
        }
        
        rescheduleModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Focus on first input field
        setTimeout(() => {
            if (newAppointmentDateTime) {
                newAppointmentDateTime.focus();
            }
        }, 100);
    }

    /**
     * Close the reschedule modal
     */
    function closeModalHandler() {
        rescheduleModal.classList.remove('active');
        document.body.style.overflow = '';
        resetForm();
    }

    /**
     * Reset the form
     */
    function resetForm() {
        if (rescheduleForm) {
            rescheduleForm.reset();
            populateRescheduleFromField();
        }
        
        // Remove validation error classes
        const errorFields = document.querySelectorAll('.error-field');
        errorFields.forEach(field => field.classList.remove('error-field'));
    }

    /**
     * Validate the form
     */
    function validateForm() {
        const newDateTime = newAppointmentDateTime.value;
        const reason = rescheduleReason.value;
        
        let isValid = true;
        
        // Clear previous error states
        newAppointmentDateTime.classList.remove('error-field');
        rescheduleReason.classList.remove('error-field');
        
        if (!newDateTime) {
            newAppointmentDateTime.classList.add('error-field');
            isValid = false;
        }
        
        if (!reason) {
            rescheduleReason.classList.add('error-field');
            isValid = false;
        }
        
        // Validate future date
        if (newDateTime && !isDateInFuture(newDateTime)) {
            newAppointmentDateTime.classList.add('error-field');
            showMessage("Please select a future date and time", "error");
            isValid = false;
        }
        
        // Update confirm button state
        if (confirmBtn) {
            confirmBtn.disabled = !isValid;
        }
        
        return isValid;
    }

    /**
     * Check if date is in the future
     */
    function isDateInFuture(dateString) {
        try {
            const date = new Date(dateString);
            const now = new Date();
            return date > now;
        } catch (error) {
            return false;
        }
    }

    /**
     * Handle reschedule appointment submission
     */
    async function handleReschedule(event) {
        event.preventDefault();
        
        if (!validateForm() || isLoading) {
            return;
        }

        if (!currentRecordId || !currentAppointmentData) {
            showMessage("Missing appointment data. Please refresh and try again.", "error");
            return;
        }

        try {
            setLoading(true);

            const formData = getFormData();
            const updateResult = await updateAppointmentRecord(formData);

            if (updateResult.success) {
                showMessage("Appointment rescheduled successfully!", "success");
                closeModalHandler();
                
                // Refresh the record view to show updated data
                setTimeout(() => {
                    ZOHO.CRM.UI.Record.refresh();
                }, 1500);
            } else {
                showMessage(updateResult.message || "Failed to reschedule appointment", "error");
            }
        } catch (error) {
            console.error("Error rescheduling appointment:", error);
            showMessage("An unexpected error occurred while rescheduling", "error");
        } finally {
            setLoading(false);
        }
    }

    /**
     * Get form data for update
     */
    function getFormData() {
        return {
            recordId: currentRecordId,
            originalDateTime: currentAppointmentData.Appointment_Start_Date_Time,
            newDateTime: newAppointmentDateTime.value,
            rescheduleReason: rescheduleReason.value,
            rescheduleNote: rescheduleNote.value
        };
    }

    /**
     * Update appointment record in Zoho CRM
     */
    async function updateAppointmentRecord(formData) {
        try {
            const updateData = {
                // Update the main appointment date/time
                Appointment_Start_Date_Time: formatDateTimeForAPI(formData.newDateTime),
                
                // Add reschedule tracking fields
                Rescheduled_From: formatDateTimeForAPI(formData.originalDateTime),
                Rescheduled_To: formatDateTimeForAPI(formData.newDateTime),
                Reschedule_Reason: formData.rescheduleReason,
                Rescheduled_By: formData.rescheduleNote
            };

            // Calculate new end time if duration is available
            if (currentAppointmentData.Duration) {
                const newStartTime = new Date(formData.newDateTime);
                const durationMinutes = parseInt(currentAppointmentData.Duration) || 30;
                const newEndTime = new Date(newStartTime.getTime() + (durationMinutes * 60000));
                updateData.Appointment_End_Date_Time = formatDateTimeForAPI(newEndTime.toISOString());
            }

            console.log("Updating record with data:", updateData);

            const response = await ZOHO.CRM.API.updateRecord({
                Entity: "Appointment_Bookings",
                RecordID: formData.recordId,
                APIData: updateData
            });

            console.log("Update response:", response);

            if (response.data && response.data[0] && response.data[0].code === "SUCCESS") {
                return { success: true, message: "Appointment rescheduled successfully" };
            } else {
                const errorMessage = response.data?.[0]?.message || "Unknown error occurred";
                return { success: false, message: errorMessage };
            }

        } catch (error) {
            console.error("Error updating appointment record:", error);
            return { success: false, message: error.message || "Failed to update appointment" };
        }
    }

    /**
     * Set loading state
     */
    function setLoading(loading) {
        isLoading = loading;
        
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
    function showMessage(message, type = 'info') {
        if (!messageContainer) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        messageDiv.innerHTML = `
            ${message}
            <button class="message-close" onclick="this.parentElement.remove()">&times;</button>
        `;

        messageContainer.appendChild(messageDiv);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentElement) {
                messageDiv.remove();
            }
        }, 5000);
    }

    /**
     * Validate business hours (optional)
     */
    function validateBusinessHours(dateTimeString) {
        const date = new Date(dateTimeString);
        const hour = date.getHours();
        const day = date.getDay(); // 0 = Sunday, 6 = Saturday
        
        // Example: Only allow appointments Monday-Friday, 9 AM - 5 PM
        if (day === 0 || day === 6) {
            return confirm('The selected date is on a weekend. Do you want to continue?');
        }
        
        if (hour < 9 || hour >= 17) {
            return confirm('The selected time is outside business hours (9 AM - 5 PM). Do you want to continue?');
        }
        
        return true;
    }

    // Event Listeners
    if (rescheduleBtn) {
        rescheduleBtn.addEventListener('click', openModal);
    }

    if (closeModal) {
        closeModal.addEventListener('click', closeModalHandler);
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeModalHandler);
    }

    if (confirmBtn) {
        confirmBtn.addEventListener('click', handleReschedule);
    }

    // Close modal when clicking outside
    if (rescheduleModal) {
        rescheduleModal.addEventListener('click', (e) => {
            if (e.target === rescheduleModal) {
                closeModalHandler();
            }
        });
    }

    // Handle ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && rescheduleModal && rescheduleModal.classList.contains('active')) {
            closeModalHandler();
        }
    });

    // Form validation on input
    if (newAppointmentDateTime) {
        newAppointmentDateTime.addEventListener('change', (e) => {
            const selectedDate = e.target.value;
            
            if (selectedDate && !isDateInFuture(selectedDate)) {
                showMessage('Please select a future date and time for the appointment.', 'error');
                e.target.value = '';
                return;
            }
            
            // Business hours validation
            if (selectedDate && !validateBusinessHours(selectedDate)) {
                e.target.value = '';
                return;
            }
            
            validateForm();
        });
    }

    if (rescheduleReason) {
        rescheduleReason.addEventListener('change', validateForm);
    }

    // Initialize the widget
    initializeWidget();
});

// Initialize Zoho embedded app
ZOHO.embeddedApp.init();