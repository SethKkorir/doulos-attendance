import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Member from './models/Member.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://zsethkipchumba179_db_user:kipchumba@doulos.ypnrghc.mongodb.net/';

// Official 4 Facilitator Levels and Clearances from PDF:
// 1. Lead Douloid: Primary Belayer Certified, Solo Station: true
// 2. Intermediate Douloid: Primary Belayer Certified, Solo Station: true
// 3. Basic Douloid: Secondary Belayer, Solo Station: false
// 4. Shadow Douloid: Not Permitted, Solo Station: false

const LEAD_DOULOIDS = [
    { name: 'Loise Gakenia', reg: '23-1422' },
    { name: 'Kelcy Daniels', reg: '' },
    { name: 'Joe Maina', reg: '' },
    { name: 'Haleem', reg: '' },
    { name: 'Samuel Muhami', reg: '' },
    { name: 'James Waregak', reg: '' }
];

const INTERMEDIATE_DOULOIDS = [
    { name: 'Alma Phyl', reg: '24-2755' },
    { name: 'Michael Maruhi', reg: '23-1801' },
    { name: 'Betayne Zawadi', reg: '24-2148' },
    { name: 'Nancy Mathenge', reg: '22-1717' },
    { name: 'Oscar Omondi', reg: '21-0541' },
    { name: 'Victor Kogo', reg: '24-2252' },
    { name: 'Fidel Oyando', reg: '' },
    { name: "Christian Lang'at", reg: '22-3382', altName: 'Christian Langat' },
    { name: 'Dolyvene Ondieki', reg: '22-2884' },
    { name: 'Shane Induli', reg: '23-2533' },
    { name: 'Tertius Moseti', reg: '20-0913' },
    { name: 'Brenda Nyakio', reg: '22-3625', altName: 'Brendah Nyakio' },
    { name: 'Wanjiru Mutua', reg: '25-1438' },
    { name: 'Emmanuel Mukoya', reg: '20-0654' },
    { name: 'Raphael Mutuku', reg: '' },
    { name: 'David Chege', reg: '' },
    { name: 'Cynthia Muthoni', reg: '' },
    { name: 'John Mbii', reg: '23-0179' },
    { name: 'Elvis Chomba', reg: '' },
    { name: 'Isaac Labi', reg: '' },
    { name: 'Jesse Kalinga', reg: '20-0722' },
    { name: 'Mwaura Kanyi', reg: '23-1910', altName: 'Kanyi Mwaura (Khan)' },
    { name: 'Alma Taji', reg: '' },
    { name: 'Ndumia Nderitu', reg: '' },
    { name: 'Peter Ngei', reg: '24-3015' },
    { name: 'Sharlyn Bett', reg: '24-2177', altName: 'Shalyn Bett' },
    { name: 'Rachael Musuki', reg: '' },
    { name: 'Daisy Tesera', reg: '25-0381' },
    { name: 'Bhakita Anja', reg: '24-1048', altName: 'Bakhita Anja' },
    { name: 'Lafont Joy', reg: '23-2687', altName: 'lafont' },
    { name: 'Joshua Njagu', reg: '25-1234' }
];

