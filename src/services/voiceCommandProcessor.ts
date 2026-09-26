import { NavMode, SupportedLanguageCode, ThemeMode, FontScale } from '../types';

export interface CommandParseResult {
  isCommand: boolean;
  action?: 
    | 'openProfileModal'
    | 'openSosModal'
    | 'openFamilyCompanion'
    | 'closeModal'
    | 'switchLanguage' 
    | 'switchMode' 
    | 'cycleNextMode'
    | 'logoutUser'
    | 'updateUserName' 
    | 'updateUserPhone'
    | 'addMedicine'
    | 'deleteMedicine'
    | 'confirmMedicine'
    | 'updateTheme'
    | 'updateSpeechRate'
    | 'updateFontScale'
    | 'toggleTorch' 
    | 'toggleCameraFacing' 
    | 'triggerSosAlert' 
    | 'toggleSpatialAudio' 
    | 'voiceSearch';
  targetLanguage?: SupportedLanguageCode;
  targetLanguageName?: string;
  targetMode?: NavMode;
  valueString?: string;
  targetTheme?: ThemeMode;
  targetFontScale?: FontScale;
  rateValue?: number;
  searchQuery?: string;
  feedbackPrompt?: string;
}

const LANGUAGE_KEYWORD_MAP: Array<{
  code: SupportedLanguageCode;
  name: string;
  keywords: string[];
  confirmationMsg: string;
}> = [
  {
    code: 'mr',
    name: 'Marathi',
    keywords: ['marathi', 'मराठी', 'मराठीत', 'मराठी मध्ये', 'marati', 'marath'],
    confirmationMsg: 'Language changed to Marathi. भाषा मराठी मध्ये बदलली आहे.'
  },
  {
    code: 'hi',
    name: 'Hindi',
    keywords: ['hindi', 'हिंदी', 'हिन्दी', 'हिंदी में'],
    confirmationMsg: 'Language changed to Hindi. भाषा हिंदी में बदल दी गई है।'
  },
  {
    code: 'en',
    name: 'English',
    keywords: ['english', 'अंग्रेजी', 'इंग्रजी', 'इंग्लिश', 'in english'],
    confirmationMsg: 'Language changed to English.'
  },
  {
    code: 'gu',
    name: 'Gujarati',
    keywords: ['gujarati', 'ગુજરાતી', 'ગુજરાતીમાં'],
    confirmationMsg: 'Language changed to Gujarati. ભાષા ગુજરાતીમાં બદલાઈ ગઈ છે.'
  },
  {
    code: 'pa',
    name: 'Punjabi',
    keywords: ['punjabi', 'ਪੰਜਾਬੀ', 'ਪੰਜਾਬੀ ਵਿੱਚ'],
    confirmationMsg: 'Language changed to Punjabi. ਭਾਸ਼ਾ ਪੰਜਾਬੀ ਵਿੱਚ ਬਦਲ ਗਈ ਹੈ।'
  },
  {
    code: 'bn',
    name: 'Bengali',
    keywords: ['bengali', 'বাংলা', 'বাংলায়'],
    confirmationMsg: 'Language changed to Bengali. ভাষা বাংলায় পরিবর্তিত হয়েছে।'
  },
  {
    code: 'ta',
    name: 'Tamil',
    keywords: ['tamil', 'தமிழ்', 'தமிழில்'],
    confirmationMsg: 'Language changed to Tamil. மொழி தமிழுக்கு மாற்றப்பட்டது.'
  },
  {
    code: 'te',
    name: 'Telugu',
    keywords: ['telugu', 'తెలుగు', 'తెలుగులో'],
    confirmationMsg: 'Language changed to Telugu. భాష తెలుగులోకి మార్చబడింది.'
  },
  {
    code: 'kn',
    name: 'Kannada',
    keywords: ['kannada', 'ಕನ್ನಡ', 'ಕನ್ನಡದಲ್ಲಿ'],
    confirmationMsg: 'Language changed to Kannada. ಭಾಷೆಯನ್ನು ಕನ್ನಡಕ್ಕೆ ಬದಲಾಯಿಸಲಾಗಿದೆ.'
  },
  {
    code: 'ml',
    name: 'Malayalam',
    keywords: ['malayalam', 'മലയാളം', 'മലയാളത്തിൽ'],
    confirmationMsg: 'Language changed to Malayalam. ഭാഷ മലയാളത്തിലേക്ക് മാറ്റി.'
  }
];

