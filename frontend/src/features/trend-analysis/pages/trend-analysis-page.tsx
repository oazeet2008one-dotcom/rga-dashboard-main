function PageHeader() {
    return (
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-3xl font-bold">E-commerce Insights</h1>
                <p className="text-muted-foreground mt-1">Analyze market trends and performance.</p>
            </div>
        </div>
    );
}

export default function TrendAnalysisPage() {
    return (
        <div className="space-y-6">
            <PageHeader />
        </div>
    );
}
