/**
 * Enhanced Client Script for Appointment Reschedule Functionality
 * Module: Appointment_Bookings
 * Version: 2.0 - Includes additional features like reschedule reason and notes
 * Trigger: On Load (Detail View)
 */

// Configuration object for easy customization
const RESCHEDULE_CONFIG = {
    buttonText: "Reschedule Appointment",
    buttonStyle: "background-color: #007bff; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; margin: 5px;",
    moduleName: "Appointment_Bookings",
    dateTimeField: "Appointment_Start_Date_Time",
    endDateTimeField: "Appointment_End_Date_Time",
    durationField: "Duration"
};

// Function to be executed when the page loads
function onPageLoad() {
    try {
        // Check if we're on the detail view of Appointment_Bookings module
        if (ZDK.Page.getModule() === RESCHEDULE_CONFIG.moduleName && ZDK.Page.getMode() === "view") {
            addRescheduleButton();
        }
    } catch (error) {
        console.error("Error in onPageLoad:", error);
    }
}

// Function to add the Reschedule Appointment button
function addRescheduleButton() {
    try {
        // Create the reschedule button
        var rescheduleButton = {
            text: RESCHEDULE_CONFIG.buttonText,
            type: "button",
            id: "reschedule_appointment_btn",
            style: RESCHEDULE_CONFIG.buttonStyle,
            onclick: function() {
                showReschedulePopup();
            }
        };

        // Add button to the detail view
        ZDK.Client.addButton(rescheduleButton);
        
        console.log("Reschedule button added successfully");
        
    } catch (error) {
        console.error("Error adding reschedule button:", error);
    }
}

