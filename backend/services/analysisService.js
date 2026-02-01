/**
 * AI Analysis Service - Production Grade
 * 
 * This service provides AI-powered resume analysis using Google Gemini API.
 * Designed for paid tier with high-quality, deterministic responses.
 * 
 * Features:
 * - Deterministic scoring (temperature: 0)
 * - Response caching & deduplication
 * - Structured logging
 * - Robust error handling
 * - Request rate limiting per user
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const crypto = require('crypto');
const logger = require('../utils/logger');

// --- API Configuration ---
if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not defined in the .env file.');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- State Management ---
const cache = new Map();
const pendingRequests = new Map();
const userRateLimits = new Map();

// --- Configuration ---
const CONFIG = {
  CACHE_TTL: 24 * 60 * 60 * 1000,     // 24 hours
  USER_HOURLY_LIMIT: 50,               // Per user limit (generous for paid)
  MAX_RETRIES: 3,                      // Retry attempts on failure
  RETRY_DELAY_BASE: 1000,              // Base delay for exponential backoff
  MODEL_NAME: 'gemini-2.0-flash',      // Model to use
  GENERATION_CONFIG: {
    temperature: 0,                    // Deterministic output
    maxOutputTokens: 8192,             // Large output for detailed analysis
    topP: 1,                           // Greedy sampling
    topK: 1,                           // Greedy sampling
  }
};

// --- Helper Functions ---

/**
 * Generate SHA-256 hash for caching
 */
const generateHash = (text) => crypto.createHash('sha256').update(text).digest('hex');

/**
 * Check and enforce user rate limits
 */
const checkRateLimits = (userId) => {
  const now = Date.now();

  if (!userRateLimits.has(userId)) {
    userRateLimits.set(userId, { count: 0, resetTime: now + 3600000 });
  }

  const userLimit = userRateLimits.get(userId);

  if (now > userLimit.resetTime) {
    userLimit.count = 0;
    userLimit.resetTime = now + 3600000;
  }

  if (userLimit.count >= CONFIG.USER_HOURLY_LIMIT) {
    const waitTime = Math.ceil((userLimit.resetTime - now) / 60000);
    throw {
      code: 'AI_LIMIT_REACHED',
      message: `You have reached your hourly analysis limit. Please try again in ${waitTime} minutes.`
    };
  }
};

/**
 * Increment user rate limit counter
 */
const incrementRateLimits = (userId) => {
  const userLimit = userRateLimits.get(userId);
  if (userLimit) userLimit.count++;
};

/**
 * Clean and parse JSON from AI response
 */
const parseAIResponse = (responseText) => {
  // Extract JSON from markdown code block or raw response
  const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) ||
    responseText.match(/```\s*([\s\S]*?)\s*```/) ||
    [null, responseText];

  if (!jsonMatch || !jsonMatch[1]) {
    throw new Error('No valid JSON found in AI response.');
  }

  let jsonString = jsonMatch[1].trim();

  // Clean common JSON issues
  jsonString = jsonString
    .replace(/\u00A0/g, ' ')                    // Non-breaking spaces
    .replace(/[\r\n]+/g, ' ')                   // Normalize newlines
    .replace(/,\s*([}\]])/g, '$1')              // Trailing commas
    .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3'); // Unquoted keys

  try {
    return JSON.parse(jsonString);
  } catch (parseError) {
    logger.error(`JSON Parse Error: ${parseError.message}`);
    logger.debug(`Raw response: ${responseText.substring(0, 500)}...`);
    throw new Error('Failed to parse AI response as JSON.');
  }
};

/**
 * Execute AI API call with retry logic
 */
