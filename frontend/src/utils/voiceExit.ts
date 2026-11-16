const EXIT_COMMAND = /\b(stop|exit|quiet)\b/i;

export const isVoiceExitCommand = (text: string): boolean => {
  const normalized = (text || '').trim();
  if (normalized.split(/\s+/).filter(Boolean).length > 3) return false;
  return EXIT_COMMAND.test(normalized);
};
