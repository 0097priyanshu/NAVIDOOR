const translationService = require('./translationService');
const { getLanguageMeta } = require('../config/languages');

const CLARIFICATION_MAP = {
  mr: 'मला नीट समजलं नाही. कृपया पुन्हा सांगा.',
  hi: 'मुझे ठीक से समझ नहीं आया। कृपया फिर से कहें।',
  en: "I didn't quite catch that. Please repeat.",
  gu: 'મને બરાબર સમજાયું નથી. કૃપા કરીને ફરી બોલો.',
  pa: 'ਮੈਨੂੰ ਠੀਕ ਤਰ੍ਹਾਂ ਸਮਝ ਨਹੀਂ ਆਇਆ। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਬੋਲੋ।',
  bn: 'আমি ঠিক বুঝতে পারিনি। দয়া করে আবার বলুন।',
  ta: 'எனக்கு தெளிவாக புரியவில்லை. தயவுசெய்து மீண்டும் சொல்லவும்.',
  te: 'నాకు సరిగ్గా అర్థం కాలేదు. దయచేసి మళ్ళీ చెప్పండి.',
  kn: 'ನನಗೆ ಸರಿಯಾಗಿ ಅರ್ಥವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಹೇಳಿ.',
  ml: 'എനിക്ക് വ്യക്തമായി മനസ്സിലായില്ല. ദയവായി വീണ്ടും പറയുക.'
};

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
          const llamaModel = models.find(m => m.name.toLowerCase().includes('llama'));
          const generalModel = llamaModel || models.find(m => 
            !m.name.toLowerCase().includes('coder') && 
            (m.name.toLowerCase().includes('mistral') || m.name.toLowerCase().includes('gemma') || m.name.toLowerCase().includes('phi') || m.name.toLowerCase().includes('qwen'))
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

  // Pre-LLM Programmatic Validation Layer (Rule 7)
  isUnusableGarbage(rawQuery) {
    if (!rawQuery || typeof rawQuery !== 'string') return true;
    const q = rawQuery.trim().toLowerCase();
    if (q.length < 2) return true;

    // Detect garbage patterns, repeating symbols, or nonsense STT failure artifacts
    if (/^([a-z\u0900-\u097F\u0A80-\u0AFF\u0B80-\u0BFF])\1{3,}$/i.test(q)) return true;
    if (q.includes('झझझ') || q.includes('zzz') || q.includes('aaa') || q.includes('bbb') || q.includes('कुवैती केक')) return true;
    if (/^[^a-zA-Z0-9\u0900-\u097F\u0A80-\u0AFF\u0B80-\u0BFF]+$/.test(q)) return true;

    return false;
  }

  // Direct Phonetic Intent Matching for Audibility Checks & Voice Tests
  matchVoiceCheckIntent(query, language = 'en') {
    const q = (query || '').toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, '').trim();

    const isMarathiVoiceCheck = 
      q.includes('माझा आवाज') || q.includes('माजा अवाज') || q.includes('माझा आवाज़') ||
      q.includes('ऐकू येत') || q.includes('आएकू येट') || q.includes('ऐकू येतोय') || q.includes('आवाज येतोय');

    if (isMarathiVoiceCheck || (language === 'mr' && (q.includes('आवाज') || q.includes('अवाज')) && (q.includes('येत') || q.includes('येतोय')))) {
      return {
        normalizedInterpretation: 'माझा आवाज ऐकू येत आहे का?',
        confidence: 0.98,
        answer: 'हो, तुमचा आवाज ऐकू येत आहे.'
      };
    }

    const isHindiVoiceCheck =
      q.includes('मेरी आवाज') || q.includes('मेरी आवाज़') || q.includes('आवाज आ रही') || q.includes('सुनाई दे रही');

    if (isHindiVoiceCheck || (language === 'hi' && q.includes('आवाज') && q.includes('सुनाई'))) {
      return {
        normalizedInterpretation: 'क्या मेरी आवाज़ सुनाई दे रही है?',
        confidence: 0.98,
        answer: 'हाँ, आपकी आवाज़ सुनाई दे रही है।'
      };
    }

    const isEnglishVoiceCheck =
      q.includes('can you hear me') || q.includes('can you hear my voice') || q.includes('hear my voice') || q.includes('hear me');

    if (isEnglishVoiceCheck) {
      return {
        normalizedInterpretation: 'Can you hear my voice?',
        confidence: 0.98,
        answer: 'Yes, I can hear your voice clearly.'
      };
    }

    return null;
  }

  async processQuery(query, language = 'en', context = {}, sessionId = 'default') {
    const rawQuery = (query || '').trim();
    const fallbackClarify = CLARIFICATION_MAP[language] || CLARIFICATION_MAP.en;

    // Structured Decision Logging (Rule 10)
    console.log(`[VOICE] Raw transcription: "${rawQuery}"`);
    console.log(`[VOICE] Detected language: "${language}"`);

    // Rule 7: Programmatic validation layer
    if (this.isUnusableGarbage(rawQuery)) {
      console.log(`[VOICE] Normalized interpretation: null (Unusable transcription)`);
      console.log(`[VOICE] Intent confidence: 0.0`);
      console.log(`[VOICE] Response decision: CLARIFY`);
      console.log(`[VOICE] Final response: "${fallbackClarify}"`);

      return {
        answer: fallbackClarify,
        intent: null,
        source: 'validation_fallback'
      };
    }

    // Direct Audibility / Voice Check Intent Matching
    const voiceCheckResult = this.matchVoiceCheckIntent(rawQuery, language);
    if (voiceCheckResult) {
      console.log(`[VOICE] Normalized interpretation: "${voiceCheckResult.normalizedInterpretation}"`);
      console.log(`[VOICE] Intent confidence: ${voiceCheckResult.confidence}`);
      console.log(`[VOICE] Response decision: ANSWER`);
      console.log(`[VOICE] Final response: "${voiceCheckResult.answer}"`);

      return {
        answer: voiceCheckResult.answer,
        intent: { action: 'voiceAudibilityCheck' },
        source: 'intent_matcher'
      };
    }

    const { detectedObjects = [], activeMode = 'assist' } = context;

    // Check natural language UI control intents
    const intent = this.extractNaturalIntent(rawQuery, language);

    if (intent && intent.suggestedAnswer && intent.action !== 'generalQA') {
      let finalAnswer = intent.suggestedAnswer;
      if (language !== 'en' && /[a-zA-Z]/.test(finalAnswer)) {
        try {
          finalAnswer = await translationService.translateText(finalAnswer, language);
        } catch (e) {}
      }

      console.log(`[VOICE] Normalized interpretation: "UI Command: ${intent.action}"`);
      console.log(`[VOICE] Intent confidence: 0.95`);
      console.log(`[VOICE] Response decision: ANSWER`);
      console.log(`[VOICE] Final response: "${finalAnswer}"`);

      return {
        answer: finalAnswer,
        intent,
        source: 'ui_command'
      };
    }

    // Resolve local Ollama model
    const model = await this.getAvailableModel();

    const langMeta = getLanguageMeta(language);
    const targetLangName = langMeta ? langMeta.name : language;

    let visionContextText = '';
    if (Array.isArray(detectedObjects) && detectedObjects.length > 0) {
      visionContextText = detectedObjects
        .map(o => `${o.label || o.class || 'object'} (${o.distance || '1.2m'}, ${o.direction || 'front'})`)
        .join(', ');
    }

    // Dedicated Accessibility System Prompt (Rule 1 & Rule 8)
    const systemPrompt = `You are NAVIDOOR, a hands-free accessibility voice assistant for blind and visually impaired users.
The user's spoken input comes from speech recognition and may contain minor phonetic spelling errors.

ACCESSIBILITY & LANGUAGE RULES:
1. Understand the user's INTENDED MEANING from the complete sentence context.
2. Respond STRICTLY in the user's native language (${targetLangName}).
3. If user speaks Marathi, respond in Marathi. If Hindi, respond in Hindi. If English, respond in English.
4. Give a direct, factual answer in 1 SHORT sentence (maximum 15 words). No markdown, no filler, no greetings.
5. Never introduce an unrelated topic, invent information, or hallucinate.
6. Do NOT randomly translate words. Do NOT generate answers based on isolated word resemblance (no cake, no Kuwait).
7. If the user input is garbled, unintelligible, or nonsense, reply ONLY with:
   "${fallbackClarify}"
${visionContextText ? `CAMERA VISION DATA: ${visionContextText}` : ''}`;

    if (!this.sessionHistory.has(sessionId)) {
      this.sessionHistory.set(sessionId, []);
    }
    const history = this.sessionHistory.get(sessionId);
    const prunedHistory = history.slice(-4);

    // Send query directly in native language (DO NOT translate to English first!)
    const messages = [
      { role: 'system', content: systemPrompt },
      ...prunedHistory,
      { role: 'user', content: rawQuery }
    ];

    let rawAnswer = '';
    let decision = 'ANSWER';
    let confidence = 0.90;

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages,
          stream: false,
          options: {
            num_predict: 45,
            temperature: 0.1
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama HTTP ${response.status}`);
      }

      const data = await response.json();
      rawAnswer = data.message?.content ? data.message.content.trim() : '';

      if (!rawAnswer || rawAnswer.includes('केक') || rawAnswer.includes('कुवैती') || rawAnswer.toLowerCase().includes('kuwait') || rawAnswer.toLowerCase().includes('cake')) {
        rawAnswer = fallbackClarify;
        decision = 'CLARIFY';
        confidence = 0.30;
      } else {
        history.push({ role: 'user', content: rawQuery });
        history.push({ role: 'assistant', content: rawAnswer });
        if (history.length > 8) history.splice(0, history.length - 8);
      }

      rawAnswer = this.cleanSpeechText(rawAnswer);

    } catch (err) {
      console.warn('[AIAssistantService] LLM fallback:', err.message);
      rawAnswer = fallbackClarify;
      decision = 'CLARIFY';
      confidence = 0.0;
    }

    console.log(`[VOICE] Normalized interpretation: "${rawQuery}"`);
    console.log(`[VOICE] Intent confidence: ${confidence}`);
    console.log(`[VOICE] Response decision: ${decision}`);
    console.log(`[VOICE] Final response: "${rawAnswer}"`);

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

  extractNaturalIntent(query, language = 'en') {
    const raw = (query || '').trim();
    let q = raw.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, ' ').replace(/\s+/g, ' ').trim();

    if (q === 'namaskar' || q === 'namaste' || q === 'hello' || q === 'hi' || q === 'नमस्कार' || q === 'नमस्ते' || q.includes('namaskar') || q.includes('namaste')) {
      const greetingMap = {
        mr: 'नमस्कार! मी नवीडोअर एआय असिस्टंट आहे. मी तुम्हाला कशी मदत करू शकतो?',
        hi: 'नमस्ते! मैं नवीडोर एआई असिस्टेंट हूँ। मैं आपकी क्या मदद कर सकता हूँ?',
        en: 'Hello! I am NAVIDOOR AI Assistant. How can I help you today?'
      };
      return {
        action: 'generalGreeting',
        suggestedAnswer: greetingMap[language] || greetingMap.en
      };
    }

    if (q.includes('what is navidoor') || q.includes('who are you') || q.includes('नवीडोअर काय आहे') || q.includes('नेविडोर क्या है')) {
      const navidoorAboutMap = {
        mr: 'नवीडोअर हे दृष्टिहीन वापरकर्त्यांसाठी एक प्रगत एआय व्हॉइस असिस्टंट ॲप आहे.',
        hi: 'नेविडोर दृष्टिबाधित उपयोगकर्ताओं के लिए एक उन्नत एआई वॉयस असिस्टेंट ऐप है।',
        en: 'NAVIDOOR is an advanced AI voice assistant app for visually impaired users.'
      };
      return {
        action: 'aboutNavidoor',
        suggestedAnswer: navidoorAboutMap[language] || navidoorAboutMap.en
      };
    }

    // Camera Flip / Switch / Facing
    const isCameraFlip = 
      q.includes('flip camera') || q.includes('flip the camera') || q.includes('switch camera') || q.includes('switch the camera') ||
      q.includes('change camera') || q.includes('reverse camera') || q.includes('turn camera') ||
      q.includes('कॅमेरा बदला') || q.includes('कॅमेरा उलटा') || q.includes('कॅमेरा फिरवा') ||
      q.includes('कैमरा बदलो') || q.includes('कैमरा फ्लिप') || q.includes('कैमरा घुमाओ');
    
    if (isCameraFlip) {
      return { action: 'toggleCameraFacing', suggestedAnswer: language === 'mr' ? 'कॅमेरा बदलत आहे.' : (language === 'hi' ? 'कैमरा बदला जा रहा है।' : 'Switching camera.') };
    }

    const isFrontCamera = q.includes('front camera') || q.includes('selfie camera') || q.includes('समोरचा कॅमेरा') || q.includes('सामने का कैमरा');
    if (isFrontCamera) {
      return { action: 'setCameraFacing', cameraFacing: 'front', suggestedAnswer: language === 'mr' ? 'समोरचा कॅमेरा सक्रिय केला.' : (language === 'hi' ? 'सामने का कैमरा सक्रिय किया गया।' : 'Front camera active.') };
    }

    const isBackCamera = q.includes('back camera') || q.includes('rear camera') || q.includes('मागील कॅमेरा') || q.includes('पीछे का कैमरा');
    if (isBackCamera) {
      return { action: 'setCameraFacing', cameraFacing: 'back', suggestedAnswer: language === 'mr' ? 'मागील कॅमेरा सक्रिय केला.' : (language === 'hi' ? 'पीछे का कैमरा सक्रिय किया गया।' : 'Rear camera active.') };
    }

    // Torch / Flashlight
    const isTorchOn = 
      q.includes('turn on torch') || q.includes('turn on the torch') || q.includes('turn on flashlight') || q.includes('turn on the flashlight') ||
      q.includes('torch on') || q.includes('flashlight on') || q.includes('flash on') ||
      q.includes('टॉर्च चालू') || q.includes('फ्लॅश चालू') || q.includes('टॉर्च ऑन') || q.includes('फ्लैश ऑन') || q.includes('टॉर्च जलाओ') || q.includes('फ्लैशलाइट जलाओ');
    if (isTorchOn) {
      return { action: 'setTorch', boolValue: true, suggestedAnswer: language === 'mr' ? 'फ्लॅशलाइट चालू केली.' : (language === 'hi' ? 'फ्लैशलाइट चालू की गई।' : 'Flashlight on.') };
    }

    const isTorchOff = 
      q.includes('turn off torch') || q.includes('turn off the torch') || q.includes('turn off flashlight') || q.includes('turn off the flashlight') ||
      q.includes('torch off') || q.includes('flashlight off') || q.includes('flash off') ||
      q.includes('टॉर्च बंद') || q.includes('फ्लॅश बंद') || q.includes('टॉर्च ऑफ') || q.includes('फ्लैश ऑफ') || q.includes('टॉर्च बुझाओ') || q.includes('फ्लैशलाइट बंद करो');
    if (isTorchOff) {
      return { action: 'setTorch', boolValue: false, suggestedAnswer: language === 'mr' ? 'फ्लॅशलाइट बंद केली.' : (language === 'hi' ? 'फ्लैशलाइट बंद की गई।' : 'Flashlight off.') };
    }

    const isTorchToggle = q.includes('toggle torch') || q.includes('toggle flashlight') || q.includes('torch') || q.includes('flashlight') || q.includes('टॉर्च') || q.includes('फ्लॅशलाइट');
    if (isTorchToggle && (q.includes('toggle') || q.includes('बदला') || q.includes('बदलो'))) {
      return { action: 'toggleTorch', suggestedAnswer: language === 'mr' ? 'टॉर्च टॉगल केली.' : (language === 'hi' ? 'टॉर्च टॉगल की गई।' : 'Toggling flashlight.') };
    }

    // Live YOLO Vision Scanning & Surroundings
    const isYoloScan = 
      q.includes('scan') || q.includes('what is ahead') || q.includes('what is in front') || q.includes('whats in front') ||
      q.includes('describe surroundings') || q.includes('look around') || q.includes('detect objects') ||
      q.includes('स्कॅन करा') || q.includes('स्कॅन') || q.includes('समोर काय आहे') || q.includes('आजूबाजूला काय आहे') ||
      q.includes('स्कैन करो') || q.includes('स्कैन') || q.includes('सामने क्या है') || q.includes('आसपास क्या है');
    if (isYoloScan && !q.includes('medicine') && !q.includes('औषध') && !q.includes('दवा')) {
      return { action: 'runLiveYoloScan', suggestedAnswer: language === 'mr' ? 'दृष्टी स्कॅनिंग सुरू करत आहे.' : (language === 'hi' ? 'दृष्टि स्कैनिंग शुरू की जा रही है।' : 'Scanning surroundings with AI vision.') };
    }

    // Photo capture
    const isPhotoCapture = 
      q.includes('take a photo') || q.includes('take photo') || q.includes('take picture') || q.includes('capture photo') || q.includes('snap photo') ||
      q.includes('फोटो काढा') || q.includes('चित्र काढा') || q.includes('फोटो घ्या') ||
      q.includes('फोटो खींचो') || q.includes('तस्वीर लो') || q.includes('फोटो लो');
    if (isPhotoCapture) {
      return { action: 'capturePhoto', suggestedAnswer: language === 'mr' ? 'फोटो काढत आहे.' : (language === 'hi' ? 'फोटो खींचा जा रहा है।' : 'Capturing photo and analyzing.') };
    }

    // Repeat / what did you say
    const isRepeat = 
      q.includes('repeat') || q.includes('say again') || q.includes('what did you say') || q.includes('pardon') ||
      q.includes('पुन्हा सांगा') || q.includes('काय म्हणालात') || q.includes('पुन्हा बोल') ||
      q.includes('फिर से बोलो') || q.includes('फिर से कहो') || q.includes('क्या कहा');
    if (isRepeat) {
      return { action: 'repeatAnnouncement', suggestedAnswer: '' };
    }

    // Emergency / SOS
    const isSos = 
      q.includes('emergency') || q.includes('sos') || q.includes('help me') || q.includes('call help') ||
      q.includes('आणीबाणी') || q.includes('मदत करा') || q.includes('वाचवा') ||
      q.includes('आपातकाल') || q.includes('मदद करो') || q.includes('बचाओ');
    if (isSos) {
      return { action: 'triggerSosAlert', suggestedAnswer: language === 'mr' ? 'आणीबाणी अलर्ट सक्रिय केला.' : (language === 'hi' ? 'आपातकालीन अलर्ट सक्रिय किया गया।' : 'Emergency alert activated.') };
    }

    // Close / Back
    if (q.startsWith('close') || q === 'back' || q.includes('go back') || q.includes('बंद करा') || q.includes('बंद करो')) {
      return { action: 'closeModal', suggestedAnswer: language === 'mr' ? 'स्क्रीन बंद करत आहे.' : (language === 'hi' ? 'स्क्रीन बंद की जा रही है।' : 'Closing screen.') };
    }

    // Profile
    if (q.includes('profile') || q.includes('प्रोफाइल') || q.includes('प्रोफाईल') || q.includes('माझी प्रोफाइल')) {
      return { action: 'openProfileModal', suggestedAnswer: language === 'mr' ? 'प्रोफाईल उघडत आहे.' : (language === 'hi' ? 'प्रोफाइल खोली जा रही है।' : 'Opening User Profile.') };
    }

    // Family Companion
    if (q.includes('family') || q.includes('companion') || q.includes('केअरटेकर') || q.includes('कौटुंबिक') || q.includes('परिवार') || q.includes('केयरटेकर')) {
      return { action: 'openFamilyCompanion', suggestedAnswer: language === 'mr' ? 'कौटुंबिक काळजीवाहू उघडत आहे.' : (language === 'hi' ? 'फैमिली कंपैनियन खोला जा रहा है।' : 'Opening Family Companion.') };
    }

    // Mode Cycling
    if (q.includes('next mode') || q.includes('pudhil mode') || q.includes('पुढील मोड') || q.includes('अगला मोड')) {
      return { action: 'cycleNextMode', suggestedAnswer: language === 'mr' ? 'पुढील मोडवर स्विच करत आहे.' : (language === 'hi' ? 'अगले मोड पर जा रहे हैं।' : 'Switching to next mode.') };
    }
    if (q.includes('previous mode') || q.includes('prev mode') || q.includes('magil mode') || q.includes('मागील मोड') || q.includes('पिछला मोड')) {
      return { action: 'cyclePrevMode', suggestedAnswer: language === 'mr' ? 'मागील मोडवर स्विच करत आहे.' : (language === 'hi' ? 'पिछले मोड पर जा रहे हैं।' : 'Switching to previous mode.') };
    }

    // Mode Switch direct
    if (q.includes('assist mode') || q.includes('assistance mode') || q.includes('मदत मोड') || q.includes('सहायता मोड')) {
      return { action: 'switchMode', targetMode: 'assist', suggestedAnswer: 'Assist mode active.' };
    }
    if (q.includes('navigate mode') || q.includes('navigation mode') || q.includes('नेव्हिगेशन मोड') || q.includes('दिशा मोड')) {
      return { action: 'switchMode', targetMode: 'navigate', suggestedAnswer: 'Navigation mode active.' };
    }
    if (q.includes('read mode') || q.includes('reading mode') || q.includes('वाचन मोड') || q.includes('पढ़ने का मोड')) {
      return { action: 'switchMode', targetMode: 'read', suggestedAnswer: 'Read mode active.' };
    }
    if (q.includes('medicine mode') || q.includes('medical mode') || q.includes('औषध मोड') || q.includes('दवा मोड')) {
      return { action: 'switchMode', targetMode: 'medicine', suggestedAnswer: 'Medicine mode active.' };
    }
    if (q.includes('transport mode') || q.includes('transit mode') || q.includes('वाहतूक मोड') || q.includes('परिवहन मोड')) {
      return { action: 'switchMode', targetMode: 'transport', suggestedAnswer: 'Transport mode active.' };
    }

    if (q.includes('logout') || q.includes('log out')) {
      return { action: 'logoutUser', suggestedAnswer: 'Logged out.' };
    }

    return { action: 'generalQA' };
  }
}

module.exports = new AIAssistantService();
