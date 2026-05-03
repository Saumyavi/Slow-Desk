import { NextRequest, NextResponse } from 'next/server';
import { registerUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json();
  if (!name || !email || !password)
    return NextResponse.json({ error: 'All fields required' }, { status: 400 });
  if (password.length < 6)
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });

  const user = registerUser(name, email, password);
  if (!user)
    return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });

  return NextResponse.json({ ok: true });
}
