import { Request, Response, NextFunction } from 'express';
import { generateToken, verifyToken } from '../utils/jwt';

interface JwtPayload {
  userId: number;   
  phone: string;
  role: 'User';
}


export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export const authenticateJWT = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized - token missing or malformed',
    });
  }

  const token = authHeader.split(' ')[1];
  console.log(token)

  try {
    const decoded = verifyToken(token);

    if (!decoded || !decoded.phone) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - invalid token structure',
      });
    }

    // req.user = decoded;
    next();
  } catch (error: any) {
  
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - token expired',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - invalid token',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Server error during authentication',
    });
  }
};
