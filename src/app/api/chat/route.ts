import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(req: Request) {
    try {
        const { messages, context } = await req.json()

        let systemPrompt = `You are SyncBot, the friendly, highly-knowledgeable AI Supplement Coach for the SuppSync app. 
      Your goal is to help users with questions about their fitness, their supplements, and general wellness. 
      Keep your answers concise, encouraging, and formatted with clean markdown.
      
      IMPORTANT: You have access to the user's logged data below. Use it to provide highly personalized advice.`

        if (context) {
            systemPrompt += `\n\n--- USER DATA CONTEXT ---\n`
            if (context.supplements?.length) systemPrompt += `\nCURRENT STACK: ${context.supplements.map((s: any) => s.name).join(', ')}`
            if (context.recentScores?.length) systemPrompt += `\nLATEST SCORES: Energy=${context.recentScores[0].energy_score}, Focus=${context.recentScores[0].focus_score}, Sleep=${context.recentScores[0].sleep_score}`
            systemPrompt += `\n-------------------------\n`
        }

        const apiKey = process.env.GEMINI_API_KEY
        if (!apiKey) throw new Error("Missing GEMINI_API_KEY")

        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            systemInstruction: systemPrompt 
        })

        // Convert messages to Gemini format
        const history = messages.slice(0, -1).map((m: any) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
        }))
        const latestMsg = messages[messages.length - 1].content

        const chat = model.startChat({ history })
        const result = await chat.sendMessageStream(latestMsg)

        // Create a custom ReadableStream to send pure raw text chunks
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of result.stream) {
                        const chunkText = chunk.text()
                        controller.enqueue(new TextEncoder().encode(chunkText))
                    }
                    controller.close()
                } catch (e: any) {
                    // Send error text to frontend so user actually sees it instead of a blank UI!
                    controller.enqueue(new TextEncoder().encode("\n[Error thinking: " + e.message + "]"))
                    controller.close()
                }
            }
        })

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream; charset=utf-8',
                'Cache-Control': 'no-cache',
            },
        })

    } catch (error: any) {
        console.error("SYNCBOT CHAT API ERROR:", error)
        return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }
}
