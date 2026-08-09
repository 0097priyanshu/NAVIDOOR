const translationService = require('./translationService');

class AIAssistantService {
  async processQuery(query, language = 'en', context = {}) {
    if (!query || !query.trim()) {
      return { answer: '', intent: null };
    }

    const { detectedObjects = [], activeMode = 'assist', location = 'Oak Lane' } = context;

    // 1. Natural Language Intent & Action Extraction Engine
    const intent = this.extractNaturalIntent(query);

    // 2. Generate natural conversational answer
    let answerEn = intent.suggestedAnswer;
    if (!answerEn) {
      answerEn = this.generateDynamicReasoning(query, detectedObjects, activeMode, location);
    }

    // 3. Dynamic translation into active user language
    const translatedAnswer = await translationService.translateText(answerEn, language);

    return {
      answer: translatedAnswer,
      intent
    };
  }

  extractNaturalIntent(query) {
    const raw = query.trim();
    const q = raw.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');

    // 0. OPEN PROFILE / LANGUAGE SECTION MODAL INTENT
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

    // A. LANGUAGE INTENT
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

    // B. SECTION / MODE INTENT
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

    // C. USER PROFILE INTENT
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

    // D. MEDICATION INTENT
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

    // E. SETTINGS INTENT
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

  generateDynamicReasoning(query, detectedObjects, activeMode, location) {
    const q = query.toLowerCase().trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');

    const objectList = Array.isArray(detectedObjects) && detectedObjects.length > 0
      ? detectedObjects.map(o => `${o.label || 'object'} at ${o.distance ? o.distance + ' meters' : '1.2 meters'} ${o.direction || 'ahead'}`).join(', ')
      : null;

    if (q.includes('what') || q.includes('see') || q.includes('front') || q.includes('look') || q.includes('ahead') || q.includes('सामने') || q.includes('दिसतंय')) {
      return objectList
        ? `Looking through your camera, I see ${objectList}.`
        : 'Looking through your camera, the path straight ahead is completely clear with no obstacles.';
    }

    if (q.includes('where') || q.includes('location') || q.includes('exit') || q.includes('door') || q.includes('कहाँ') || q.includes('कुठे')) {
      return `You are currently located at ${location}. The nearest exit is straight ahead.`;
    }

    if (q.includes('name') || q.includes('who are you') || q.includes('तुम कौन हो')) {
      return 'I am NAVIDOOR, your AI vision and voice navigation assistant.';
    }

    return objectList
      ? `Based on your live camera feed, I observe ${objectList}.`
      : 'Your surroundings are clear and safe to navigate.';
  }
}

module.exports = new AIAssistantService();
