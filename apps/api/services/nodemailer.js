import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const nodemailerService = {
  sendMail: async (options) => {
    const logoPath = path.resolve(__dirname, '../../client/public/logo_redexcom.png');
    return transporter.sendMail({
      from: `"Corporación RedexCom" <${process.env.EMAIL_USER}>`,
      ...options,
      attachments: [
        ...(options.attachments || []),
        { 
          filename: 'logo_redexcom.png', 
          path: logoPath, 
          cid: 'logo_redexcom',
          contentDisposition: 'inline'
        },
      ],
    });
  },
};

export default nodemailerService;
