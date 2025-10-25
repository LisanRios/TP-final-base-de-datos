import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

export const ENV = {
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
    PORT: process.env.PORT || '3001',
    MONGODB_URI: process.env.MONGODB_URI || ''
};
