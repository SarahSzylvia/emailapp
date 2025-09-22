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

    /** Calculate end date time based on start time and duration **/
    function calculateEndDateTime(startDateTime, durationMinutes = 30) {
        if (!startDateTime) return null;
        
        console.log('=== TIME CALCULATION DEBUG ===');
        console.log('Start time:', startDateTime);
        console.log('Duration minutes:', durationMinutes);
        
        const endDateTime = new Date(startDateTime.getTime() + (durationMinutes * 60000));
        
        console.log('Calculated end time:', endDateTime);
        return endDateTime;
    }

    /** Client-side validation with specific error messages **/
    async function validateAppointmentAvailability(newStartTime, newEndTime) {
        try {
            // Check Overlapping Appointments
            const overlapCheck = await checkOverlappingAppointments(newStartTime, newEndTime);
            if (!overlapCheck.isValid) {
                showMessage(overlapCheck.message, "error");
                return false;
            }

            return true;
        } catch (error) {
            console.error('Validation error:', error);
            showMessage("Unable to validate appointment availability. Please try again.", "error");
            return false;
        }
    }

    /** Check Overlapping Appointments with comprehensive approach **/
    async function checkOverlappingAppointments(newStartTime, newEndTime) {
        try {
            const doctorId = currentAppointmentData.Doctor_Name?.id;
            const doctorName = currentAppointmentData.Doctor_Name?.name || "Doctor";
            const patientId = currentAppointmentData.Appointment_For?.id;
            const patientName = currentAppointmentData.Appointment_For?.name || "Patient";
            
            if (!doctorId || !patientId) {
                console.error('Missing required IDs for overlap check:', { doctorId, patientId });
                return { 
                    isValid: false, 
                    message: "❌ Missing required information to check for overlapping appointments." 
                };
            }
            
            const startTimeStr = formatDateTimeForAPI(newStartTime);
            const endTimeStr = formatDateTimeForAPI(newEndTime);

            console.log('=== OVERLAP CHECK DEBUG ===');
            console.log('Checking for overlapping appointments between', startTimeStr, 'and', endTimeStr);
            console.log('Doctor ID:', doctorId, 'Patient ID:', patientId);
            console.log('Current Record ID (to exclude):', currentRecordId);
            
            // Helper function to handle overlap response
            function handleOverlap(overlap, doctorId, doctorName, patientId, patientName) {
                console.log('=== OVERLAP FOUND ===');
                console.log('Overlapping appointment:', overlap);
                
                const startDT = new Date(overlap.Appointment_Start_Date_Time);
                const endDT = new Date(overlap.Appointment_End_Date_Time);
                const startStr = startDT.toLocaleDateString('en-GB', { 
                    day: '2-digit', 
                    month: 'short', 
                    year: 'numeric' 
                }) + ' ' + startDT.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit', 
                    hour12: true 
                });
                const endStr = endDT.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit', 
                    hour12: true 
                });
                
                let conflictMsg = "";
                if (overlap.Doctor_Name?.id === doctorId && overlap.Appointment_For?.id === patientId) {
                    conflictMsg = `${doctorName} and ${patientName} already have an appointment`;
                } else if (overlap.Doctor_Name?.id === doctorId) {
                    conflictMsg = `${doctorName} already has an appointment`;
                } else if (overlap.Appointment_For?.id === patientId) {
                    conflictMsg = `${patientName} already has an appointment`;
                } else {
                    conflictMsg = "An overlapping appointment was found";
                }
                
                console.log('Conflict message:', conflictMsg);
                return { 
                    isValid: false, 
                    message: `❌ ${conflictMsg} from ${startStr} to ${endStr}. Please choose a different time.` 
                };
            }

            // Try multiple approaches to find overlapping appointments
            let searchResponse = null;
            let searchAttempt = 0;
            
            // Approach 1: Try COQL first (most reliable)
            try {
                searchAttempt = 1;
                console.log('Attempt', searchAttempt, ': Trying COQL...');
                
                if (typeof ZOHO !== 'undefined' && ZOHO.CRM && ZOHO.CRM.COQL && typeof ZOHO.CRM.COQL.selectRecords === 'function') {
                    const queryString = `select id, Appointment_Start_Date_Time, Appointment_End_Date_Time, ` +
                                     `Doctor_Name, Appointment_For from Appointment_Bookings ` +
                                     `where (Appointment_Start_Date_Time < '${endTimeStr}' ` +
                                     `and Appointment_End_Date_Time > '${startTimeStr}') ` +
                                     `and (Doctor_Name.id = '${doctorId}' or Appointment_For.id = '${patientId}') ` +
                                     `and id != '${currentRecordId}' limit 10`;
                    
                    console.log('COQL Query:', queryString);
                    
                    const queryResponse = await ZOHO.CRM.COQL.selectRecords({
                        select_query: queryString
                    });

                    console.log('COQL Response:', JSON.stringify(queryResponse, null, 2));

                    if (queryResponse && queryResponse.data && Array.isArray(queryResponse.data)) {
                        if (queryResponse.data.length > 0) {
                            console.log('COQL found', queryResponse.data.length, 'overlapping appointments');
                            const overlap = queryResponse.data[0];
                            return handleOverlap(overlap, doctorId, doctorName, patientId, patientName);
                        } else {
                            console.log('COQL: No overlapping appointments found');
                            return { isValid: true };
                        }
                    }
                } else {
                    console.log('COQL API not available');
                }
            } catch (coqlError) {
                console.warn('COQL query failed:', coqlError);
            }
            
            // Approach 2: Try searchRecords API with different criteria formats
            try {
                searchAttempt = 2;
                console.log('Attempt', searchAttempt, ': Trying searchRecords API...');
                
                // Format 1: Simple criteria format
                let criteria = `((Appointment_Start_Date_Time:less_than:${endTimeStr}) and (Appointment_End_Date_Time:greater_than:${startTimeStr})) and ((Doctor_Name:equals:${doctorId}) or (Appointment_For:equals:${patientId}))`;
                
                console.log('Search Criteria (Format 1):', criteria);
                
                searchResponse = await ZOHO.CRM.API.searchRecords({
                    Entity: 'Appointment_Bookings',
                    Type: 'criteria',
                    Query: criteria,
                    page: 1,
                    per_page: 10
                }).catch(async (error1) => {
                    console.warn('Search format 1 failed:', error1);
                    
                    // Format 2: Alternative criteria format
                    criteria = `(Appointment_Start_Date_Time:less_than:${endTimeStr}) and (Appointment_End_Date_Time:greater_than:${startTimeStr}) and ((Doctor_Name:equals:${doctorId}) or (Appointment_For:equals:${patientId}))`;
                    
                    console.log('Search Criteria (Format 2):', criteria);
                    
                    return await ZOHO.CRM.API.searchRecords({
                        Entity: 'Appointment_Bookings',
                        Type: 'criteria',
                        Query: criteria,
                        page: 1,
                        per_page: 10
                    }).catch(async (error2) => {
                        console.warn('Search format 2 failed:', error2);
                        
                        // Format 3: Using word search as last resort
                        const searchWord = doctorName.split(' ')[0]; // Use first name for word search
                        console.log('Search Criteria (Format 3 - Word):', searchWord);
                        
                        return await ZOHO.CRM.API.searchRecords({
                            Entity: 'Appointment_Bookings',
                            Type: 'word',
                            Query: searchWord,
                            page: 1,
                            per_page: 50
                        });
                    });
                });

                console.log('Search Response:', JSON.stringify(searchResponse, null, 2));

                if (searchResponse && searchResponse.data && Array.isArray(searchResponse.data)) {
                    console.log('Search API returned', searchResponse.data.length, 'records');
                    
                    // Filter the results manually for overlaps (especially important for word search)
                    const overlappingAppointments = searchResponse.data.filter(appointment => {
                        // Skip the current appointment being rescheduled
                        if (appointment.id === currentRecordId) {
                            return false;
                        }
                        
                        // Check if this appointment involves the same doctor or patient
                        const sameDoctor = appointment.Doctor_Name?.id === doctorId;
                        const samePatient = appointment.Appointment_For?.id === patientId;
                        
                        if (!sameDoctor && !samePatient) {
                            return false;
                        }
                        
                        // Check for time overlap
                        const existingStart = new Date(appointment.Appointment_Start_Date_Time);
                        const existingEnd = new Date(appointment.Appointment_End_Date_Time);
                        
                        // Two appointments overlap if:
                        // newStart < existingEnd AND newEnd > existingStart
                        const hasOverlap = newStartTime < existingEnd && newEndTime > existingStart;
                        
                        console.log('Checking appointment:', appointment.id);
                        console.log('  Existing:', existingStart.toISOString(), 'to', existingEnd.toISOString());
                        console.log('  New:', newStartTime.toISOString(), 'to', newEndTime.toISOString());
                        console.log('  Same doctor:', sameDoctor, 'Same patient:', samePatient);
                        console.log('  Has overlap:', hasOverlap);
                        
                        return hasOverlap;
                    });
                    
                    if (overlappingAppointments.length > 0) {
                        console.log('Manual filter found', overlappingAppointments.length, 'overlapping appointments');
                        const overlap = overlappingAppointments[0];
                        return handleOverlap(overlap, doctorId, doctorName, patientId, patientName);
                    } else {
                        console.log('Manual filter: No overlapping appointments found');
                    }
                } else {
                    console.log('Search API: Invalid or empty response');
                }
            } catch (searchError) {
                console.error('All search attempts failed:', searchError);
            }
            
            // Approach 3: Try getAllRecords as absolute fallback
            try {
                searchAttempt = 3;
                console.log('Attempt', searchAttempt, ': Trying getAllRecords as fallback...');
                
                const allRecordsResponse = await ZOHO.CRM.API.getAllRecords({
                    Entity: 'Appointment_Bookings',
                    page: 1,
                    per_page: 200
                });

                console.log('GetAllRecords Response:', JSON.stringify(allRecordsResponse, null, 2));

                if (allRecordsResponse && allRecordsResponse.data && Array.isArray(allRecordsResponse.data)) {
                    console.log('GetAllRecords returned', allRecordsResponse.data.length, 'records');
                    
                    // Filter for overlapping appointments
                    const overlappingAppointments = allRecordsResponse.data.filter(appointment => {
                        // Skip the current appointment being rescheduled
                        if (appointment.id === currentRecordId) {
                            return false;
                        }
                        
                        // Skip appointments without required fields
                        if (!appointment.Appointment_Start_Date_Time || !appointment.Appointment_End_Date_Time) {
                            return false;
                        }
                        
                        // Check if this appointment involves the same doctor or patient
                        const sameDoctor = appointment.Doctor_Name?.id === doctorId;
                        const samePatient = appointment.Appointment_For?.id === patientId;
                        
                        if (!sameDoctor && !samePatient) {
                            return false;
                        }
                        
                        // Check for time overlap
                        const existingStart = new Date(appointment.Appointment_Start_Date_Time);
                        const existingEnd = new Date(appointment.Appointment_End_Date_Time);
                        
                        // Two appointments overlap if:
                        // newStart < existingEnd AND newEnd > existingStart
                        const hasOverlap = newStartTime < existingEnd && newEndTime > existingStart;
                        
                        console.log('Checking appointment (getAllRecords):', appointment.id);
                        console.log('  Existing:', existingStart.toISOString(), 'to', existingEnd.toISOString());
                        console.log('  New:', newStartTime.toISOString(), 'to', newEndTime.toISOString());
                        console.log('  Same doctor:', sameDoctor, 'Same patient:', samePatient);
                        console.log('  Has overlap:', hasOverlap);
                        
                        return hasOverlap;
                    });
                    
                    if (overlappingAppointments.length > 0) {
                        console.log('GetAllRecords found', overlappingAppointments.length, 'overlapping appointments');
                        const overlap = overlappingAppointments[0];
                        return handleOverlap(overlap, doctorId, doctorName, patientId, patientName);
                    } else {
                        console.log('GetAllRecords: No overlapping appointments found');
                        return { isValid: true };
                    }
                } else {
                    console.log('GetAllRecords: Invalid or empty response');
                }
            } catch (getAllError) {
                console.error('GetAllRecords failed:', getAllError);
            }

            // If all methods fail, we should NOT allow the appointment to proceed
            // This is a safety measure - if we can't verify there are no conflicts, we should block
            console.warn('All overlap check methods failed - blocking appointment for safety');
            return { 
                isValid: false, 
                message: "❌ Unable to verify appointment availability. Please try again or contact support." 
            };

        } catch (error) {
            console.error('Overlap check error:', error);
            const errorMsg = error.message || 'Unknown error';
            console.error('Full error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack,
                code: error.code,
                status: error.status
            });
            
            // If there's an error checking for overlaps, we should block the appointment for safety
            return { 
                isValid: false, 
                message: `❌ Unable to check for overlapping appointments. Please try again later. (${errorMsg})` 
            };
        }
    }

    /** Create update payload with all existing fields **/
    function createUpdatePayload(newDateTime) {
        if (!currentAppointmentData || !newDateTime) {
            console.error('Missing required data for update payload');
            return null;
        }

        // Start with a copy of the existing record data
        const updateData = { ...currentAppointmentData };

        // Remove system fields that shouldn't be updated (but keep 'id' as it's required)
        const systemFields = ['Created_Time', 'Modified_Time', 'Created_By', 'Modified_By', '$approved', '$approval', '$approval_state'];
        systemFields.forEach(field => {
            delete updateData[field];
        });

        // Clean up dollar-prefixed system fields that might cause issues
        Object.keys(updateData).forEach(key => {
            if (key.startsWith('$') && key !== '$currency_symbol') {
                delete updateData[key];
            }
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

            // Calculate end time for validation (assuming 30 minutes duration)
            const newEndDateTime = calculateEndDateTime(newDateTime, 30);

            // Validate appointment availability (including overlap check)
            const isValid = await validateAppointmentAvailability(newDateTime, newEndDateTime);
            if (!isValid) {
                return; // Validation failed, error message already shown
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