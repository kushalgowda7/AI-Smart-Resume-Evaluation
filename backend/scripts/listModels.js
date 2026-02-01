// listModels.js - Ensure this is the content
const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');

const path = require('path');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('Error: GEMINI_API_KEY not found in your .env file.');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function listAvailableModels() {
  try {
    console.log('Fetching available models...');

    // This should now work with the updated library
    const result = await genAI.listModels();

    console.log('----------------------------------------');
    console.log('Models available for your API key:');
    console.log('----------------------------------------');

    for await (const m of result) {
      if (m.supportedGenerationMethods.includes('generateContent')) {
        console.log(`- ${m.name}`); // Example output: models/gemini-1.5-flash-001
      }
    }

    console.log('----------------------------------------');
    console.log("Use one of these model names (e.g., 'gemini-1.5-flash') in your 'analysisService.js' file."); // Adjust based on actual output

  } catch (error) {
    console.error('Error listing models:', error);
  }
}

listAvailableModels();