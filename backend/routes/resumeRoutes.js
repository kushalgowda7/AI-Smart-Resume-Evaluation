const express = require('express');
const {
    uploadResume,
    analyzeResume,
    getResumeHistory,
    getResumeDetails,
    deleteResume,
    downloadResume
} = require('../controllers/resumeController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Include other resource routers
const jdMatchRouter = require('./jdMatchRoutes');

const router = express.Router();

// All routes in this file are protected and restricted to jobseekers
router.use(protect);
router.use(authorize('jobseeker'));

// Re-route into other resource routers
router.use('/:resumeId/jd-match', jdMatchRouter);

router.route('/upload')
    .post(upload.single('resume'), uploadResume);

router.route('/history')
    .get(getResumeHistory);

router.route('/:id/analyze')
    .post(analyzeResume);

router.route('/:id/download')
    .get(downloadResume);
    
router.route('/:id')
    .get(getResumeDetails)
    .delete(deleteResume);

module.exports = router;