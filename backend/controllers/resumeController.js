const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const mongoose = require('mongoose');
const Resume = require('../models/Resume');
const ResumeAnalysis = require('../models/ResumeAnalysis');
const JDMatchHistory = require('../models/JDMatchHistory');
const { parseResume } = require('../utils/resumeParser.js');
const asyncHandler = require('express-async-handler');
const { performSimpleAnalysis, clearAnalysisCache } = require('../services/analysisService');
const logger = require('../utils/logger');

// Helper to generate hash
const generateHash = (text) => crypto.createHash('sha256').update(text).digest('hex');

// @desc    Upload and parse a resume
// @route   POST /api/resumes/upload
// @access  Private (Job Seekers)
exports.uploadResume = asyncHandler(async (req, res, next) => {
    if (!req.file) {
        res.status(400);
        throw new Error('Please upload a file.');
    }

    const parsedText = await parseResume(req.file);

    if (!parsedText) {
        res.status(400);
        throw new Error('Could not parse text from the resume.');
    }

    const resume = await Resume.create({
        user: req.user.id,
        originalFilename: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        parsedText: parsedText,
        analysis: {} // Deprecated, kept for backward compatibility if needed, but we use ResumeAnalysis now
    });

    res.status(201).json({
        success: true,
        message: 'Resume uploaded successfully. Ready for analysis.',
        data: {
            _id: resume._id,
            originalFilename: resume.originalFilename,
            createdAt: resume.createdAt,
            fileSize: resume.fileSize,
        }
    });
});

// @desc    Analyze a specific resume
// @route   POST /api/resumes/:id/analyze
// @access  Private (Job Seekers)
exports.analyzeResume = async (req, res, next) => {
    try {
        const resume = await Resume.findById(req.params.id);

        if (!resume) {
            return res.status(404).json({ success: false, message: 'Resume not found.' });
        }

        if (resume.user.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Not authorized to analyze this resume.' });
        }

        // 1. Generate Hash
        const inputHash = generateHash(resume.parsedText);

        // 2. Check DB for existing analysis (Current Resume)
        let analysisEntry = await ResumeAnalysis.findOne({ resume: resume._id, inputHash });

        if (analysisEntry) {
            logger.debug('Returning existing analysis from DB.');

            // Simulate processing delay for better UX
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Update resume.analysis for backward compatibility/easy access
            resume.analysis = analysisEntry.analysisResult;
            resume.analysis.analyzedAt = analysisEntry.createdAt;
            await resume.save();

            return res.status(200).json({
                success: true,
                message: 'Resume analysis retrieved from database.',
                data: analysisEntry.analysisResult
            });
        }

        // 2b. Check DB for existing analysis (Any Resume by this user with same content)
        // This handles "upload same file without deleting previous" -> reuse result
        // CRITICAL: We must ensure we don't pick up "zombie" analyses from deleted resumes
        const existingAnalyses = await ResumeAnalysis.find({ user: req.user.id, inputHash }).sort({ createdAt: -1 });

        let analysisResults;

        for (const analysis of existingAnalyses) {
            // Check if the linked resume actually exists
            const linkedResume = await Resume.findById(analysis.resume);
            if (linkedResume) {
                logger.debug('Reusing analysis from previous upload (Deduplication).');
                // Simulate processing delay for better UX
                await new Promise(resolve => setTimeout(resolve, 2000));
                analysisResults = analysis.analysisResult;
                break; // Found a valid one, stop searching
            } else {
                // This is an orphan record (resume was deleted but analysis wasn't)
                // We should probably clean it up, or at least ignore it
                logger.debug(`Found orphaned analysis record, deleting: ${analysis._id}`);
                await ResumeAnalysis.findByIdAndDelete(analysis._id);
            }
        }

        if (!analysisResults) {
            // 3. Perform AI Analysis
            analysisResults = await performSimpleAnalysis(resume.parsedText, req.user.id);
        }

        // 4. Save new analysis (for the current resume)
        analysisEntry = await ResumeAnalysis.create({
            user: req.user.id,
            resume: resume._id,
            inputHash,
            analysisResult: analysisResults
        });

        // Update resume.analysis for backward compatibility
        resume.analysis = analysisResults;
        resume.analysis.analyzedAt = new Date();
        await resume.save();

        res.status(200).json({
            success: true,
            message: 'Resume analyzed successfully.',
            data: analysisResults
        });

    } catch (error) {
        logger.error(`Error analyzing resume: ${error.message}`);
        if (error.code === 'AI_LIMIT_REACHED') {
            return res.status(429).json({ success: false, message: error.message });
        }
        if (error.code === 'AI_TEMPORARILY_UNAVAILABLE') {
            return res.status(503).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: 'Server error while analyzing resume.' });
    }
};

