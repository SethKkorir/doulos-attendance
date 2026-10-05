import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import User from './models/User.js';
import Fellowship from './models/Fellowship.js';

const envPathLocal = path.resolve(process.cwd(), '.env');
const envPathParent = path.resolve(process.cwd(), '..', '.env');
dotenv.config({ path: envPathLocal });
if (!process.env.MONGO_URI) {
    dotenv.config({ path: envPathParent });
}

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/doulos-attendance';

async function seed() {
    try {
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB:', mongoUri.split('@')[1] || mongoUri);

        // 1. Ensure G3 and G4 user accounts exist
        const usersToSeed = [
            { username: 'g3', role: 'g3', campus: 'Athi River' },
            { username: 'g4', role: 'g4', campus: 'Athi River' },
            { username: 'g3_secretary', role: 'g3_secretary', campus: 'Valley Road' },
        ];

        for (const u of usersToSeed) {
            const exists = await User.findOne({ username: u.username });
            if (!exists) {
                const user = new User({
                    username: u.username,
                    password: 'admin123',
                    role: u.role,
                    campus: u.campus
                });
                await user.save();
                console.log(`👤 Created ${u.username} (Password: admin123)`);
            } else {
                console.log(`✓ User ${u.username} already exists`);
            }
        }

        // 2. Ensure an active published fellowship exists for today
        const existingFellowship = await Fellowship.findOne({ status: 'PUBLISHED' });
        if (!existingFellowship) {
            const inaugural = new Fellowship({
                title: 'The Courage to Begin',
                date: new Date(),
                theme: 'Courage & Calling',
                scriptureReference: 'Joshua 1:9',
                scriptureText: 'Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.',
                devotional: `Beginning any new season requires stepping into the unknown. When Joshua took over leadership from Moses, the assignment was massive and the territory was unfamiliar. Yet God did not anchor Joshua's confidence in his own natural strength, weapons, or past experience. God anchored Joshua's confidence in one unwavering truth: His divine presence.\n\nWhatever station of life, campus semester, or spiritual discipline you are stepping into today, remember that courage is not the absence of fear — it is the decision to move forward knowing the Lord walks with you.`,
                reflectionQuestion: 'What is one specific step of faith or courage God is inviting you to take today?',
                prayer: 'Heavenly Father, grant me the strength to step into this day without fear. Fill my heart with quiet confidence in Your presence, and let my words and actions reflect Your love to those around me. In Jesus name, Amen.',
                communityPrompt: 'Share with a fellow Douloid one area where you are trusting God for boldness this semester.',
                campus: 'All',
                status: 'PUBLISHED',
                publishedAt: new Date(),
                openedCount: 42,
                reflectionsCount: 18,
                prayerInteractionsCount: 26,
                createdBy: 'G3 Spiritual Coordinator'
            });

            inaugural.calculateCompletion();
            await inaugural.save();
            console.log('📖 Seeded inaugural published fellowship: "The Courage to Begin"');
        } else {
            console.log(`✓ Fellowship "${existingFellowship.title}" is already published`);
        }

        await mongoose.connection.close();
        console.log('✅ Seeding completed successfully');
        process.exit(0);
    } catch (e) {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    }
}

seed();
