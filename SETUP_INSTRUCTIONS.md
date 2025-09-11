# Appointment Reschedule Client Script Setup Guide

## Overview
This client script adds a "Reschedule Appointment" button to your Appointment_Bookings module's detail view in Zoho CRM. When clicked, it opens a popup allowing users to select a new appointment date and time.

## Features
- ✅ Custom "Reschedule Appointment" button on detail view
- ✅ Popup form with current and new appointment date/time fields
- ✅ Date validation (prevents past dates)
- ✅ Automatic end time calculation based on duration
- ✅ Real-time record update
- ✅ User-friendly interface with loading states
- ✅ Keyboard shortcuts (ESC to close popup)

## Setup Instructions

### Step 1: Access Zoho CRM Setup
1. Log in to your Zoho CRM account
2. Go to **Setup** (gear icon in top-right corner)
3. Navigate to **Developer Space** → **Client Script**

### Step 2: Create New Client Script
1. Click **+ Create Script**
2. Fill in the details:
   - **Script Name**: `Appointment Reschedule Script`
   - **Module**: Select `Appointment_Bookings`
   - **When to Execute**: `On Load`
   - **Where to Execute**: `Detail View`

### Step 3: Add the Script Code
1. Copy the entire content from `appointment_reschedule_client_script.js`
2. Paste it into the script editor
3. Click **Save**

### Step 4: Test the Implementation
1. Navigate to any record in your Appointment_Bookings module
2. You should see the "Reschedule Appointment" button
3. Click the button to test the popup functionality
4. Try rescheduling an appointment to verify it works

## Script Functionality

### What the Script Does:
1. **Adds Button**: Automatically adds a "Reschedule Appointment" button to the detail view
2. **Shows Popup**: Displays a modal popup with appointment rescheduling form
3. **Validates Input**: Ensures new appointment date is in the future
4. **Updates Record**: Uses Zoho CRM API to update the appointment record
5. **Calculates End Time**: Automatically updates end time based on duration
6. **Refreshes Page**: Shows updated information after successful save

### Fields Updated:
- `Appointment_Start_Date_Time` - Updated to new selected date/time
- `Appointment_End_Date_Time` - Automatically calculated based on Duration field

## Customization Options

### Modify Button Appearance
To change the button styling, modify the `style` property in the `rescheduleButton` object:

```javascript
style: "background-color: #your-color; color: white; padding: 8px 16px; ..."
```

### Add Additional Fields
To include more fields in the reschedule popup (like Reschedule Reason, Notes), modify the `popupHTML` variable and add corresponding form fields.

### Change Validation Rules
Modify the validation logic in the `saveReschedule` function to add custom business rules.

## Troubleshooting

### Common Issues:

1. **Button Not Appearing**
   - Ensure script is set to execute "On Load" in "Detail View"
   - Check that module name is exactly "Appointment_Bookings"
   - Verify script is active/enabled

2. **Popup Not Opening**
   - Check browser console for JavaScript errors
   - Ensure ZDK/ZOHO objects are available
   - Try refreshing the page

3. **Save Not Working**
   - Verify API permissions for the user
   - Check field API names match exactly
   - Ensure record ID is being passed correctly

4. **Date Validation Issues**
   - Check browser compatibility with datetime-local input
   - Verify date format matches Zoho CRM expectations

### Debug Mode
To enable debug logging, add this line at the beginning of any function:
```javascript
console.log("Debug: Function name", arguments);
```

## Browser Compatibility
- Chrome: ✅ Fully supported
- Firefox: ✅ Fully supported  
- Safari: ✅ Supported
- Edge: ✅ Supported

## API Permissions Required
Ensure the user has the following permissions:
- Read access to Appointment_Bookings module
- Edit access to Appointment_Bookings module
- API access enabled

## Support
If you encounter any issues:
1. Check the browser console for error messages
2. Verify all field API names match your CRM setup
3. Test with a simple record first
4. Contact your Zoho CRM administrator if API permissions are needed

---

**Note**: This script is designed for the Appointment_Bookings custom module. If your module has different field names, update the field references in the script accordingly.