const BASIC_DOULOIDS = [
    { name: 'Abigael Kirui', reg: '24-0578' },
    { name: 'Abigael Mwende', reg: '24-2282' },
    { name: 'Brayan John', reg: '24-1683' },
    { name: 'Brian Mogusu', reg: '23-2243' },
    { name: 'Christine Musimbi', reg: '24-2733' },
    { name: 'Cynthia Wangari', reg: '24-2308' },
    { name: 'Edith Temba', reg: '25-0575' },
    { name: 'Esther Njoki', reg: '25-0969' },
    { name: 'Felicia Ahadi', reg: '23-1441' },
    { name: 'Laurah Nyangasi', reg: '23-2499' },
    { name: 'Rachael Jelagat', reg: '24-2180' },
    { name: 'Ray Kahi', reg: '23-0082' },
    { name: 'Whitney Asega', reg: '24-1279' },
    { name: 'Mbae Samuel', reg: '24-2170', altName: 'Mbae Samuel kimandi' },
    { name: 'Faith Nyambura', reg: '22-2812' },
    { name: 'Neulior Baraza', reg: '23-2844', altName: 'Neuliour Baraza' },
    { name: 'Waziri Nyalual', reg: '22-2432' },
    { name: 'Linet Maina', reg: '22-2815' },
    { name: 'Francis Musau', reg: '22-2280' },
    { name: 'Ruth Rono', reg: '23-3058' },
    { name: 'Gareth Oseko', reg: '22-2657', altName: 'Gareth Oyongo' },
    { name: 'Ida Kahaviza', reg: '23-1128' },
    { name: 'Patience Mukami', reg: '23-1123' },
    { name: 'Deborah Joy Bosibori', reg: '22-2712' },
    { name: 'Brianna Malaika', reg: '22-1616' },
    { name: 'Fifay Wambui', reg: '25-2243', altName: 'Mitchell Wambui' },
    { name: 'Patience Sandy', reg: '25-0195' },
    { name: 'Shaltone Rimba', reg: '25-1085' },
    { name: 'Janet Jaoko', reg: '24-2047' },
    { name: 'Trizah Ritah', reg: '23-1677' },
    { name: 'Ngendo Muteria', reg: '25-1579' },
    { name: 'Chantelle Tindi', reg: '25-0094', altName: 'Chantelle Tindy' },
    { name: 'Mary Wilson', reg: '25-2644' },
    { name: 'Ayen Mary', reg: '23-2672', altName: 'Mary Ayen Mawien Dhuol' },
    { name: 'Daisy Nyamokami', reg: '22-2946' },
    { name: 'James Chiama', reg: '23-2512' },
    { name: 'Jason Subo', reg: '24-3240' },
    { name: 'Qarina Muriithi', reg: '25-1357' },
    { name: 'Ivan Shonko', reg: '24-1469' },
    { name: "Nasieku Naning'oi", reg: '23-2199', altName: 'Nasieku Letiyion' },
    { name: 'Sandra Kipkorir', reg: '23-1312' },
    { name: 'Yvonne Muchemi', reg: '' },
    { name: 'Justin Mutinda', reg: '24-0697' },
    { name: 'Serena Melanie', reg: '24-1943' },
    { name: 'Risper Kanana', reg: '22-2808' },
    { name: 'Debbie Kibuti', reg: '22-0935' },
    { name: 'Michelle Kanyeki', reg: '22-1447' },
    { name: 'Kanai Grace', reg: '22-3340', altName: 'Grace Kanai' },
    { name: 'Fidelia Uzoamaka', reg: '22-1747' },
    { name: 'Florence Mwende', reg: '22-2822' },
    { name: 'Lincoln Mugominyo', reg: '22-0849' },
    { name: 'Seth Kipchumba', reg: '22-0990', altName: 'Seth' },
    { name: 'Jeddy Wanjiru', reg: '25-0775' },
    { name: 'Patience Wangui', reg: '25-1279' }
];

const SHADOW_DOULOIDS = [
    { name: 'Albright Mardeline', reg: '22-0984' },
    { name: 'Avril Vanessa', reg: '24-2303' },
    { name: 'Kamanja Gloria', reg: '23-2504' },
    { name: 'Laura Lejeune', reg: '25-2159' },
    { name: 'Audrey Nduta', reg: '22-2369' },
    { name: 'Mercy Kihu', reg: '24-1033' },
    { name: 'Mercy Makokha', reg: '24-3055' },
    { name: 'John Walker', reg: '25-1461' },
    { name: 'Nicole Omondi', reg: '24-1865' },
    { name: 'Veronica B Bath', reg: '24-0828', altName: 'Veronica G Bath' },
    { name: 'Nicole Prudence', reg: '25-1331' },
    { name: 'Joy Njeri', reg: '25-2418' },
    { name: 'Dyrine Waringa', reg: '22-0422' },
    { name: 'Charlmark Karanja', reg: '24-1249', altName: 'Charlmak Karanja' },
    { name: 'Ivy Kibet', reg: '23-2168' },
    { name: 'Wilfred Wambari', reg: '24-3540' },
    { name: 'Abigael Ndungu', reg: '24-1220', altName: 'Abigail Ndungu' },
    { name: 'Grace Nzomo', reg: '23-2935' },
    { name: 'Marcus Chomba', reg: '25-2747' },
    { name: 'Tressylne Naliaka', reg: '24-3435', altName: 'Tressylyne Naliaka' },
    { name: 'Benda Akinyi', reg: '22-1684', altName: 'Brenda Akinyi' },
    { name: 'Giovanni Deogratsia', reg: '25-2942' },
    { name: 'Liz', reg: '25-1469', altName: 'Liz Tracy' },
    { name: 'Joy Mudaki', reg: '22-2699' },
    { name: 'Elsie Zawadi', reg: '' },
    { name: 'Sir Enock', reg: '' },
    { name: 'Georgina Amisi', reg: '' },
    { name: 'Naomi Muhoro', reg: '24-1840', altName: 'Naomi Wangare' },
    { name: 'Natalie Anyango', reg: '22-2384' },
    { name: 'Samuel Wambua', reg: '25-4839' },
    { name: 'Purity Wangui', reg: '' },
    { name: 'Caleb Lotu', reg: '' },
    { name: 'Adrian Baraka', reg: '24-1891' },
    { name: 'Mourine Mumo', reg: '24-2847' },
    { name: 'Lavine Opiyo', reg: '24-1539', altName: 'Lavine Nafula' },
    { name: 'Kefa Kemboi', reg: '25-2463' }
];

