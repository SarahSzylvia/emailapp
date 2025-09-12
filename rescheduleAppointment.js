ZOHO.embeddedApp.on("PageLoad", function (data) {
    // DOM elements
    const rescheduleModal = document.getElementById("rescheduleModal");
    const closeModal = document.getElementById("closeModal");
    const cancelBtn = document.getElementById("cancelBtn");
    const confirmBtn = document.getElementById("confirmReschedule");
    const rescheduleForm = document.getElementById("rescheduleForm");
    const loadingOverlay = document.getElementById("loadingOverlay");
    const messageContainer = document.getElementById("messageContainer");

    // Form fields
    const rescheduleFromField = document.getElementById("rescheduleFrom");
    const appointmentDate = document.getElementById("appointmentDate");
    const appointmentTime = document.getElementById("appointmentTime");
    const rescheduleReason = document.getElementById("rescheduleReason");
    const rescheduleNote = document.getElementById("rescheduleNote");
    
    
    // Calendar elements
    const calendarContainer = document.getElementById("calendarContainer");
    const currentMonthSpan = document.getElementById("currentMonth");
    const prevMonthBtn = document.getElementById("prevMonth");
    const nextMonthBtn = document.getElementById("nextMonth");
    const calendarDays = document.getElementById("calendarDays");

    // State
    let currentAppointmentData = null;
    let currentRecordId = null;
    let isLoading = false;
    let currentCalendarDate = new Date();
    let selectedDate = null;

    /** Initialize widget **/
    function initializeWidget() {
        if (data.Entity === "Appointment_Bookings" && data.EntityId) {
            currentRecordId = data.EntityId;
            fetchCurrentAppointmentData().then(() => {
                // Auto-open modal when widget loads since it's linked to button
                openModal();
            });
        } else {
            showMessage("This widget should be used in Appointment_Bookings module", "error");
        }
    }

    /** Fetch current record **/
    async function fetchCurrentAppointmentData() {
        try {
            const response = await ZOHO.CRM.API.getRecord({
                Entity: "Appointment_Bookings",
                RecordID: currentRecordId
            });

            if (response.data && response.data.length > 0) {
                currentAppointmentData = response.data[0];
                console.log('Current appointment data:', currentAppointmentData);
                populateRescheduleFromField();
            } else {
                showMessage("Unable to load appointment data", "error");
            }
        } catch (error) {
            console.error('Error fetching appointment data:', error);
            showMessage("Error loading appointment data", "error");
        }
    }

    /** Populate "Reschedule From" field **/
    function populateRescheduleFromField() {
        if (currentAppointmentData && currentAppointmentData.Appointment_Start_Date_Time) {
            rescheduleFromField.value = formatDateTimeForDisplay(currentAppointmentData.Appointment_Start_Date_Time);
        }
    }


    /** Format for display: Sep 8, 2025 02:00 PM **/
    function formatDateTimeForDisplay(dateTimeString) {
        const date = new Date(dateTimeString);
        const options = {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true
        };
        return date.toLocaleDateString("en-US", options);
    }

    /** Format for API with IST timezone **/
    function formatDateTimeForAPI(dateObject) {
        if (!dateObject) return null;
        
        // Get IST offset (+05:30)
        const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
        const istDate = new Date(dateObject.getTime() + istOffset);
        
        // Format as ISO string but replace Z with +05:30
        const isoString = istDate.toISOString();
        return isoString.replace('Z', '+05:30');
    }

    /** Open modal **/
    function openModal() {
        if (!currentAppointmentData) {
            showMessage("Please wait for appointment data to load", "error");
            return;
        }
        rescheduleModal.classList.add("active");
        document.body.style.overflow = "hidden";
        initializeTimeSlots();
        renderCalendar();
    }

    /** Close modal **/
    function closeModalHandler() {
        rescheduleModal.classList.remove("active");
        document.body.style.overflow = "";
        rescheduleForm.reset();
        populateRescheduleFromField();
    }

    /** Initialize time slots **/
    function initializeTimeSlots() {
        const timeSlots = [
            "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
            "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM",
            "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM",
            "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM", "08:00 PM"
        ];
        
        appointmentTime.innerHTML = '<option value="">Select Time</option>';
        timeSlots.forEach(time => {
            const option = document.createElement('option');
            option.value = time;
            option.textContent = time;
            appointmentTime.appendChild(option);
        });
    }

    /** Render calendar **/
    function renderCalendar() {
        const year = currentCalendarDate.getFullYear();
        const month = currentCalendarDate.getMonth();
        
        // Set month header
        const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"];
        currentMonthSpan.textContent = `${monthNames[month]} ${year}`;
        
        // Clear previous days
        calendarDays.innerHTML = '';
        
        // Get first day of month and number of days
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = (firstDay.getDay() + 6) % 7; // Convert to Monday = 0
        
        // Add empty cells for days before month starts
        for (let i = 0; i < startingDayOfWeek; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty';
            calendarDays.appendChild(emptyDay);
        }
        
        // Add days of the month
        const today = new Date();
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = day;
            
            const currentDate = new Date(year, month, day);
            
            // Disable past dates
            if (currentDate <= today) {
                dayElement.classList.add('disabled');
            } else {
                dayElement.addEventListener('click', () => selectDate(currentDate));
            }
            
            // Highlight selected date
            if (selectedDate && 
                currentDate.getDate() === selectedDate.getDate() &&
                currentDate.getMonth() === selectedDate.getMonth() &&
                currentDate.getFullYear() === selectedDate.getFullYear()) {
                dayElement.classList.add('selected');
            }
            
            calendarDays.appendChild(dayElement);
        }
    }

    /** Select date **/
    function selectDate(date) {
        selectedDate = date;
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        appointmentDate.value = date.toLocaleDateString('en-US', options);
        calendarContainer.style.display = 'none';
        renderCalendar(); // Re-render to show selection
    }

    /** Validate form **/
    function validateForm() {
        let isValid = true;

        if (!appointmentDate.value) {
            appointmentDate.classList.add("error-field");
            showMessage("Please select an appointment date", "error");
            isValid = false;
        } else {
            appointmentDate.classList.remove("error-field");
        }

        if (!appointmentTime.value) {
            appointmentTime.classList.add("error-field");
            showMessage("Please select an appointment time", "error");
            isValid = false;
        } else {
            appointmentTime.classList.remove("error-field");
        }

        if (!rescheduleReason.value) {
            rescheduleReason.classList.add("error-field");
            showMessage("Please select a reschedule reason", "error");
            isValid = false;
        } else {
            rescheduleReason.classList.remove("error-field");
        }

        if (selectedDate && selectedDate <= new Date()) {
            showMessage("Please select a future date", "error");
            isValid = false;
        }

        return isValid;
    }

    /** Combine date and time into a JS Date object **/
    function combineDateTime(date, timeString) {
        if (!date || !timeString) return null;

        // Extract hours and minutes from "hh:mm AM/PM"
        const [time, modifier] = timeString.split(" ");
        let [hours, minutes] = time.split(":").map(Number);

        if (modifier === "PM" && hours !== 12) hours += 12;
        if (modifier === "AM" && hours === 12) hours = 0;

        // Clone selected date and apply time
        const combined = new Date(date);
        combined.setHours(hours, minutes, 0, 0);

        return combined;
    }

    /** Create update payload with all existing fields **/
    function createUpdatePayload(newDateTime) {
        if (!currentAppointmentData || !newDateTime) {
            console.error('Missing required data for update payload');
            return null;
        }

        // Start with a copy of the existing record data
        const updateData = { ...currentAppointmentData };

        // Remove system fields that shouldn't be updated
        const systemFields = ['id', 'Created_Time', 'Modified_Time', 'Created_By', 'Modified_By', '$approved', '$approval', '$approval_state'];
        systemFields.forEach(field => {
            delete updateData[field];
        });

        // Update the fields we want to change
        const formattedDateTime = formatDateTimeForAPI(newDateTime);
        updateData.Appointment_Start_Date_Time = formattedDateTime;
        updateData.Rescheduled_From = currentAppointmentData.Appointment_Start_Date_Time;
        updateData.Rescheduled_To = formattedDateTime;
        updateData.Reschedule_Reason = rescheduleReason.value;
        
        // Only add reschedule note if it has a value
        if (rescheduleNote.value.trim()) {
            updateData.Rescheduled_By = rescheduleNote.value.trim();
        }

        console.log('Update payload created:', updateData);
        return updateData;
    }

    /** Handle reschedule **/
    async function handleReschedule(event) {
        event.preventDefault();
        if (!validateForm() || isLoading) return;

        try {
            setLoading(true);
            
            // Combine selected date and time
            const newDateTime = combineDateTime(selectedDate, appointmentTime.value);
            if (!newDateTime) {
                showMessage("Invalid date or time selected", "error");
                return;
            }

            // Create the update payload with all existing fields
            const updatePayload = createUpdatePayload(newDateTime);
            if (!updatePayload) {
                showMessage("Failed to prepare update data", "error");
                return;
            }

            console.log('Sending update request with data:', updatePayload);

            const updateResponse = await ZOHO.CRM.API.updateRecord({
                Entity: "Appointment_Bookings",
                RecordID: currentRecordId,
                APIData: updatePayload
            });

            console.log('Update response:', updateResponse);

            // Handle different response structures
            if (updateResponse && updateResponse.data) {
                // Check if it's an array response
                if (Array.isArray(updateResponse.data) && updateResponse.data.length > 0) {
                    const responseItem = updateResponse.data[0];
                    if (responseItem.code === "SUCCESS") {
                        showMessage("Appointment rescheduled successfully!", "success");
                        closeModalHandler();
                        setTimeout(() => {
                            try {
                                ZOHO.CRM.UI.Record.refresh();
                            } catch (refreshError) {
                                console.log('Refresh not available in current context');
                            }
                        }, 1500);
                        return;
                    } else {
                        const errorMsg = responseItem.message || "Failed to reschedule appointment";
                        showMessage(errorMsg, "error");
                        console.error('Update failed:', responseItem);
                        return;
                    }
                }
                // Check if it's a direct success response
                else if (updateResponse.data.id || updateResponse.status === "success") {
                    showMessage("Appointment rescheduled successfully!", "success");
                    closeModalHandler();
                    setTimeout(() => {
                        try {
                            ZOHO.CRM.UI.Record.refresh();
                        } catch (refreshError) {
                            console.log('Refresh not available in current context');
                        }
                    }, 1500);
                    return;
                }
            }
            
            // If we reach here, check for other success indicators
            if (updateResponse && (updateResponse.status === "success" || updateResponse.code === "SUCCESS")) {
                showMessage("Appointment rescheduled successfully!", "success");
                closeModalHandler();
                setTimeout(() => {
                    try {
                        ZOHO.CRM.UI.Record.refresh();
                    } catch (refreshError) {
                        console.log('Refresh not available in current context');
                    }
                }, 1500);
            } else {
                // Extract error message from various possible locations
                let errorMsg = "Failed to reschedule appointment";
                if (updateResponse && updateResponse.message) {
                    errorMsg = updateResponse.message;
                } else if (updateResponse && updateResponse.data && updateResponse.data.message) {
                    errorMsg = updateResponse.data.message;
                } else if (updateResponse && updateResponse.error) {
                    errorMsg = updateResponse.error;
                }
                showMessage(errorMsg, "error");
                console.error('Update failed - Full response:', updateResponse);
            }
        } catch (error) {
            console.error('Reschedule error - Full error object:', error);
            console.error('Error name:', error.name);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
            
            let errorMessage = "An unexpected error occurred";
            
            // Check if this is actually a successful response that was thrown as an error
            if (error.data && Array.isArray(error.data) && error.data.length > 0) {
                const responseItem = error.data[0];
                console.log('Error object contains data array:');
                console.log('Response item:', responseItem);
                console.log('Response code:', responseItem.code);
                console.log('Response status:', responseItem.status);
                console.log('Response message:', responseItem.message);
                
                if (responseItem.code === "SUCCESS") {
                    showMessage("Appointment rescheduled successfully!", "success");
                    closeModalHandler();
                    setTimeout(() => {
                        try {
                            ZOHO.CRM.UI.Record.refresh();
                        } catch (refreshError) {
                            console.log('Refresh not available in current context');
                        }
                    }, 1500);
                    return;
                } else if (responseItem.message) {
                    errorMessage = responseItem.message;
                    // If it's a MANDATORY_NOT_FOUND error, provide more specific guidance
                    if (responseItem.code === "MANDATORY_NOT_FOUND") {
                        errorMessage += ". Please ensure all required fields are filled in the original appointment record.";
                        console.error('MANDATORY_NOT_FOUND details:', responseItem.details);
                    }
                }
            } else if (error.message) {
                errorMessage += ": " + error.message;
            }
            
            showMessage(errorMessage, "error");
        } finally {
            setLoading(false);
        }
    }

    /** Loading state **/
    function setLoading(state) {
        isLoading = state;
        loadingOverlay.classList.toggle("active", state);
        confirmBtn.disabled = state;
    }

    /** Show toast **/
    function showMessage(msg, type) {
        const message = document.createElement("div");
        message.className = `message message-${type}`;
        message.innerText = msg;

        const closeBtn = document.createElement("button");
        closeBtn.className = "message-close";
        closeBtn.innerHTML = "&times;";
        closeBtn.onclick = () => message.remove();

        message.appendChild(closeBtn);
        messageContainer.appendChild(message);

        setTimeout(() => message.remove(), 4000);
    }

    // Calendar event listeners
    appointmentDate.addEventListener('click', () => {
        calendarContainer.style.display = calendarContainer.style.display === 'none' ? 'block' : 'none';
    });
    
    prevMonthBtn.addEventListener('click', () => {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
        renderCalendar();
    });
    
    nextMonthBtn.addEventListener('click', () => {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
        renderCalendar();
    });
    
    // Close calendar when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.datetime-picker-container')) {
            calendarContainer.style.display = 'none';
        }
    });

    // Event listeners
    closeModal.addEventListener("click", closeModalHandler);
    cancelBtn.addEventListener("click", closeModalHandler);
    confirmBtn.addEventListener("click", handleReschedule);
    
    // Expose openModal function globally so it can be called from external button
    window.openRescheduleModal = openModal;

    initializeWidget();
});

ZOHO.embeddedApp.init();