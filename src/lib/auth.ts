import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables.');
}

interface DecodedToken {
  userId: number;
  email: string;
  isAdmin: boolean;
}

function isDecodedToken(decoded: any): decoded is DecodedToken {
  return (
    typeof decoded === 'object' &&
    decoded !== null &&
    typeof decoded.userId === 'number' &&
    typeof decoded.email === 'string' &&
    typeof decoded.isAdmin === 'boolean'
  );
}

export function getUserIdFromRequest(request: NextRequest): number | null {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.split(' ')?.[1];

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET as string);
    if (isDecodedToken(decoded)) {
      return decoded.userId;
    }
    return null;
  } catch (error) {
    return null;
  }
}

export function getIsAdminFromRequest(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.split(' ')?.[1];

  if (!token) {
    return false;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET as string);
    if (isDecodedToken(decoded)) {
      return decoded.isAdmin;
    }
    return false;
  } catch (error) {
    return false;
  }
}