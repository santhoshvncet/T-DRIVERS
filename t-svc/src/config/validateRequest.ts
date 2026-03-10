import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();



const ValidateRequest = async (req: Request, res: Response, next: NextFunction) => {
    const url = req.url;

    
    // Always allow health and otp routes
    if (url.includes('/health')||url.includes('/users') || url.includes('login') || url.includes('website') || url.includes("/test") || url.includes('/service/auth') || url.includes('otp'))  {
        return next();
    }
    const token = req.headers.authorization?.split(' ')[1];
    const role = req.headers['x-role'];
    if (!token) {
        return res.status(401).json({ message: "Unauthorized: Token missing" });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
        if (role === 'anonymous') {
            return next();
        }
        // Attach decoded token to request if needed
        (req as any).user = decoded;
        return next();
    } catch (error) {   
        return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }
};

export default ValidateRequest;
