import { SupportedLanguageCode } from '../types';
import { getTranslation } from '../utils/translations';

export interface NavigationInstruction {
  stepNumber: number;
  instruction: string;
  distanceMeters: number;
}

export class VoiceNavigationService {
  private currentStepIndex: number = 0;

  getStepsForDestination(destination: string, langCode: SupportedLanguageCode): NavigationInstruction[] {
    const t = getTranslation(langCode);
    return [
      { stepNumber: 1, instruction: `${t.modes.navigate.description}`, distanceMeters: 45 },
      { stepNumber: 2, instruction: `Turn right towards ${destination}.`, distanceMeters: 12 },
      { stepNumber: 3, instruction: `Arriving at ${destination}. Entrance 3 meters straight.`, distanceMeters: 3 }
    ];
  }

  getCurrentStep(steps: NavigationInstruction[]): NavigationInstruction {
    return steps[Math.min(this.currentStepIndex, steps.length - 1)];
  }

  nextStep(steps: NavigationInstruction[]): NavigationInstruction {
    this.currentStepIndex = Math.min(this.currentStepIndex + 1, steps.length - 1);
    return steps[this.currentStepIndex];
  }

  reset() {
    this.currentStepIndex = 0;
  }
}

export const voiceNavigationService = new VoiceNavigationService();