const executeAICall = async (prompt, customConfig = {}) => {
  const generationConfig = { ...CONFIG.GENERATION_CONFIG, ...customConfig };
  let lastError;

  for (let attempt = 1; attempt <= CONFIG.MAX_RETRIES; attempt++) {
    try {
      const model = genAI.getGenerativeModel({
        model: CONFIG.MODEL_NAME,
        generationConfig
      });

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      if (!responseText || responseText.trim().length === 0) {
        throw new Error('Empty response from AI service.');
      }

      return parseAIResponse(responseText);

    } catch (error) {
      lastError = error;
      const isRetryable = error.status === 429 ||
        error.status === 503 ||
        error.status >= 500 ||
        error.message?.includes('429');

      if (isRetryable && attempt < CONFIG.MAX_RETRIES) {
        const delay = CONFIG.RETRY_DELAY_BASE * Math.pow(2, attempt - 1);
        logger.warn(`AI API error (attempt ${attempt}/${CONFIG.MAX_RETRIES}): ${error.message}. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      break;
    }
  }

  // All retries exhausted
  logger.error(`AI API call failed after ${CONFIG.MAX_RETRIES} attempts: ${lastError?.message}`);

  if (lastError?.status === 429) {
    throw {
      code: 'AI_RATE_LIMITED',
      message: 'AI service is temporarily busy. Please try again in a few moments.'
    };
  }

  throw {
    code: 'AI_SERVICE_ERROR',
    message: 'Failed to get analysis from AI service. Please try again later.'
  };
};

/**
 * Main function to get analysis from AI with caching and deduplication
 */
const getAnalysisFromAI = async (prompt, userId, customConfig = {}) => {
  // 1. Rate Limit Check
  checkRateLimits(userId);

  // 2. Cache Check
  const promptHash = generateHash(prompt);

  if (cache.has(promptHash)) {
    const cached = cache.get(promptHash);
    if (Date.now() - cached.timestamp < CONFIG.CACHE_TTL) {
      logger.debug(`Cache hit for analysis (hash: ${promptHash.substring(0, 8)}...)`);
      return cached.data;
    }
    cache.delete(promptHash);
  }

  // 3. Deduplication - Check for in-flight requests
  if (pendingRequests.has(promptHash)) {
    logger.debug('Returning in-flight request promise');
    return pendingRequests.get(promptHash);
  }

  // 4. Execute API Call
  const apiCallPromise = (async () => {
    const data = await executeAICall(prompt, customConfig);

    // Cache successful response
    cache.set(promptHash, { data, timestamp: Date.now() });
    incrementRateLimits(userId);

    logger.info(`Analysis completed successfully for user ${userId}`);
    return data;
  })();

  pendingRequests.set(promptHash, apiCallPromise);

  try {
    return await apiCallPromise;
  } finally {
    pendingRequests.delete(promptHash);
  }
};

// --- Prompt Templates ---

/**
 * Create comprehensive resume analysis prompt
 * This prompt is designed for deterministic, consistent scoring
 */
const createAnalysisPrompt = (resumeText) => {
  return `**SYSTEM INSTRUCTION:** You are a hyper-consistent, deterministic AI resume analyst. You MUST follow all instructions precisely and without deviation. Your single task is to analyze the provided resume text and return a valid JSON object.

**CONTEXT:** You are analyzing the **raw text extracted** from a resume file (PDF/Doc). This text is exactly what an Applicant Tracking System (ATS) sees.
- If the text is jumbled, has weird characters, or lacks clear separation, it means the resume is **NOT** ATS-friendly.
- If standard headers (Experience, Education) are missing from the text, the resume fails the ATS check.
- Use the quality of this text to determine the "ATS_Optimization_Score".

**CRITICAL RULES:**
1. **JSON OUTPUT ONLY:** Your entire response MUST be a single, valid JSON object enclosed in \`\`\`json ... \`\`\`. NO additional text, explanation, or conversational filler is permitted outside this JSON block.
2. **DETERMINISTIC SCORING:** You must score based on the strict, internal rubric provided below. The same resume must receive the exact same score every time. Scores must be integers between 0 and 100.
3. **EVIDENCE-BASED ANALYSIS:** 
   - **MANDATORY:** Every single paragraph in your response MUST quote specific keywords, phrases, or numbers directly from the resume text.
   - **Length:** Write **detailed, insightful paragraphs (3-4 sentences)**. Do not be too brief, but do not waffle.
   - **Style:** Use simple, direct English. No corporate jargon.
   - **Format:** "You mentioned [Quote from Resume]. This is good because... / This needs improvement because..."
4. **NO JOB DESCRIPTION:** Your analysis is based SOLELY on the resume text provided and general best practices for creating a high-quality, professional resume. You are FORBIDDEN from mentioning, referencing, or alluding to a "job description" in any part of your output. For "Missing_Skills" and "Suitable_Job_Role", infer the candidate's likely career path and suggest skills/roles based on that inference.
5. **SPEAK TO THE CANDIDATE:** Drop third-person words like he, she, or they. Use you. Make it feel personal — you're giving feedback straight to the person reading it.
6. **REALISTIC JOB MATCHING:** For "Suitable_Job_Role", you must suggest roles that the candidate is *currently* qualified for based on the evidence in the resume.
   - Do not suggest "Senior" or "Lead" roles for candidates with < 3 years of experience.
   - **ORDERING & SCORING IS CRITICAL:** 
     - **1st Role:** The absolute best fit. **Match % MUST be between 85-98%**.
     - **2nd Role:** A strong alternative. **Match % MUST be between 75-85%**.
     - **3rd Role:** A good backup option. **Match % MUST be between 65-75%**.
   - **REASONING:** In the "reason" field, **bold** the specific matching skills (e.g., "**React**, **Node.js**").

**SCORING RUBRIC (Internal use only, do not mention in the output):**
* **Overall_Resume_Score (0-100):**
  * Clarity & Conciseness: 20 pts
  * Impact & Action Verbs: 20 pts
  * Quantifiable Results (Numbers/Metrics): 20 pts
  * Formatting & Structure (Logical flow): 20 pts
  * Completeness (Contact, Experience, Education, Skills): 20 pts
* **ATS_Optimization_Score (0-100):**
  * Standard Section Headers (Experience, Education, Skills): 40 pts
  * Keyword Relevance (Industry-standard terminology): 30 pts
  * Parseability (Text coherence, lack of artifacts): 30 pts

**You must be unbiased and consistent — the same resume must receive identical scores and deep analysis every time, regardless of format or upload count.**

**Resume Text to Analyze:**
---
${resumeText}
---

**JSON STRUCTURE (Strictly adhere to this format):**
{
  "Overall_Assessment": [
    "- Detailed paragraph (3-4 sentences) on overall clarity and impact. MUST quote a phrase from the resume.",
    "- Detailed paragraph on marketability. Cite specific skills found.",
    "- Detailed paragraph on major standout elements or concerns with examples."
  ],
  "Education_Analysis": [
    "- Paragraph on degrees listed. Quote the degree name/university.",
    "- Paragraph analyzing institution names/dates clarity. Cite specific text.",
    "- Paragraph suggesting specific improvements based on what is written."
  ],
  "Skills_Analysis": {
    "Current_Skills": [
      "- Paragraph describing a key technical skill found. Quote it. highlight skills in bold",
      "- Paragraph about a soft skill found, citing the evidence. highlight skills in bold",
      "- Paragraph highlighting any additional skill. highlight skills in bold"
    ],
    "Missing_Skills": [
      "- Paragraph describing an important missing skill. Why is it needed? higlight skills in bold",
      "- Paragraph about a skill gap. highlight skills in bold",
      "- Additional missing skill with explanation. higlight skills in bold"
    ]
  },
  "Experience_Analysis": [
    "- Paragraph assessing action verbs. Quote a specific verb used.",
    "- Paragraph checking for numbers/metrics. Quote a result or point out where it's missing.",
    "- Paragraph noting gaps or inconsistencies with examples."
  ],
  "Key_Strengths": [
    "- Paragraph explaining strength #1 with a direct quote from the resume.",
    "- Paragraph for strength #2 with specific evidence.",
    "- Paragraph for strength #3, tied to professional effectiveness.",
    "- Optional additional paragraph if needed."
  ],
  "Suitable_Job_Role": [
    { "role_name": "<Best Fit Role>", "match_percentage": "<Integer 85-98>", "reason": "<Explanation citing specific skills found in the resume. Bold keywords like **Skill**.>" },
    { "role_name": "<2nd Best Fit Role>", "match_percentage": "<Integer 75-85>", "reason": "<Explanation citing specific skills. Bold keywords like **Skill**.>" },
    { "role_name": "<3rd Best Fit Role>", "match_percentage": "<Integer 65-75>", "reason": "<Explanation citing specific skills. Bold keywords like **Skill**.>" }
  ],
  "Areas_for_Improvement": {
    "Grammar_and_Formatting": [
      "- Paragraph describing grammar/layout. Cite a specific error or section.",
      "- Paragraph on consistency. Give an example of inconsistency found.",
      "- Paragraph explaining layout tweaks."
    ],
    "Completeness": [
      "- Paragraph describing missing details (e.g., 'You didn't list a LinkedIn URL').",
      "- Paragraph identifying outdated content with examples.",
      "- Paragraph suggesting ways to make the resume feel more complete."
    ],
    "Keyword_Optimization": [
      "- Paragraph explaining keywords to add. List specific words.",
      "- Paragraph on missing action verbs. Suggest better verbs.",
      "- Paragraph suggesting additional terms."
    ]
  },
  "Improvement_Tips": {
    "To_Improve_Overall_Score": [
      "- Actionable tip for content improvement.",
      "- Tip on quantifying results with an example.",
      "- Tip on formatting."
    ],
    "To_Improve_ATS_Score": [
      "- Tip on headers.",
      "- Tip on ATS-friendly formatting.",
      "- Tip on keywords."
    ]
  },
  "Score_Explanation": {
            "Overall_Score_Explanation": "1 sentence summary of Overall Score calculation.",
            "ATS_Score_Explanation": "1 sentence summary of ATS Score calculation."
  },
  "Final_Scoring": {
    "ATS_Optimization_Score": "<Integer score from 0-100>",
    "Overall_Resume_Score": "<Integer score from 0-100>"
  }
}`;
};

/**
 * Create job description match analysis prompt
 */
const createJDMatchPrompt = (resumeText, jdText) => {
  return `**SYSTEM INSTRUCTION:** You are an expert AI-powered recruitment consultant. Your task is to analyze the provided RESUME TEXT and compare it against the provided JOB DESCRIPTION text. You must return a single, valid JSON object and nothing else.

**CRITICAL RULES:**
1. **JSON OUTPUT ONLY:** Your entire response MUST be a single, valid JSON object enclosed in \`\`\`json ... \`\`\`. NO additional text, explanation, or conversational filler is permitted outside this JSON block.
2. **HONEST ANALYSIS:** Provide a realistic and constructive analysis. The goal is to help the job seeker improve their resume for this specific job application.
3. **SPEAK TO THE CANDIDATE:** Use "you" and "your resume" to make the feedback personal and direct.
4. **THREE POINTS REQUIRED:** For the "strengths" and "gapsAndWeaknesses" fields, you MUST provide exactly three distinct bullet points for each. If you cannot find three distinct points, provide the best you can and fill the remainder with general but relevant advice.
5. **NORMALIZE KEYWORDS:** When comparing skills, you MUST normalize them. Be case-insensitive and treat variations like 'SpringBoot', 'Spring-boot', 'SpringBoot' and 'Spring boot' as the exact same skill.
6. **CONTEXTUAL AWARENESS:** You must identify skills and keywords regardless of where they appear in the resume. A skill mentioned in a project description, achievement list, or internship role is just as valid as one listed in a dedicated 'Skills' section.
7. **STRICT DOMAIN MATCHING:** You must first determine if the candidate's primary domain (e.g., Software Engineering, Nursing, Sales) matches the Job Description's primary domain.
   - **IF DOMAINS DO NOT MATCH:** The \`matchScore\` MUST be **below 20**. Do not give points for generic soft skills (communication, teamwork) if the core technical or functional role is completely different (e.g., a Commerce student applying for a Senior Java Developer role).
   - **IF DOMAINS MATCH:** Score based on the overlap of specific skills, experience levels, and qualifications.

**Resume Text to Analyze:**
---
${resumeText}
---

**Job Description to Match Against:**
---
${jdText}
---

**JSON STRUCTURE (Strictly adhere to this format):**
{
  "matchScore": "<An integer between 0 and 100. CRITICAL: If the candidate's core domain/field does not match the JD (e.g., Accountant vs. Python Developer), the score MUST be < 20. Only give high scores (>60) for strong technical/functional alignment.>",
  "overallFitAnalysis": "<A 2-3 sentence paragraph summarizing the candidate's overall fit for the role. If the domains are different, clearly state that the resume is not suitable for this specific career path.>",
  "strengths": [
    "<First detailed bullet point on a key strength...>",
    "<Second detailed bullet point on another strength...>",
    "<Third detailed bullet point on a final strength...>"
  ],
  "gapsAndWeaknesses": [
    "<First detailed bullet point on a key gap...>",
    "<Second detailed bullet point on another gap...>",
    "<Third detailed bullet point on a final gap...>"
  ],
  "matchedKeywords": [
    "<A skill found in both the resume and the job description, e.g., 'html'. Normalize words with same meaning but with different text format, e.g., 'Spring-boot' and 'Spring boot' and 'SpringBoot' as all three have same meaning, but have different text format, consider all these as same..>"
  ],
  "missingKeywords": [
    "<A crucial skill from the JD that is missing from the resume.>"
  ],
  "tailoringSuggestions": [
    "<A specific, actionable suggestion to tailor the resume. For example: 'In your Project X description, rephrase 'worked on the backend' to 'Engineered RESTful APIs using Node.js and Express.js' to better match the job's requirement for API development experience.'>"
  ]
}`;
};

// --- Public API ---

/**
 * Perform simple resume analysis
 */
const performSimpleAnalysis = async (resumeText, userId) => {
  if (!resumeText || resumeText.trim().length < 100) {
    throw {
      code: 'INVALID_INPUT',
      message: 'Resume text is too short or empty. Please upload a valid resume.'
    };
  }

  const prompt = createAnalysisPrompt(resumeText);
  return getAnalysisFromAI(prompt, userId);
};

/**
 * Perform JD match analysis
 */
const performJDMatchAnalysis = async (resumeText, jdText, userId) => {
  if (!resumeText || resumeText.trim().length < 100) {
    throw {
      code: 'INVALID_INPUT',
      message: 'Resume text is too short or empty.'
    };
  }

  if (!jdText || jdText.trim().length < 50) {
    throw {
      code: 'INVALID_INPUT',
      message: 'Job description is too short. Please provide a detailed job description.'
    };
  }

  const prompt = createJDMatchPrompt(resumeText, jdText);
  return getAnalysisFromAI(prompt, userId);
};

/**
 * Clear analysis cache for a specific resume
 */
const clearAnalysisCache = (resumeText) => {
  if (!resumeText) return;

  const prompt = createAnalysisPrompt(resumeText);
  const promptHash = generateHash(prompt);

  if (cache.has(promptHash)) {
    cache.delete(promptHash);
    logger.debug(`Cleared cache for resume (hash: ${promptHash.substring(0, 8)}...)`);
  }
};

/**
 * Get current service status (for monitoring)
 */
const getServiceStatus = () => ({
  cacheSize: cache.size,
  pendingRequests: pendingRequests.size,
  activeUsers: userRateLimits.size,
  config: {
    model: CONFIG.MODEL_NAME,
    cacheTTL: CONFIG.CACHE_TTL,
    userHourlyLimit: CONFIG.USER_HOURLY_LIMIT
  }
});

module.exports = {
  performSimpleAnalysis,
  performJDMatchAnalysis,
  clearAnalysisCache,
  getServiceStatus
};
