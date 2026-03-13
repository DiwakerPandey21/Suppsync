'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Loader2, ScanLine } from 'lucide-react'
import { BarcodeScanner, type ScannedProduct } from './barcode-scanner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function AddSupplementDialog() {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isScanning, setIsScanning] = useState(false)
    const router = useRouter()

    // Form State
    const [name, setName] = useState('')
    const [brand, setBrand] = useState('')
    const [category, setCategory] = useState('')
    const [form, setForm] = useState('Powder')
    const [color, setColor] = useState('#3b82f6') // Default Blue

    // Inventory State
    const [reorderUrl, setReorderUrl] = useState('')
    const [totalCapacity, setTotalCapacity] = useState('')
    const [unit, setUnit] = useState('scoops')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const supabase = createClient()

            // Get current user id
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const { data: newSupp, error } = await supabase
                .from('supplements')
                .insert([
                    {
                        user_id: user.id,
                        name,
                        brand,
                        category,
                        form,
                        color_hex: color,
                        reorder_url: reorderUrl || null
                    }
                ]).select('id').single()

            if (error) throw error

            if (totalCapacity && parseFloat(totalCapacity) > 0) {
                await supabase.from('inventory').insert([{
                    supplement_id: newSupp.id,
                    user_id: user.id,
                    total_capacity: parseFloat(totalCapacity),
                    amount_remaining: parseFloat(totalCapacity),
                    unit: unit || 'servings',
                    low_stock_threshold: 7
                }])
            }

            // Reset form and close
            setName('')
            setBrand('')
            setCategory('')
            setForm('Powder')
            setColor('#3b82f6')
            setReorderUrl('')
            setTotalCapacity('')
            setUnit('scoops')
            setOpen(false)

            // Refresh the server component to show the new supplement
            router.refresh()

        } catch (error) {
            console.error('Error adding supplement:', error)
            alert('Failed to add supplement')
        } finally {
            setIsLoading(false)
        }
    }

    const handleScanResult = (product: ScannedProduct) => {
        if (product.name) setName(product.name)
        if (product.brand) setBrand(product.brand)
        setIsScanning(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="bg-[#3b82f6] text-white hover:bg-blue-600 rounded-full w-8 h-8 p-0 flex items-center justify-center">
                    <Plus className="w-5 h-5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-[#0F172A] border-slate-800 text-white max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add New Supplement</DialogTitle>
                </DialogHeader>

                {isScanning ? (
                    <div className="mt-4 mb-2">
                        <BarcodeScanner
                            onResult={handleScanResult}
                            onClose={() => setIsScanning(false)}
                        />
                    </div>
                ) : (
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full mt-4 bg-slate-900 border-slate-700 hover:bg-slate-800 hover:text-white transition-colors flex items-center justify-center space-x-2"
                        onClick={() => setIsScanning(true)}
                    >
                        <ScanLine className="w-4 h-4 text-[#3b82f6]" />
                        <span>Scan Barcode Quick Add</span>
                    </Button>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 mt-6">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            required
                            placeholder="e.g. Whey Protein"
                            className="bg-slate-900 border-slate-800"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="brand">Brand (Optional)</Label>
                        <Input
                            id="brand"
                            placeholder="e.g. Optimum Nutrition"
                            className="bg-slate-900 border-slate-800"
                            value={brand}
                            onChange={(e) => setBrand(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <Input
                                id="category"
                                required
                                placeholder="e.g. Recovery"
                                className="bg-slate-900 border-slate-800"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Form</Label>
                            <Select value={form} onValueChange={setForm}>
                                <SelectTrigger className="bg-slate-900 border-slate-800">
                                    <SelectValue placeholder="Select form" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                    <SelectItem value="Powder">Powder</SelectItem>
                                    <SelectItem value="Pill">Pill</SelectItem>
                                    <SelectItem value="Liquid">Liquid</SelectItem>
                                    <SelectItem value="Gummy">Gummy</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="color">Accent Color</Label>
                        <div className="flex items-center space-x-3">
                            <Input
                                id="color"
                                type="color"
                                className="w-12 h-10 p-1 bg-slate-900 border-slate-800 cursor-pointer"
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                            />
                            <span className="text-sm text-slate-400">{color}</span>
                        </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-800">
                        <Label htmlFor="reorderUrl" className="text-blue-400">Reorder URL (Amazon, Brand Site)</Label>
                        <Input
                            id="reorderUrl"
                            placeholder="https://..."
                            className="bg-slate-900 border-slate-800"
                            value={reorderUrl}
                            onChange={(e) => setReorderUrl(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="totalCapacity" className="text-blue-400">Total Capacity</Label>
                            <Input
                                id="totalCapacity"
                                type="number"
                                placeholder="e.g. 30"
                                className="bg-slate-900 border-slate-800"
                                value={totalCapacity}
                                onChange={(e) => setTotalCapacity(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="unit" className="text-blue-400">Serving Unit</Label>
                            <Input
                                id="unit"
                                placeholder="e.g. scoops, pills"
                                className="bg-slate-900 border-slate-800"
                                value={unit}
                                onChange={(e) => setUnit(e.target.value)}
                            />
                        </div>
                    </div>

                    <Button type="submit" className="w-full bg-[#3b82f6] hover:bg-blue-600 mt-6" disabled={isLoading}>
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Supplement'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
