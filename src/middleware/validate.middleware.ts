import {Request, Response, NextFunction} from 'express';
import { z } from 'zod';

export const validate = (schema: z.ZodTypeAny) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try{
            req.body = await schema.parseAsync(req.body);
            next();
        }
        catch(error){
            next(error);
        }
    }
};