export class VoiceCommandProcessor {
  parseCommand(query: string): CommandParseResult {
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

    // 1. CLOSE MODAL / GO BACK / DISMISS
    if (
      q.startsWith('close') || q === 'back' || q.includes('go back') || q.includes('dismiss') ||
      q.includes('बंद') || q.includes('मागे') || q.includes('पाछा') || q.includes('बाहर') ||
      q.includes('બંધ') || q.includes('மூடு') || q.includes('మూసివేయి') || q.includes('ಮುಚ್ಚಿ')
    ) {
      return {
        isCommand: true,
        action: 'closeModal',
        feedbackPrompt: 'Closing screen.'
      };
    }

    // 2. OPEN USER PROFILE & MEDICAL ID MODAL
    if (
      q.includes('profile') || q.includes('प्रोफाइल') || q.includes('प्रोफाईल') || q.includes('प्रोफ़ाइल') ||
      q.includes('मेरी प्रोफाइल') || q.includes('माझी प्रोफाइल') || q.includes('माझी माहिती') || q.includes('माझे प्रोफाइल') ||
      q.includes('પ્રોફાઇલ') || q.includes('சுயவிவரம்') || q.includes('ప్రొఫైల్') || q.includes('ಪ್ರೊಫೈಲ್') ||
      q.includes('പ്രൊഫൈൽ') || q.includes('প্রোফাইল') || q.includes('ਪ੍ਰੋਫਾਈਲ') || q.includes('my account') || q.includes('user account') ||
      q.includes('edit profile') || q.includes('open profile') || q.includes('update profile')
    ) {
      return {
        isCommand: true,
        action: 'openProfileModal',
        feedbackPrompt: 'Opening User Profile and Medical ID.'
      };
    }

    // 3. LOGOUT & RESET SETUP COMMAND
    if (q.includes('logout') || q.includes('log out') || q.includes('reset profile') || q.includes('restart setup') || q.includes('start setup again')) {
      return {
        isCommand: true,
        action: 'logoutUser',
        feedbackPrompt: 'Logged out. Starting voice profile setup again.'
      };
    }

    // 4. DYNAMIC LANGUAGE SWITCH COMMANDS
    for (const langConfig of LANGUAGE_KEYWORD_MAP) {
      const matchesLang = langConfig.keywords.some((kw) => q.includes(kw));
      if (matchesLang) {
        return {
          isCommand: true,
          action: 'switchLanguage',
          targetLanguage: langConfig.code,
          targetLanguageName: langConfig.name,
          feedbackPrompt: langConfig.confirmationMsg
        };
      }
    }

    // 5. EDIT USER NAME DYNAMICALLY
    if (
      q.includes('name is') || q.includes('change name') || q.includes('set name') || q.includes('update name') || q.includes('call me') ||
      q.includes('मेरा नाम') || q.includes('नाम रखो') || q.includes('नाम बदलो') ||
      q.includes('माझं नाव') || q.includes('माझे नाव') || q.includes('नाव ठेवा') || q.includes('नाव बदला') || q.includes('नाव सेट')
    ) {
      const extracted = raw
        .replace(/.*(?:my name is|change name to|change name|set name to|set name|update name to|update name|call me|मेरा नाम|नाम रखो|नाम बदलो|माझं नाव|माझे नाव|नाव ठेवा|नाव बदला|नाव सेट करा)\s*/gi, '')
        .replace(/(?:ठेवा|बदला|करा|आहे|होय)$/gi, '')
        .trim();
      const cleanName = extracted.replace(/[.,]/g, '').trim();
      if (cleanName) {
        return {
          isCommand: true,
          action: 'updateUserName',
          valueString: cleanName.charAt(0).toUpperCase() + cleanName.slice(1)
        };
      }
    }

    // 6. EDIT USER PHONE DYNAMICALLY
    if (
      q.includes('phone number') || q.includes('my phone is') || q.includes('change phone') || q.includes('update phone') ||
      q.includes('मेरा फोन') || q.includes('नंबर बदलो') || q.includes('माझा फोन') || q.includes('नंबर बदला')
    ) {
      const extracted = raw
        .replace(/.*(?:phone number is|my phone is|change phone to|update phone to|phone|मेरा फोन|नंबर बदलो|माझा फोन|नंबर बदला)\s*/gi, '')
        .replace(/(?:ठेवा|बदला|करा|आहे)$/gi, '')
        .trim();
      if (extracted) {
        return {
          isCommand: true,
          action: 'updateUserPhone',
          valueString: extracted
        };
      }
    }

    // 7. ADD MEDICATION DYNAMICALLY
    const isAddMedPhrase =
      q.includes('add medicine') || q.includes('add medication') || q.includes('new medicine') || q.includes('add pill') ||
      q.includes('दवा जोड़ो') || q.includes('नई दवा') || q.includes('गोली जोड़ो') ||
      q.includes('औषध जोडा') || q.includes('नवीन औषध') || q.includes('गोळी जोडा') || q.includes('औषध ऍड') ||
      (q.startsWith('add ') && (q.includes('mg') || q.includes('tablet') || q.includes('pill') || q.includes('capsule') || q.includes('syrup') || q.includes('paracetamol') || q.includes('crocin') || q.includes('aspirin') || q.includes('ibuprofen') || q.includes('disprin') || q.length > 4));

    if (isAddMedPhrase) {
      let medName = raw
        .replace(/.*(?:add medicine|add medication|new medicine|add pill|add|दवा जोड़ो|नई दवा|गोली जोड़ो|औषध जोडा|नवीन औषध|गोळी जोडा|औषध ऍड करा)\s*/gi, '')
        .replace(/(?:औषध जोडा|दवा जोड़ो|ऍड करा|जोडा)$/gi, '')
        .trim();
      if (!medName || medName.length < 2) {
        medName = raw.replace(/(?:औषध जोडा|दवा जोड़ो|add medicine|add medication|new medicine|add)\s*/gi, '').trim();
      }
      return {
        isCommand: true,
        action: 'addMedicine',
        valueString: medName || 'Daily Medication'
      };
    }

    // 8. DELETE MEDICATION
    const isDeleteMedPhrase =
      q.includes('delete medicine') || q.includes('remove medicine') || q.includes('delete medication') || q.includes('remove medication') || q.includes('delete pill') || q.includes('remove pill') ||
      q.includes('दवा हटाओ') || q.includes('दवा मिटाओ') || q.includes('गोली हटाओ') ||
      q.includes('औषध काढा') || q.includes('औषध हटवा') || q.includes('गोळी काढा');

    if (isDeleteMedPhrase) {
      let medName = raw
        .replace(/.*(?:delete medicine|remove medicine|delete medication|remove medication|delete pill|remove pill|दवा हटाओ|दवा मिटाओ|गोली हटाओ|औषध काढा|औषध हटवा|गोळी काढा)\s*/gi, '')
        .trim();
      return {
        isCommand: true,
        action: 'deleteMedicine',
        valueString: medName
      };
    }

    // 9. CONFIRM MEDICATION TAKEN
    if (q.includes('took my medicine') || q.includes('take medicine') || q.includes('confirm pill') || q.includes('medicine taken') || q.includes('दवा ले ली')) {
      return {
        isCommand: true,
        action: 'confirmMedicine'
      };
    }

    // 9. DYNAMIC THEME & VOICE SETTINGS
    if (q.includes('dark mode') || q.includes('dark theme') || q.includes('black theme')) {
      return { isCommand: true, action: 'updateTheme', targetTheme: 'highContrastDark' };
    }
    if (q.includes('light mode') || q.includes('light theme') || q.includes('white theme')) {
      return { isCommand: true, action: 'updateTheme', targetTheme: 'standard' };
    }
    if (q.includes('high contrast') || q.includes('contrast mode')) {
      return { isCommand: true, action: 'updateTheme', targetTheme: 'highContrastAmber' };
    }
    if (q.includes('speak faster') || q.includes('faster voice') || q.includes('increase speed')) {
      return { isCommand: true, action: 'updateSpeechRate', rateValue: 1.35 };
    }
    if (q.includes('speak slower') || q.includes('slower voice') || q.includes('decrease speed')) {
      return { isCommand: true, action: 'updateSpeechRate', rateValue: 0.85 };
    }
    if (q.includes('large font') || q.includes('bigger text') || q.includes('large text')) {
      return { isCommand: true, action: 'updateFontScale', targetFontScale: 'large' };
    }
    if (q.includes('normal font') || q.includes('normal text') || q.includes('regular font')) {
      return { isCommand: true, action: 'updateFontScale', targetFontScale: 'normal' };
    }

    // 10. DYNAMIC SECTION / MODE OPEN COMMANDS (Multilingual support for English, Hindi, Marathi, Gujarati, Punjabi, Bengali, Tamil, Telugu, Kannada, Malayalam & Hinglish/Marathlish)
    if (
      q.includes('location') || q.includes('where am i') || q.includes('my location') || q.includes('gps') || q.includes('map') ||
      q.includes('लोकेशन') || q.includes('लोकेसन') || q.includes('स्थान') || q.includes('जगह') || q.includes('ठिकाण') ||
      q.includes('સ્થળ') || q.includes('સ્થાન') || q.includes('இடம்') || q.includes('இருப்பிடம்') || q.includes('స్థానం') ||
      q.includes('లొకేషన్') || q.includes('ಸ್ಥಳ') || q.includes('ಲೋಕೇಶನ್') || q.includes('സ്ഥലം') || q.includes('ലൊക്കേഷൻ') ||
      q.includes('লোকেশন') || q.includes('ਲੋਕੇਸ਼ਨ')
    ) {
      return { isCommand: true, action: 'switchMode', targetMode: 'location' };
    }

    if (
      q.includes('emergency') || q.includes('sos contacts') || q.includes('contacts') || q.includes('urgent') ||
      q.includes('इमरजेंसी') || q.includes('इमर्जन्सी') || q.includes('आपातकालीन') || q.includes('आपत्कालीन') || q.includes('संपर्क') ||
      q.includes('ઇમરજન્સી') || q.includes('આપાતકાલીન') || q.includes('அவசரம்') || q.includes('தொடர்புகள்') || q.includes('అత్యవసర') ||
      q.includes('సంప్రదింపులు') || q.includes('ತುರ್ತು') || q.includes('അടിയന്തിരം') || q.includes('জরুরী') || q.includes('ਐਮਰਜੈਂਸੀ')
    ) {
      return { isCommand: true, action: 'switchMode', targetMode: 'emergency' };
    }

    if (
      q.includes('medical') || q.includes('health') || q.includes('medical record') || q.includes('health info') || q.includes('medical id') ||
      q.includes('मेडिकल') || q.includes('स्वास्थ्य') || q.includes('वैद्यकीय') || q.includes('आरोग्य') || q.includes('सेहत') || q.includes('चिकित्सा') ||
      q.includes('મેડિકલ') || q.includes('સ્વાસ્થ્ય') || q.includes('மருத்துவ') || q.includes('ஆரோக்கியம்') || q.includes('మెడికల్') ||
      q.includes('ఆరోగ్యం') || q.includes('ವೈದ್ಯಕೀಯ') || q.includes('ಆರೋಗ್ಯ') || q.includes('മെഡിക്കൽ') || q.includes('মেডিকেল')
    ) {
      return { isCommand: true, action: 'switchMode', targetMode: 'medical' };
    }

    if (
      q.includes('language') || q.includes('languages') || q.includes('speech language') ||
      q.includes('लैंग्वेज') || q.includes('लँग्वेज') || q.includes('भाषा') || q.includes('भाषाएं') ||
      q.includes('ભાષા') || q.includes('લેંગ્વેજ') || q.includes('மொழி') || q.includes('லாங்குவேஜ்') ||
      q.includes('భాష') || q.includes('లాంగ్వేజ్') || q.includes('ಭಾಷೆ') || q.includes('ಲ್ಯಾಂಗ್ವೇಜ್') ||
      q.includes('ഭാഷ') || q.includes('ലാംഗ്വേജ്') || q.includes('বাংলা ভাষা') || q.includes('ਭਾਸ਼ਾ')
    ) {
      return { isCommand: true, action: 'switchMode', targetMode: 'languages' };
    }

    if (
      q.includes('setting') || q.includes('settings') || q.includes('accessibility') || q.includes('preferences') || q.includes('options') ||
      q.includes('सेटिंग') || q.includes('सेटिंग्स') || q.includes('सेटिंग्झ') ||
      q.includes('સેટિંગ્સ') || q.includes('સેટિંગ') || q.includes('அமைப்புகள்') || q.includes('செட்டிங்ஸ்') ||
      q.includes('సెట్టింగ్‌లు') || q.includes('సెట్టింగ్స్') || q.includes('ಸೆಟ್ಟಿಂಗ್‌ಗಳು') || q.includes('ಸೆಟ್ಟಿಂಗ್ಸ್') ||
      q.includes('സെറ്റിംഗ്സ്') || q.includes('সেটিংস') || q.includes('ਸੈਟਿੰਗਾਂ')
    ) {
      return { isCommand: true, action: 'switchMode', targetMode: 'settings' };
    }

    if (
      q.includes('read') || q.includes('reading') || q.includes('document') || q.includes('signboard') || q.includes('ocr') || q.includes('scanner') ||
      q.includes('रीडिंग') || q.includes('रीडींग') || q.includes('पढ़ें') || q.includes('पढो') || q.includes('पढ़ना') || q.includes('वाचा') || q.includes('वाचन') || q.includes('कागदपत्र') ||
      q.includes('રીડિંગ') || q.includes('વાંચવું') || q.includes('વાંચો') || q.includes('வாசிப்பு') || q.includes('படிக்க') ||
      q.includes('చదువు') || q.includes('ఓದು') || q.includes('വായിക്കുക') || q.includes('পড়ুন') || q.includes('ਪੜ੍ਹੋ')
    ) {
      return { isCommand: true, action: 'switchMode', targetMode: 'read' };
    }

    if (
      q.includes('medicine') || q.includes('medication') || q.includes('pill') || q.includes('prescription') || q.includes('dose') ||
      q.includes('मेडिसिन') || q.includes('दवा') || q.includes('दवाइयां') || q.includes('दवाई') || q.includes('गोली') || q.includes('औषध') || q.includes('औषधे') || q.includes('गोळ्या') ||
      q.includes('મેડિસિન') || q.includes('દવા') || q.includes('દવાઓ') || q.includes('ગોળીઓ') || q.includes('மருந்து') || q.includes('மாத்திரை') ||
      q.includes('మందులు') || q.includes('మాత్రలు') || q.includes('ಔಷಧ') || q.includes('ಮಾತ್ರೆ') || q.includes('മരുന്ന്') || q.includes('ওষুধ') || q.includes('ਦਵਾਈ')
    ) {
      return { isCommand: true, action: 'switchMode', targetMode: 'medicine' };
    }

    if (
      q.includes('transport') || q.includes('transit') || q.includes('bus') || q.includes('shuttle') || q.includes('vehicle') ||
      q.includes('ट्रांसपोर्ट') || q.includes('ट्रान्सपोर्ट') || q.includes('बस') || q.includes('वाहन') || q.includes('गाड़ी') || q.includes('वाहतूक') || q.includes('वाहने') ||
      q.includes('ટ્રાન્સપોર્ટ') || q.includes('બસ') || q.includes('વાહન') || q.includes('போக்குவரத்து') || q.includes('பேருந்து') ||
      q.includes('రవాణా') || q.includes('బస్సు') || q.includes('ಸಾರಿಗೆ') || q.includes('ಬಸ್') || q.includes('ഗതാഗതം') || q.includes('ബസ്') || q.includes('পরিবহন') || q.includes('ਟਰਾਂਸਪੋਰਟ')
    ) {
      return { isCommand: true, action: 'switchMode', targetMode: 'transport' };
    }

    if (
      q.includes('navigate') || q.includes('navigation') || q.includes('guide') || q.includes('path') || q.includes('walk') || q.includes('route') ||
      q.includes('नेविगेट') || q.includes('नेविगेशन') || q.includes('नेव्हिगेशन') || q.includes('नेव्हिगेट') || q.includes('मार्ग') || q.includes('रास्ता') || q.includes('रस्ता') || q.includes('दिशा') ||
      q.includes('નેવિગેશન') || q.includes('નેવિગેટ') || q.includes('રસ્તો') || q.includes('માર્ગ') || q.includes('வழி') || q.includes('பாதை') ||
      q.includes('నేవిగేషన్') || q.includes('మార్గం') || q.includes('దారి') || q.includes('ನೇವಿಗೇಷನ್') || q.includes('ದಾರಿ') || q.includes('നാവിഗേഷൻ') || q.includes('വഴി') || q.includes('নেভিগেশন')
    ) {
      return { isCommand: true, action: 'switchMode', targetMode: 'navigate' };
    }

    if (
      q.includes('family') || q.includes('caregiver') || q.includes('companion') || q.includes('family companion') ||
      q.includes('फैमिली') || q.includes('फॅमिली') || q.includes('परिवार') || q.includes('कुटुंब') || q.includes('आपले लोक') ||
      q.includes('ફેમિલી') || q.includes('પરિવાર') || q.includes('કુટુંબ') || q.includes('குடும்பம்') || q.includes('குழு') ||
      q.includes('కుటుంబం') || q.includes('ఫ్యామిలీ') || q.includes('ಕುಟುಂಬ') || q.includes('കുടുംബം') || q.includes('পরিবার') || q.includes('ਪਰਿਵਾਰ')
    ) {
      return { isCommand: true, action: 'switchMode', targetMode: 'family' };
    }

    if (
      q.includes('history') || q.includes('log') || q.includes('past') || q.includes('recent') || q.includes('activity') ||
      q.includes('हिस्ट्री') || q.includes('इतिहास') || q.includes('पुराना') || q.includes('लॉग') || q.includes('नोंदी') ||
      q.includes('હિસ્ટ્રી') || q.includes('ઇતિહાસ') || q.includes('வரலாறு') || q.includes('ஹிஸ்டரி') ||
      q.includes('చరిత్ర') || q.includes('హిస్టరీ') || q.includes('ಇತಿಹಾಸ') || q.includes('ചരിത്രം') || q.includes('ইতিহাস') || q.includes('ਇਤਿਹਾਸ')
    ) {
      return { isCommand: true, action: 'switchMode', targetMode: 'history' };
    }

    if (
      q === 'home' || q === 'main' || q.includes('home screen') || q.includes('main screen') || q.includes('assist mode') ||
      q === 'होम' || q === 'मुख्य' || q.includes('होम स्क्रीन') || q.includes('मुख्य स्क्रीन') || q.includes('असिस्टेंट') || q.includes('सहायता') || q.includes('मदत') ||
      q === 'હોમ' || q === 'મુખ્ય' || q.includes('முகப்பு') || q.includes('హోమ్') || q.includes('ಹೋಮ್') || q.includes('ഹോം')
    ) {
      return { isCommand: true, action: 'switchMode', targetMode: 'assist' };
    }

    // 11. GENERAL CYCLE SECTION / MODE COMMANDS
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
      return { isCommand: true, action: 'cycleNextMode' };
    }

