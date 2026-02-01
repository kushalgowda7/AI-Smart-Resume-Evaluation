const express = require('express');
const { analyzeJD, getJDMatchHistory } = require('../controllers/jdMatchController');
const { validate, jdMatchRules } = require('../middleware/validators');
const upload = require('../middleware/upload');

const router = express.Router({ mergeParams: true });

// Routes that operate on a specific resume (mounted under /api/resumes/:resumeId/jd-match)
router.post('/', upload.single('jdFile'), jdMatchRules, validate, analyzeJD);
router.get('/history', getJDMatchHistory);

module.exports = router;
