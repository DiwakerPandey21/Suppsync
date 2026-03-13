import { generateText } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'

const google = createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY || '',
})

export async function POST(req: Request) {
    try {
        const { prompt, image } = await req.json()

        // Build messages for multimodal support
        const messages: any[] = []

        if (image) {
            // Multimodal: text + image
            const base64Data = image.replace(/^data:image\/\w+;base64,/, '')
            messages.push({
                role: 'user' as const,
                content: [
                    { type: 'text' as const, text: prompt },
                    { type: 'image' as const, image: base64Data },
                ],
            })

            const result = await generateText({
                model: google('gemini-2.5-flash'),
                messages,
            })

            return new Response(JSON.stringify({ response: result.text }), {
                headers: { 'Content-Type': 'application/json' },
            })
        } else {
            // Text-only
            const result = await generateText({
                model: google('gemini-2.5-flash'),
                prompt,
            })

            return new Response(JSON.stringify({ response: result.text }), {
                headers: { 'Content-Type': 'application/json' },
            })
        }

    } catch (error: any) {
        console.error("GEMINI API ERROR:", error)
        return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }
}
