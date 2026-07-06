import express from 'express';
import auth from '../../core/middlewares/authMiddleware.js';
import * as workshopController from './workshop.controller.js';

const router = express.Router();
const authenticate = auth();

router.get('/history', authenticate, workshopController.getWorkshopHistory);
router.get(
  '/history/:sessionId',
  authenticate,
  workshopController.getWorkshopBySession
);

router.post('/create', authenticate, workshopController.createSession);
router.post('/classify', authenticate, workshopController.classifyForces);
router.post('/axes', authenticate, workshopController.selectAxes);
router.post('/scenarios', authenticate, workshopController.buildScenarios);
router.post('/windtunnel', authenticate, workshopController.runWindTunnel);
router.post('/report', authenticate, workshopController.generateReport);
router.post('/report/download', authenticate, workshopController.downloadPDF);
router.post('/guest/:token', workshopController.addedByInvitedUser);
router.delete('/guest/:token', workshopController.deleteInvitedUserFactor);
router.get(
  '/all/:sessionId',
  // authenticate,
  workshopController.getAllWorkshopBySession
);

export default router;
