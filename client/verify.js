import { isAttendanceOpen } from './src/utils/timeUtils.js';
import { submitAttendance } from './src/services/mockData.js';

console.log("Running Doulos Attendance Verification...");

// Test Case 1: Attendance on Monday at 9:00 PM (Should be OPEN)
const mondayNight = new Date('2023-10-23T21:00:00'); // Oct 23 2023 was a Monday
const resultOpen = isAttendanceOpen(mondayNight);
if (resultOpen.isOpen) {
    console.log("✅ Test 1 Passed: Attendance is OPEN on Monday 9PM");
} else {
    console.error("❌ Test 1 Failed: Attendance should be OPEN", resultOpen);
}

// Test Case 2: Attendance on Tuesday (Should be CLOSED)
const tuesday = new Date('2023-10-24T10:00:00');
const resultClosedDay = isAttendanceOpen(tuesday);
if (!resultClosedDay.isOpen && resultClosedDay.reason.includes('not Monday')) {
    console.log("✅ Test 2 Passed: Attendance is CLOSED on Tuesday");
} else {
    console.error("❌ Test 2 Failed: Attendance should be CLOSED on Tuesday", resultClosedDay);
}

// Test Case 3: Attendance on Monday at 6:00 PM (Should be CLOSED - too early)
const mondayEarly = new Date('2023-10-23T18:00:00');
const resultTooEarly = isAttendanceOpen(mondayEarly);
if (!resultTooEarly.isOpen && resultTooEarly.reason.includes('Start: 8:30 PM')) {
    console.log("✅ Test 3 Passed: Attendance is CLOSED on Monday 6PM");
} else {
    console.error("❌ Test 3 Failed: Attendance should be CLOSED (Too Early)", resultTooEarly);
}

// Test Case 4: Submit Attendance
console.log("Testing Mock Submission...");
submitAttendance("Test User", "athi")
    .then(res => {
        if (res.success && res.message.includes("Test User")) {
            console.log("✅ Test 4 Passed: Submission Successful");
        } else {
            console.error("❌ Test 4 Failed: Unexpected response", res);
        }
    })
    .catch(err => {
        console.error("❌ Test 4 Failed: Submission error", err);
    });
