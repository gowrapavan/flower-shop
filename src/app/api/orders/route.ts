import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || !payload.email) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Fetch orders for this specific user, sorted by newest first
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_email', payload.email)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ orders: data });

  } catch (error) {
    console.error("Orders API Error:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}