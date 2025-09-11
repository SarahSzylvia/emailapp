/**
 * Working Client Script for Appointment Management
 * Uses only client-side methods that actually work in Zoho CRM
 * No server-side API calls - pure client script approach
 */

// Configuration
const CONFIG = {
    moduleName: "Appointment_Bookings",
    dateTimeField: "Appointment_Start_Date_Time",
    endDateTimeField: "Appointment_End_Date_Time",
    durationField: "Duration",
    modeField: "Appointment_Mode"
};

// Initialize when page loads
function initializeAppointmentManagement() {
    try {
        if (ZDK.Page.getModule() === CONFIG.moduleName && ZDK.Page.getMode() === "view") {
            addManagementButtons();
        }
    } catch (error) {
        console.error("Error initializing:", error);
    }
}

// Add both buttons
function addManagementButtons() {
    try {
        // Reschedule button
        var rescheduleBtn = {
            text: "Reschedule",
            type: "button",
            id: "reschedule_btn",
            style: "background-color: #007bff; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; margin: 5px;",
            onclick: function() { showRescheduleForm(); }
        };

        // Mode change button  
        var modeBtn = {
            text: "Change Mode",
            type: "button", 
            id: "mode_btn",
            style: "background-color: #17a2b8; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; margin: 5px;",
            onclick: function() { changeAppointmentMode(); }
        };

        ZDK.Client.addButton(rescheduleBtn);
        ZDK.Client.addButton(modeBtn);
        
    } catch (error) {
        console.error("Error adding buttons:", error);
    }
}

// Change appointment mode using client script methods
function changeAppointmentMode() {
    var currentMode = ZDK.Page.getRecord()[CONFIG.modeField] || "Face to Face";
    
    ZDK.Client.getInput([
        {
            type: 'picklist',
            label: 'Select Appointment Mode',
            list_options: [
                { actual_value: "Face to Face", display_value: "Face to Face" },
                { actual_value: "Video Call", display_value: "Video Call" }
            ],
            default_value: currentMode
        }
    ], 'Change Appointment Mode', 'Update', 'Cancel')
    .then(function(response) {
        if (response && response.data && response.data.length > 0) {
            let selectedMode = response.data[0].value;
            
            if (selectedMode === currentMode) {
                ZDK.Client.showMessage("No changes made.", "info");
                return;
            }

            // Update field and save
            ZDK.Page.getField(CONFIG.modeField).setValue(selectedMode);
            
            // Use ZDK.Page.save() - this works in client scripts
            ZDK.Page.save().then(function(saveResponse) {
                ZDK.Client.showMessage(`Mode changed to "${selectedMode}"!`, "success");
                setTimeout(() => window.location.reload(), 1500);
            }).catch(function(error) {
                console.error("Save error:", error);
                ZDK.Client.showMessage("Error saving. Please try again.", "error");
            });
        }
    })
    .catch(function(error) {
        console.error("Input error:", error);
    });
}

// Show reschedule form
function showRescheduleForm() {
    var currentRecord = ZDK.Page.getRecord();
    var currentDateTime = currentRecord[CONFIG.dateTimeField];
    
    var formHTML = `
        <div id="reschedule-form" style="
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); z-index: 10000;
            display: flex; justify-content: center; align-items: center;
        ">
            <div style="
                background: white; padding: 30px; border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3); width: 500px; max-width: 90%;
            ">
                <h3 style="margin-top: 0; text-align: center; color: #333;">Reschedule Appointment</h3>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">
                        Current Date & Time:
                    </label>
                    <input type="text" value="${formatDateTime(currentDateTime)}" readonly
                           style="width: 100%; padding: 10px; border: 1px solid #ddd; 
                                  border-radius: 4px; background: #f9f9f9; box-sizing: border-box;">
                </div>

                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">
                        New Date & Time: <span style="color: red;">*</span>
                    </label>
                    <input type="datetime-local" id="new-datetime" required
                           style="width: 100%; padding: 10px; border: 1px solid #ddd; 
                                  border-radius: 4px; box-sizing: border-box;">
                </div>

                <div style="text-align: center; margin-top: 25px;">
                    <button onclick="saveReschedule()" style="
                        background: #28a745; color: white; padding: 10px 20px;
                        border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;
                    ">Save</button>
                    <button onclick="closeRescheduleForm()" style="
                        background: #6c757d; color: white; padding: 10px 20px;
                        border: none; border-radius: 4px; cursor: pointer;
                    ">Cancel</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', formHTML);
    
    // Set minimum date
    var now = new Date();
    document.getElementById('new-datetime').min = now.toISOString().slice(0, 16);
}

// Save reschedule using client script methods
function saveReschedule() {
    var newDateTime = document.getElementById('new-datetime').value;
    
    if (!newDateTime) {
        alert("Please select a new date and time.");
        return;
    }

    if (new Date(newDateTime) <= new Date()) {
        alert("Please select a future date and time.");
        return;
    }

    try {
        // Update the datetime field
        ZDK.Page.getField(CONFIG.dateTimeField).setValue(newDateTime);
        
        // Calculate and update end time if duration exists
        var currentRecord = ZDK.Page.getRecord();
        if (currentRecord[CONFIG.durationField]) {
            var duration = parseInt(currentRecord[CONFIG.durationField]) || 60;
            var endDateTime = new Date(new Date(newDateTime).getTime() + (duration * 60000));
            ZDK.Page.getField(CONFIG.endDateTimeField).setValue(endDateTime.toISOString().slice(0, 19));
        }

        // Save using ZDK - this works in client scripts
        ZDK.Page.save().then(function(response) {
            ZDK.Client.showMessage("Appointment rescheduled successfully!", "success");
            closeRescheduleForm();
            setTimeout(() => window.location.reload(), 1500);
        }).catch(function(error) {
            console.error("Save error:", error);
            alert("Error saving. Please try again.");
        });
        
    } catch (error) {
        console.error("Error in saveReschedule:", error);
        alert("Error rescheduling. Please try again.");
    }
}

// Close reschedule form
function closeRescheduleForm() {
    var form = document.getElementById('reschedule-form');
    if (form) form.remove();
}

// Format datetime for display
function formatDateTime(dateTimeString) {
    if (!dateTimeString) return "Not set";
    try {
        return new Date(dateTimeString).toLocaleString('en-US', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', hour12: true
        });
    } catch (error) {
        return dateTimeString;
    }
}

// Event listeners
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeRescheduleForm();
    }
});

// Initialize
initializeAppointmentManagement();

// Alternative initialization methods
if (typeof ZDK !== 'undefined') {
    ZDK.Client.onPageLoad(initializeAppointmentManagement);
}