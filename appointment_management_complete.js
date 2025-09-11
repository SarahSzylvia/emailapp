/**
 * Complete Appointment Management Client Script
 * Module: Appointment_Bookings
 * Features: Reschedule Appointment + Change Appointment Mode
 * Trigger: On Load (Detail View)
 */

// Configuration
const APPOINTMENT_CONFIG = {
    moduleName: "Appointment_Bookings",
    dateTimeField: "Appointment_Start_Date_Time",
    endDateTimeField: "Appointment_End_Date_Time",
    durationField: "Duration",
    appointmentModeField: "Appointment_Mode"
};

// Function to be executed when the page loads
function onPageLoad() {
    try {
        if (ZDK.Page.getModule() === APPOINTMENT_CONFIG.moduleName && ZDK.Page.getMode() === "view") {
            addAppointmentButtons();
        }
    } catch (error) {
        console.error("Error in onPageLoad:", error);
    }
}

// Function to add both reschedule and mode change buttons
function addAppointmentButtons() {
    try {
        // Add Reschedule Appointment button
        var rescheduleButton = {
            text: "Reschedule Appointment",
            type: "button",
            id: "reschedule_appointment_btn",
            style: "background-color: #007bff; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; margin: 5px;",
            onclick: function() {
                showReschedulePopup();
            }
        };

        // Add Change Mode button
        var modeButton = {
            text: "Change Mode",
            type: "button",
            id: "change_appointment_mode_btn",
            style: "background-color: #17a2b8; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; margin: 5px;",
            onclick: function() {
                changeAppointmentMode();
            }
        };

        ZDK.Client.addButton(rescheduleButton);
        ZDK.Client.addButton(modeButton);
        
        console.log("Appointment management buttons added successfully");
        
    } catch (error) {
        console.error("Error adding appointment buttons:", error);
    }
}

// Function to change appointment mode with proper record save
function changeAppointmentMode() {
    try {
        var currentRecord = ZDK.Page.getRecord();
        var recordId = currentRecord.id;
        var currentMode = currentRecord[APPOINTMENT_CONFIG.appointmentModeField] || "Face to Face";

        ZDK.Client.getInput([
            {
                type: 'picklist',
                label: 'Select Appointment Mode',
                list_options: [
                    {
                        actual_value: "Face to Face",
                        display_value: "Face to Face"
                    },
                    {
                        actual_value: "Video Call",
                        display_value: "Video Call"
                    }
                ],
                default_value: currentMode
            }
        ], 'Change Appointment Mode', 'Update', 'Cancel')
        .then(function(response) {
            if (response && response.data && response.data.length > 0) {
                let selectedMode = response.data[0].value;
                console.log("Selected Mode:", selectedMode);

                // Check if mode actually changed
                if (selectedMode === currentMode) {
                    ZDK.Client.showMessage("No changes made to appointment mode.", "info");
                    return;
                }

                // Update the field in UI first
                ZDK.Page.getField(APPOINTMENT_CONFIG.appointmentModeField).setValue(selectedMode);

                // Prepare update data
                var updateData = {};
                updateData[APPOINTMENT_CONFIG.appointmentModeField] = selectedMode;

                // If changing to Video Call, we might want to generate/update the appointment link
                if (selectedMode === "Video Call") {
                    // You can add logic here to generate meeting link if needed
                    // updateData.Appointment_Link = generateMeetingLink();
                }

                // Update the record in database
                ZOHO.CRM.API.updateRecord({
                    Entity: APPOINTMENT_CONFIG.moduleName,
                    APIData: updateData,
                    RecordID: recordId
                }).then(function(apiResponse) {
                    console.log("Mode Update Response:", apiResponse);
                    
                    if (apiResponse.data && apiResponse.data[0] && apiResponse.data[0].code === "SUCCESS") {
                        ZDK.Client.showMessage(`Appointment mode changed to "${selectedMode}" successfully!`, "success");
                        
                        // Optional: Refresh page to show all updates
                        setTimeout(() => {
                            window.location.reload();
                        }, 1500);
                        
                    } else {
                        console.error("API Error:", apiResponse);
                        ZDK.Client.showMessage("Error updating appointment mode. Please try again.", "error");
                        
                        // Revert UI change
                        ZDK.Page.getField(APPOINTMENT_CONFIG.appointmentModeField).setValue(currentMode);
                    }
                }).catch(function(error) {
                    console.error("Error updating record:", error);
                    ZDK.Client.showMessage("Error updating appointment mode. Please try again.", "error");
                    
                    // Revert UI change
                    ZDK.Page.getField(APPOINTMENT_CONFIG.appointmentModeField).setValue(currentMode);
                });
            }
        })
        .catch(function(error) {
            console.error("Error in appointment mode popup:", error);
            ZDK.Client.showMessage("Error opening appointment mode selection.", "error");
        });
        
    } catch (error) {
        console.error("Error in changeAppointmentMode:", error);
        ZDK.Client.showMessage("Error changing appointment mode.", "error");
    }
}

