import express from 'express';
import {
    getRankDefinitions,
    getEvaluationDomains,
    getPromotionCandidates,
    submitEvaluation,
    promoteMember,
    downgradeMember,
    getCadreRoster
} from '../controllers/rankingController.js';

const router = express.Router();

router.get('/rank-definitions', getRankDefinitions);
router.get('/evaluation-domains', getEvaluationDomains);
router.get('/candidates', getPromotionCandidates);
router.get('/roster', getCadreRoster);
router.post('/:memberId/evaluate', submitEvaluation);
router.post('/:memberId/promote', promoteMember);
router.post('/:memberId/downgrade', downgradeMember);

export default router;
