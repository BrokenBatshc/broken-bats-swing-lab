import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { videoUrl } = await req.json();

    if (!videoUrl) {
      return NextResponse.json(
        { error: "Missing videoUrl" },
        { status: 400 }
      );
    }

    const prompt = `
You are an elite baseball hitting coach.
Analyze this hitter's swing from the video URL below and give:
1) A concise summary of what's good.
2) The top 3–5 issues to fix (in simple language a 12–16 year old can understand).
3) 3–5 specific drills they should do to improve.

Video URL: ${videoUrl}

Return your answer as JSON with this shape:
{
  "feedback": "overall notes and issues",
  "drills": ["drill 1", "drill 2", "drill 3"]
}
    `.trim();

    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0].message.content || "{}";
    const parsed = JSON.parse(raw as string);

    return NextResponse.json({
      feedback: parsed.feedback ?? "",
      drills: parsed.drills ?? [],
    });
  } catch (err: any) {
    console.error("Analyze error:", err);
    return NextResponse.json(
      { error: "Analysis failed" },
      { status: 500 }
    );
  }
}
