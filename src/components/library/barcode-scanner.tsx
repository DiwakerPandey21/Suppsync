'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { Camera, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface ScannedProduct {
    name: string
    brand: string
}

interface BarcodeScannerProps {
    onResult: (product: ScannedProduct) => void
    onClose: () => void
}

export function BarcodeScanner({ onResult, onClose }: BarcodeScannerProps) {
    const scannerRef = useRef<Html5QrcodeScanner | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')

    // Keep callbacks fresh without triggering re-renders of the scanner
    const onResultRef = useRef(onResult)
    const onCloseRef = useRef(onClose)
    const isProcessingRef = useRef(isProcessing)

    useEffect(() => {
        onResultRef.current = onResult
        onCloseRef.current = onClose
        isProcessingRef.current = isProcessing
    }, [onResult, onClose, isProcessing])

    useEffect(() => {
        // Initialize Scanner on Mount
        scannerRef.current = new Html5QrcodeScanner(
            "reader",
            {
                fps: 10,
                qrbox: { width: 250, height: 150 },
                formatsToSupport: [
                    Html5QrcodeSupportedFormats.EAN_13,
                    Html5QrcodeSupportedFormats.EAN_8,
                    Html5QrcodeSupportedFormats.UPC_A,
                    Html5QrcodeSupportedFormats.UPC_E,
                    Html5QrcodeSupportedFormats.CODE_128,
                    Html5QrcodeSupportedFormats.CODE_39
                ],
                rememberLastUsedCamera: true
            },
            false
        )

        const onScanSuccess = async (decodedText: string) => {
            if (isProcessingRef.current) return // Prevent multiple rapid fires

            // Immediately pause scanning while we fetch API
            if (scannerRef.current) {
                scannerRef.current.pause(true)
            }

            setIsProcessing(true)
            setErrorMsg('')

            try {
                // Query Open Food Facts API (works for many supplements/foods globally)
                const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${decodedText}.json`)
                const data = await res.json()

                if (data.status === 1 && data.product) {
                    onResultRef.current({
                        name: data.product.product_name || data.product.product_name_en || '',
                        brand: data.product.brands ? data.product.brands.split(',')[0] : ''
                    })

                    // Automatically clean up and close on success
                    if (scannerRef.current) await scannerRef.current.clear()
                    onCloseRef.current()
                } else {
                    setErrorMsg(`Barcode ${decodedText} not found in database. Try manual entry.`)
                    // Resume scanning to allow another try
                    if (scannerRef.current) scannerRef.current.resume()
                }
            } catch (err) {
                console.error("API Error fetching barcode", err)
                setErrorMsg("Network error looking up product.")
                if (scannerRef.current) scannerRef.current.resume()
            } finally {
                setIsProcessing(false)
            }
        }

        const onScanFailure = (error: any) => {
            // html5-qrcode continuously fires failures when no barcode is in frame.
            // We ignore these safely.
        }

        scannerRef.current.render(onScanSuccess, onScanFailure)

        // Cleanup on unmount
        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(e => console.error("Cleanup error:", e))
            }
        }
    }, []) // Empty dependency array ensures it only mounts once

    return (
        <div className="w-full bg-[#0F172A] border border-slate-700 rounded-xl overflow-hidden relative">
            <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex justify-between items-center">
                <div className="flex items-center text-sm font-medium text-white">
                    <Camera className="w-4 h-4 mr-2 text-slate-400" />
                    Scan Barcode
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-slate-400 hover:text-white rounded-full"
                    onClick={async () => {
                        if (scannerRef.current) await scannerRef.current.clear()
                        onClose()
                    }}
                >
                    <X className="w-4 h-4" />
                </Button>
            </div>

            <div className="relative bg-black min-h-[250px] flex items-center justify-center">
                {isProcessing && (
                    <div className="absolute inset-0 z-10 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                        <Loader2 className="w-8 h-8 animate-spin text-[#3b82f6] mb-3" />
                        <p className="font-medium text-sm">Looking up product...</p>
                    </div>
                )}

                {/* Scanner Target Container */}
                <div id="reader" className="w-full" />
            </div>

            {errorMsg && (
                <div className="bg-red-500/10 border-t border-red-500/20 px-4 py-3">
                    <p className="text-xs text-red-500 text-center font-medium">{errorMsg}</p>
                </div>
            )}

            {/* Global style overrides needed to tame the html5-qrcode default injection styles */}
            <style dangerouslySetInnerHTML={{
                __html: `
                #reader { border: none !important; }
                #reader img { display: none !important; }
                #reader button { 
                    max-width: 90%;
                    margin: 8px auto;
                    display: block;
                    background: #3b82f6; 
                    color: white; 
                    border: none; 
                    padding: 8px 16px; 
                    border-radius: 6px; 
                    font-size: 14px;
                    cursor: pointer;
                }
                #reader select {
                    max-width: 90%;
                    margin: 8px auto;
                    display: block;
                    background: #1e293b;
                    color: white;
                    border: 1px solid #334155;
                    padding: 6px;
                    border-radius: 4px;
                }
                #reader a { display: none !important; }
                #reader span { color: #94a3b8 !important; }
                #reader__scan_region { min-height: 200px; }
            `}} />
        </div>
    )
}
