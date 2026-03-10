import jwt from 'jsonwebtoken';

export interface JwtPayload {
  userId: number;
  phone: string;
  role: string;
}

export function generateToken(payload: object) {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }

  return jwt.sign(payload, secret, { expiresIn: "7d" });
}

// Verify the JWT token and return the decoded payload
export function verifyToken(token: string): JwtPayload {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;
    return decoded;
  } catch (error) {
    throw error;
  }
}
