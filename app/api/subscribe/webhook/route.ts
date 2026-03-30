import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Monobank sends POST here when payment status changes
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    console.log("Monobank webhook:", JSON.stringify(data, null, 2));

    const { invoiceId, status, reference, walletData } = data;

    // Only act on successful payments
    if (status !== "success") {
      console.log(`Invoice ${invoiceId} status: ${status} — skipping`);
      return NextResponse.json({ ok: true });
    }

    // Extract email from reference: "fastvid_pro_{timestamp}_{email_with_underscores}"
    // e.g. "fastvid_pro_1711234567_user_example_com" → "user@example.com"
    const parts = reference?.split("_") ?? [];
    // parts[0]=fastvid, parts[1]=pro, parts[2]=timestamp, parts[3..]=email parts
    const emailParts = parts.slice(3);
    // Last part before @ was replaced with _ at position -2...
    // Reconstruct: join with _ then replace last _ with @
    const emailJoined = emailParts.join("_");
    // Find the domain part (contains a dot) — split by _ and rejoin
    // Simpler: the original email had @ replaced with _ — find segment with dot
    const emailSegments = emailJoined.split("_");
    let email = "";
    for (let i = 0; i < emailSegments.length; i++) {
      if (emailSegments[i].includes(".") && i > 0) {
        email = emailSegments.slice(0, i).join(".") + "@" + emailSegments[i];
        break;
      }
    }
    // Fallback: use walletData email if available
    const finalEmail = (email || walletData?.email || "").toLowerCase();
    const cardToken = walletData?.cardToken ?? null;

    console.log(`✅ Payment success! Invoice: ${invoiceId}, Email: ${finalEmail}`);

    if (!finalEmail) {
      console.error("Could not extract email from reference:", reference);
      return NextResponse.json({ ok: true });
    }

    // Save/update subscriber in Supabase
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days from now

    const { error } = await supabase
      .from("subscribers")
      .upsert(
        {
          email: finalEmail,
          card_token: cardToken,
          invoice_id: invoiceId,
          status: "active",
          expires_at: expiresAt.toISOString(),
        },
        { onConflict: "email" } // update if email already exists
      );

    if (error) {
      console.error("Supabase upsert error:", error);
    } else {
      console.log(`🎉 Pro activated for ${finalEmail} until ${expiresAt.toISOString()}`);
    }

    return NextResponse.json({ ok: true });

  } catch (error: any) {
    console.error("Webhook error:", error);
    // Always return 200 to Monobank so they don't retry
    return NextResponse.json({ ok: true });
  }
}

// Monobank also sends GET to verify webhook URL is alive
export async function GET() {
  return NextResponse.json({ ok: true });
}
