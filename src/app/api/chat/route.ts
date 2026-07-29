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
            if (context.recentScores?.length && context.recentScores[0]) {
                systemPrompt += `\nLATEST SCORES: Energy=${context.recentScores[0].energy_score ?? 'N/A'}, Focus=${context.recentScores[0].focus_score ?? 'N/A'}, Sleep=${context.recentScores[0].sleep_score ?? 'N/A'}`
            }
            systemPrompt += `\n-------------------------\n`
        }

        const apiKey = process.env.GEMINI_API_KEY
        if (!apiKey) throw new Error("Missing GEMINI_API_KEY")

        const genAI = new GoogleGenerativeAI(apiKey)

        // Candidate Gemini models in order of stability & performance
        const candidateModels = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-2.5-flash", "gemini-1.5-pro"]

        // Convert messages to Gemini format
        const history = messages.slice(0, -1).map((m: any) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content || ' ' }]
        }))
        const latestMsg = messages[messages.length - 1]?.content || 'Hello'

        let result: any = null
        let lastError: any = null

        // Model fallback loop to prevent 503 Service Unavailable / High Demand failures
        for (const modelName of candidateModels) {
            try {
                const model = genAI.getGenerativeModel({ 
                    model: modelName,
                    systemInstruction: systemPrompt 
                })
                const chat = model.startChat({ history })
                result = await chat.sendMessageStream(latestMsg)
                if (result) break
            } catch (err: any) {
                console.warn(`Gemini Model [${modelName}] high demand or unavailable (${err?.message}). Trying fallback model...`)
                lastError = err
            }
        }

        if (!result) {
            throw lastError || new Error("All Gemini AI model endpoints are currently experiencing high demand. Please try again in a moment.")
        }

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
                    controller.enqueue(new TextEncoder().encode("\n[Response stream notice: " + e.message + "]"))
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
