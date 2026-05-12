import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    customer_name,
    phone,
    address,
    city,
    product_id,
    product_name,
    size,
    color,
    quantity,
    total_price,
    notes,
  } = body;

  // Basic validation
  if (!customer_name || !phone || !address || !product_name || !total_price) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("orders")
      .insert({
        customer_name,
        phone,
        address,
        city: city ?? "",
        product_id: product_id ?? null,
        product_name,
        size: size ?? null,
        color: color ?? null,
        quantity: quantity ?? 1,
        total_price,
        notes: notes ?? "",
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ order: data }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
