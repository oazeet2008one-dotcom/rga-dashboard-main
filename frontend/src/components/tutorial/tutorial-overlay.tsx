import { useEffect, useState, useRef } from 'react';
import { useTutorialStore } from '../../stores/tutorial-store';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming this exists

export function TutorialOverlay() {
    const { isActive, currentStepIndex, steps, nextStep, prevStep, endTutorial } = useTutorialStore();
    const [position, setPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });
    const currentStep = steps[currentStepIndex];
    const [targetFound, setTargetFound] = useState(false);

    useEffect(() => {
        if (!isActive || !currentStep) return;

        const updatePosition = () => {
            const element = document.getElementById(currentStep.targetId);
            if (element) {
                const rect = element.getBoundingClientRect();
                setPosition({
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height
                });
                setTargetFound(true);
                // Scroll into view if needed
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                setTargetFound(false);
            }
        };

        // Initial delay to allow rendering
        const timer = setTimeout(updatePosition, 100);
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition);

        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition);
            clearTimeout(timer);
        };
    }, [isActive, currentStep, currentStepIndex]);

    if (!isActive || !currentStep) return null;

    // Calculate Popover Position based on preference
    let popoverStyle: React.CSSProperties = {};
    const offset = 12;

    if (targetFound) {
        switch (currentStep.position) {
            case 'top':
                popoverStyle = {
                    top: position.top - offset,
                    left: position.left + position.width / 2,
                    transform: 'translate(-50%, -100%)'
                };
                break;
            case 'bottom':
                popoverStyle = {
                    top: position.top + position.height + offset,
                    left: position.left + position.width / 2,
                    transform: 'translate(-50%, 0)'
                };
                break;
            case 'left':
                popoverStyle = {
                    top: position.top + position.height / 2,
                    left: position.left - offset,
                    transform: 'translate(-100%, -50%)'
                };
                break;
            case 'right':
                popoverStyle = {
                    top: position.top + position.height / 2,
                    left: position.left + position.width + offset,
                    transform: 'translate(0, -50%)'
                };
                break;
            case 'inner-right':
                popoverStyle = {
                    top: position.top + offset,
                    left: position.left + position.width - offset,
                    transform: 'translate(-100%, 0)'
                };
                break;
            case 'inner-top-left':
                popoverStyle = {
                    top: position.top + offset,
                    left: position.left + offset,
                    transform: 'translate(0, 0)'
                };
                break;
            case 'inner-top-right':
                popoverStyle = {
                    top: position.top + offset,
                    left: position.left + position.width - offset,
                    transform: 'translate(-100%, 0)'
                };
                break;
            case 'bottom-right':
                popoverStyle = {
                    top: position.top + position.height + offset,
                    left: position.left + position.width,
                    transform: 'translate(-100%, 0)'
                };
                break;
            case 'inner-bottom-right':
                popoverStyle = {
                    top: position.top + position.height - offset,
                    left: position.left + position.width - offset,
                    transform: 'translate(-100%, -100%)'
                };
                break;
            case 'inner-bottom-left':
                popoverStyle = {
                    top: position.top + position.height - offset,
                    left: position.left + offset,
                    transform: 'translate(0, -100%)'
                };
                break;
            default: // bottom default
                popoverStyle = {
                    top: position.top + position.height + offset,
                    left: position.left + position.width / 2,
                    transform: 'translate(-50%, 0)'
                };
        }
    } else {
        // Fallback to center if element not found
        popoverStyle = {
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            position: 'fixed'
        };
    }

    return (
        <div className="fixed inset-0 z-[9999] pointer-events-none">
            {/* Backdrop / Spotlight Effect */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-transparent pointer-events-auto"
            >
                {/* Cutout (Simulated with SVG or simpler approach) */}
                {/* For simplicity in this version, we just use a dark overlay. 
                    A true mix-blend-mode cutout is complex with stacking contexts. 
                    We'll just highlight the box with a border. */}
            </motion.div>

            {/* Target Highlighter Box */}
            {targetFound && (
                <motion.div
                    layoutId="highlight-box"
                    className="absolute border-2 border-orange-500 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] box-content pointer-events-none transition-all duration-300"
                    style={{
                        top: position.top - 4,
                        left: position.left - 4,
                        width: position.width + 8,
                        height: position.height + 8,
                    }}
                />
            )}

            {/* Popover Card */}
            {/* Popover Card Container - Positions the element entirely */}
            <div
                className="absolute w-[320px] pointer-events-auto z-50"
                style={popoverStyle}
            >
                <motion.div
                    key={currentStep.title} // Re-animate on step change
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-white rounded-xl shadow-2xl p-5 w-full border border-slate-100"
                >
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-slate-800 text-lg">{currentStep.title}</h3>
                        <button onClick={endTutorial} className="text-slate-400 hover:text-slate-600 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <p className="text-slate-600 text-sm leading-relaxed mb-6">
                        {currentStep.content}
                    </p>

                    <div className="flex justify-between items-center">
                        <div className="flex gap-1">
                            {steps.map((_, i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        "w-2 h-2 rounded-full transition-colors",
                                        i === currentStepIndex ? "bg-orange-500" : "bg-slate-200"
                                    )}
                                />
                            ))}
                        </div>

                        <div className="flex gap-2">
                            {currentStepIndex > 0 && (
                                <button
                                    onClick={prevStep}
                                    className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors"
                                >
                                    Back
                                </button>
                            )}
                            <button
                                onClick={currentStepIndex === steps.length - 1 ? endTutorial : nextStep}
                                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 shadow-sm"
                            >
                                {currentStepIndex === steps.length - 1 ? 'Finish' : 'Next'}
                                {currentStepIndex < steps.length - 1 && <ChevronRight className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
