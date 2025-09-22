/** Step 2: Check Overlapping Appointments **/
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
        
        // Validate new appointment times
        const newStart = new Date(newStartTime);
        const newEnd = new Date(newEndTime);
        
        if (!isValidDate(newStart) || !isValidDate(newEnd)) {
            console.error('Invalid new appointment times:', { newStartTime, newEndTime });
            return {
                isValid: false,
                message: "❌ Invalid appointment times provided."
            };
        }
        
        if (newStart >= newEnd) {
            return {
                isValid: false,
                message: "❌ Appointment start time must be before end time."
            };
        }
        
        // Format dates for API
        const startTimeStr = formatDateTimeForAPI(newStartTime);
        const endTimeStr = formatDateTimeForAPI(newEndTime);

        console.log('=== OVERLAP CHECK DEBUG ===');
        console.log('Checking for overlapping appointments between', startTimeStr, 'and', endTimeStr);
        console.log('New appointment window:', {
            start: newStart.toISOString(),
            end: newEnd.toISOString(),
            doctorId: doctorId,
            patientId: patientId,
            currentRecordId: currentRecordId
        });
        
        let appointments = [];
        let searchMethod = 'none';
        
        // Try to get appointments using available API methods
        try {
            // First, check if we're in external mode and use searchRecords API
            if (typeof ZOHO.CRM.CONFIG !== 'undefined' && ZOHO.CRM.CONFIG && ZOHO.CRM.CONFIG.mode === 'EXTERNAL') {
                appointments = await getAppointmentsViaSearch(doctorId, patientId);
                searchMethod = 'searchRecords';
            } else {
                // Try using COQL if available
                try {
                    if (ZOHO.CRM.COQL && typeof ZOHO.CRM.COQL.selectRecords === 'function') {
                        appointments = await getAppointmentsViaCOQL(doctorId, patientId);
                        searchMethod = 'COQL';
                    }
                } catch (coqlError) {
                    console.warn('COQL query failed, falling back to search:', coqlError);
                    appointments = await getAppointmentsViaSearch(doctorId, patientId);
                    searchMethod = 'searchRecords (fallback)';
                }
            }
        } catch (apiError) {
            console.error('All API methods failed:', apiError);
            return {
                isValid: false,
                message: `❌ Unable to check for overlapping appointments. API Error: ${apiError.message}`
            };
        }
        
        console.log(`Found ${appointments.length} appointments using ${searchMethod}`);
        
        // Check each appointment for overlaps
        const overlappingAppointments = [];
        
        for (let i = 0; i < appointments.length; i++) {
            const appointment = appointments[i];
            
            try {
                // Validate appointment data
                if (!appointment.id || appointment.id === currentRecordId) {
                    console.log(`Skipping appointment ${i + 1}: same as current record`);
                    continue;
                }
                
                if (!appointment.Appointment_Start_Date_Time || !appointment.Appointment_End_Date_Time) {
                    console.error(`Appointment ${appointment.id} missing date fields:`, {
                        start: appointment.Appointment_Start_Date_Time,
                        end: appointment.Appointment_End_Date_Time
                    });
                    continue;
                }
                
                const apptStart = new Date(appointment.Appointment_Start_Date_Time);
                const apptEnd = new Date(appointment.Appointment_End_Date_Time);
                
                if (!isValidDate(apptStart) || !isValidDate(apptEnd)) {
                    console.error(`Invalid dates in appointment ${appointment.id}:`, {
                        start: appointment.Appointment_Start_Date_Time,
                        end: appointment.Appointment_End_Date_Time,
                        startValid: isValidDate(apptStart),
                        endValid: isValidDate(apptEnd)
                    });
                    continue;
                }
                
                // Log detailed overlap check
                const isOverlapping = checkTimeOverlap(newStart, newEnd, apptStart, apptEnd);
                
                console.log(`Appointment ${i + 1} (${appointment.id}) overlap check:`, {
                    apptStart: apptStart.toISOString(),
                    apptEnd: apptEnd.toISOString(),
                    newStart: newStart.toISOString(),
                    newEnd: newEnd.toISOString(),
                    condition1: newStart < apptEnd,
                    condition2: newEnd > apptStart,
                    isOverlapping: isOverlapping,
                    doctorMatch: appointment.Doctor_Name?.id === doctorId,
                    patientMatch: appointment.Appointment_For?.id === patientId
                });
                
                if (isOverlapping) {
                    console.log(`OVERLAP DETECTED with appointment ${appointment.id}`);
                    overlappingAppointments.push(appointment);
                }
                
            } catch (processingError) {
                console.error(`Error processing appointment ${appointment.id}:`, processingError);
                // Continue checking other appointments instead of failing completely
                continue;
            }
        }
        
        // If overlaps found, return the first one with detailed message
        if (overlappingAppointments.length > 0) {
            console.log(`Found ${overlappingAppointments.length} overlapping appointment(s)`);
            return handleOverlap(overlappingAppointments[0], doctorId, doctorName, patientId, patientName);
        }
        
        // If we get here, no overlaps were found
        console.log('✅ No overlapping appointments found.');
        return { isValid: true };
        
    } catch (error) {
        console.error('Overlap check error:', error);
        console.error('Full error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack,
            code: error.code,
            status: error.status
        });
        return { 
            isValid: false, 
            message: `❌ Unable to check for overlapping appointments. Please try again later. (${error.message || 'Unknown error'})` 
        };
    }
}