// Function to show the reschedule popup
function showReschedulePopup() {
    try {
        var currentRecord = ZDK.Page.getRecord();
        var currentStartDateTime = currentRecord[APPOINTMENT_CONFIG.dateTimeField];
        var recordId = currentRecord.id;

        var popupHTML = `
            <div id="reschedule-popup" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
                z-index: 10000;
                display: flex;
                justify-content: center;
                align-items: center;
            ">
                <div style="
                    background: white;
                    padding: 30px;
                    border-radius: 8px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                    width: 500px;
                    max-width: 90%;
                ">
                    <h3 style="margin-top: 0; color: #333; text-align: center;">Reschedule Appointment</h3>
                    
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #555;">
                            Current Appointment Date & Time:
                        </label>
                        <input type="text" value="${formatDateTime(currentStartDateTime)}" 
                               readonly style="
                                   width: 100%;
                                   padding: 10px;
                                   border: 1px solid #ddd;
                                   border-radius: 4px;
                                   background-color: #f9f9f9;
                                   box-sizing: border-box;
                               ">
                    </div>

                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #555;">
                            New Appointment Date & Time: <span style="color: red;">*</span>
                        </label>
                        <input type="datetime-local" id="new-appointment-datetime" 
                               style="
                                   width: 100%;
                                   padding: 10px;
                                   border: 1px solid #ddd;
                                   border-radius: 4px;
                                   box-sizing: border-box;
                               " required>
                        <small style="color: #666; font-size: 12px;">Please select a future date and time</small>
                    </div>

                    <div style="text-align: center; margin-top: 25px;">
                        <button onclick="saveReschedule('${recordId}')" id="save-reschedule-btn" style="
                            background-color: #28a745;
                            color: white;
                            padding: 10px 20px;
                            border: none;
                            border-radius: 4px;
                            cursor: pointer;
                            margin-right: 10px;
                            font-size: 14px;
                        ">Save</button>
                        
                        <button onclick="closeReschedulePopup()" style="
                            background-color: #6c757d;
                            color: white;
                            padding: 10px 20px;
                            border: none;
                            border-radius: 4px;
                            cursor: pointer;
                            font-size: 14px;
                        ">Cancel</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', popupHTML);

        // Set minimum date to current date
        var now = new Date();
        var minDateTime = now.toISOString().slice(0, 16);
        document.getElementById('new-appointment-datetime').min = minDateTime;

    } catch (error) {
        console.error("Error showing reschedule popup:", error);
        ZDK.Client.showMessage("Error opening reschedule form. Please try again.", "error");
    }
}

// Function to format date time for display
function formatDateTime(dateTimeString) {
    if (!dateTimeString) return "Not set";
    
    try {
        var date = new Date(dateTimeString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    } catch (error) {
        return dateTimeString;
    }
}

// Function to save the rescheduled appointment
function saveReschedule(recordId) {
    try {
        var newDateTime = document.getElementById('new-appointment-datetime').value;
        
        if (!newDateTime) {
            alert("Please select a new appointment date and time.");
            return;
        }

        var newDate = new Date(newDateTime);
        var currentDate = new Date();

        if (newDate <= currentDate) {
            alert("Please select a future date and time for the appointment.");
            return;
        }

        // Show loading state
        var saveButton = document.getElementById('save-reschedule-btn');
        var originalText = saveButton.innerHTML;
        saveButton.innerHTML = "Saving...";
        saveButton.disabled = true;

        // Prepare the update data
        var updateData = {};
        updateData[APPOINTMENT_CONFIG.dateTimeField] = newDateTime;

        // Calculate new end date time if Duration field exists
        var currentRecord = ZDK.Page.getRecord();
        if (currentRecord[APPOINTMENT_CONFIG.durationField]) {
            var duration = parseInt(currentRecord[APPOINTMENT_CONFIG.durationField]) || 60;
            var endDateTime = new Date(newDate.getTime() + (duration * 60000));
            updateData[APPOINTMENT_CONFIG.endDateTimeField] = endDateTime.toISOString().slice(0, 19);
        }

        // Update the record
        ZOHO.CRM.API.updateRecord({
            Entity: APPOINTMENT_CONFIG.moduleName,
            APIData: updateData,
            RecordID: recordId
        }).then(function(response) {
            if (response.data && response.data[0] && response.data[0].code === "SUCCESS") {
                ZDK.Client.showMessage("Appointment rescheduled successfully!", "success");
                closeReschedulePopup();
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                throw new Error("API returned error: " + JSON.stringify(response));
            }
        }).catch(function(error) {
            console.error("Error updating appointment:", error);
            alert("Error rescheduling appointment. Please try again.");
            
            saveButton.innerHTML = originalText;
            saveButton.disabled = false;
        });

    } catch (error) {
        console.error("Error in saveReschedule:", error);
        alert("Error rescheduling appointment. Please try again.");
    }
}

// Function to close the reschedule popup
function closeReschedulePopup() {
    var popup = document.getElementById('reschedule-popup');
    if (popup) {
        popup.remove();
    }
}

// Event listeners
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        var popup = document.getElementById('reschedule-popup');
        if (popup) {
            closeReschedulePopup();
        }
    }
});

// Initialize the script
try {
    onPageLoad();
} catch (error) {
    console.error("Error initializing appointment management script:", error);
}

// Alternative initialization for different Zoho CRM versions
if (typeof ZDK !== 'undefined') {
    ZDK.Client.onPageLoad(onPageLoad);
} else if (typeof ZOHO !== 'undefined') {
    document.addEventListener('DOMContentLoaded', onPageLoad);
}