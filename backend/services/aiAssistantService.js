const translationService = require('./translationService');
const { getLanguageMeta } = require('../config/languages');

class AIAssistantService {
  constructor() {
    this.baseUrl = process.env.LLM_BASE_URL || 'http://127.0.0.1:11434';
    this.modelName = process.env.LLM_MODEL || null;
    this.sessionHistory = new Map();
  }

  async getAvailableModel() {
    if (this.modelName) return this.modelName;

    try {
      const res = await fetch(`${this.baseUrl}/api/tags`);
      if (res.ok) {
        const data = await res.json();
        const models = data.models || [];
        if (models.length > 0) {
          // Prioritize general-purpose conversational models first (llama3.2, mistral, gemma, phi), avoiding -coder models if general models exist
          const generalModel = models.find(m => 
            !m.name.toLowerCase().includes('coder') && 
            (m.name.toLowerCase().includes('llama') || m.name.toLowerCase().includes('mistral') || m.name.toLowerCase().includes('gemma') || m.name.toLowerCase().includes('phi') || m.name.toLowerCase().includes('qwen'))
          );
          
          this.modelName = generalModel ? generalModel.name : models[0].name;
          console.log(`[AIAssistantService] Auto-selected local Ollama model: "${this.modelName}"`);
          return this.modelName;
        }
      }
    } catch (err) {
      console.warn('[AIAssistantService] Failed to query local Ollama /api/tags:', err.message);
    }
    return 'llama3.2';
  }