// Helper function to validate dates
function isValidDate(date) {
    return date instanceof Date && !isNaN(date.getTime());
}

// Helper function to check time overlap with detailed logging
function checkTimeOverlap(newStart, newEnd, apptStart, apptEnd) {
    // Standard overlap check: two time periods overlap if one starts before the other ends
    const overlaps = newStart < apptEnd && newEnd > apptStart;
    
    // Also check for exact boundary matches (appointments touching)
    const startMatches = newStart.getTime() === apptStart.getTime() || 
                        newStart.getTime() === apptEnd.getTime();
    const endMatches = newEnd.getTime() === apptStart.getTime() || 
                      newEnd.getTime() === apptEnd.getTime();
    
    return overlaps || startMatches || endMatches;
}

// Helper function to get appointments via Search API
async function getAppointmentsViaSearch(doctorId, patientId) {
    const criteria = `(Doctor_Name.id = '${doctorId}' or Appointment_For.id = '${patientId}') ` +
                    `and id != '${currentRecordId}'`;
    
    console.log('Search Criteria:', criteria);
    
    const searchResponse = await ZOHO.CRM.API.searchRecords({
        entity: 'Appointment_Bookings',
        criteria: criteria,
        per_page: 200,
        page: 1
    }).catch(error => {
        console.error('Search Records Error:', error);
        throw new Error(`Search Records Failed: ${error.message || 'Unknown error'}`);
    });

    console.log('Search Response Status:', searchResponse?.status);
    console.log('Search Response Data Length:', searchResponse?.data?.length || 0);

    if (!searchResponse || !searchResponse.data || !Array.isArray(searchResponse.data)) {
        console.error('Invalid search response format:', searchResponse);
        throw new Error('Invalid response format from server');
    }
    
    return searchResponse.data;
}

// Helper function to get appointments via COQL
async function getAppointmentsViaCOQL(doctorId, patientId) {
    const queryString = `select id, Appointment_Start_Date_Time, Appointment_End_Date_Time, ` +
                       `Doctor_Name, Appointment_For from Appointment_Bookings ` +
                       `where (Doctor_Name.id = '${doctorId}' or Appointment_For.id = '${patientId}') ` +
                       `and id != '${currentRecordId}'`;
    
    console.log('COQL Query:', queryString);
    
    const queryResponse = await ZOHO.CRM.COQL.selectRecords({
        select_query: queryString
    });

    console.log('COQL Response Status:', queryResponse?.status);
    console.log('COQL Response Data Length:', queryResponse?.data?.length || 0);

    if (!queryResponse || !queryResponse.data || !Array.isArray(queryResponse.data)) {
        throw new Error('Invalid COQL response format');
    }
    
    return queryResponse.data;
}

// Helper function to handle overlap response
function handleOverlap(overlap, doctorId, doctorName, patientId, patientName) {
    try {
        const startDT = new Date(overlap.Appointment_Start_Date_Time);
        const endDT = new Date(overlap.Appointment_End_Date_Time);
        
        if (!isValidDate(startDT) || !isValidDate(endDT)) {
            console.error('Invalid dates in overlapping appointment:', overlap.id);
            return {
                isValid: false,
                message: "❌ An overlapping appointment was found. Please choose a different time."
            };
        }
        
        // Format the date and time for display
        const startStr = startDT.toLocaleDateString('en-GB', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric',
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
        const isDoctorConflict = overlap.Doctor_Name?.id === doctorId;
        const isPatientConflict = overlap.Appointment_For?.id === patientId;
        
        if (isDoctorConflict && isPatientConflict) {
            conflictMsg = `${doctorName} and ${patientName} already have an appointment scheduled`;
        } else if (isDoctorConflict) {
            const conflictPatientName = overlap.Appointment_For?.name || "another patient";
            conflictMsg = `${doctorName} already has an appointment with ${conflictPatientName}`;
        } else if (isPatientConflict) {
            const conflictDoctorName = overlap.Doctor_Name?.name || "another doctor";
            conflictMsg = `${patientName} already has an appointment with ${conflictDoctorName}`;
        } else {
            conflictMsg = "An overlapping appointment was found";
        }
        
        return { 
            isValid: false, 
            message: `❌ ${conflictMsg} from ${startStr} to ${endStr}. Please choose a different time.`,
            conflictDetails: {
                appointmentId: overlap.id,
                startTime: startDT.toISOString(),
                endTime: endDT.toISOString(),
                doctorConflict: isDoctorConflict,
                patientConflict: isPatientConflict
            }
        };
    } catch (error) {
        console.error('Error formatting overlap message:', error);
        return {
            isValid: false,
            message: "❌ An overlapping appointment was found. Please choose a different time."
        };
    }
}