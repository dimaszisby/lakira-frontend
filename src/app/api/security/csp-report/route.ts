import { NextResponse } from "next/server";

type CspReportBody = {
  "csp-report"?: Record<string, unknown>;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CspReportBody;
    if (process.env.NODE_ENV !== "production") {
      console.warn("[CSP REPORT]", JSON.stringify(body));
    }
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[CSP REPORT] invalid payload", error);
    }
  }

  return NextResponse.json({ ok: true });
}
