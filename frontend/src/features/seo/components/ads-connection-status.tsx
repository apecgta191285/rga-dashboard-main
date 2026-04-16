import { AlertCircle, CheckCircle2, Loader2, WifiOff } from "lucide-react";

interface AdsConnection {
    googleAnalytics?: boolean;
}

interface AdsConnectionStatusProps {
    data?: AdsConnection;
    isLoading?: boolean;
    error?: Error | null;
}

export function AdsConnectionStatus({
    data,
    isLoading = false,
    error = null,
}: AdsConnectionStatusProps) {
    const baseClasses = "inline-flex items-center gap-2.5 px-4 py-2.5 rounded-lg border transition-all duration-200 backdrop-blur-sm";
    const isConnected = data?.googleAnalytics === true;

    if (isLoading) {
        return (
            <div className={`${baseClasses} bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200 shadow-sm hover:shadow-md`}>
                <Loader2 className="w-4 h-4 text-amber-600 animate-spin" />
                <span className="text-sm font-semibold text-amber-900 tracking-wide">
                    ⏳ กำลังตรวจสอบการเชื่อมต่อ Google Analytics...
                </span>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`${baseClasses} bg-gradient-to-r from-red-50 to-rose-50 border-red-200 shadow-sm hover:shadow-md`}>
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span className="text-sm font-semibold text-red-900 tracking-wide">
                    ❌ ไม่สามารถตรวจสอบการเชื่อมต่อ Google Analytics
                </span>
            </div>
        );
    }

    if (isConnected) {
        return (
            <div className={`${baseClasses} bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 shadow-sm hover:shadow-md`}>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="text-sm font-semibold text-emerald-900 tracking-wide">
                    ✅ เชื่อมต่อ Google Analytics แล้ว
                </span>
            </div>
        );
    }

    return (
        <div className={`${baseClasses} bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200 shadow-sm hover:shadow-md`}>
            <WifiOff className="w-4 h-4 text-orange-600 flex-shrink-0" />
            <span className="text-sm font-semibold text-orange-900 tracking-wide">
                ❌ ยังไม่เชื่อมต่อ Google Analytics
            </span>
        </div>
    );
}
