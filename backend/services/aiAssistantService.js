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
    const intent = this.extractNaturalIntent(query, language);

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
          stream: false,
          options: {
            num_predict: 60,
            temperature: 0.3
          }
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

  extractNaturalIntent(query, language = 'en') {
    const raw = query.trim();
    let q = raw.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');

    // Phonetic STT normalization for Whisper Devanagari / Indic transcriptions
    q = q
      .replace(/नाजिगेत|नाविगेट|नाव्हिगेट|नेविगेत|नेभिगेट|नेविगेसन|नेभिगेसन/g, 'नेविगेट')
      .replace(/सेक्षिन|सेक्सन|सेकसन|सॅक्शन|सैक्शन|सेकशन/g, 'सेक्शन')
      .replace(/अपन|ऑपन|अपण/g, 'ओपन')
      .replace(/लोकेसन|लोकेसिन|लोकेषन/g, 'लोकेशन')
      .replace(/इमरजेन्सी|इमर्जेन्सी|इमरजन्सी|इमरजन्सि/g, 'इमरजेंसी')
      .replace(/मेडिकिल|मेडिका/g, 'मेडिकल')
      .replace(/सेटिंस/g, 'सेटिंग्स')
      .replace(/रिडींग|रीडीन्ग/g, 'रीडिंग')
      .replace(/मेडिसीन/g, 'मेडिसिन')
      .replace(/ट्रांसपोट|ट्रान्सपोट/g, 'ट्रांसपोर्ट')
      .replace(/फेमिली/g, 'फैमिली')
      .replace(/हिसट्री/g, 'हिस्ट्री')
      .replace(/लैंग्वेस|लँग्वेस/g, 'लैंग्वेज')
      .replace(/प्रोफइल/g, 'प्रोफाइल');

    // 0. Natural polite greetings in target language
    if (q === 'namaskar' || q === 'namaste' || q === 'hello' || q === 'hi' || q === 'hey' || q === 'नमस्कार' || q === 'नमस्ते' || q.includes('namaskar') || q.includes('namaste')) {
      const greetingMap = {
        mr: 'नमस्कार! मी नवीडोअर एआय असिस्टंट आहे. मी तुम्हाला कशी मदत करू शकतो?',
        hi: 'नमस्ते! मैं नवीडोर एआई असिस्टेंट हूँ। मैं आपकी क्या मदद कर सकता हूँ?',
        en: 'Hello! I am NAVIDOOR AI Assistant. How can I help you today?',
        gu: 'નમસ્તે! હું નવીડોર એઆઈ આસિસ્ટન્ટ છું. હું તમને કેવી રીતે મદદ કરી શકું?',
        pa: 'ਨਮਸਤੇ! ਮੈਂ ਨਵੀਡੋਰ ਏਆਈ ਸਹਾਇਕ ਹਾਂ। ਮੈਂ ਤੁਹਾਡੀ ਕੀ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ?',
        bn: 'নমস্কার! আমি নেভিডোর এআই অ্যাসিস্ট্যান্ট। আমি আপনাকে কীভাবে সাহায্য করতে পারি?',
        ta: 'வணக்கம்! நான் நேவிடோர் AI உதவி உதவியாளர். உங்களுக்கு நான் எவ்வாறு உதவ முடியும்?',
        te: 'నమస్కారం! నేను నేవిడోర్ AI అసిస్టెంట్. నేను మీకు ఎలా సహాయం చేయగలను?',
        kn: 'ನಮಸ್ಕಾರ! ನಾನು ನೇವಿಡೋರ್ AI ಸಹಾಯಕ. ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?',
        ml: 'നമസ്കാരം! ഞാൻ നേവിഡോർ എഐ അസിസ്റ്റന്റാണ്. ഞാൻ നിങ്ങളെ എങ്ങനെ സഹായിക്കും?'
      };
      return {
        action: 'generalGreeting',
        suggestedAnswer: greetingMap[language] || greetingMap.en
      };
    }

    if (q.startsWith('close') || q === 'back' || q.includes('go back') || q.includes('dismiss')) {
      return {
        action: 'closeModal',
        suggestedAnswer: 'Closing screen.'
      };
    }

    if (q.includes('open profile') || q.includes('profile section') || q.includes('my profile') || q.includes('user profile')) {
      return {
        action: 'openProfileModal',
        suggestedAnswer: 'Opening User Profile and Medical ID.'
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

    if (
      q.includes('location') || q.includes('where am i') || q.includes('my location') || q.includes('gps') || q.includes('map') ||
      q.includes('लोकेशन') || q.includes('लोकेसन') || q.includes('स्थान') || q.includes('जगह') || q.includes('ठिकाण') ||
      q.includes('સ્થળ') || q.includes('સ્થાન') || q.includes('இடம்') || q.includes('இருப்பிடம்') || q.includes('స్థానం') ||
      q.includes('లొకేషన్') || q.includes('ಸ್ಥಳ') || q.includes('ಲೋಕೇಶನ್') || q.includes('സ്ഥലം') || q.includes('ലൊക്കേഷൻ') ||
      q.includes('লোকেশন') || q.includes('ਲੋਕੇਸ਼ਨ')
    ) {
      return { action: 'switchMode', targetMode: 'location', suggestedAnswer: 'Switched to Location panel.' };
    }

    if (
      q.includes('emergency') || q.includes('sos contacts') || q.includes('contacts') || q.includes('urgent') ||
      q.includes('इमरजेंसी') || q.includes('इमर्जन्सी') || q.includes('आपातकालीन') || q.includes('आपत्कालीन') || q.includes('संपर्क') ||
      q.includes('ઇમરજન્સી') || q.includes('આપાતકાલીન') || q.includes('அவசரம்') || q.includes('தொடர்புகள்') || q.includes('அత్యవసర') ||
      q.includes('సంప్రదింపులు') || q.includes('ತುರ್ತು') || q.includes('അടിയന്തിരം') || q.includes('জরুরী') || q.includes('ਐਮਰਜੈਂਸੀ')
    ) {
      return { action: 'switchMode', targetMode: 'emergency', suggestedAnswer: 'Switched to Emergency Contacts panel.' };
    }

    if (
      q.includes('medical') || q.includes('health') || q.includes('medical record') || q.includes('health info') || q.includes('medical id') ||
      q.includes('मेडिकल') || q.includes('स्वास्थ्य') || q.includes('वैद्यकीय') || q.includes('आरोग्य') || q.includes('सेहत') || q.includes('चिकित्सा') ||
      q.includes('મેડિકલ') || q.includes('સ્વાસ્થ્ય') || q.includes('மருத்துவ') || q.includes('ஆரோக்கியம்') || q.includes('మెడికల్') ||
      q.includes('ఆరోగ్యం') || q.includes('ವೈದ್ಯಕೀಯ') || q.includes('ಆರೋಗ್ಯ') || q.includes('മെഡിക്കൽ') || q.includes('মেডিকেল')
    ) {
      return { action: 'switchMode', targetMode: 'medical', suggestedAnswer: 'Switched to Medical Info panel.' };
    }

    if (
      q.includes('language') || q.includes('languages') || q.includes('speech language') ||
      q.includes('लैंग्वेज') || q.includes('लँग्वेज') || q.includes('भाषा') || q.includes('भाषाएं') ||
      q.includes('ભાષા') || q.includes('લેંગ્વેજ') || q.includes('மொழி') || q.includes('லாங்குவேஜ்') ||
      q.includes('భాష') || q.includes('లాంగ్వేజ్') || q.includes('ಭಾಷೆ') || q.includes('ಲ್ಯಾಂಗ್ವೇಜ್') ||
      q.includes('ഭാഷ') || q.includes('ലാംഗ്വേജ്') || q.includes('বাংলা ভাষা') || q.includes('ਭਾਸ਼ਾ')
    ) {
      return { action: 'switchMode', targetMode: 'languages', suggestedAnswer: 'Switched to Languages panel.' };
    }

    if (
      q.includes('setting') || q.includes('settings') || q.includes('accessibility') || q.includes('preferences') || q.includes('options') ||
      q.includes('सेटिंग') || q.includes('सेटिंग्स') || q.includes('सेटिंग्झ') ||
      q.includes('સેટિંગ્સ') || q.includes('સેટિંગ') || q.includes('அமைப்புகள்') || q.includes('செட்டிங்ஸ்') ||
      q.includes('సెట్టింగ్‌లు') || q.includes('సెట్టింగ్స్') || q.includes('ಸೆಟ್ಟಿಂಗ್‌ಗಳು') || q.includes('ಸೆಟ್ಟಿಂಗ್ಸ್') ||
      q.includes('സെറ്റിംഗ്സ്') || q.includes('সেটিংস') || q.includes('ਸੈਟਿੰਗਾਂ')
    ) {
      return { action: 'switchMode', targetMode: 'settings', suggestedAnswer: 'Switched to Settings panel.' };
    }

    if (
      q.includes('read') || q.includes('reading') || q.includes('document') || q.includes('signboard') || q.includes('ocr') || q.includes('scanner') ||
      q.includes('रीडिंग') || q.includes('रीडींग') || q.includes('पढ़ें') || q.includes('पढो') || q.includes('पढ़ना') || q.includes('वाचा') || q.includes('वाचन') || q.includes('कागदपत्र') ||
      q.includes('રીડિંગ') || q.includes('વાંચવું') || q.includes('વાંચો') || q.includes('வாசிப்பு') || q.includes('படிக்க') ||
      q.includes('చదువు') || q.includes('ఓದು') || q.includes('വായിക്കുക') || q.includes('পড়ুন') || q.includes('ਪੜ੍ਹੋ')
    ) {
      return { action: 'switchMode', targetMode: 'read', suggestedAnswer: 'Switched to Read mode for document and text scanning.' };
    }

    if (
      q.includes('medicine') || q.includes('medication') || q.includes('pill') || q.includes('prescription') || q.includes('dose') ||
      q.includes('मेडिसिन') || q.includes('दवा') || q.includes('दवाइयां') || q.includes('दवाई') || q.includes('गोली') || q.includes('औषध') || q.includes('औषधे') || q.includes('गोळ्या') ||
      q.includes('મેડિસિન') || q.includes('દવા') || q.includes('દવાઓ') || q.includes('ગોળીઓ') || q.includes('மருந்து') || q.includes('மாத்திரை') ||
      q.includes('మందులు') || q.includes('మాత్రలు') || q.includes('ಔಷಧ') || q.includes('ಮಾತ್ರೆ') || q.includes('മരുന്ന്') || q.includes('ওষুধ') || q.includes('ਦਵਾਈ')
    ) {
      return { action: 'switchMode', targetMode: 'medicine', suggestedAnswer: 'Switched to Medicine mode for pill identification and dosage schedules.' };
    }

    if (
      q.includes('transport') || q.includes('transit') || q.includes('bus') || q.includes('shuttle') || q.includes('vehicle') ||
      q.includes('ट्रांसपोर्ट') || q.includes('ट्रान्सपोर्ट') || q.includes('बस') || q.includes('वाहन') || q.includes('गाड़ी') || q.includes('वाहतूक') || q.includes('वाहने') ||
      q.includes('ટ્રાન્સપોર્ટ') || q.includes('બસ') || q.includes('વાહન') || q.includes('போக்குவரத்து') || q.includes('பேருந்து') ||
      q.includes('రవాణా') || q.includes('బస్సు') || q.includes('ಸಾರಿಗೆ') || q.includes('ಬಸ್') || q.includes('ഗതാഗതം') || q.includes('ബസ്') || q.includes('পরিবহন') || q.includes('ਟਰਾਂਸਪੋਰਟ')
    ) {
      return { action: 'switchMode', targetMode: 'transport', suggestedAnswer: 'Switched to Transport mode for transit assistance.' };
    }

    if (
      q.includes('navigate') || q.includes('navigation') || q.includes('guide') || q.includes('path') || q.includes('walk') || q.includes('route') ||
      q.includes('नेविगेट') || q.includes('नेविगेशन') || q.includes('नेव्हिगेशन') || q.includes('नेव्हिगेट') || q.includes('मार्ग') || q.includes('रास्ता') || q.includes('रस्ता') || q.includes('दिशा') ||
      q.includes('નેવિગેશન') || q.includes('નેવિગેટ') || q.includes('રસ્તો') || q.includes('માર્ગ') || q.includes('வழி') || q.includes('பாதை') ||
      q.includes('నేవిగేషన్') || q.includes('మార్గం') || q.includes('దారి') || q.includes('ನೇವಿಗೇಷನ್') || q.includes('ದಾರಿ') || q.includes('നാവിഗേഷൻ') || q.includes('വഴി') || q.includes('নেভিগেশন')
    ) {
      return { action: 'switchMode', targetMode: 'navigate', suggestedAnswer: 'Switched to Navigation mode for live obstacle avoidance.' };
    }

    if (
      q.includes('family') || q.includes('caregiver') || q.includes('companion') || q.includes('family companion') ||
      q.includes('फैमिली') || q.includes('फॅमिली') || q.includes('परिवार') || q.includes('कुटुंब') || q.includes('आपले लोक') ||
      q.includes('ફેમિલી') || q.includes('પરિવાર') || q.includes('કુટુંબ') || q.includes('குடும்பம்') || q.includes('குழு') ||
      q.includes('కుటుంబం') || q.includes('ఫ్యామిలీ') || q.includes('ಕುಟುಂಬ') || q.includes('കുടുംബം') || q.includes('পরিবার') || q.includes('ਪਰਿਵਾਰ')
    ) {
      return { action: 'switchMode', targetMode: 'family', suggestedAnswer: 'Switched to Family companion mode.' };
    }

    if (
      q.includes('history') || q.includes('log') || q.includes('past') || q.includes('recent') || q.includes('activity') ||
      q.includes('हिस्ट्री') || q.includes('इतिहास') || q.includes('पुराना') || q.includes('लॉग') || q.includes('नोंदी') ||
      q.includes('હિસ્ટ્રી') || q.includes('ઇતિહાસ') || q.includes('வரலாறு') || q.includes('ஹிஸ்டரி') ||
      q.includes('చరిత్ర') || q.includes('హిస్టరీ') || q.includes('ಇತಿಹಾಸ') || q.includes('ചരിത്രം') || q.includes('ইতিহাস') || q.includes('ਇਤਿਹਾਸ')
    ) {
      return { action: 'switchMode', targetMode: 'history', suggestedAnswer: 'Switched to History log mode.' };
    }

    if (
      q.includes('change section') || q.includes('switch section') || q.includes('next section') || q.includes('open section') ||
      q.includes('change mode') || q.includes('switch mode') || q.includes('next mode') || q.includes('open mode') ||
      q.includes('section change') || q.includes('mode change') || q.includes('cycle section') ||
      q.includes('सेक्शन खोलो') || q.includes('विभाग खोलो') || q.includes('सेक्शन उघडा') || q.includes('विभाग उघडा') ||
      q.includes('सेक्शन बदल') || q.includes('विभाग बदल') || q.includes('अगला सेक्शन') || q.includes('पुढील सेक्शन') ||
      q.includes('पुढचा मोड') || q.includes('अगला मोड') || q.includes('सेक्शन चालू') || q.includes('विभाग चालू') ||
      q.includes('ઓપન સેક્શન') || q.includes('સેક્શન ખોલો') || q.includes('સેક્શન બદલો') || q.includes('વિભાગ ખોલો') ||
      q.includes('ओपन सेक्शन') || q.includes('सेक्शन ओपन')
    ) {
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
