import { getFailedReportUsers } from '../controllers/reportFailedController.js';

import express from 'express';
const router = express.Router();

router.route("/:id")
    .get(getFailedReportUsers)

export default router;