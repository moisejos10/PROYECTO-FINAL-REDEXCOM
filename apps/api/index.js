import express from 'express';
import userRouter from './features/user/user.routes.js';
import { ZodError } from 'zod';
import { SqliteError } from 'better-sqlite3';
import authRouter from './features/auth/auth.routes.js';
import { authenticate } from './features/auth/auth.middlewares.js';
import jwt from 'jsonwebtoken';
import cors from 'cors';

const app = express();
const port = 3000;

app.use(cors({ origin: ['http://localhost:4321'] }));
app.use(express.json());

// Rutas públicas
app.use('/api/user', userRouter);
app.use('/api/auth', authRouter);

// Manejo global de errores
app.use((err, req, res, next) => {
  console.log(err);

  let errorString = 'Error desconocido';
  let errorCode = 500;

  if (err instanceof ZodError) {
    const errorsFormatted = err.issues.map((issue) => {
      return `${issue.path[0] ? issue.path[0].toString().toUpperCase() + ': ' : ''}${issue.message}.\n`;
    });
    errorString = errorsFormatted.join('');
    errorCode = 400;
  }

  if (err instanceof SqliteError) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      const property = err.message.split('.')[1];
      errorCode = 400;
      errorString = `${property ? property.toUpperCase() : 'El campo'} ya se encuentra en uso.`;
    }
  }

  if (err instanceof jwt.TokenExpiredError) {
    return res.status(401).json({ error: 'Token expirado' });
  }

  if (err instanceof jwt.JsonWebTokenError) {
    return res.status(403).json({ error: 'Token inválido' });
  }

  return res.status(errorCode).json({ error: errorString });
});

app.listen(port, () => {
  console.log(`🚀 API RedexCom corriendo en http://localhost:${port}`);
});

export default app;