// @desc    Get all resume analysis history for a user
// @route   GET /api/resumes/history
// @access  Private (Job Seekers)
exports.getResumeHistory = async (req, res, next) => {
    try {
        // We still fetch from Resume collection, but we ensure we have the latest analysis
        // Since we update resume.analysis on every analyze call, this is still valid.
        // However, strictly speaking, we should probably aggregate from ResumeAnalysis if we want full history.
        // For now, adhering to the requirement "Get all resume analysis history", we'll return the resumes
        // which contain the latest analysis snapshot.

        const resumes = await Resume.find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .select('_id originalFilename createdAt fileSize analysis');

        res.status(200).json({
            success: true,
            count: resumes.length,
            data: resumes
        });
    } catch (error) {
        console.error('Error fetching resume history:', error);
        res.status(500).json({ success: false, message: 'Server error while fetching history.' });
    }
};

// @desc    Get a single resume's full details
// @route   GET /api/resumes/:id
// @access  Private (Job Seekers)
exports.getResumeDetails = async (req, res, next) => {
    try {
        const resume = await Resume.findById(req.params.id);

        if (!resume) {
            return res.status(404).json({ success: false, message: 'Resume not found.' });
        }

        if (resume.user.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Not authorized to view this resume.' });
        }

        res.status(200).json({
            success: true,
            data: resume
        });

    } catch (error) {
        console.error('Error fetching resume details:', error);
        res.status(500).json({ success: false, message: 'Server error while fetching details.' });
    }
};

// @desc    Delete a specific resume and all associated data
// @route   DELETE /api/resumes/:id
// @access  Private (Job Seekers)
exports.deleteResume = async (req, res, next) => {
    try {
        const resume = await Resume.findById(req.params.id);

        if (!resume) {
            return res.status(404).json({ success: false, message: 'Resume not found.' });
        }

        if (resume.user.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Not authorized to delete this resume.' });
        }

        // 1. Delete File from Storage
        try {
            await fs.unlink(resume.filePath);
        } catch (fileError) {
            console.error(`Failed to delete file ${resume.filePath}:`, fileError);
            // Continue execution even if file delete fails (it might be already gone)
        }

        // 2. Clear Analysis Cache
        if (resume.parsedText) {
            clearAnalysisCache(resume.parsedText);
        }

        // 3. Delete All Analyses
        await ResumeAnalysis.deleteMany({ resume: resume._id });

        // 4. Delete All JD Matches
        await JDMatchHistory.deleteMany({ resume: resume._id });

        // 5. Delete Resume Document
        await Resume.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Resume and all associated data deleted successfully.'
        });

    } catch (error) {
        console.error('Error deleting resume:', error);
        res.status(500).json({ success: false, message: 'Server error while deleting resume.' });
    }
};

// @desc    Download the original resume file
// @route   GET /api/resumes/:id/download
// @access  Private
exports.downloadResume = async (req, res, next) => {
    try {
        const resume = await Resume.findById(req.params.id);

        if (!resume) {
            return res.status(404).json({ success: false, message: 'Resume not found.' });
        }

        if (resume.user.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Not authorized to download this resume.' });
        }

        const filePath = path.resolve(resume.filePath);

        const uploadDir = path.resolve(__dirname, '..', 'uploads');
        if (!filePath.startsWith(uploadDir)) {
            return res.status(403).json({ msg: 'Forbidden: Access to this file is not allowed.' });
        }

        res.download(filePath, resume.originalFilename, (err) => {
            if (err) {
                console.error('Error downloading file:', err);
                if (!res.headersSent) {
                    res.status(500).send('Could not download the file.');
                }
            }
        });

    } catch (error) {
        console.error('Error downloading resume:', error);
        res.status(500).json({ success: false, message: 'Server error while downloading resume.' });
    }
};