    // 12. EXPLICIT EMERGENCY SOS COMMANDS
    if (
      q.includes('trigger sos') || q.includes('emergency sos') || q.includes('send sos') ||
      q.includes('sos alert') || q.includes('call sos') || q.includes('emergency help') ||
      q.includes('help me') || q.includes('i need help') || q.includes('call 911') || 
      q.includes('call police') || q.includes('call ambulance') || q.includes('save me') ||
      q.includes('आपातकालीन मदद') || q.includes('एसओएस') || q.includes('बचाओ') || 
      q.includes('मुझे मदद चाहिए') || q.includes('मदत करा') || q.includes('वाचवा')
    ) {
      return { isCommand: true, action: 'triggerSosAlert' };
    }

    // 13. FLASHLIGHT COMMANDS
    if (
      q.includes('torch') || q.includes('flashlight') || q.includes('light on') || q.includes('light off') ||
      q.includes('टॉर्च') || q.includes('लाइट')
    ) {
      return { isCommand: true, action: 'toggleTorch' };
    }

    // 14. CAMERA SWITCH COMMANDS
    if (
      q.includes('switch camera') || q.includes('flip camera') || q.includes('front camera') ||
      q.includes('back camera') || q.includes('कैमरा')
    ) {
      return { isCommand: true, action: 'toggleCameraFacing' };
    }

    // 15. SPATIAL AUDIO COMMANDS
    if (
      q.includes('spatial audio') || q.includes('3d audio') || q.includes('toggle audio')
    ) {
      return { isCommand: true, action: 'toggleSpatialAudio' };
    }

    // 16. VOICE SEARCH QUERY
    if (q.startsWith('search') || q.startsWith('find') || q.includes('खोजो') || q.includes('शोधा')) {
      const cleanSearch = raw.replace(/^search for |^find |^खोजो |^शोधा /gi, '').trim();
      return { isCommand: true, action: 'voiceSearch', searchQuery: cleanSearch || 'pharmacy' };
    }

    return { isCommand: false };
  }
}

export const voiceCommandProcessor = new VoiceCommandProcessor();