  async processQuery(query, language = 'en', context = {}, sessionId = 'default') {
    if (!query || !query.trim()) {
      return { answer: '', intent: null, source: 'ollama' };
    }

    const { detectedObjects = [], activeMode = 'assist', location = 'Oak Lane' } = context;

    // 1. Check natural language UI control intents
    const intent = this.extractNaturalIntent(query);

    // If intent has a direct UI control command AND a suggested feedback answer
    if (intent && intent.suggestedAnswer && intent.action !== 'generalQA') {
      const translatedAnswer = await translationService.translateText(intent.suggestedAnswer, language);
      return {
        answer: translatedAnswer,
        intent,
        source: 'ui_command'
      };
    }

    // 2. Resolve local Ollama model
    const model = await this.getAvailableModel();

    // 3. Build System Prompt & Messages
    const langMeta = getLanguageMeta(language);
    const targetLangName = langMeta ? langMeta.name : language;

    let visionContextText = '';
    if (Array.isArray(detectedObjects) && detectedObjects.length > 0) {
      visionContextText = detectedObjects
        .map(o => `${o.label || o.class || 'object'} (confidence: ${Math.round((o.confidence || 0.9) * 100)}%, distance: ${o.distance || '1.2m'}, position: ${o.direction || o.position || 'center'})`)
        .join(', ');
    }

    const systemPrompt = `You are NAVIDOOR's AI Assistant, a general-purpose voice AI assistant for blind and visually impaired users.
Your job is to answer the user's questions clearly, accurately, and concisely in natural spoken text.

Rules:
1. Answer ANY general question across any domain (science, history, math, coding, jokes, general knowledge, directions, daily life advice).
2. Respond DIRECTLY in ${targetLangName} (Language code: ${language}).
3. Whether the user's input transcript is written in native script (e.g. Devanagari) or Romanized text (e.g. Marathi/Hinglish), understand their intent and answer in clear, natural ${targetLangName}.
4. Keep answers concise (1-3 sentences maximum) suitable for voice synthesis readout unless the user explicitly requests more detail.
5. NEVER include markdown elements like code blocks, backticks, asterisks, hash tags, or bullet points in your output text.
6. When asked about what is in front of the user or environmental surroundings:
   ${visionContextText ? `CAMERA PERCEPTION DATA: ${visionContextText}` : `CAMERA PERCEPTION DATA: NO OBJECTS DETECTED OR CAMERA FEED UNAVAILABLE.`}
   - NEVER fabricate visual objects, distances, or directions.
   - Use provided camera perception data ONLY when asked about the environment.
   - If asked what is in front of the user and camera data is unavailable, state clearly that reliable camera data is currently unavailable.
7. Do NOT force general knowledge questions into navigation topics.`;

    if (!this.sessionHistory.has(sessionId)) {
      this.sessionHistory.set(sessionId, []);
    }
    const history = this.sessionHistory.get(sessionId);

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: query.trim() }
    ];

    console.log(`[AIAssistantService] Querying Local Ollama (${model}) [Lang: ${language}]...`);
    console.log(`[AIAssistantService] Prompt query: "${query}"`);

    let rawAnswer = '';
    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages,
          stream: false
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[AIAssistantService] Ollama chat endpoint returned HTTP ${response.status}:`, errorText);
        throw new Error(`Ollama local LLM service returned HTTP ${response.status}`);
      }

      const data = await response.json();
      rawAnswer = data.message?.content ? data.message.content.trim() : '';

      if (!rawAnswer) {
        throw new Error('Ollama returned empty message content');
      }

      rawAnswer = this.cleanSpeechText(rawAnswer);
      console.log(`[AIAssistantService] Ollama LLM Response: "${rawAnswer}"`);

      history.push({ role: 'user', content: query.trim() });
      history.push({ role: 'assistant', content: rawAnswer });
      if (history.length > 10) {
        history.splice(0, history.length - 10);
      }
    } catch (err) {
      console.error('[AIAssistantService] Ollama LLM Inference Error:', err.message);
      throw new Error(`Local LLM (Ollama) unavailable: ${err.message}`);
    }

    return {
      answer: rawAnswer,
      intent,
      model,
      source: 'ollama'
    };
  }

  cleanSpeechText(text) {
    if (!text) return '';
    return text
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/^#+\s*/gm, '')
      .replace(/[-*]\s+/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  extractNaturalIntent(query) {
    const raw = query.trim();
    const q = raw.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');

    if (q.includes('language section') || q.includes('open language') || q.includes('language settings') || q.includes('open profile') || q.includes('profile section') || q.includes('open settings') || q.includes('open setup') || q.includes('भाषा विभाग') || q.includes('सेक्शन खोलो')) {
      return {
        action: 'openProfileModal',
        suggestedAnswer: 'Opening Language and Profile settings.'
      };
    }

    if (q.includes('logout') || q.includes('log out') || q.includes('reset profile') || q.includes('restart setup') || q.includes('start setup again')) {
      return {
        action: 'logoutUser',
        suggestedAnswer: 'Logged out. Starting voice profile setup again.'
      };
    }

    const langMap = [
      { code: 'mr', name: 'Marathi', match: ['marathi', 'मराठी', 'मराठीत', 'मराठी मध्ये', 'marati', 'marath'], ans: 'Language changed to Marathi. भाषा मराठी मध्ये बदलली आहे.' },
      { code: 'hi', name: 'Hindi', match: ['hindi', 'हिंदी', 'हिन्दी', 'हिंदी में'], ans: 'Language changed to Hindi. भाषा हिंदी में बदल दी गई है।' },
      { code: 'en', name: 'English', match: ['english', 'अंग्रेजी', 'इंग्रजी', 'इंग्लिश', 'in english'], ans: 'Language changed to English.' },
      { code: 'gu', name: 'Gujarati', match: ['gujarati', 'ગુજરાતી'], ans: 'Language changed to Gujarati.' },
      { code: 'pa', name: 'Punjabi', match: ['punjabi', 'ਪੰਜਾਬੀ'], ans: 'Language changed to Punjabi.' },
      { code: 'bn', name: 'Bengali', match: ['bengali', 'বাংলা'], ans: 'Language changed to Bengali.' },
      { code: 'ta', name: 'Tamil', match: ['tamil', 'தமிழ்'], ans: 'Language changed to Tamil.' },
      { code: 'te', name: 'Telugu', match: ['telugu', 'తెలుగు'], ans: 'Language changed to Telugu.' },
      { code: 'kn', name: 'Kannada', match: ['kannada', 'ಕನ್ನಡ'], ans: 'Language changed to Kannada.' },
      { code: 'ml', name: 'Malayalam', match: ['malayalam', 'മലയാളം'], ans: 'Language changed to Malayalam.' }
    ];

    for (const l of langMap) {
      if (l.match.some(m => q.includes(m))) {
        return {
          action: 'switchLanguage',
          targetLanguage: l.code,
          targetLanguageName: l.name,
          suggestedAnswer: l.ans
        };
      }
    }

    if (q.includes('read') || q.includes('document') || q.includes('sign') || q.includes('पढ़') || q.includes('वाच')) {
      return { action: 'switchMode', targetMode: 'read', suggestedAnswer: 'Switched to Read mode for document and text scanning.' };
    }
    if (q.includes('medicine') || q.includes('pill') || q.includes('prescription') || q.includes('दवा') || q.includes('औषध')) {
      return { action: 'switchMode', targetMode: 'medicine', suggestedAnswer: 'Switched to Medicine mode for pill identification and dosage schedules.' };
    }
    if (q.includes('transport') || q.includes('bus') || q.includes('transit') || q.includes('बस')) {
      return { action: 'switchMode', targetMode: 'transport', suggestedAnswer: 'Switched to Transport mode for transit assistance.' };
    }
    if (q.includes('navigate') || q.includes('guide') || q.includes('path') || q.includes('walk') || q.includes('मार्ग') || q.includes('रस्ता')) {
      return { action: 'switchMode', targetMode: 'navigate', suggestedAnswer: 'Switched to Navigation mode for live obstacle avoidance.' };
    }
    if (q.includes('family') || q.includes('stream') || q.includes('caregiver') || q.includes('परिवार') || q.includes('कुटुंब')) {
      return { action: 'switchMode', targetMode: 'family', suggestedAnswer: 'Switched to Family companion mode.' };
    }
    if (q.includes('history') || q.includes('log') || q.includes('past') || q.includes('इतिहास')) {
      return { action: 'switchMode', targetMode: 'history', suggestedAnswer: 'Switched to History log mode.' };
    }
    if (q.includes('change section') || q.includes('switch section') || q.includes('next section') || q.includes('change mode') || q.includes('switch mode')) {
      return { action: 'cycleNextMode', suggestedAnswer: 'Switched to next section.' };
    }

    if (q.includes('name is') || q.includes('call me') || q.includes('change my name') || q.includes('set my name') || q.includes('मेरा नाम')) {
      const extracted = raw.replace(/.*(?:name is|call me|change my name to|set my name to|मेरा नाम)\s*/gi, '').trim();
      const cleanName = extracted.replace(/[.,]/g, '').trim();
      if (cleanName) {
        const nameFormatted = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
        return {
          action: 'updateProfile',
          updateField: 'userName',
          updateValue: nameFormatted,
          suggestedAnswer: `Name updated to ${nameFormatted}.`
        };
      }
    }
    if (q.includes('phone number') || q.includes('my phone is') || q.includes('change phone') || q.includes('update phone')) {
      const extracted = raw.replace(/.*(?:phone number is|my phone is|change phone to|update phone to|phone)\s*/gi, '').trim();
      if (extracted) {
        return {
          action: 'updateProfile',
          updateField: 'userPhone',
          updateValue: extracted,
          suggestedAnswer: `Phone number updated to ${extracted}.`
        };
      }
    }

    if (q.includes('add medicine') || q.includes('add medication') || q.includes('new medicine') || q.includes('दवा जोड़ो')) {
      const medName = raw.replace(/.*(?:add medicine|add medication|new medicine|दवा जोड़ो)\s*/gi, '').trim();
      return {
        action: 'manageMedication',
        subAction: 'add',
        medicationName: medName || 'Daily Pill',
        suggestedAnswer: `Added new medicine: ${medName || 'Daily Pill'}.`
      };
    }
    if (q.includes('took my medicine') || q.includes('take medicine') || q.includes('confirm pill') || q.includes('medicine taken') || q.includes('दवा ले ली')) {
      return {
        action: 'manageMedication',
        subAction: 'confirm',
        suggestedAnswer: 'Confirmed pill dose taken.'
      };
    }

    if (q.includes('dark mode') || q.includes('dark theme')) {
      return { action: 'updateSettings', theme: 'dark', suggestedAnswer: 'App theme set to Dark mode.' };
    }
    if (q.includes('light mode') || q.includes('light theme')) {
      return { action: 'updateSettings', theme: 'light', suggestedAnswer: 'App theme set to Light mode.' };
    }
    if (q.includes('high contrast')) {
      return { action: 'updateSettings', theme: 'high-contrast', suggestedAnswer: 'App theme set to High Contrast mode.' };
    }
    if (q.includes('speak faster') || q.includes('faster voice')) {
      return { action: 'updateSettings', speechRate: 1.35, suggestedAnswer: 'Voice speed increased.' };
    }
    if (q.includes('speak slower') || q.includes('slower voice')) {
      return { action: 'updateSettings', speechRate: 0.85, suggestedAnswer: 'Voice speed decreased.' };
    }

    return { action: 'generalQA' };
  }
}

module.exports = new AIAssistantService();
