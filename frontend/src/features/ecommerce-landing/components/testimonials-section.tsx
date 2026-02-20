import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Star, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const TESTIMONIALS = [
    {
        id: 1,
        name: "Khun Dew",
        role: "Fashion Brand Owner",
        content: "Since using NovaPulse, my sales increased by 30% in the first month. I know exactly which ads to boost. No more guessing.",
        rating: 5,
        avatar: "D"
    },
    {
        id: 2,
        name: "Khun Un",
        role: "Marketing Manager",
        content: "I love the unified chat feature. I can reply to customers much faster. The reports are easy to read, my boss loves it. Highly recommended for marketing teams.",
        rating: 5,
        avatar: "U"
    },
    {
        id: 3,
        name: "Khun Dong",
        role: "SME Online Seller",
        content: "The backend system is very stable. Connecting Shopee and Lazada is smooth with no interruptions. Support team answers quickly and solves problems right away.",
        rating: 4,
        avatar: "D"
    }
]

export function TestimonialsSection() {
    return (
        <section className="w-full py-12 sm:py-16 bg-white">
            <div className="container px-4 mx-auto max-w-6xl">
                <div className="text-center mb-8 sm:mb-12 space-y-2 sm:space-y-3">
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                        What Our Users Say
                    </h2>
                    <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
                        Many businesses trust NovaPulse to help them grow.
                    </p>
                </div>

                <div className="grid gap-4 sm:gap-6 md:grid-cols-3 items-start">
                    {TESTIMONIALS.map((review) => (
                        <TestimonialCard key={review.id} review={review} />
                    ))}
                </div>
            </div>
        </section>
    )
}

function TestimonialCard({ review }: { review: typeof TESTIMONIALS[0] }) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <Card
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
                "rounded-xl border border-slate-200/70 shadow-none bg-white transition-colors duration-200 cursor-pointer overflow-hidden group",
                "hover:bg-white"
            )}
        >
            <CardHeader className="flex flex-row items-center gap-3 px-4 py-4 pb-2 select-none">
                <Avatar className="h-10 w-10 border border-slate-200 shadow-sm">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${review.name}`} alt={review.name} />
                    <AvatarFallback className="bg-indigo-100 text-indigo-700 font-bold">{review.avatar}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <div className="text-sm font-semibold text-slate-900">{review.name}</div>
                    <div className="text-xs text-slate-500">{review.role}</div>
                </div>
                <ChevronDown className={cn("w-4 h-4 text-slate-300 transition-transform duration-200", isOpen && "rotate-180")} />
            </CardHeader>
            <CardContent className="space-y-3 px-4 pb-4 pt-0">
                <div className="flex gap-0.5 mt-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "fill-slate-200 text-slate-200"}`}
                        />
                    ))}
                </div>

                <div
                    className={cn(
                        "grid transition-all duration-300 ease-in-out",
                        isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    )}
                >
                    <div className="overflow-hidden">
                        <p className="text-sm text-slate-600 leading-relaxed italic pt-2 border-t border-slate-100 mt-2">
                            "{review.content}"
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
