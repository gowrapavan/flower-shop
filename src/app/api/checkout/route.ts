import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload || !payload.email) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    // --- NEW: VERIFY USER DATA FROM DB ---
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('phone, address')
      .eq('email', payload.email)
      .single();

    if (userError || !user?.phone || !user?.address?.doorNo) {
      return NextResponse.json({ 
        error: "Profile incomplete. Please add your phone and address in Account settings." 
      }, { status: 400 });
    }

    const body = await request.json();
    const { items, totalAmount } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // Save the order using the verified data from the DB
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([
        {
          user_email: payload.email,
          items: items,
          total_amount: totalAmount,
          shipping_address: user.address, // Use DB address for security
          status: 'pending'
        }
      ])
      .select()
      .single();

    if (orderError) throw orderError;

    return NextResponse.json({ success: true, order });

  } catch (error) {
    console.error("Checkout API Error:", error);
    return NextResponse.json({ error: "Failed to place order" }, { status: 500 });
  }
}