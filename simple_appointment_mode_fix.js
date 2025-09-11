/**
 * Simple Fix for Appointment Mode Update Issue
 * Problem: setValue() only updates UI, doesn't save to database
 * Solution: Use ZOHO.CRM.API.updateRecord() to actually save the change
 */

// Your original code with the fix
function updateAppointmentModeFixed() {
    // Get current record ID for database update
    var currentRecord = ZDK.Page.getRecord();
    var recordId = currentRecord.id;

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
            default_value: "Face to Face"
        }
    ], 'Appointment Mode Selection', 'OK', 'Cancel')
    .then(function(response) {
        if (response && response.data && response.data.length > 0) {
            let selectedMode = response.data[0].value;
            console.log("Selected Mode:", selectedMode);

            // Step 1: Update the UI field (your original code - this works for display)
            ZDK.Page.getField("Appointment_Mode").setValue(selectedMode);

            // Step 2: IMPORTANT - Save the change to the database
            var updateData = {
                "Appointment_Mode": selectedMode
            };

            ZOHO.CRM.API.updateRecord({
                Entity: "Appointment_Bookings",  // Replace with your actual module name
                APIData: updateData,
                RecordID: recordId
            }).then(function(apiResponse) {
                console.log("Database Update Response:", apiResponse);
                
                if (apiResponse.data && apiResponse.data[0] && apiResponse.data[0].code === "SUCCESS") {
                    console.log("Appointment mode saved successfully!");
                    // Optional: Show success message
                    // ZDK.Client.showMessage("Appointment mode updated!", "success");
                } else {
                    console.error("Failed to save appointment mode:", apiResponse);
                    alert("Error saving appointment mode. Please try again.");
                }
            }).catch(function(error) {
                console.error("Error updating record:", error);
                alert("Error saving appointment mode. Please try again.");
            });
        }
    })
    .catch(function(error) {
        console.error("Error in popup:", error);
    });
}

// Alternative method using ZDK.Page.save()
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
            default_value: "Face to Face"
        }
    ], 'Appointment Mode Selection', 'OK', 'Cancel')
    .then(function(response) {
        if (response && response.data && response.data.length > 0) {
            let selectedMode = response.data[0].value;
            console.log("Selected Mode:", selectedMode);

            // Update the field value in UI
            ZDK.Page.getField("Appointment_Mode").setValue(selectedMode);
            
            // Save the entire page/record - this will save all changed fields
            ZDK.Page.save().then(function(saveResponse) {
                console.log("Page saved successfully:", saveResponse);
            }).catch(function(saveError) {
                console.error("Error saving page:", saveError);
                alert("Error saving changes. Please try again.");
            });
        }
    })
    .catch(function(error) {
        console.error("Error in popup:", error);
    });
}