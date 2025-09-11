import * as fs from 'fs';
import {dirname, join} from 'path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function createEnv() {
    const envPath = join(__dirname, '..', '.env');

    if (fs.existsSync(envPath)) {
        return;
    }

    // Create .env file from .env.example
    fs.copyFileSync(join(__dirname, '..', '.env.example'), envPath);
}

createEnv();
