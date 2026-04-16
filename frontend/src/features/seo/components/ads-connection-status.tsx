import { AlertCircle, CheckCircle2, Loader2, WifiOff } from "lucide-react";

interface AdsConnection {
    google?: boolean;
    facebook?: boolean;
    tiktok?: boolean;
    line?: boolean;
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
    
    if (isLoading) {
        return (
            <div className={`${baseClasses} bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200 shadow-sm hover:shadow-md`}>
                <Loader2 className="w-4 h-4 text-amber-600 animate-spin" />
                <span className="text-sm font-semibold text-amber-900 tracking-wide">
                    กำลังโหลดการเชื่อมต่อ...
                </span>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`${baseClasses} bg-gradient-to-r from-red-50 to-rose-50 border-red-200 shadow-sm hover:shadow-md`}>
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span className="text-sm font-semibold text-red-900 tracking-wide">
                    ไม่สามารถตรวจสอบการเชื่อมต่อ
                </span>
            </div>
        );
    }

    if (!data) {
        return (
            <div className={`${baseClasses} bg-gradient-to-r from-slate-50 to-gray-50 border-slate-200 shadow-sm hover:shadow-md`}>
                <WifiOff className="w-4 h-4 text-slate-600 flex-shrink-0" />
                <span className="text-sm font-semibold text-slate-900 tracking-wide">
                    ไม่สามารถตรวจสอบการเชื่อมต่อ
                </span>
            </div>
        );
    }

    const connectedAds = Object.entries(data)
        .filter(([_, isConnected]) => isConnected)
        .map(([platform]) => {
            const platformNames: Record<string, string> = {
                google: "Google Ads",
                facebook: "Facebook Ads",
                tiktok: "TikTok Ads",
                line: "LINE Ads",
            };
            return platformNames[platform] || platform;
        });

    if (connectedAds.length > 0) {
        return (
            <div className={`${baseClasses} bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 shadow-sm hover:shadow-md`}>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider opacity-75">เชื่อมต่อแล้ว</span>
                    <span className="text-sm font-semibold text-emerald-900 tracking-wide">
                        {connectedAds.join(", ")}
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className={`${baseClasses} bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200 shadow-sm hover:shadow-md`}>
            <WifiOff className="w-4 h-4 text-orange-600 flex-shrink-0" />
            <span className="text-sm font-semibold text-orange-900 tracking-wide">
                ยังไม่เชื่อมต่อการแพลตฟอร์ม
            </span>
        </div>
    );
}
