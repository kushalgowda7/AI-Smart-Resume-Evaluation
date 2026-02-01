const mongoose = require('mongoose');

const ResumeAnalysisSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    resume: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Resume',
        required: true
    },
    inputHash: {
        type: String,
        required: true,
        index: true // Add index for faster lookups
    },
    analysisResult: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    }
}, { timestamps: true });

// Compound index to ensure uniqueness of analysis for a specific resume and hash
ResumeAnalysisSchema.index({ resume: 1, inputHash: 1 });

module.exports = mongoose.model('ResumeAnalysis', ResumeAnalysisSchema);