const RANK_GROUPS = [
    {
        rank: 'Lead Douloid',
        belayStatus: 'Primary Belayer Certified',
        soloStationAllowed: true,
        items: LEAD_DOULOIDS
    },
    {
        rank: 'Intermediate Douloid',
        belayStatus: 'Primary Belayer Certified',
        soloStationAllowed: true,
        items: INTERMEDIATE_DOULOIDS
    },
    {
        rank: 'Basic Douloid',
        belayStatus: 'Secondary Belayer',
        soloStationAllowed: false,
        items: BASIC_DOULOIDS
    },
    {
        rank: 'Shadow Douloid',
        belayStatus: 'Not Permitted',
        soloStationAllowed: false,
        items: SHADOW_DOULOIDS
    }
];

async function run() {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected.');

    const allDbMembers = await Member.find({});
    console.log(`Current total DB members: ${allDbMembers.length}`);

    let updatedCount = 0;
    let createdCount = 0;

    for (const group of RANK_GROUPS) {
        console.log(`\n=== Processing ${group.rank} (${group.items.length} members) ===`);
        for (const item of group.items) {
            // Find in DB by reg number first
            let member = allDbMembers.find(m => m.studentRegNo === item.reg);

            // If not found by reg, search by name or altName
            if (!member) {
                const normName = item.name.toLowerCase().trim();
                const normAlt = item.altName ? item.altName.toLowerCase().trim() : null;
                member = allDbMembers.find(m => {
                    const mName = m.name.toLowerCase().trim();
                    return mName === normName || (normAlt && mName === normAlt);
                });
            }

            if (member) {
                await Member.findByIdAndUpdate(member._id, {
                    $set: {
                        douloidRank: group.rank,
                        belayStatus: group.belayStatus,
                        soloStationAllowed: group.soloStationAllowed,
                        memberType: 'Douloid'
                    }
                });
                updatedCount++;
                console.log(`✓ UPDATED: ${member.name} (${member.studentRegNo}) -> ${group.rank}`);
            } else {
                // Create new member record
                const newMember = await Member.create({
                    name: item.name,
                    studentRegNo: item.reg,
                    memberType: 'Douloid',
                    campus: 'Athi River',
                    douloidRank: group.rank,
                    belayStatus: group.belayStatus,
                    soloStationAllowed: group.soloStationAllowed,
                    totalPoints: 40,
                    status: 'Active',
                    isActive: true
                });
                createdCount++;
                console.log(`+ CREATED: ${newMember.name} (${newMember.studentRegNo}) -> ${group.rank}`);
            }
        }
    }

    // Clean up any remaining legacy "Senior Lead Douloid"
    const seniorLeads = await Member.find({ douloidRank: 'Senior Lead Douloid' });
    for (const sl of seniorLeads) {
        await Member.findByIdAndUpdate(sl._id, {
            $set: {
                douloidRank: 'Lead Douloid',
                belayStatus: 'Primary Belayer Certified',
                soloStationAllowed: true
            }
        });
        console.log(`Cleaned up Senior Lead -> Lead Douloid for ${sl.name}`);
    }

    console.log('\n=======================================');
    console.log('            FINAL SYNC AUDIT           ');
    console.log('=======================================');
    console.log(`Updated existing members: ${updatedCount}`);
    console.log(`Created new members:     ${createdCount}`);
    console.log(`Total 127 facilitators processed: ${updatedCount + createdCount}`);

    // Verify final breakdown in DB
    const finalCounts = await Member.aggregate([
        { $match: { douloidRank: { $in: ['Lead Douloid', 'Intermediate Douloid', 'Basic Douloid', 'Shadow Douloid'] } } },
        { $group: { _id: '$douloidRank', count: { $sum: 1 } } }
    ]);
    console.log('\nFinal DB Rank Counts:', finalCounts);

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB.');
}

run().catch(err => {
    console.error('Fatal error during sync:', err);
    process.exit(1);
});
