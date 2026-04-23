import { AlertCircle, Loader2, Link, Unlink } from "lucide-react";
import { useIntegrationStatus } from '@/hooks/useIntegrationStatus';

export function AdsConnectionStatus() {
    const { status, ga4Account, isLoading, error } = useIntegrationStatus();

    const baseClasses = "inline-flex items-center gap-2.5 px-4 py-2.5 rounded-lg border transition-all duration-200 backdrop-blur-sm";
    const isConnected = status.googleAnalytics === true;

    if (isLoading) {
        return (
            <div className={`${baseClasses} bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200 shadow-sm hover:shadow-md`}>
                <Loader2 className="w-4 h-4 text-amber-600 animate-spin" />
                <span className="text-sm font-semibold text-amber-900 tracking-wide">
                    กำลังตรวจสอบการเชื่อมต่อ Google Analytics...
                </span>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`${baseClasses} bg-gradient-to-r from-red-50 to-rose-50 border-red-200 shadow-sm hover:shadow-md`}>
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span className="text-sm font-semibold text-red-900 tracking-wide">
                    ไม่สามารถตรวจสอบการเชื่อมต่อ Google Analytics
                </span>
            </div>
        );
    }

    if (isConnected) {
        return (
            <div className={`${baseClasses} bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 shadow-sm hover:shadow-md`}>
                <Link className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold text-emerald-900 tracking-wide">
                        เชื่อมต่อ Google Analytics แล้ว
                    </span>
                    {ga4Account?.propertyName && (
                        <span className="text-xs text-emerald-800 opacity-90">
                            {ga4Account.propertyName}
                        </span>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className={`${baseClasses} bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200 shadow-sm hover:shadow-md`}>
            <Unlink className="w-4 h-4 text-orange-600 flex-shrink-0" />
            <span className="text-sm font-semibold text-orange-900 tracking-wide">
                ยังไม่เชื่อมต่อ Google Analytics
            </span>
        </div>
    );
}
