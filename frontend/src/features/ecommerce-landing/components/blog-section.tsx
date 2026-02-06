import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const BLOG_CARDS = Array.from({ length: 4 }).map((_, idx) => ({
    id: idx,
    title: 'Blog Post Title',
    description: 'Latest updates and insights from our team.',
}));

export function BlogSection() {
    return (
        <section className="w-full bg-slate-50">
            <div className="mx-auto max-w-6xl px-4 py-16">
                <div className="text-center">
                    <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Blogs</h2>
                </div>

                <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {BLOG_CARDS.map((post) => (
                        <Card key={post.id} className="overflow-hidden shadow-md">
                            <div className="aspect-video w-full bg-slate-200" />
                            <CardHeader>
                                <CardTitle className="text-base">{post.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">{post.description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}
