import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Using placeholder images for now since the user provided paths are likely not available in this env
// Ideally we would replace these with actual product images or imports
// Using colored placeholders to distinguish items
const PRODUCTS = [
    {
        id: 1,
        name: 'T-Shirt',
        description: 'High-quality T-shirt mockup that helps you visualize your artwork before production.',
        color: 'bg-indigo-50',
        zIndex: 50,
        marginLeft: '',
        rotate: 'rotate-0',
    },
    {
        id: 2,
        name: 'Shirt!',
        description: 'High-quality shirt mockup that helps you visualize your artwork before production.',
        color: 'bg-sky-50',
        zIndex: 40,
        marginLeft: '-ml-16 sm:-ml-36',
        rotate: 'rotate-3',
    },
    {
        id: 3,
        name: 'trousers!',
        description: 'High-quality trousers mockup that helps you visualize your artwork before production.',
        color: 'bg-fuchsia-50',
        zIndex: 30,
        marginLeft: '-ml-16 sm:-ml-36',
        rotate: 'rotate-6',
    },
];

export function ProductStack() {
    return (
        <div className="flex justify-center items-center py-12 pl-8 sm:pl-36 pr-8 overflow-visible">
            <div className="flex items-center perspective-[1000px] group/stack">
                {PRODUCTS.map((product) => (
                    <div
                        key={product.id}
                        className={cn(
                            "relative h-[240px] w-[180px] sm:h-[340px] sm:w-[260px] shrink-0 rounded-3xl bg-white shadow-2xl transition-all duration-700 ease-out flex flex-col overflow-hidden border border-slate-100",
                            "hover:-translate-y-6 sm:hover:-translate-y-10 hover:z-[60] hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] hover:scale-110 hover:rotate-0",
                            "group-hover/stack:translate-x-2",
                            product.marginLeft,
                            product.rotate
                        )}
                        style={{ zIndex: product.zIndex }}
                    >
                        <figure className={cn("h-[110px] sm:h-[180px] w-full shrink-0 relative overflow-hidden", product.color)}>
                            {/* Shine effect */}
                            <div className="absolute inset-0 -translate-x-full group-hover/card:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/40 to-transparent z-10" />

                            {/* Placeholder for image - with zoom and pulse effect */}
                            <div className="w-full h-full flex items-center justify-center text-slate-400/80 font-bold transition-transform duration-700 group-hover:scale-110 text-sm sm:text-lg tracking-tight">
                                {product.name} Image
                            </div>
                        </figure>
                        <div className="flex flex-col flex-1 p-5 text-slate-900 bg-white">
                            <h2 className="text-lg sm:text-xl font-bold mb-1.5 tracking-tight group-hover:text-indigo-600 transition-colors">{product.name}</h2>
                            <p className="text-[11px] sm:text-xs text-slate-500 line-clamp-2 sm:line-clamp-3 mb-3 leading-relaxed">
                                {product.description}
                            </p>
                            <div className="mt-auto">
                                <Button size="sm" className="w-full bg-slate-900 text-white hover:bg-indigo-600 transition-colors shadow-none text-xs h-8 sm:h-9 rounded-lg font-semibold">
                                    Buy Now
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
