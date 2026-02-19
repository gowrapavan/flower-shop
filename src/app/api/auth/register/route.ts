import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // ADDED AWAIT HERE
    const existingUser = await db.users.getByEmail(email);
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // ADDED AWAIT HERE
    const newUser = await db.users.create({
      id: crypto.randomUUID(), 
      email,
      password: hashedPassword,
      name: name || "Flower Lover",
      role: "customer"
    });

    const token = await signToken({ id: newUser.id, email: newUser.email, role: newUser.role });

    const response = NextResponse.json({ success: true, user: { email: newUser.email, name: newUser.name } });
    
    response.cookies.set('token', token, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, 
      path: '/',
    });

    return response;

  } catch (error) {
    console.error("Register Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}