import * as fs from "fs";
import { join } from "path";

const __filename = import.meta.filename;
const __dirname = import.meta.dirname;

function createEnv() {
  const envPath = join(__dirname, "..", ".env");

  if (fs.existsSync(envPath)) {
    return;
  }

  // Create .env file from .env.example
  fs.copyFileSync(join(__dirname, "..", ".env.example"), envPath);
}

createEnv();
