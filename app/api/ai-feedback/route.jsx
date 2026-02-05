import { FEEDBACK_PROMPT } from "@/services/Constants";
import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req) {

    const { conversation } = await req.json();
    const FINAL_PROMPT = FEEDBACK_PROMPT.replace('{{conversation}}', conversation)
    console.log(FINAL_PROMPT);
    try {
        const openai = new OpenAI({
            baseURL: "https://openrouter.ai/api/v1",
            apiKey: process.env.OPENROUTER_API_KEY,
        })
        const completion = await openai.chat.completions.create({
            model: "google/gemini-flash-1.5",
            messages: [
                { role: "user", content: FINAL_PROMPT }
            ],

        })

        return NextResponse.json(completion.choices[0].message)
    }
    catch (e) {
        console.log(e)
        return NextResponse.json(e)
    }

}