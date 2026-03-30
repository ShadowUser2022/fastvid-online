import { NextRequest, NextResponse } from "next/server";

// Monobank sends POST here when payment status changes
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    console.log("Monobank webhook:", JSON.stringify(data, null, 2));

    const { invoiceId, status, amount, ccy, reference, walletData } = data;

    // Only act on successful payments
    if (status !== "success") {
      console.log(`Invoice ${invoiceId} status: ${status} — skipping`);
      return NextResponse.json({ ok: true });
    }

    // Extract email from reference: "fastvid_pro_{timestamp}_{email}"
    const emailRaw = reference?.split("_").slice(3).join("_").replace(/_/g, ".") ?? "";
    // walletData?.cardToken is saved card token for future recurring charges
    const cardToken = walletData?.cardToken ?? null;

    console.log(`✅ Payment success! Invoice: ${invoiceId}, Amount: ${amount/100} USD`);
    console.log(`   Reference: ${reference}`);
    console.log(`   Card token for recurring: ${cardToken}`);

    // TODO (Task 9): Save to Supabase — { email, cardToken, invoiceId, status: 'active' }

    // For now: notify owner via email log
    // In production this will write to DB and auto-activate Pro
    console.log(`🔔 NEW PRO SUBSCRIBER — add to PRO_EMAILS env: ${emailRaw}`);

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
