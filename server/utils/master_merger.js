/**
 * DOULOS SYSTEM - MASTER CLUSTER MERGER
 * -------------------------------------
 * Use this script once your primary MongoDB cluster is back online.
 * It will merge everything recorded in the Temporary Cluster back into the Main Cluster.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Configure these carefully during the merge phase
const SOURCE_URI = "NEW_TEMP_CLUSTER_URI"; // Temporary cluster (source)
const TARGET_URI = "OLD_MAIN_CLUSTER_URI"; // Main cluster (target)

dotenv.config();

const merge = async () => {
  try {
    console.log("--- Starting Master Merge ---");

    // 1. Connect to Source
    const sourceConn = await mongoose.createConnection(SOURCE_URI).asPromise();
    const MemberSource = sourceConn.model('Member', (await import('../models/Member.js')).default.schema);
    const AttendanceSource = sourceConn.model('Attendance', (await import('../models/Attendance.js')).default.schema);
    console.log("Connected to Source Cluster");

    // 2. Connect to Target
    const targetConn = await mongoose.createConnection(TARGET_URI).asPromise();
    const MemberTarget = targetConn.model('Member', (await import('../models/Member.js')).default.schema);
    const AttendanceTarget = targetConn.model('Attendance', (await import('../models/Attendance.js')).default.schema);
    console.log("Connected to Target Cluster");

    // 3. Merging Members (adding points + checking new signups)
    const sourceMembers = await MemberSource.find({});
    console.log(`Processing ${sourceMembers.length} members from source...`);

    for (const member of sourceMembers) {
      // Find matching member in target
      const targetMember = await MemberTarget.findOne({ studentRegNo: member.studentRegNo });

      if (targetMember) {
        // Increment their points by the delta earned in the temp cluster
        if (member.totalPoints > 0) {
            await MemberTarget.updateOne(
                { studentRegNo: member.studentRegNo },
                { $inc: { totalPoints: member.totalPoints } }
            );
        }
      } else {
        // This is a new sign-up while the system was in recovery
        const memberData = member.toObject();
        delete memberData._id; // Ensure new ID in target
        await MemberTarget.create(memberData);
        console.log(`New sign-up merged: ${member.studentRegNo}`);
      }
    }

    // 4. Merging Attendance Records
    const sourceAttendance = await AttendanceSource.find({});
    console.log(`Merging ${sourceAttendance.length} attendance records...`);

    let newRecordsCount = 0;
    for (const att of sourceAttendance) {
        // Check if this record already exists in target (optional safety)
        const exists = await AttendanceTarget.findOne({ 
            studentRegNo: att.studentRegNo, 
            timestamp: att.timestamp 
        });

        if (!exists) {
            const attData = att.toObject();
            delete attData._id;
            await AttendanceTarget.create(attData);
            newRecordsCount++;
        }
    }

    console.log(`✅ Success! ${newRecordsCount} attendance records merged.`);
    console.log("Merge complete. Please switch your .env MONGO_URI back to the main cluster.");
    
    process.exit(0);
  } catch (error) {
    console.error("Critical Merge Error:", error);
    process.exit(1);
  }
};

merge();
