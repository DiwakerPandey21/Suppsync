import { AlertTriangle, ShoppingCart } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

export type InventoryAlertItem = {
    id: string
    name: string
    amount: number
    unit: string
    reorderUrl: string | null
}

interface InventoryAlertsProps {
    alerts: InventoryAlertItem[]
}

export function InventoryAlerts({ alerts }: InventoryAlertsProps) {
    if (!alerts || alerts.length === 0) return null

    return (
        <div className="w-full px-4 mb-6 space-y-3">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest pl-1">Restock Alerts</h2>
            {alerts.map(alert => (
                <Alert key={alert.id} className="bg-amber-500/10 border-amber-500/20 text-amber-500">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    <AlertTitle className="text-white font-medium ml-2">Running Low on {alert.name}</AlertTitle>
                    <AlertDescription className="text-amber-500/80 ml-2 mt-1 flex justify-between items-center">
                        <span>Only {alert.amount} {alert.unit} remaining</span>

                        {alert.reorderUrl && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs border-amber-500/30 hover:bg-amber-500 hover:text-white transition-colors"
                                onClick={() => window.open(alert.reorderUrl || '', '_blank')}
                            >
                                <ShoppingCart className="w-3 h-3 mr-1.5" />
                                Reorder
                            </Button>
                        )}
                    </AlertDescription>
                </Alert>
            ))}
        </div>
    )
}
