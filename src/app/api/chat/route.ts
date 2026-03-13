import { streamText } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'

const google = createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY || '',
})

export async function POST(req: Request) {
    console.log("SYNCBOT: Received chat request")
    try {
        const { messages } = await req.json()
        console.log("SYNCBOT: Messages parsed:", messages)

        const result = await streamText({
            model: google('gemini-2.5-flash'),
            system: `You are SyncBot, the friendly, highly-knowledgeable AI Supplement Coach for the SuppSync app. 
      Your goal is to help users with questions about their fitness, their supplements, and general wellness. 
      Keep your answers concise, encouraging, and formatted with clean markdown.
      If asked about medical advice or treating diseases, politely decline and remind the user to consult a doctor.`,
            messages,
        })

        console.log("SYNCBOT: Stream initialized successfully")
        return result.toTextStreamResponse()

    } catch (error: any) {
        console.error("SYNCBOT CHAT API ERROR:", error)
        return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }
}
