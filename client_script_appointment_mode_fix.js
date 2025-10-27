/**
 * Client Script Fix for Appointment Mode Update
 * Problem: ZOHO.CRM.API.updateRecord() doesn't work in client scripts
 * Solution: Use ZDK.Page.save() or trigger record save properly
 */

// Method 1: Using ZDK.Page.save() - Most Reliable
function updateAppointmentModeClientScript() {
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

            // Update the field value in the form
            ZDK.Page.getField("Appointment_Mode").setValue(selectedMode);
            
            // IMPORTANT: Save the page to persist changes
            ZDK.Page.save().then(function(saveResponse) {
                console.log("Save Response:", saveResponse);
                ZDK.Client.showMessage("Appointment mode updated successfully!", "success");
                
                // Optional: Refresh to show updated data
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
                
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

// Method 2: Using form submission approach
function updateAppointmentModeFormSubmit() {
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

            // Update the field value
            ZDK.Page.getField("Appointment_Mode").setValue(selectedMode);
            
            // Mark the field as modified to ensure it gets saved
            ZDK.Page.getField("Appointment_Mode").setMandatory(false);
            
            // Trigger form save programmatically
            var saveButton = document.querySelector('button[data-zcqa="save_record"]') || 
                           document.querySelector('input[value="Save"]') ||
                           document.querySelector('button:contains("Save")');
            
            if (saveButton) {
                saveButton.click();
            } else {
                // Fallback to ZDK save
                ZDK.Page.save();
            }
        }
    })
    .catch(function(error) {
        console.error("Error in popup:", error);
    });
}

// Method 3: Using field change event to trigger save
function updateAppointmentModeWithEvent() {
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

            // Get the field element
            var field = ZDK.Page.getField("Appointment_Mode");
            
            // Update the field value
            field.setValue(selectedMode);
            
            // Trigger change event to mark field as dirty
            var fieldElement = document.querySelector('[data-fieldapiname="Appointment_Mode"]') ||
                             document.querySelector('select[name="Appointment_Mode"]') ||
                             document.querySelector('#Appointment_Mode');
            
            if (fieldElement) {
                // Create and dispatch change event
                var changeEvent = new Event('change', { bubbles: true });
                fieldElement.dispatchEvent(changeEvent);
                
                // Also try input event
                var inputEvent = new Event('input', { bubbles: true });
                fieldElement.dispatchEvent(inputEvent);
            }
            
            // Save the page
            ZDK.Page.save().then(function(saveResponse) {
                console.log("Successfully saved:", saveResponse);
                ZDK.Client.showMessage("Appointment mode updated!", "success");
            }).catch(function(error) {
                console.error("Save failed:", error);
                ZDK.Client.showMessage("Error saving. Please try again.", "error");
            });
        }
    })
    .catch(function(error) {
        console.error("Error in popup:", error);
    });
}

// Method 4: Simple approach - let user save manually
function updateAppointmentModeSimple() {
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

            // Update the field value
            ZDK.Page.getField("Appointment_Mode").setValue(selectedMode);
            
            // Show message asking user to save
            ZDK.Client.showMessage("Appointment mode updated. Please click 'Save' to persist changes.", "info");
        }
    })
    .catch(function(error) {
        console.error("Error in popup:", error);
    });
}

// Function to add the appointment mode button
function addAppointmentModeButton() {
    try {
        var modeButton = {
            text: "Change Mode",
            type: "button",
            id: "change_appointment_mode_btn",
            style: "background-color: #17a2b8; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; margin: 5px;",
            onclick: function() {
                // Use Method 1 as it's most reliable
                updateAppointmentModeClientScript();
            }
        };

        ZDK.Client.addButton(modeButton);
        console.log("Appointment mode button added successfully");
        
    } catch (error) {
        console.error("Error adding appointment mode button:", error);
    }
}

// Initialize if on detail view of Appointment_Bookings
function initializeAppointmentMode() {
    try {
        if (ZDK.Page.getModule() === "Appointment_Bookings" && ZDK.Page.getMode() === "view") {
            addAppointmentModeButton();
        }
    } catch (error) {
        console.error("Error initializing:", error);
    }
}

// Call initialization
initializeAppointmentMode();