import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const SERVICE_CARDS = [
    {
        id: 0,
        title: 'Store Management',
        description: null,
        features: [
            'Set up and design a beautiful and attractive storefront.',
            'Manage product categories and list products with complete and appealing details.',
            'Create product and store graphics to stand out from competitors.',
            'Implement Shopee SEO to help your store rank higher in search results.'
        ]
    },
    {
        id: 1,
        title: 'Sales Promotion and Marketing',
        description: null,
        features: [
            'Create promotions and participate in platform campaigns.',
            'Run advertising campaigns on Shopee Ads, Lazada Ads, Facebook CPAS, and Google Ads to increase visibility and reach'
        ]
    },
    {
        id: 2,
        title: 'Key Advantage',
        description: 'Why our platform is the best choice for you.',
        features: null
    },
    {
        id: 3,
        title: 'Key Advantage',
        description: 'Why our platform is the best choice for you.',
        features: null
    }
];

export function ServicesSection() {
    return (
        <section className="relative w-full overflow-hidden bg-white">
            <div className="pointer-events-none absolute -top-20 left-[-6rem] h-64 w-[28rem] rounded-full bg-gradient-to-r from-orange-200/35 via-amber-200/25 to-yellow-200/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 right-[-8rem] h-64 w-[30rem] rounded-full bg-gradient-to-r from-orange-200/25 via-red-200/20 to-amber-200/25 blur-3xl" />
            <div className="mx-auto max-w-6xl px-4 py-16">
                <div className="text-center">
                    <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                        Services You Will Receive from RGA
                    </h2>
                    <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
                        We provide comprehensive solutions to make your store stand out and generate sales effectively.
                    </p>
                </div>

                <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {SERVICE_CARDS.map((item) => (
                        <Card
                            key={item.id}
                            className="group relative overflow-hidden shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg flex flex-col h-full"
                        >
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-orange-50/50 via-transparent to-amber-50/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                            <CardHeader className="space-y-3 pb-2">

                                <CardTitle className="text-lg font-bold text-slate-900">{item.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {item.features ? (
                                    <ul className="space-y-2 mt-1">
                                        {item.features.map((feature, i) => (
                                            <li key={i} className="flex items-start text-sm text-slate-600">
                                                <span className="mr-2 mt-2 block h-1.5 w-1.5 shrink-0 rounded-full bg-orange-600" />
                                                <span className="leading-relaxed">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-muted-foreground">{item.description}</p>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}
