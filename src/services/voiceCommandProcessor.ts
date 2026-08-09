import { NavMode, SupportedLanguageCode } from '../types';

export interface CommandParseResult {
  isCommand: boolean;
  action?: 
    | 'openProfileModal'
    | 'closeModal'
    | 'switchLanguage' 
    | 'switchMode' 
    | 'cycleNextMode' 
    | 'updateUserName' 
    | 'updateUserPhone'
    | 'addMedicine'
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
    keywords: ['hindi', 'हिंदी', 'हिन्दी', 'हिंदी में', 'हिन्दी में'],
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
    const q = raw.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');

    // 1. OPEN LANGUAGE SECTION ON NAVBAR MODE WHEEL
    if (
      q.includes('language section') || q.includes('open language section') || q.includes('languages section') ||
      q.includes('open languages') || q.includes('show languages') || q.includes('languages mode') || q.includes('भाषा विभाग')
    ) {
      return {
        isCommand: true,
        action: 'switchMode',
        targetMode: 'languages'
      };
    }

    // 2. OPEN USER PROFILE & MEDICAL ID MODAL
    if (
      q.includes('open profile') || q.includes('profile section') || q.includes('medical id') || q.includes('my profile')
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

    // 4. CLOSE MODAL / GO BACK
    if (q.startsWith('close') || q === 'back' || q.includes('go back') || q.includes('dismiss')) {
      return {
        isCommand: true,
        action: 'closeModal',
        feedbackPrompt: 'Closing screen.'
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

    // 5. EDIT USER NAME
    if (q.includes('my name is') || q.includes('change name to') || q.includes('set name to') || q.includes('update name to') || q.includes('मेरा नाम')) {
      const extracted = raw.replace(/.*(?:my name is|change name to|set name to|update name to|मेरा नाम)\s*/gi, '').trim();
      const cleanName = extracted.replace(/[.,]/g, '').trim();
      if (cleanName) {
        return {
          isCommand: true,
          action: 'updateUserName',
          valueString: cleanName.charAt(0).toUpperCase() + cleanName.slice(1)
        };
      }
    }

    // 6. EDIT USER PHONE
    if (q.includes('phone number') || q.includes('my phone is') || q.includes('change phone') || q.includes('update phone')) {
      const extracted = raw.replace(/.*(?:phone number is|my phone is|change phone to|update phone to|phone)\s*/gi, '').trim();
      if (extracted) {
        return {
          isCommand: true,
          action: 'updateUserPhone',
          valueString: extracted
        };
      }
    }

    // 7. ADD MEDICATION VIA VOICE
    if (q.includes('add medicine') || q.includes('add medication') || q.includes('new medicine') || q.includes('दवा जोड़ो') || q.includes('औषध जोडा')) {
      const medName = raw.replace(/.*(?:add medicine|add medication|new medicine|दवा जोड़ो|औषध जोडा)\s*/gi, '').trim();
      return {
        isCommand: true,
        action: 'addMedicine',
        valueString: medName || 'Daily Medication'
      };
    }

    // 8. CONFIRM MEDICATION TAKEN
    if (q.includes('took my medicine') || q.includes('take medicine') || q.includes('confirm pill') || q.includes('medicine taken') || q.includes('दवा ले ली')) {
      return {
        isCommand: true,
        action: 'confirmMedicine'
      };
    }

    // 9. UPDATE SETTINGS
    if (q.includes('dark mode') || q.includes('dark theme') || q.includes('black theme')) {
      return { isCommand: true, action: 'updateTheme', targetTheme: 'dark' };
    }
    if (q.includes('light mode') || q.includes('light theme') || q.includes('white theme')) {
      return { isCommand: true, action: 'updateTheme', targetTheme: 'light' };
    }
    if (q.includes('high contrast') || q.includes('contrast mode')) {
      return { isCommand: true, action: 'updateTheme', targetTheme: 'high-contrast' };
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

    // 10. DYNAMIC SECTION / MODE SWITCH COMMANDS
    if (q.includes('read') || q.includes('reading') || q.includes('document') || q.includes('signboard') || q.includes('पढ़ें') || q.includes('वाचा') || q.includes('वाचन')) {
      return { isCommand: true, action: 'switchMode', targetMode: 'read' };
    }
    if (q.includes('medicine') || q.includes('pill') || q.includes('prescription') || q.includes('दवा') || q.includes('औषध') || q.includes('औषधे')) {
      return { isCommand: true, action: 'switchMode', targetMode: 'medicine' };
    }
    if (q.includes('transport') || q.includes('bus') || q.includes('transit') || q.includes('बस') || q.includes('वाहने')) {
      return { isCommand: true, action: 'switchMode', targetMode: 'transport' };
    }
    if (q.includes('navigate') || q.includes('navigation') || q.includes('guide') || q.includes('path') || q.includes('walk') || q.includes('मार्ग') || q.includes('रस्ता') || q.includes('नेविगेट')) {
      return { isCommand: true, action: 'switchMode', targetMode: 'navigate' };
    }
    if (q.includes('family') || q.includes('stream') || q.includes('caregiver') || q.includes('परिवार') || q.includes('कुटुंब')) {
      return { isCommand: true, action: 'switchMode', targetMode: 'family' };
    }
    if (q.includes('history') || q.includes('log') || q.includes('past') || q.includes('इतिहास')) {
      return { isCommand: true, action: 'switchMode', targetMode: 'history' };
    }
    if (q.includes('settings') || q.includes('setting')) {
      return { isCommand: true, action: 'switchMode', targetMode: 'settings' };
    }
    if (q.includes('accessibility')) {
      return { isCommand: true, action: 'switchMode', targetMode: 'accessibility' };
    }
    if (q.includes('assist') || q.includes('home') || q.includes('main')) {
      return { isCommand: true, action: 'switchMode', targetMode: 'assist' };
    }

    // 11. GENERAL "CHANGE SECTION" / "SWITCH MODE" / "NEXT SECTION" COMMANDS
    if (
      q.includes('change section') || q.includes('switch section') || q.includes('next section') ||
      q.includes('change mode') || q.includes('switch mode') || q.includes('next mode') ||
      q.includes('section change') || q.includes('mode change') || q.includes('विभाग बदला') || q.includes('सेक्शन बदल')
    ) {
      return { isCommand: true, action: 'cycleNextMode' };
    }

    // 12. EXPLICIT EMERGENCY SOS COMMANDS
    if (
      q.includes('trigger sos') || q.includes('emergency sos') || q.includes('send sos') ||
      q.includes('sos alert') || q.includes('call sos') || q.includes('emergency help') ||
      q.includes('आपातकालीन मदद') || q.includes('एसओएस')
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
