import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Member from './models/Member.js';

dotenv.config();

const members = [
  { studentRegNo: "22-3382", name: "Christian Langat", memberType: "Douloid", campus: "Athi River", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "24-1033", name: "Mercy Kihu", memberType: "Douloid", campus: "Athi River", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "22-2657", name: "Gareth Oyongo", memberType: "Douloid", campus: "Athi River", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "22-1747", name: "Nancy Mathenge", memberType: "Douloid", campus: "Athi River", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "24-1683", name: "Brayan John", memberType: "Douloid", campus: "Athi River", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "24-2755", name: "Alma Phyl", memberType: "Douloid", campus: "Athi River", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "23-1422", name: "Loise Gakenia", memberType: "Douloid", campus: "Athi River", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "23-2499", name: "Laurah Nyangasi", memberType: "Douloid", campus: "Athi River", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "23-2199", name: "Nasieku Letiyion", memberType: "Douloid", campus: "Athi River", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "24-3015", name: "Peter Ngei", memberType: "Douloid", campus: "Athi River", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "23-2533", name: "Shane Induli", memberType: "Douloid", campus: "Athi River", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "24-3055", name: "Mercy Makokha", memberType: "Douloid", campus: "Athi River", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "23-2714", name: "Hope Okada", memberType: "Douloid", campus: "Athi River", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "24-2047", name: "Janet Jaoko", memberType: "Douloid", campus: "Athi River", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "23-2512", name: "James Chiama", memberType: "Douloid", campus: "Athi River", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "24-2847", name: "Mourine Mumo", memberType: "Douloid", campus: "Athi River", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "24-2252", name: "Victor Kogo", memberType: "Douloid", campus: "Athi River", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "23-0082", name: "Ray Kahi", memberType: "Douloid", campus: "Valley Road", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "22-2699", name: "Joy Mudaki", memberType: "Douloid", campus: "Athi River", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "20-0722", name: "Jesse Kalinga", memberType: "Douloid", campus: "Athi River", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "22-1616", name: "Brianna Malaika", memberType: "Douloid", campus: "Athi River", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "22-2432", name: "Waziri Nyalual", memberType: "Douloid", campus: "Athi River", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "22-2280", name: "Francis Musau", memberType: "Douloid", campus: "Athi River", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "23-2844", name: "Neuliour Baraza", memberType: "Douloid", campus: "Athi River", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "24-1902", name: "Allan Spergion", memberType: "Douloid", campus: "Athi River", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "22-2369", name: "Audrey Nduta", memberType: "Douloid", campus: "Athi River", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "22-1735", name: "David Kariuki", memberType: "Douloid", campus: "Athi River", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "22-1447", name: "Michelle Kanyeki", memberType: "Douloid", campus: "Athi River", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "25-0093", name: "Billy Kitonga", memberType: "Douloid", campus: "Valley Road", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "24-3435", name: "Tressylyne Naliaka", memberType: "Douloid", campus: "Athi River", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "24-0697", name: "Justin Mutinda", memberType: "Douloid", campus: "Athi River", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "24-1539", name: "Lavine Nafula", memberType: "Douloid", campus: "Athi River", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "25-0094", name: "Chantelle Tindy", memberType: "Douloid", campus: "Athi River", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "24-2733", name: "Christine Musimbi", memberType: "Douloid", campus: "Athi River", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "24-2308", name: "Cynthia Wangari", memberType: "Douloid", campus: "Athi River", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "23-1677", name: "Trizah Ritah", memberType: "Douloid", campus: "Valley Road", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "23-2243", name: "Brian Mogusu", memberType: "Douloid", campus: "Athi River", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "20-0913", name: "Tertius Moseti", memberType: "Douloid", campus: "Valley Road", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "22-1684", name: "Brenda Akinyi", memberType: "Douloid", campus: "Athi River", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "24-1220", name: "Abigail Ndungu", memberType: "Douloid", campus: "Valley Road", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "22-3625", name: "Brendah Nyakio", memberType: "Douloid", campus: "Valley Road", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "24-2148", name: "Betayne Zawadi", memberType: "Douloid", campus: "Athi River", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "24-2282", name: "Abigael Mwende", memberType: "Douloid", campus: "Athi River", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "22-2815", name: "Linet Maina", memberType: "Douloid", campus: "Athi River", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "23-1282", name: "Emma Matuu", memberType: "Douloid", campus: "Athi River", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "23-1910", name: "Kanyi Mwaura (Khan)", memberType: "Douloid", campus: "Athi River", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "22-0935", name: "Debbie Kibuti", memberType: "Douloid", campus: "Athi River", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "25-0381", name: "Daisy Tesera", memberType: "Douloid", campus: "Valley Road", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "22-2812", name: "Faith Nyambura", memberType: "Douloid", campus: "Athi River", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "24-1048", name: "Bakhita Anja", memberType: "Douloid", campus: "Valley Road", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "24-2180", name: "Rachael Jelagat", memberType: "Douloid", campus: "Athi River", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "23-1441", name: "Felicia Ahadi", memberType: "Douloid", campus: "Valley Road", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "23-2085", name: "Sharon Kibet", memberType: "Douloid", campus: "Athi River", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "22-2671", name: "Murithi Muthiaine", memberType: "Douloid", campus: "Athi River", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "23-3058", name: "Ruth Rono", memberType: "Douloid", campus: "Athi River", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "24-1840", name: "Naomi Wangare", memberType: "Douloid", campus: "Athi River", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "22-2712", name: "Deborah Joy Bosibori", memberType: "Douloid", campus: "Athi River", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "23-2437", name: "Maureen Wangari", memberType: "Douloid", campus: "Athi River", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "22-2822", name: "Florence Mwende", memberType: "Douloid", campus: "Athi River", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "24-0828", name: "Veronica G Bath", memberType: "Douloid", campus: "Valley Road", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "22-2946", name: "Daisy Nyamokami", memberType: "Douloid", campus: "Athi River", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "24-1279", name: "Whitney Asega", memberType: "Douloid", campus: "Valley Road", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "24-3240", name: "Jason Subo", memberType: "Douloid", campus: "Athi River", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "22-2808", name: "Risper Kanana", memberType: "Douloid", campus: "Athi River", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "22-0822", name: "Paula Awuor", memberType: "Douloid", campus: "Valley Road", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "22-0422", name: "Dyrine Waringa", memberType: "Douloid", campus: "Athi River", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "22-2384", name: "Natalie Anyango", memberType: "Douloid", campus: "Athi River", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "23-1123", name: "Patience Mukami", memberType: "Douloid", campus: "Valley Road", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "22-0849", name: "Lincoln Mugominyo", memberType: "Douloid", campus: "Athi River", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "22-3773", name: "Bofoya Pistache Simon", memberType: "Douloid", campus: "Valley Road", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "23-2672", name: "Mary Ayen Mawien Dhuol", memberType: "Douloid", campus: "Valley Road", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "23-0179", name: "John Mbii", memberType: "Douloid", campus: "Athi River", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "22-2884", name: "Dolyvene Ondieki", memberType: "Douloid", campus: "Athi River", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "23-0979", name: "Yvonne Muchemi", memberType: "Douloid", campus: "Athi River", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "22-3340", name: "Grace Kanai", memberType: "Douloid", campus: "Athi River", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "24-3545", name: "Angelica Muendo", memberType: "Douloid", campus: "Valley Road", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "24-1694", name: "Shabuya Natasha", memberType: "Douloid", campus: "Athi River", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "23-1128", name: "Ida Kahaviza", memberType: "Douloid", campus: "Valley Road", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "24-1469", name: "Ivan Shonko", memberType: "Douloid", campus: "Athi River", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "22-1627", name: "Monica Joy", memberType: "Douloid", campus: "Athi River", totalPoints: 40, status: "Active", isActive: true },
  { studentRegNo: "24-1934", name: "Prudence Njuguna", memberType: "Douloid", campus: "Athi River", totalPoints: 40, status: "Active", isActive: true }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
    console.log("Connected to MongoDB");
    // Using ordered: false to skip duplicates
    await Member.insertMany(members, { ordered: false });
    console.log(`${members.length} members processed successfully!`);
    process.exit();
  } catch (error) {
    if (error.code === 11000) {
        console.warn("Notice: Some duplicates were skipped.");
        process.exit(0);
    }
    console.error("Error seeding data:", error);
    process.exit(1);
  }
};

seedDB();
