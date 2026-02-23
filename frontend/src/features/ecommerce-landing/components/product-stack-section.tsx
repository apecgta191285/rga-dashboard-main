import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Product {
    id: number;
    name: string;
    abbreviation: string;
    description: string;
    color: string;
    zIndex: number;
    marginLeft: string;
    rotate: string;
    imageUrl?: string;
}

// RGA Dashboard Features - shown as feature cards with abbreviations
// These represent key features of the RGA marketing analytics platform
const PRODUCTS: Product[] = [
    {
        id: 1,
        name: 'Dashboard Analytics',
        abbreviation: 'DA',
        description: 'Real-time overview of all your marketing metrics in one unified dashboard. Track performance across all platforms instantly.',
        color: 'bg-indigo-50',
        zIndex: 50,
        marginLeft: '',
        rotate: 'rotate-0',
    },
    {
        id: 2,
        name: 'Campaign Insights',
        abbreviation: 'CI',
        description: 'Deep dive into campaign performance with AI-powered insights. Optimize your ad spend with data-driven recommendations.',
        color: 'bg-sky-50',
        zIndex: 40,
        marginLeft: 'sm:-ml-16',
        rotate: 'rotate-3',
    },
    {
        id: 3,
        name: 'Multi-Platform Ads',
        abbreviation: 'MA',
        description: 'Connect and manage Google Ads, Facebook, TikTok, and LINE all in one place. Sync campaigns automatically.',
        color: 'bg-fuchsia-50',
        zIndex: 30,
        marginLeft: 'sm:-ml-16',
        rotate: 'rotate-6',
    },
];

export function ProductStack() {
    return (
        <div className="flex justify-center lg:justify-start items-center py-12 px-4 sm:px-6 overflow-x-auto sm:overflow-visible w-full snap-x snap-mandatory">
            <div className="flex items-center justify-center perspective-[1000px] group/stack max-w-full gap-4 sm:gap-0 pl-8">
                {PRODUCTS.map((product) => (
                    <div
                        key={product.id}
                        className={cn(
                            "relative h-[240px] w-[180px] sm:h-[340px] sm:w-[260px] shrink-0 rounded-3xl bg-white shadow-2xl transition-all duration-700 ease-out flex flex-col overflow-hidden border border-slate-200 snap-start",
                            "hover:-translate-y-3 hover:z-[60] hover:shadow-xl hover:scale-[1.02] hover:rotate-0",
                            "group-hover/stack:translate-x-2",
                            product.marginLeft,
                            product.rotate
                        )}
                        style={{ zIndex: product.zIndex }}
                    >
                        <figure className={cn("h-[110px] sm:h-[180px] w-full shrink-0 relative overflow-hidden flex items-center justify-center", product.color)}>
                            {/* Shine effect */}
                            <div className="absolute inset-0 -translate-x-full group-hover/card:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/40 to-transparent z-10" />

                            {/* Feature Abbreviation Display */}
                            <div className="relative z-20 flex flex-col items-center justify-center">
                                <span className={cn(
                                    "text-5xl sm:text-6xl font-black tracking-tighter",
                                    product.id === 1 ? 'text-indigo-600' : product.id === 2 ? 'text-sky-600' : 'text-fuchsia-600'
                                )}>
                                    {product.abbreviation}
                                </span>
                                <span className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
                                    {product.name}
                                </span>
                            </div>
                        </figure>
                        <div className="flex flex-col flex-1 p-5 text-slate-900 bg-white">
                            <h2 className="text-lg sm:text-xl font-bold mb-1.5 tracking-tight group-hover:text-indigo-600 transition-colors">{product.name}</h2>
                            <p className="text-[11px] sm:text-xs text-slate-500 line-clamp-3 sm:line-clamp-4 mb-3 leading-relaxed">
                                {product.description}
                            </p>
                            <div className="mt-auto">
                                <Button size="sm" className="w-full bg-slate-900 text-white hover:bg-indigo-600 transition-colors shadow-none text-xs h-8 sm:h-9 rounded-lg font-semibold">
                                    Learn More
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
