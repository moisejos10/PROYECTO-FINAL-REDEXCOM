import express from 'express';
import cors from 'cors';
import userRouter from './features/user/user.routes.js';
import { ZodError } from 'zod';
import { SqliteError } from 'better-sqlite3';

const app = express();
const port = 3000;

app.use(cors({ origin: ['http://localhost:4321'] }));
app.use(express.json());

app.use('/api/user', userRouter);

app.use((err, req, res, next) => {
  let errorString = 'Ocurrió un error inesperado';
  let errorCode = 500;

  if (err instanceof ZodError) {
    errorString = "Los datos del formulario son incorrectos.";
    errorCode = 400;
  }
  if (err instanceof SqliteError && err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    errorString = "Ese correo ya está registrado en REDEXCOM.";
    errorCode = 400;
  }

  return res.status(errorCode).json({ error: errorString });
});

app.listen(port, () => {
  console.log(`🚀 Servidor de REDEXCOM activo en http://localhost:${port}`);
});

export default app;