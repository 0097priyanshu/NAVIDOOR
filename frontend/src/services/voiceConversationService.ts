import { SupportedLanguageCode } from '../types';
import { requestAIChat } from './voiceAssistantBackend';

export class VoiceConversationService {
  async processUserSpeech(userSpeech: string, langCode: SupportedLanguageCode, context: any = {}): Promise<{ answer: string; intent?: any }> {
    if (!userSpeech || !userSpeech.trim()) return { answer: '' };
    return await requestAIChat(userSpeech, langCode, context);
  }
}

export const voiceConversationService = new VoiceConversationService();
