import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = await cookies();
  
  // This explicitly deletes the httpOnly cookie from the server side
  cookieStore.delete('token');

  return NextResponse.json({ success: true });
}