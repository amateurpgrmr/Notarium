import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function requireAuth(request: Request): Promise<Response | null> {
  const auth = request.headers.get('Authorization');
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;

  if (!token) return new Response('Unauthorized', { status: 401 });

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    // @ts-ignore
    request.user = payload;
    return null; // continue
  } catch {
    return new Response('Invalid token', { status: 401 });
  }
}
