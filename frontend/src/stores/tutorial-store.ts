import { create } from 'zustand';

export interface TutorialStep {
    targetId: string;
    title: string;
    content: string;
    position?: 'top' | 'bottom' | 'left' | 'right' | 'inner-right' | 'inner-top-left' | 'inner-top-right' | 'bottom-right' | 'inner-bottom-right' | 'inner-bottom-left';
}

interface TutorialState {
    isActive: boolean;
    tutorialId: string | null;
    currentStepIndex: number;
    steps: TutorialStep[];
    startTutorial: (id: string, steps: TutorialStep[]) => void;
    endTutorial: () => void;
    nextStep: () => void;
    prevStep: () => void;
}

export const useTutorialStore = create<TutorialState>((set) => ({
    isActive: false,
    tutorialId: null,
    currentStepIndex: 0,
    steps: [],
    startTutorial: (id, steps) => set({ isActive: true, tutorialId: id, steps, currentStepIndex: 0 }),
    endTutorial: () => set({ isActive: false, tutorialId: null, steps: [], currentStepIndex: 0 }),
    nextStep: () => set((state) => {
        if (state.currentStepIndex < state.steps.length - 1) {
            return { currentStepIndex: state.currentStepIndex + 1 };
        }
        return state; // Or end tutorial? keeping it simple
    }),
    prevStep: () => set((state) => {
        if (state.currentStepIndex > 0) {
            return { currentStepIndex: state.currentStepIndex - 1 };
        }
        return state;
    }),
}));
