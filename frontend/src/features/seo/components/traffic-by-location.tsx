import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TrafficByLocationProps {
    data?: any; // Placeholder for future data type
    isLoading?: boolean;
}

export function TrafficByLocation({ isLoading }: TrafficByLocationProps) {
    if (isLoading) {
        return <Card className="h-full animate-pulse bg-white/50" />;
    }

    return (
        <Card className="shadow-sm h-full">
            <CardHeader className="p-3 pb-2 border-b">
                <CardTitle className="text-xs font-semibold text-gray-700">Traffic by location</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="relative w-full overflow-auto max-h-[160px]">
                    <table className="w-full text-xs text-left">
                        <thead className="text-[10px] text-muted-foreground bg-muted/50 uppercase">
                            <tr>
                                <th className="px-3 py-2 font-medium">Location</th>
                                <th className="px-3 py-2 font-medium text-right">Traffic</th>
                                <th className="px-3 py-2 font-medium text-right">Share</th>
                                <th className="px-3 py-2 font-medium text-right">Keywords</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {/* Empty State / NULL as requested */}
                            <tr>
                                <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground text-[10px]">
                                    No location data available
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
