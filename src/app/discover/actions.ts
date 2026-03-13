'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

const defaultProtocols = [
    {
        title: 'Huberman Sleep Cocktail',
        description: 'Designed by Dr. Andrew Huberman to optimize the transition to sleep and sleep architecture. Take 30-60 minutes before bed.',
        author: 'Dr. Andrew Huberman',
        tags: ['sleep', 'recovery', 'huberman'],
        supplements: [
            {
                name: 'Magnesium Threonate',
                brand: 'Generic',
                category: 'Mineral',
                form: 'pill',
                color_hex: '#3b82f6',
                dosage_amount: 145,
                dosage_unit: 'mg',
                frequency: 'daily',
                time_of_day: 'evening'
            },
            {
                name: 'Apigenin',
                brand: 'Generic',
                category: 'Extract',
                form: 'pill',
                color_hex: '#10b981',
                dosage_amount: 50,
                dosage_unit: 'mg',
                frequency: 'daily',
                time_of_day: 'evening'
            },
            {
                name: 'L-Theanine',
                brand: 'Generic',
                category: 'Amino Acid',
                form: 'pill',
                color_hex: '#8b5cf6',
                dosage_amount: 200,
                dosage_unit: 'mg',
                frequency: 'daily',
                time_of_day: 'evening'
            }
        ]
    },
    {
        title: 'Attia Longevity & Heart Stack',
        description: 'A foundational subset of Peter Attia\'s protocol focusing on cardiovascular health and lipid management.',
        author: 'Dr. Peter Attia',
        tags: ['longevity', 'heart', 'attia'],
        supplements: [
            {
                name: 'Omega-3 EPA/DHA',
                brand: 'Generic',
                category: 'Fatty Acid',
                form: 'pill',
                color_hex: '#eab308',
                dosage_amount: 2,
                dosage_unit: 'g',
                frequency: 'daily',
                time_of_day: 'morning'
            },
            {
                name: 'Vitamin D3',
                brand: 'Generic',
                category: 'Vitamin',
                form: 'pill',
                color_hex: '#f59e0b',
                dosage_amount: 5000,
                dosage_unit: 'IU',
                frequency: 'daily',
                time_of_day: 'morning'
            },
            {
                name: 'Magnesium Glycinate',
                brand: 'Generic',
                category: 'Mineral',
                form: 'pill',
                color_hex: '#ef4444',
                dosage_amount: 400,
                dosage_unit: 'mg',
                frequency: 'daily',
                time_of_day: 'evening'
            }
        ]
    },
    {
        title: 'Blueprint Morning Routine',
        description: 'Bryan Johnson\'s core morning longevity mix designed to optimize aging markers.',
        author: 'Bryan Johnson',
        tags: ['blueprint', 'longevity', 'energy'],
        supplements: [
            {
                name: 'Ashwagandha',
                brand: 'Generic',
                category: 'Herb',
                form: 'pill',
                color_hex: '#64748b',
                dosage_amount: 600,
                dosage_unit: 'mg',
                frequency: 'daily',
                time_of_day: 'morning'
            },
            {
                name: 'NR (Nicotinamide Riboside)',
                brand: 'Generic',
                category: 'NAD+ precursor',
                form: 'pill',
                color_hex: '#06b6d4',
                dosage_amount: 300,
                dosage_unit: 'mg',
                frequency: 'daily',
                time_of_day: 'morning'
            },
            {
                name: 'Creatine Monohydrate',
                brand: 'Generic',
                category: 'Amino Acid',
                form: 'powder',
                color_hex: '#a855f7',
                dosage_amount: 5,
                dosage_unit: 'g',
                frequency: 'daily',
                time_of_day: 'morning'
            }
        ]
    }
]

export async function seedProtocols() {
    const supabase = await createClient()

    // check if any exist
    const { count } = await supabase.from('protocols').select('*', { count: 'exact', head: true })

    if (count === 0) {
        // seed
        await supabase.from('protocols').insert(defaultProtocols)
    }
}

export async function adoptProtocol(protocolId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authorized' }
    }

    // 1. Fetch protocol
    const { data: protocol, error: fetchError } = await supabase
        .from('protocols')
        .select('*')
        .eq('id', protocolId)
        .single()

    if (fetchError || !protocol) {
        return { error: 'Protocol not found' }
    }

    // 2. Loop through supplements and insert them
    const adoptedSupplements = protocol.supplements as any[]

    for (const supp of adoptedSupplements) {
        // Insert supplement
        const { data: newSupp, error: suppError } = await supabase
            .from('supplements')
            .insert({
                user_id: user.id,
                name: supp.name,
                brand: supp.brand,
                category: supp.category,
                form: supp.form,
                color_hex: supp.color_hex
            })
            .select()
            .single()

        if (suppError || !newSupp) {
            console.error('Failed to insert supp', suppError)
            continue
        }

        // Insert schedule
        await supabase
            .from('schedules')
            .insert({
                user_id: user.id,
                supplement_id: newSupp.id,
                dosage_amount: supp.dosage_amount,
                dosage_unit: supp.dosage_unit,
                frequency: supp.frequency,
                time_of_day: supp.time_of_day,
                is_active: true
            })

        // Note: we could also insert empty inventory here if we wanted, but we'll leave it empty to prompt user to add stock.
    }

    revalidatePath('/dashboard')
    revalidatePath('/library')

    return { success: true }
}
