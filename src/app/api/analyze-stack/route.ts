import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(request: Request) {
    try {
        const supabase = await createClient()

        // 1. Authenticate User
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // 2. Extract context from request
        const { supplements, goals } = await request.json()

        if (!supplements || supplements.length === 0) {
            return NextResponse.json({ error: 'No supplements provided for analysis.' }, { status: 400 })
        }

        // 3. Initialize Gemini
        const apiKey = process.env.GEMINI_API_KEY
        if (!apiKey) {
            console.error("GEMINI_API_KEY is missing from environment variables.")
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
        }

        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

        // 4. Construct the prompt
        let prompt = `You are an expert sports nutritionist and biohacker. Analyze the user's current supplement stack.\n`

        if (goals) {
            prompt += `The user's primary fitness goals are: ${goals}.\n`
        }

        prompt += `\nHere is their current stack:\n`
        supplements.forEach((sup: any) => {
            prompt += `- ${sup.name} ${sup.brand ? `(${sup.brand})` : ''} [Form: ${sup.form}, Category: ${sup.category}]\n`
        })

        prompt += `\nPlease provide a structured analysis with the following:\n`
        prompt += `1. **Overall Assessment:** A brief 2-3 sentence overview of this stack regarding their goals.\n`
        prompt += `2. **Synergies:** What combinations in this stack work well together?\n`
        prompt += `3. **Potential Interactions / Warnings:** Are there any negative interactions? (e.g., competing absorption, excessive stimulants, contraindications).\n`
        prompt += `4. **Optimal Timing:** Recommend the absolute best time of day to take each of these for maximum efficiency.\n`
        prompt += `5. **Missing Links:** Based on their goals and current stack, what 1 or 2 supplements are they missing that would provide the highest ROI? What should they consider dropping?`

        prompt += `\nFormat your response in clean, easy-to-read Markdown.`

        // 5. Generate Content
        const result = await model.generateContent(prompt)
        const responseText = result.response.text()

        return NextResponse.json({ result: responseText })

    } catch (error: any) {
        console.error('AI Analysis Error:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
