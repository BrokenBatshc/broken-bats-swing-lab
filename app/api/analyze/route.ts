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
You are an elite baseball hitting coach writing a personal swing report
for a single athlete. You are reviewing the swing from this video URL:

${videoUrl}

Write the report as if you are talking directly to the hitter ("you"),
not to a coach. The tone should be positive, encouraging, and specific.
Avoid sounding like a robot. Imagine this is a paid remote lesson.

Please do ALL of the following:

1) Start with a short, friendly opener (1–2 sentences) that sets the tone.

2) Clearly describe what is GOOD about the swing:
   - 2–4 specific strengths (e.g. "you do a great job staying loose with your hands").

3) Then give a more detailed breakdown (2–3 short paragraphs) of what needs work:
   - Focus on 2–4 main issues, explained in simple language.
   - Tie your comments to real checkpoints: stance, load, stride, separation, bat path, contact, finish, etc.
   - Make it clear WHY each issue matters (how it affects power/consistency).

4) End the main write-up with a short encouragement paragraph:
   - Remind them they are closer than they think.
   - Emphasize what to focus on next session.

5) Provide 3–6 specific drills as a list:
   - Each drill should have a short, clear name.
   - One sentence per drill explaining how to do it and what it fixes.

Keep the overall length of the main written feedback around 400–600 words.
Keep the language clean and age-appropriate for 11–18 year old players.

Return your answer as JSON with this exact shape:

{
  "feedback": "the full written swing report with paragraphs and line breaks",
  "drills": ["Drill 1 with explanation", "Drill 2 with explanation", "Drill 3...", "Drill 4...", "Drill 5...", "Drill 6..."]
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
      // IMPORTANT: use max_tokens here, not max_output_tokens
      max_tokens: 800,
    });

    const raw = completion.choices[0].message.content || "{}";

    let parsed: any = {};
    try {
      parsed = JSON.parse(raw as string);
    } catch (e) {
      console.error("Failed to parse JSON from model:", raw);
      return NextResponse.json(
        { error: "Bad response format from model" },
        { status: 500 }
      );
    }

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
