const EXIT_COMMAND = /\b(stop|exit|quiet)\b/i;

export const isVoiceExitCommand = (text: string): boolean => EXIT_COMMAND.test(text);
