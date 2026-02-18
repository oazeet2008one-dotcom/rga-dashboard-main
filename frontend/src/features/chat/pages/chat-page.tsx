
import { ChatInterface } from '../components';

export function ChatPage() {
    return (
        <div className="min-h-screen bg-slate-50/50 p-6 md:p-8 font-sans text-slate-900">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                    AI Chat <span className="text-orange-500">Support</span>
                </h1>
                <p className="text-slate-500 mt-2 text-lg max-w-2xl">
                    Your personal AI assistant for general inquiries and support.
                </p>
            </div>

            {/* Main Chat Interface */}
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
                <ChatInterface />
            </div>
        </div>
    );
}
