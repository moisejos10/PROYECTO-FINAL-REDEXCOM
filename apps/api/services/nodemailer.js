import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

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
    // Intentar buscar el logo en diferentes ubicaciones relativas comunes
    const pathsToTry = [
      path.resolve(__dirname, '../../client/public/logo_redexcom.png'),
      path.resolve(__dirname, '../client/public/logo_redexcom.png'),
      path.resolve(__dirname, '../../../client/public/logo_redexcom.png'),
      path.resolve(process.cwd(), 'apps/client/public/logo_redexcom.png'),
      path.resolve(process.cwd(), 'client/public/logo_redexcom.png'),
      path.resolve(process.cwd(), 'logo_redexcom.png')
    ];

    let logoPath = null;
    for (const p of pathsToTry) {
      if (fs.existsSync(p)) {
        logoPath = p;
        break;
      }
    }

    const attachments = [...(options.attachments || [])];
    if (logoPath) {
      attachments.push({ 
        filename: 'logo_redexcom.png', 
        path: logoPath, 
        cid: 'logo_redexcom',
        contentDisposition: 'inline'
      });
    } else {
      console.warn('⚠️ Advertencia: No se encontró logo_redexcom.png en ninguna de las rutas de búsqueda. Se enviará el correo sin el logo adjunto.');
    }

    return transporter.sendMail({
      from: `"Corporación RedexCom" <${process.env.EMAIL_USER}>`,
      ...options,
      attachments,
    });
  },
};

export default nodemailerService;
