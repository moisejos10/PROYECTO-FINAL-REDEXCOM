import { Router } from 'express';
import bcrypt from 'bcrypt';
import userRepository from './user.repository.js';
import { createUserRouteSchema } from './user.routes.schemas.js';

const userRouter = Router();

userRouter.post('/', async (req, res, next) => {
  try {
    const body = createUserRouteSchema.body.parse(req.body);
    const passwordHash = await bcrypt.hash(body.password, 10);
    
    const createdUser = await userRepository.createUser({
      email: body.email,
      passwordHash: passwordHash
    });

    return res.status(201).json({ message: "¡Usuario de REDEXCOM registrado!", id: createdUser.id });
  } catch (error) {
    next(error); 
  }
});

export default userRouter;