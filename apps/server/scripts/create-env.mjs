import * as fs from 'fs';
import {dirname, join} from 'path';
import {fileURLToPath} from 'url';

const __filename = import.meta.filename;
const __dirname = import.meta.dirname;

function createEnv() {
    const envPath = join(__dirname, '..', '.env');

    if (fs.existsSync(envPath)) {
        return;
    }

    // Create .env file from .env.example
    fs.copyFileSync(join(__dirname, '..', '.env.example'), envPath);
}

createEnv();
