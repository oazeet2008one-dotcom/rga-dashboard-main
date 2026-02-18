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
        <section className="w-full py-20 bg-white">
            <div className="container px-4 mx-auto max-w-6xl">
                <div className="text-center mb-16 space-y-4">
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                        What Our Users Say
                    </h2>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        Many businesses trust NovaPulse to help them grow.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 items-start">
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
                "border-0 shadow-lg bg-white/80 backdrop-blur-sm transition-all duration-300 cursor-pointer overflow-hidden group",
                "hover:bg-white hover:shadow-xl hover:-translate-y-1"
            )}
        >
            <CardHeader className="flex flex-row items-center gap-4 pb-2 select-none">
                <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${review.name}`} alt={review.name} />
                    <AvatarFallback className="bg-indigo-100 text-indigo-700 font-bold">{review.avatar}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <div className="font-semibold text-slate-900">{review.name}</div>
                    <div className="text-xs text-slate-500">{review.role}</div>
                </div>
                <ChevronDown className={cn("w-5 h-5 text-slate-300 transition-transform duration-300 group-hover:text-indigo-500", isOpen && "rotate-180")} />
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
                <div className="flex gap-0.5 mt-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                            key={i}
                            className={`w-4 h-4 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "fill-slate-200 text-slate-200"}`}
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
                        <p className="text-slate-600 leading-relaxed italic pt-2 border-t border-slate-100 mt-2">
                            "{review.content}"
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
