// Your original code - just add ONE line at the end:

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

        // Update the Appointment_Mode field in the current record
        ZDK.Page.getField("Appointment_Mode").setValue(selectedMode);
        
        // ADD JUST THIS ONE LINE:
        ZDK.Page.save();
    }
})
.catch(function(error) {
    console.error("Error in popup:", error);
});