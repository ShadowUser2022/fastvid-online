import { NextRequest, NextResponse } from "next/server";
import { isProUser } from "@/lib/supabase";

// Check if an email has active Pro subscription
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ isPro: false });
    }

    const isPro = await isProUser(email);
    return NextResponse.json({ isPro });

  } catch (error: any) {
    console.error("Check pro error:", error);
    return NextResponse.json({ isPro: false });
  }
}
