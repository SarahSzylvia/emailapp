/**
 * Fixed Client Script for Appointment Mode Update
 * This script properly updates the Appointment_Mode field and saves it to the record
 */

// Function to update Appointment Mode with proper record save
function updateAppointmentMode() {
    // Get current record ID
    var currentRecord = ZDK.Page.getRecord();
    var recordId = currentRecord.id;

    // Show the picklist popup
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
            default_value: currentRecord.Appointment_Mode || "Face to Face"
        }
    ], 'Appointment Mode Selection', 'Update', 'Cancel')
    .then(function(response) {
        if (response && response.data && response.data.length > 0) {
            let selectedMode = response.data[0].value;
            console.log("Selected Mode:", selectedMode);

            // Method 1: Update the field in UI first
            ZDK.Page.getField("Appointment_Mode").setValue(selectedMode);

            // Method 2: Update the actual record in database using API
            var updateData = {
                "Appointment_Mode": selectedMode
            };

            ZOHO.CRM.API.updateRecord({
                Entity: "Appointment_Bookings",
                APIData: updateData,
                RecordID: recordId
            }).then(function(apiResponse) {
                console.log("Update Response:", apiResponse);
                
                if (apiResponse.data && apiResponse.data[0] && apiResponse.data[0].code === "SUCCESS") {
                    // Show success message
                    ZDK.Client.showMessage("Appointment mode updated successfully!", "success");
                    
                    // Optional: Refresh the page to show updated data
                    // window.location.reload();
                } else {
                    console.error("API Error:", apiResponse);
                    ZDK.Client.showMessage("Error updating appointment mode. Please try again.", "error");
                }
            }).catch(function(error) {
                console.error("Error updating record:", error);
                ZDK.Client.showMessage("Error updating appointment mode. Please try again.", "error");
            });
        }
    })
    .catch(function(error) {
        console.error("Error in popup:", error);
        ZDK.Client.showMessage("Error opening appointment mode selection.", "error");
    });
}

// Alternative method using ZDK.Page.getRecord() and update
function updateAppointmentModeAlternative() {
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
            default_value: ZDK.Page.getRecord().Appointment_Mode || "Face to Face"
        }
    ], 'Appointment Mode Selection', 'Update', 'Cancel')
    .then(function(response) {
        if (response && response.data && response.data.length > 0) {
            let selectedMode = response.data[0].value;
            console.log("Selected Mode:", selectedMode);

            // Update field in UI
            ZDK.Page.getField("Appointment_Mode").setValue(selectedMode);
            
            // Save the record using ZDK
            ZDK.Page.save().then(function(saveResponse) {
                console.log("Save Response:", saveResponse);
                ZDK.Client.showMessage("Appointment mode updated successfully!", "success");
            }).catch(function(saveError) {
                console.error("Save Error:", saveError);
                ZDK.Client.showMessage("Error saving changes. Please try again.", "error");
            });
        }
    })
    .catch(function(error) {
        console.error("Error in popup:", error);
    });
}

// Function to add button for appointment mode update
function addAppointmentModeButton() {
    try {
        var modeButton = {
            text: "Change Mode",
            type: "button",
            id: "change_appointment_mode_btn",
            style: "background-color: #17a2b8; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; margin: 5px;",
            onclick: function() {
                updateAppointmentMode();
            }
        };

        ZDK.Client.addButton(modeButton);
        console.log("Appointment mode button added successfully");
        
    } catch (error) {
        console.error("Error adding appointment mode button:", error);
    }
}

// Initialize if on detail view
if (ZDK.Page.getModule() === "Appointment_Bookings" && ZDK.Page.getMode() === "view") {
    addAppointmentModeButton();
}