const mongoose = require('mongoose');

const JDMatchHistorySchema = new mongoose.Schema({
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
    jobTitle: {
        type: String,
        default: 'Job Description Analysis'
    },
    jdText: {
        type: String,
        required: true
    },
    inputHash: {
        type: String,
        required: true,
        index: true
    },
    analysisData: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    }
}, { timestamps: true });

// Compound index for faster lookups
JDMatchHistorySchema.index({ resume: 1, inputHash: 1 });

module.exports = mongoose.model('JDMatchHistory', JDMatchHistorySchema);