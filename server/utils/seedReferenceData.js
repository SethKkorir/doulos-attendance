import RankDefinition from '../models/RankDefinition.js';
import EvaluationDomain from '../models/EvaluationDomain.js';
import Venue from '../models/Venue.js';
import LopDoc from '../models/LopDoc.js';

export const seedReferenceData = async () => {
    try {
        // 1. Seed Official Rank Definitions
        const rankDefs = [
            {
                rank: 'shadow',
                displayName: 'Shadow Douloid',
                belayPermission: 'none',
                canRunGroupAlone: false,
                order: 1,
                characteristics: [
                    'Apprentice facilitator in probationary training',
                    'Observes station setup and debrief synthesis techniques',
                    'Assists certified Douloids under direct supervision',
                    'Not permitted to operate high elements or belay unsupervised',
                    'Requires 8 meetings and G5 camp qualification to advance'
                ]
            },
            {
                rank: 'basic',
                displayName: 'Basic Douloid',
                belayPermission: 'secondary',
                canRunGroupAlone: false,
                order: 2,
                characteristics: [
                    'Certified secondary belayer on mid elements',
                    'Capable of co-leading team-building debriefs and ground initiatives',
                    'Supervised station operations with intermediate or lead douloid present',
                    'Assists in Freedom Base equipment staging and maintenance audits',
                    'Eligible for Intermediate review after consistent attendance & competency check'
                ]
            },
            {
                rank: 'intermediate',
                displayName: 'Intermediate Douloid',
                belayPermission: 'primary',
                canRunGroupAlone: true,
                order: 3,
                characteristics: [
                    'Primary belayer certified for high challenge ropes and zip systems',
                    'Approved to run individual challenge stations independently',
                    'Conducts technical harness inspections and carabiner squeeze checks',
                    'Mentors Shadow and Basic Douloids during field training drills',
                    'Eligible for Lead Douloid commission by G5 Directorate'
                ]
            },
            {
                rank: 'lead',
                displayName: 'Lead Douloid',
                belayPermission: 'primary',
                canRunGroupAlone: true,
                order: 4,
                characteristics: [
                    'Master facilitator and emergency rescue commander',
                    'Full operational clearance on all Freedom Base high stations and traverses',
                    'Authorized to conduct official candidate evaluations and checkoffs',
                    'Authorizes station openings, equipment lockouts, and gear retirements',
                    'Council-certified outdoor ministry leadership cadre'
                ]
            }
        ];

        for (const rd of rankDefs) {
            await RankDefinition.findOneAndUpdate(
                { rank: rd.rank },
                { $set: rd },
                { upsert: true, new: true }
            );
        }

        // 2. Seed Dynamic Evaluation Domains
        const evalDomains = [
            {
                key: 'teamBuilding',
                label: 'Team Building',
                tag: 'Facilitation',
                description: 'Group dynamics, debrief facilitation, activity structuring & debrief synthesis',
                subCriteria: ['Icebreaker execution', 'Challenge framing', 'Facilitated debrief', 'Metaphor application'],
                order: 1,
                isActive: true
            },
            {
                key: 'freedomBase',
                label: 'Freedom Base',
                tag: 'Operations',
                description: 'Base station hardware, equipment definition, maintenance audits & anchor security',
                subCriteria: ['Site safety checklist', 'Anchor inspection', 'Gear staging', 'Participant check-in'],
                order: 2,
                isActive: true
            },
            {
                key: 'highRopes',
                label: 'High Ropes',
                tag: 'Hardware & Rigging',
                description: 'Hardware rigging, carabiner squeeze check, challenge element navigation',
                subCriteria: ['Primary belay setup', 'Tensioning systems', 'Static safety line checks', 'Displacement management'],
                order: 3,
                isActive: true
            },
            {
                key: 'rescueExtrication',
                label: 'Rescue & Extrication',
                tag: 'Emergency',
                description: 'Mid-element rescues, spine board extrication, litter extraction, descent control',
                subCriteria: ['Cut-away rescue', 'Haul systems', 'Litter basket rigging', 'Emergency descent control'],
                order: 4,
                isActive: true
            },
            {
                key: 'firstAid',
                label: 'First Aid',
                tag: 'Medical Protocol',
                description: 'Wilderness triage, incident response, CPR/wound care, medical protocol execution',
                subCriteria: ['Primary patient assessment', 'Hemorrhage control', 'Splinting & immobilization', 'Evacuation communication'],
                order: 5,
                isActive: true
            },
            {
                key: 'safetyRiskManagement',
                label: 'Safety & Risk Management',
                tag: 'Risk Assessment',
                description: 'Environmental hazard assessment, participant briefings, double-check commands',
                subCriteria: ['Weather assessment', 'Double-check challenge', 'Briefing compliance', 'Physical hazard mitigation'],
                order: 6,
                isActive: true
            },
            {
                key: 'curriculumMentorship',
                label: 'Curriculum & Mentorship',
                tag: 'Strategy',
                description: 'Program strategy, apprentice development, facilitator guidance & spiritual formation',
                subCriteria: ['Shadow onboarding', 'Peer constructive feedback', 'Session lesson integration', 'Spiritual reflection'],
                order: 7,
                isActive: true
            }
        ];

        for (const ed of evalDomains) {
            await EvaluationDomain.findOneAndUpdate(
                { key: ed.key },
                { $set: ed },
                { upsert: true, new: true }
            );
        }

        // 3. Seed Venues
        const venues = [
            {
                name: 'Doulos Store',
                title: 'Doulos Store',
                sub: 'Athi River Campus',
                campus: 'Athi River',
                latitude: -1.44800,
                longitude: 37.01500,
                radius: 200,
                isDefault: true
            },
            {
                name: 'DAC 506',
                title: 'DAC 506',
                sub: 'Nairobi Campus (Valley Road)',
                campus: 'Valley Road',
                latitude: -1.29210,
                longitude: 36.80730,
                radius: 200,
                isDefault: true
            },
            {
                name: 'Freedom Base Main Lawn',
                title: 'Freedom Base',
                sub: 'Athi River Outdoor Facility',
                campus: 'Athi River',
                latitude: -1.44750,
                longitude: 37.01620,
                radius: 350,
                isDefault: false
            }
        ];

        for (const v of venues) {
            await Venue.findOneAndUpdate(
                { name: v.name },
                { $set: v },
                { upsert: true, new: true }
            );
        }

        // 4. Seed LOP Docs
        const lopDocs = [
            {
                title: 'High Ropes Standard Operating Procedures (SOP-HR-01)',
                category: 'High Ropes',
                description: 'Complete operational protocols for high challenge course rigging, belay protocols, and safety checkoffs.',
                fileUrl: '#lop-high-ropes',
                version: 'v3.2',
                approvedBy: 'G5 Training Directorate'
            },
            {
                title: 'Freedom Base Equipment & Gear Inspection Manual',
                category: 'Freedom Base',
                description: 'Daily, monthly, and semesterly inspection standards for harnesses, carabiners, dynamic ropes, and anchors.',
                fileUrl: '#lop-gear-inspection',
                version: 'v2.8',
                approvedBy: 'G8 Assets Directorate'
            },
            {
                title: 'Wilderness First Aid & Medical Protocol Guide',
                category: 'First Aid',
                description: 'Emergency trauma care, heat illness response, CPR standards, and medical evacuation coordinates for Freedom Base.',
                fileUrl: '#lop-first-aid',
                version: 'v4.0',
                approvedBy: 'G6 Welfare Directorate'
            },
            {
                title: 'Mid-Element Rescue & Emergency Extrication Action Plan',
                category: 'Emergency Protocol',
                description: 'Step-by-step procedures for aerial rescues, pick-off maneuvers, and urgent participant extraction.',
                fileUrl: '#lop-rescue',
                version: 'v2.1',
                approvedBy: 'G5 Training Directorate'
            },
            {
                title: 'Environmental Hazard & Severe Weather Guidelines',
                category: 'Risk Assessment',
                description: 'Lightning, high wind thresholds, and site evacuation protocols for outdoor activities.',
                fileUrl: '#lop-weather',
                version: 'v1.5',
                approvedBy: 'G1 Coordinator'
            }
        ];

        for (const doc of lopDocs) {
            await LopDoc.findOneAndUpdate(
                { title: doc.title },
                { $set: doc },
                { upsert: true, new: true }
            );
        }

        console.log('✅ Official reference data seeded successfully (Ranks, Domains, Venues, LOP Docs).');
    } catch (err) {
        console.error('Error seeding reference data:', err.message);
    }
};
