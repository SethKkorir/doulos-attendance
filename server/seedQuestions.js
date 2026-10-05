import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Question from './models/Question.js';

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
        console.log('✅ Connected to MongoDB');

        const count = await Question.countDocuments();
        if (count === 0) {
            const initialQuestions = [
                {
                    text: 'Campus Fuel: What is your primary morning lifesaver at Daystar?',
                    category: 'BANTER',
                    responseType: 'multiple_choice',
                    options: ['Tea', 'Coffee', 'Pure Hydration (Water)', 'Just Vibes'],
                    visibility: 'COMMUNITY',
                    required: false,
                    status: 'ACTIVE',
                    createdBy: 'G3 Spiritual Coordinator'
                },
                {
                    text: 'Who in your squad would survive a zombie apocalypse and why?',
                    category: 'BANTER',
                    responseType: 'text',
                    options: [],
                    visibility: 'COMMUNITY',
                    required: false,
                    status: 'ACTIVE',
                    createdBy: 'G4 Spiritual Coordinator'
                },
                {
                    text: 'What is the primary difference between screw-gate and auto-locking carabiners?',
                    category: 'SKILLS',
                    responseType: 'multiple_choice',
                    options: [
                        'Screw-gate requires manual sleeve rotation to lock',
                        'Auto-locking requires manual twisting every time',
                        'Auto-locking carabiners cannot be used in high ropes courses',
                        'There is no functional difference'
                    ],
                    correctAnswer: 'Screw-gate requires manual sleeve rotation to lock',
                    explanation: 'Screw-gate carabiners require the operator to consciously screw the threaded sleeve closed, while auto-locking carabiners snap into a locked state via spring tension automatically.',
                    difficulty: 'Beginner',
                    skill: 'High Ropes & Rigging Safety',
                    visibility: 'TRAINER',
                    required: true,
                    status: 'ACTIVE',
                    createdBy: 'G5 Training & Safety'
                },
                {
                    text: 'What should you do first under the 30-second flash-to-bang severe weather protocol?',
                    category: 'SKILLS',
                    responseType: 'multiple_choice',
                    options: [
                        'Immediately clear high elements and disperse to the designated safe zone',
                        'Take shelter under tall trees on the ridge',
                        'Continue drills if lightning is not visible',
                        'Pack heavy metallic carabiners into open metal buckets'
                    ],
                    correctAnswer: 'Immediately clear high elements and disperse to the designated safe zone',
                    explanation: 'Per LOP-ENV-03, when the flash-to-bang count drops to 30 seconds or less, all aerial ropes must be evacuated immediately and participants dispersed to lightning-safe structures.',
                    difficulty: 'Intermediate',
                    skill: 'Wilderness Safety & Evacuation',
                    visibility: 'TRAINER',
                    required: true,
                    status: 'ACTIVE',
                    createdBy: 'G5 Training & Safety'
                },
                {
                    text: 'What is one personal prayer point or life challenge currently on your heart?',
                    category: 'LIFE',
                    responseType: 'text',
                    options: [],
                    visibility: 'PRIVATE',
                    required: false,
                    status: 'ACTIVE',
                    createdBy: 'G3 Spiritual Coordinator'
                }
            ];

            await Question.insertMany(initialQuestions);
            console.log(`✅ Seeded ${initialQuestions.length} initial questions across Banter, Skills, and Life`);
        } else {
            console.log(`✓ Question bank already contains ${count} questions`);
        }

        await mongoose.connection.close();
        process.exit(0);
    } catch (e) {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    }
}

seed();
