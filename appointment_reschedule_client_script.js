/**
 * Client Script for Appointment Reschedule Functionality
 * Module: Appointment_Bookings
 * Trigger: On Load (Detail View)
 */

// Function to be executed when the page loads
function onPageLoad() {
    // Check if we're on the detail view of Appointment_Bookings module
    if (ZDK.Page.getModule() === "Appointment_Bookings" && ZDK.Page.getMode() === "view") {
        addRescheduleButton();
    }
}

// Function to add the Reschedule Appointment button
function addRescheduleButton() {
    try {
        // Create the reschedule button
        var rescheduleButton = {
            text: "Reschedule Appointment",
            type: "button",
            id: "reschedule_appointment_btn",
            style: "background-color: #007bff; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; margin: 5px;",
            onclick: function() {
                showReschedulePopup();
            }
        };

        // Add button to the detail view
        ZDK.Client.addButton(rescheduleButton);
        
    } catch (error) {
        console.error("Error adding reschedule button:", error);
    }
}

// Function to show the reschedule popup
function showReschedulePopup() {
    try {
        // Get current appointment details
        var currentRecord = ZDK.Page.getRecord();
        var currentStartDateTime = currentRecord.Appointment_Start_Date_Time;
        var recordId = currentRecord.id;

        // Create popup HTML
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
                        <button onclick="saveReschedule('${recordId}')" style="
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

        // Add popup to the page
        document.body.insertAdjacentHTML('beforeend', popupHTML);

        // Set minimum date to current date
        var now = new Date();
        var minDateTime = now.toISOString().slice(0, 16);
        document.getElementById('new-appointment-datetime').min = minDateTime;

    } catch (error) {
        console.error("Error showing reschedule popup:", error);
        alert("Error opening reschedule form. Please try again.");
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
        
        // Validation
        if (!newDateTime) {
            alert("Please select a new appointment date and time.");
            return;
        }

        var newDate = new Date(newDateTime);
        var currentDate = new Date();

        // Check if the new date is in the future
        if (newDate <= currentDate) {
            alert("Please select a future date and time for the appointment.");
            return;
        }

        // Show loading state
        var saveButton = event.target;
        var originalText = saveButton.innerHTML;
        saveButton.innerHTML = "Saving...";
        saveButton.disabled = true;

        // Prepare the update data
        var updateData = {
            "Appointment_Start_Date_Time": newDateTime
        };

        // Calculate new end date time if Duration field exists
        var currentRecord = ZDK.Page.getRecord();
        if (currentRecord.Duration) {
            var duration = parseInt(currentRecord.Duration) || 60; // Default 60 minutes
            var endDateTime = new Date(newDate.getTime() + (duration * 60000));
            updateData.Appointment_End_Date_Time = endDateTime.toISOString().slice(0, 19);
        }

        // Update the record using Zoho CRM API
        ZOHO.CRM.API.updateRecord({
            Entity: "Appointment_Bookings",
            APIData: updateData,
            RecordID: recordId
        }).then(function(response) {
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
            alert("Error rescheduling appointment. Please try again.");
            
            // Restore button state
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

// Function to handle escape key press
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        var popup = document.getElementById('reschedule-popup');
        if (popup) {
            closeReschedulePopup();
        }
    }
});

// Initialize the script when page loads
onPageLoad();

// Alternative initialization for different Zoho CRM versions
if (typeof ZDK !== 'undefined') {
    ZDK.Client.onPageLoad(onPageLoad);
} else if (typeof ZOHO !== 'undefined') {
    // For newer versions of Zoho CRM
    document.addEventListener('DOMContentLoaded', onPageLoad);
}