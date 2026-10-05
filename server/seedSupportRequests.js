import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import SupportRequest from './models/SupportRequest.js';

const envPathLocal = path.resolve(process.cwd(), '.env');
const envPathParent = path.resolve(process.cwd(), '..', '.env');
dotenv.config({ path: envPathLocal });
if (!process.env.MONGO_URI) {
    dotenv.config({ path: envPathParent });
}

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/doulos-attendance';

const seedSupportRequests = async () => {
    try {
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB Atlas for Member Care Seeding');

        const existingCount = await SupportRequest.countDocuments();
        if (existingCount > 0) {
            console.log(`Found ${existingCount} existing support requests, skipping seed.`);
            process.exit(0);
        }

        const sampleRequests = [
            {
                memberId: '22-0990',
                memberName: 'Seth Korir',
                campus: 'Athi River',
                memberType: 'Douloid',
                reason: 'Family encouragement & academic balance',
                details: 'Would appreciate someone checking in after fellowship regarding balancing leadership responsibilities and mid-semester coursework.',
                preferredContactMethod: 'In Person',
                source: 'QUESTION_CHECK_IN',
                priority: 'NORMAL',
                status: 'NEEDS_ATTENTION',
                assignedTo: null,
                notes: [],
                requestedAt: new Date(Date.now() - 3600000 * 4) // 4 hours ago
            },
            {
                memberId: '23-1450',
                memberName: 'Grace Wambui',
                campus: 'Nairobi',
                memberType: 'Doulos Member',
                reason: 'Prayer regarding spiritual discipline during exams',
                details: 'Requested a prayer partner from Doulos for early morning devotions and spiritual accountability.',
                preferredContactMethod: 'WhatsApp',
                source: 'DIRECT_REQUEST',
                priority: 'NORMAL',
                status: 'ASSIGNED',
                assignedTo: 'g3',
                notes: [
                    {
                        text: 'Assigned to G3. Sent intro WhatsApp message to schedule a 15-minute call.',
                        author: 'g3',
                        createdAt: new Date(Date.now() - 3600000 * 2)
                    }
                ],
                requestedAt: new Date(Date.now() - 3600000 * 24)
            },
            {
                memberId: '21-0812',
                memberName: 'Kevin Otieno',
                campus: 'Athi River',
                memberType: 'Douloid',
                reason: 'Discerning camp ministry leadership calling',
                details: 'Struggling with confidence to step forward for the upcoming outdoor wilderness expedition trainer role. Needs pastoral guidance.',
                preferredContactMethod: 'In Person',
                source: 'QUESTION_CHECK_IN',
                priority: 'NORMAL',
                status: 'IN_PROGRESS',
                assignedTo: 'g4',
                notes: [
                    {
                        text: 'Met after Wednesday evening fellowship at the amphitheatre. Discussed Moses and Gideon scriptures.',
                        author: 'g4',
                        createdAt: new Date(Date.now() - 3600000 * 18)
                    },
                    {
                        text: 'Agreed to fast on Friday and review camp responsibilities together next week.',
                        author: 'g4',
                        createdAt: new Date(Date.now() - 3600000 * 12)
                    }
                ],
                requestedAt: new Date(Date.now() - 3600000 * 48)
            },
            {
                memberId: '22-0451',
                memberName: 'Faith Chebet',
                campus: 'Athi River',
                memberType: 'Douloid',
                reason: 'Bereavement follow-up & prayer visit',
                details: 'Lost grandmother last week. Requested prayer and support from the fellowship family.',
                preferredContactMethod: 'In Person',
                source: 'DIRECT_REQUEST',
                priority: 'NORMAL',
                status: 'RESOLVED',
                assignedTo: 'g3',
                notes: [
                    {
                        text: 'Visited hostel with G3 prayer team on Thursday evening. Shared Psalm 23 and prayed with roommate.',
                        author: 'g3',
                        createdAt: new Date(Date.now() - 3600000 * 70)
                    },
                    {
                        text: 'Followed up over weekend. Faith reported peace and gratitude to the fellowship.',
                        author: 'g3',
                        createdAt: new Date(Date.now() - 3600000 * 24)
                    }
                ],
                requestedAt: new Date(Date.now() - 3600000 * 96),
                resolvedAt: new Date(Date.now() - 3600000 * 24)
            }
        ];

        await SupportRequest.insertMany(sampleRequests);
        console.log(`Successfully seeded ${sampleRequests.length} Member Care support requests!`);
        process.exit(0);
    } catch (err) {
        console.error('Error seeding support requests:', err);
        process.exit(1);
    }
};

seedSupportRequests();