// Function to show the reschedule popup with enhanced features
function showReschedulePopup() {
    try {
        // Get current appointment details
        var currentRecord = ZDK.Page.getRecord();
        var currentStartDateTime = currentRecord[RESCHEDULE_CONFIG.dateTimeField];
        var recordId = currentRecord.id;

        // Create enhanced popup HTML with additional fields
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
                    width: 600px;
                    max-width: 90%;
                    max-height: 90%;
                    overflow-y: auto;
                ">
                    <h3 style="margin-top: 0; color: #333; text-align: center; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
                        Reschedule Appointment
                    </h3>
                    
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #555;">
                            Reschedule From (Current Date & Time):
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

                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #555;">
                            Reschedule Reason:
                        </label>
                        <select id="reschedule-reason" style="
                            width: 100%;
                            padding: 10px;
                            border: 1px solid #ddd;
                            border-radius: 4px;
                            box-sizing: border-box;
                        ">
                            <option value="">Select Reason</option>
                            <option value="By Patient">By Patient</option>
                            <option value="By Doctor">By Doctor</option>
                            <option value="By Team">By Team</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #555;">
                            Reschedule Notes:
                        </label>
                        <textarea id="reschedule-notes" rows="3" placeholder="Enter any additional notes about the reschedule..." 
                                  style="
                                      width: 100%;
                                      padding: 10px;
                                      border: 1px solid #ddd;
                                      border-radius: 4px;
                                      box-sizing: border-box;
                                      resize: vertical;
                                      font-family: inherit;
                                  "></textarea>
                    </div>

                    <div style="text-align: center; margin-top: 25px;">
                        <button onclick="saveReschedule('${recordId}')" id="save-reschedule-btn" style="
                            background-color: #28a745;
                            color: white;
                            padding: 12px 24px;
                            border: none;
                            border-radius: 4px;
                            cursor: pointer;
                            margin-right: 10px;
                            font-size: 14px;
                            font-weight: bold;
                        ">Save Reschedule</button>
                        
                        <button onclick="closeReschedulePopup()" style="
                            background-color: #6c757d;
                            color: white;
                            padding: 12px 24px;
                            border: none;
                            border-radius: 4px;
                            cursor: pointer;
                            font-size: 14px;
                        ">Cancel</button>
                    </div>
                </div>
            </div>
        `;

        // Add popup to the page
        document.body.insertAdjacentHTML('beforeend', popupHTML);

        // Set minimum date to current date
        var now = new Date();
        var minDateTime = now.toISOString().slice(0, 16);
        document.getElementById('new-appointment-datetime').min = minDateTime;

        // Focus on the datetime input
        setTimeout(() => {
            document.getElementById('new-appointment-datetime').focus();
        }, 100);

    } catch (error) {
        console.error("Error showing reschedule popup:", error);
        alert("Error opening reschedule form. Please try again.");
    }
}

// Enhanced function to format date time for display
function formatDateTime(dateTimeString) {
    if (!dateTimeString) return "Not set";
    
    try {
        var date = new Date(dateTimeString);
        return date.toLocaleString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    } catch (error) {
        console.error("Error formatting date:", error);
        return dateTimeString;
    }
}

// Enhanced function to save the rescheduled appointment
function saveReschedule(recordId) {
    try {
        var newDateTime = document.getElementById('new-appointment-datetime').value;
        var rescheduleReason = document.getElementById('reschedule-reason').value;
        var rescheduleNotes = document.getElementById('reschedule-notes').value;
        
        // Validation
        if (!newDateTime) {
            alert("Please select a new appointment date and time.");
            document.getElementById('new-appointment-datetime').focus();
            return;
        }

        var newDate = new Date(newDateTime);
        var currentDate = new Date();

        // Check if the new date is in the future (at least 1 hour from now)
        var minimumFutureTime = new Date(currentDate.getTime() + (60 * 60 * 1000)); // 1 hour from now
        if (newDate <= minimumFutureTime) {
            alert("Please select a date and time that is at least 1 hour in the future.");
            document.getElementById('new-appointment-datetime').focus();
            return;
        }

        // Show loading state
        var saveButton = document.getElementById('save-reschedule-btn');
        var originalText = saveButton.innerHTML;
        saveButton.innerHTML = "Saving...";
        saveButton.disabled = true;

        // Prepare the update data
        var updateData = {};
        updateData[RESCHEDULE_CONFIG.dateTimeField] = newDateTime;

        // Calculate new end date time if Duration field exists
        var currentRecord = ZDK.Page.getRecord();
        if (currentRecord[RESCHEDULE_CONFIG.durationField]) {
            var duration = parseInt(currentRecord[RESCHEDULE_CONFIG.durationField]) || 60; // Default 60 minutes
            var endDateTime = new Date(newDate.getTime() + (duration * 60000));
            updateData[RESCHEDULE_CONFIG.endDateTimeField] = endDateTime.toISOString().slice(0, 19);
        }

        // Add reschedule reason and notes if provided
        if (rescheduleReason) {
            updateData.Reschedule_Reason = rescheduleReason;
        }
        if (rescheduleNotes) {
            updateData.Reschedule_Notes = rescheduleNotes;
        }

        // Add reschedule timestamp
        updateData.Last_Rescheduled_Date = new Date().toISOString().slice(0, 19);

        console.log("Updating record with data:", updateData);

        // Update the record using Zoho CRM API
        ZOHO.CRM.API.updateRecord({
            Entity: RESCHEDULE_CONFIG.moduleName,
            APIData: updateData,
            RecordID: recordId
        }).then(function(response) {
            console.log("API Response:", response);
            
            if (response.data && response.data[0] && response.data[0].code === "SUCCESS") {
                alert("Appointment rescheduled successfully!");
                closeReschedulePopup();
                // Refresh the page to show updated data
                window.location.reload();
            } else {
                throw new Error("API returned error: " + JSON.stringify(response));
            }
        }).catch(function(error) {
            console.error("Error updating appointment:", error);
            alert("Error rescheduling appointment. Please try again or contact your administrator.");
            
            // Restore button state
            saveButton.innerHTML = originalText;
            saveButton.disabled = false;
        });

    } catch (error) {
        console.error("Error in saveReschedule:", error);
        alert("Error rescheduling appointment. Please try again.");
        
        // Restore button state if it exists
        var saveButton = document.getElementById('save-reschedule-btn');
        if (saveButton) {
            saveButton.innerHTML = "Save Reschedule";
            saveButton.disabled = false;
        }
    }
}

// Function to close the reschedule popup
function closeReschedulePopup() {
    var popup = document.getElementById('reschedule-popup');
    if (popup) {
        popup.remove();
    }
}

// Enhanced event listeners
document.addEventListener('keydown', function(event) {
    // Close popup on Escape key
    if (event.key === 'Escape') {
        var popup = document.getElementById('reschedule-popup');
        if (popup) {
            closeReschedulePopup();
        }
    }
    
    // Save on Ctrl+Enter or Cmd+Enter
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        var popup = document.getElementById('reschedule-popup');
        if (popup) {
            var recordId = ZDK.Page.getRecord().id;
            saveReschedule(recordId);
        }
    }
});

// Click outside popup to close
document.addEventListener('click', function(event) {
    var popup = document.getElementById('reschedule-popup');
    if (popup && event.target === popup) {
        closeReschedulePopup();
    }
});

// Initialize the script when page loads
try {
    onPageLoad();
} catch (error) {
    console.error("Error initializing script:", error);
}

// Alternative initialization methods for different Zoho CRM versions
if (typeof ZDK !== 'undefined') {
    ZDK.Client.onPageLoad(onPageLoad);
} else if (typeof ZOHO !== 'undefined') {
    // For newer versions of Zoho CRM
    document.addEventListener('DOMContentLoaded', onPageLoad);
}

// Fallback initialization
setTimeout(function() {
    if (document.readyState === 'complete') {
        onPageLoad();
    }
}, 1000);