import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    const token = process.env.MONO_TOKEN;
    if (!token) {
      return NextResponse.json({ error: "Payment not configured" }, { status: 500 });
    }

    const reference = `fastvid_pro_${Date.now()}_${email.replace(/[^a-z0-9]/gi, "_")}`;

    const body = {
      amount: 900,        // $9.00 in cents
      ccy: 840,           // USD
      merchantPaymInfo: {
        reference,
        destination: "FastVid Pro — monthly subscription",
        basketOrder: [
          {
            name: "FastVid Pro (1 month)",
            qty: 1,
            sum: 900,
            total: 900,
            unit: "pcs",
          },
        ],
      },
      redirectUrl: "https://www.fastvid.online/success",
      webhookUrl: "https://www.fastvid.online/api/subscribe/webhook",
      validity: 3600, // 1 hour to pay
      saveCardData: {
        saveCard: true,
        walletId: email, // saves card for future recurring charges
      },
    };

    const response = await fetch("https://api.monobank.ua/api/merchant/invoice/create", {
      method: "POST",
      headers: {
        "X-Token": token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Monobank error:", err);
      return NextResponse.json({ error: "Payment creation failed", details: err }, { status: 500 });
    }

    const data = await response.json();
    // data.pageUrl — redirect user here to pay
    return NextResponse.json({ pageUrl: data.pageUrl, invoiceId: data.invoiceId });

  } catch (error: any) {
    console.error("Subscribe create error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
