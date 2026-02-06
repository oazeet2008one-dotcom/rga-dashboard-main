
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"

const FAQS = [
    {
        id: "item-1",
        question: "How do I start selling on multiple platforms?",
        answer: "Our platform integrates seamlessly with Shopee, Lazada, and TikTok. Simply connect your accounts in the dashboard, and you can manage all your products and orders from one place."
    },
    {
        id: "item-2",
        question: "Is there a free trial available?",
        answer: "Yes! We offer a 14-day free trial so you can experience all the features of RGA.Data before committing to a plan. No credit card required."
    },
    {
        id: "item-3",
        question: "Can I track my sales performance in real-time?",
        answer: "Absolutely. Our analytics dashboard provides real-time data on sales, revenue, and order trends across all your connected shops, helping you make data-driven decisions."
    },
    {
        id: "item-4",
        question: "Do you offer customer support?",
        answer: "We provide 24/7 customer support via chat and email. Our dedicated team is always ready to assist you with any questions or technical issues."
    },
    {
        id: "item-5",
        question: "How secure is my data?",
        answer: "Your data security is our top priority. We use enterprise-grade encryption and follow strict security protocols to ensure your business information remains safe and confidential."
    }
]

export function FaqSection() {
    return (
        <section className="w-full bg-white py-20 text-slate-900">
            <div className="mx-auto max-w-3xl px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                        Frequently Asked Questions
                    </h2>
                    <p className="mt-4 text-lg text-slate-600">
                        Everything you need to know about our e-commerce solutions.
                    </p>
                </div>

                <Accordion type="single" collapsible className="w-full">
                    {FAQS.map((faq) => (
                        <AccordionItem key={faq.id} value={faq.id} className="border-b border-slate-200">
                            <AccordionTrigger className="text-left text-base font-semibold text-slate-900 hover:text-indigo-600 hover:no-underline py-5">
                                {faq.question}
                            </AccordionTrigger>
                            <AccordionContent className="text-slate-600 text-base leading-relaxed pb-5">
                                {faq.answer}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </section>
    )
}
