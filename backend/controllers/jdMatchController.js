const asyncHandler = require('express-async-handler');
const Resume = require('../models/Resume');
const JDMatchHistory = require('../models/JDMatchHistory');
const { parseResume } = require('../utils/resumeParser.js');
const { performJDMatchAnalysis } = require('../services/analysisService');
const crypto = require('crypto');

// Helper to generate hash
const generateHash = (text) => crypto.createHash('sha256').update(text).digest('hex');

// @desc    Compare a resume with a JD and save the analysis
// @route   POST /api/resumes/:resumeId/jd-match
// @access  Private
exports.analyzeJD = asyncHandler(async (req, res) => {
    const { resumeId } = req.params;
    const { jdText } = req.body;
    const jdFile = req.file;

    const resume = await Resume.findById(resumeId);
    if (!resume || resume.user.toString() !== req.user.id) {
        res.status(404);
        throw new Error('Resume not found or user not authorized');
    }

    let jobDescriptionText = jdText;
    if (jdFile) {
        jobDescriptionText = await parseResume(jdFile);
    }

    if (!jobDescriptionText || jobDescriptionText.trim() === '') {
        res.status(400);
        throw new Error('Job description text is required.');
    }

    // 1. Generate Hash
    const inputHash = generateHash(resume.parsedText + jobDescriptionText);

    // 2. Check DB for existing match analysis
    let historyEntry = await JDMatchHistory.findOne({ resume: resumeId, inputHash });

    if (historyEntry) {
        const logger = require('../utils/logger');
        logger.debug('Returning existing JD match analysis from DB.');
        return res.status(200).json({
            success: true,
            message: 'JD analysis retrieved from database.',
            data: historyEntry
        });
    }

    try {
        const analysisResult = await performJDMatchAnalysis(resume.parsedText, jobDescriptionText, req.user.id);

        // Create a history entry
        historyEntry = await JDMatchHistory.create({
            user: req.user.id,
            resume: resumeId,
            jdText: jobDescriptionText,
            inputHash,
            jobTitle: `Analysis vs ${resume.originalFilename}`,
            analysisData: analysisResult
        });

        res.status(201).json({
            success: true,
            message: 'JD analysis complete.',
            data: historyEntry
        });
    } catch (error) {
        if (error.code === 'AI_LIMIT_REACHED') {
            res.status(429);
            throw new Error(error.message);
        }
        if (error.code === 'AI_TEMPORARILY_UNAVAILABLE') {
            res.status(503);
            throw new Error(error.message);
        }
        throw error;
    }
});

// @desc    Get JD match history for a specific resume
// @route   GET /api/resumes/:resumeId/jd-match/history
// @access  Private
exports.getJDMatchHistory = asyncHandler(async (req, res) => {
    const { resumeId } = req.params;
    const history = await JDMatchHistory.find({ resume: resumeId, user: req.user.id }).sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: history.length,
        data: history
    });
});

// @desc    Delete a JD match history entry
// @route   DELETE /api/jd-match/:historyId
// @access  Private
exports.deleteJDMatchHistory = asyncHandler(async (req, res) => {
    const { historyId } = req.params;
    const historyEntry = await JDMatchHistory.findById(historyId);

    if (!historyEntry || historyEntry.user.toString() !== req.user.id) {
        res.status(404);
        throw new Error('History entry not found or user not authorized');
    }

    await JDMatchHistory.findByIdAndDelete(historyId);

    res.status(200).json({ success: true, message: 'History entry deleted.' });
});