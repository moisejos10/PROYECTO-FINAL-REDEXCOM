import nodemailer from 'nodemailer';
import { env } from 'process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Read .env manually
const envPath = join(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envMap = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) envMap[parts[0].trim()] = parts.slice(1).join('=').trim();
});

console.log('Testing with email:', envMap.EMAIL_USER);

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: envMap.EMAIL_USER,
    pass: envMap.EMAIL_PASS,
  },
});

async function main() {
  try {
    await transporter.verify();
    console.log('SUCCESS: SMTP connection is successful. No errors.');
  } catch (err) {
    console.error('ERROR OCCURRED:');
    console.error(err);
  }
}

main();
