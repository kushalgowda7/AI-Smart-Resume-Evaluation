const { cleanEnv, str, port, url } = require('envalid');

const validateEnv = () => {
    return cleanEnv(process.env, {
        NODE_ENV: str({ choices: ['development', 'production', 'test'], default: 'development' }),
        PORT: port({ default: 5000 }),
        MONGO_URI: str({ desc: 'MongoDB connection string' }),
        JWT_SECRET: str({ desc: 'Secret key for JWT signing' }),
        GEMINI_API_KEY: str({ desc: 'Google Gemini API key' }),
        GMAIL_EMAIL: str({ desc: 'Gmail address for sending OTP emails' }),
        GMAIL_APP_PASSWORD: str({ desc: 'Gmail app password for SMTP' }),
    });
};

module.exports = validateEnv;
