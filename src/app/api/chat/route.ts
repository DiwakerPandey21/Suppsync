import { streamText } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'

const google = createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY || '',
})

export async function POST(req: Request) {
    console.log("SYNCBOT: Received chat request")
    try {
        const { messages, context } = await req.json()
        console.log("SYNCBOT: Messages parsed:", messages.length, "Context received:", !!context)

        let systemPrompt = `You are SyncBot, the friendly, highly-knowledgeable AI Supplement Coach for the SuppSync app. 
      Your goal is to help users with questions about their fitness, their supplements, and general wellness. 
      Keep your answers concise, encouraging, and formatted with clean markdown.
      If asked about medical advice or treating diseases, politely decline and remind the user to consult a doctor.
      
      IMPORTANT: You have access to the user's logged data below. Use it to provide highly personalized advice.`

        if (context) {
            systemPrompt += `\n\n--- USER DATA CONTEXT ---\n`
            if (context.supplements?.length) {
                systemPrompt += `\nCURRENT STACK: ${context.supplements.map((s: any) => s.name).join(', ')}`
            }
            if (context.recentScores?.length) {
                const latest = context.recentScores[0]
                systemPrompt += `\nLATEST SUBJECTIVE SCORES (Out of 10): Energy=${latest.energy_score}, Focus=${latest.focus_score}, Sleep=${latest.sleep_score}`
            }
            if (context.biomarkers?.length) {
                systemPrompt += `\nRECENT BIOMARKERS: ${context.biomarkers.map((b: any) => `${b.name}=${b.value}${b.unit}`).join(', ')}`
            }
            if (context.goals?.length) {
                systemPrompt += `\nACTIVE GOALS: ${context.goals.map((g: any) => g.title).join(', ')}`
            }
            if (context.genotypes?.length) {
                systemPrompt += `\nGENETIC MARKERS (CRITICAL): The user has the following DNA mutations logged: ${context.genotypes.map((g: any) => `${g.marker_name} (${g.status})`).join(', ')}. YOU MUST ADAPT ALL ADVICE TO THESE GENOTYPES. E.g. If MTHFR is mutated, strictly warn against synthetic Folic Acid and recommend Methylfolate.`
            }
            systemPrompt += `\n-------------------------\n`
        }

        const result = await streamText({
            model: google('gemini-2.5-flash'),
            system: systemPrompt,
            messages,
        })

    } catch (error: any) {
        console.error("SYNCBOT CHAT API ERROR:", error)
        return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }
}
