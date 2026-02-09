import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Carousel,
    CarouselApi,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";

const WHY_CARDS = [
    {
        id: 0,
        title: 'Key Advantage',
        description: 'Why our platform is the best choice for you.',
        number: '01'
    },
    {
        id: 1,
        title: 'Key Advantage',
        description: 'Why our platform is the best choice for you.',
        number: '02'
    },
    {
        id: 2,
        title: 'Key Advantage',
        description: 'Why our platform is the best choice for you.',
        number: '03'
    },
    {
        id: 3,
        title: 'Key Advantage',
        description: 'Why our platform is the best choice for you.',
        number: '04'
    },
    {
        id: 4,
        title: 'Key Advantage',
        description: 'Why our platform is the best choice for you.',
        number: '05'
    },
    {
        id: 5,
        title: 'Key Advantage',
        description: 'Why our platform is the best choice for you.',
        number: '06'
    },
];

export function WhyChooseUsSection() {
    const [api, setApi] = React.useState<CarouselApi>()

    React.useEffect(() => {
        if (!api) {
            return
        }

        const intervalId = setInterval(() => {
            api.scrollNext()
        }, 3000)

        return () => clearInterval(intervalId)
    }, [api])

    return (
        <section className="relative w-full overflow-hidden bg-white text-slate-900">
            <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-200/45 via-sky-200/35 to-emerald-200/40 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 right-[-6rem] h-72 w-[32rem] rounded-full bg-gradient-to-r from-rose-200/35 via-orange-200/30 to-amber-200/35 blur-3xl" />

            <div className="mx-auto max-w-6xl px-4 py-16">
                <div className="text-center mb-12">
                    <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                        <span className="block">Why Choose Us</span>
                        <span className="block text-slate-600 mt-2">for your E-commerce management</span>
                    </h2>
                </div>

                <Carousel
                    setApi={setApi}
                    opts={{
                        align: "start",
                        loop: true,
                    }}
                    className="w-full relative"
                >
                    <CarouselContent className="-ml-4">
                        {WHY_CARDS.map((item) => (
                            <CarouselItem key={item.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                                <div className="p-1 h-full">
                                    <Card className="group relative overflow-hidden border-slate-200 bg-white text-slate-900 shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-xl h-full flex flex-col p-8 min-h-[320px]">
                                        <div className="absolute top-0 right-0 p-6 opacity-10 font-bold text-7xl text-indigo-500 select-none pointer-events-none">
                                            {item.number}
                                        </div>

                                        <div className="relative z-10 flex-1 flex flex-col justify-center">
                                            <CardHeader className="p-0 mb-5">
                                                <CardTitle className="text-xl font-bold text-slate-900">{item.title}</CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-0">
                                                <p className="text-base text-slate-600 leading-relaxed">{item.description}</p>
                                            </CardContent>
                                        </div>
                                    </Card>
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <div className="hidden md:block">
                        <CarouselPrevious className="-left-4 lg:-left-12 border-slate-200 bg-white/80 backdrop-blur-sm hover:bg-white hover:border-indigo-200" />
                        <CarouselNext className="-right-4 lg:-right-12 border-slate-200 bg-white/80 backdrop-blur-sm hover:bg-white hover:border-indigo-200" />
                    </div>
                </Carousel>
            </div>
        </section>
    );
}
