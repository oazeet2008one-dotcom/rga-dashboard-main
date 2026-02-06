import { BlogSection } from '../components/blog-section';
import { HeroSection } from '../components/hero-section';
import { FaqSection } from '../components/faq-section';
import { PlatformsSection } from '../components/platforms-section';
import { ServicesSection } from '../components/services-section';
import { WhyChooseUsSection } from '../components/why-choose-us-section';

export default function EcommerceLandingPage() {
    return (
        <main className="min-h-screen">
            <HeroSection />
            <ServicesSection />
            <WhyChooseUsSection />
            <PlatformsSection />
            <FaqSection />
            <BlogSection />
        </main>
    );
}
