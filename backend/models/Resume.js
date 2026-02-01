const mongoose = require('mongoose');

const ResumeSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    originalFilename: {
        type: String,
        required: true
    },
    filePath: {
        type: String,
        required: true
    },
    fileSize: {
        type: Number, // in bytes
        required: true
    },
    parsedText: {
        type: String,
        required: true
    },
    analysis: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model('Resume', ResumeSchema);
