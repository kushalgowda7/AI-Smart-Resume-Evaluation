const fs = require('fs').promises;
const pdf = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Parses a resume file from a buffer or file path.
 * @param {object} file - The file object from multer. Should have either a `buffer` or a `path` property.
 * @returns {Promise<string>} The extracted text from the document.
 */
const parseResume = async (file) => {
    let buffer;

    if (file.path) {
        buffer = await fs.readFile(file.path);
    } else if (file.buffer) {
        buffer = file.buffer;
    } else {
        throw new Error('File path or buffer must be provided.');
    }

    if (file.mimetype === 'application/pdf') {
        const data = await pdf(buffer);
        return data.text;
    } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const { value } = await mammoth.extractRawText({ buffer });
        return value;
    } else {
        throw new Error('Unsupported file type. Please upload a PDF or DOCX file.');
    }
};

module.exports = { parseResume };
