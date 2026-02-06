import { Card } from '@/components/ui/card';

const TikTokLogo = () => (
    <div className="flex flex-col items-center justify-center w-full h-full p-4">
        {/* TikTok Note Icon */}
        <div className="relative w-1/2 aspect-square mb-4">
            <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <path d="M80 25V35C65 35 55 30 55 20V70C55 83 45 93 32 93C19 93 10 83 10 70C10 57 20 47 32 47V60C26 60 22 64 22 70C22 76 26 80 32 80C38 80 42 76 42 70V10H55V25C55 35 65 35 80 25Z" fill="#25F4EE" transform="translate(-3, -3)" />
                <path d="M80 25V35C65 35 55 30 55 20V70C55 83 45 93 32 93C19 93 10 83 10 70C10 57 20 47 32 47V60C26 60 22 64 22 70C22 76 26 80 32 80C38 80 42 76 42 70V10H55V25C55 35 65 35 80 25Z" fill="#FE2C55" transform="translate(3, 3)" />
                <path d="M80 25V35C65 35 55 30 55 20V70C55 83 45 93 32 93C19 93 10 83 10 70C10 57 20 47 32 47V60C26 60 22 64 22 70C22 76 26 80 32 80C38 80 42 76 42 70V10H55V25C55 35 65 35 80 25Z" fill="black" />
            </svg>
        </div>
        {/* TikTok Text */}
        <div className="text-3xl font-bold tracking-tight text-black">TikTok</div>
    </div>
);

const PLATFORMS = [
    {
        key: 'tiktok',
        render: <TikTokLogo />,
        bgColor: 'bg-white'
    },
    {
        key: 'empty-1',
        render: null,
        bgColor: 'bg-slate-50'
    },
    {
        key: 'empty-2',
        render: null,
        bgColor: 'bg-white'
    },
    {
        key: 'empty-3',
        render: null,
        bgColor: 'bg-white'
    },
    {
        key: 'empty-4',
        render: null,
        bgColor: 'bg-white'
    },
];

export function PlatformsSection() {
    return (
        <section className="w-full bg-white py-20">
            <div className="mx-auto max-w-6xl px-4">
                <div className="text-center mb-12 space-y-4">
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Supported Platforms</h2>
                    <p className="text-lg text-slate-600">We are ready to support your store on popular platforms including</p>
                </div>

                <div className="grid grid-cols-2 gap-6 md:grid-cols-5">
                    {PLATFORMS.map((p) => (
                        <Card
                            key={p.key}
                            className={`group relative aspect-square w-full overflow-hidden rounded-3xl border-none shadow-xl transition-all duration-500 hover:-translate-y-2 ${p.bgColor}`}
                        >
                            <div className="flex h-full w-full items-center justify-center transition-transform duration-500 group-hover:scale-105">
                                {p.render}
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}
