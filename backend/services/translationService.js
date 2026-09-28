const https = require('https');
const http = require('http');

// Dynamic real-time translation service for 10 languages
class DynamicTranslationService {
  constructor() {
    this.cache = new Map();
  }

  async translateText(text, targetLang = 'en') {
    if (!text || !text.trim()) return text;

    const trimmed = text.trim();

    // If requesting English target and text has non-English script, translate to English
    if (targetLang === 'en') {
      const isIndicScript = /[\u0900-\u0DFF\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F]/.test(trimmed);
      if (isIndicScript) {
        try {
          const translatedEn = await this.queryTranslationApi(trimmed, 'en');
          if (translatedEn && translatedEn !== trimmed) return translatedEn;
        } catch (err) {}
      }
      return trimmed;
    }

    // If string has NO English letters and is already purely in native script of target language, return as-is
    const hasEnglishWords = /[a-zA-Z]/.test(trimmed);
    
    // For Marathi (mr) and Devanagari (hi, mr): check if purely native without English
    if (!hasEnglishWords && targetLang === 'mr' && /^[\u0900-\u097F\s.,!?'"()-]+$/.test(trimmed)) {
      return trimmed;
    }

    const cacheKey = `${targetLang}:${trimmed}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      // Real-time dynamic translation query via free Google Translate endpoint
      let translated = await this.queryTranslationApi(trimmed, targetLang);
      if (translated && translated !== trimmed) {
        translated = this.preprocessTerms(translated, targetLang);
        this.cache.set(cacheKey, translated);
        return translated;
      }
    } catch (err) {
      console.warn(`[TranslationService] Dynamic query error for ${targetLang}:`, err.message);
    }

    // High-accuracy fallback dictionary for common spatial & navigation terms
    return this.preprocessTerms(this.fallbackTranslate(trimmed, targetLang), targetLang);
  }

  preprocessTerms(text, targetLang) {
    if (!text) return '';
    let res = text;
    if (targetLang === 'mr') {
      res = res
        .replace(/\bnavigations?\b/gi, 'नेव्हिगेशन')
        .replace(/\bsections?\b/gi, 'विभाग')
        .replace(/\bprofiles?\b/gi, 'प्रोफाइल')
        .replace(/\blocations?\b/gi, 'स्थान')
        .replace(/\bmodes?\b/gi, 'मोड')
        .replace(/\bsettings?\b/gi, 'सेटिंग्ज')
        .replace(/\bemergenc(y|ies)\b/gi, 'आपत्कालीन')
        .replace(/\bmedicals?\b/gi, 'वैद्यकीय')
        .replace(/\blanguages?\b/gi, 'भाषा')
        .replace(/\bassistants?\b/gi, 'असिस्टंट')
        .replace(/\bapps?\b/gi, 'ॲप')
        .replace(/\busers?\b/gi, 'वापरकर्ता')
        .replace(/\bcontacts?\b/gi, 'संपर्क')
        .replace(/\bspeech\b/gi, 'आवाज')
        .replace(/\bvoice\b/gi, 'आवाज')
        .replace(/\bsteps?\b/gi, 'पायरी')
        .replace(/\bcameras?\b/gi, 'कॅमेरा')
        .replace(/\bflashlights?\b/gi, 'टॉर्च')
        .replace(/\bvisions?\b/gi, 'व्हिजन')
        .replace(/\breading\b/gi, 'वाचन')
        .replace(/\bmedicines?\b/gi, 'औषध')
        .replace(/\btransports?\b/gi, 'वाहतूक')
        .replace(/\bhistory\b/gi, 'इतिहास')
        .replace(/\bfamily\b/gi, 'कुटुंब');
    } else if (targetLang === 'hi') {
      res = res
        .replace(/\bnavigations?\b/gi, 'नेविगेशन')
        .replace(/\bsections?\b/gi, 'सेक्शन')
        .replace(/\bprofiles?\b/gi, 'प्रोफाइल')
        .replace(/\blocations?\b/gi, 'स्थान')
        .replace(/\bmodes?\b/gi, 'मोड')
        .replace(/\bsettings?\b/gi, 'सेटिंग्स')
        .replace(/\bemergenc(y|ies)\b/gi, 'आपातकालीन')
        .replace(/\bmedicals?\b/gi, 'चिकित्सा')
        .replace(/\blanguages?\b/gi, 'भाषा')
        .replace(/\bassistants?\b/gi, 'सहायक')
        .replace(/\bapps?\b/gi, 'ऐप');
    }
    return res;
  }

  queryTranslationApi(text, targetLang) {
    return new Promise((resolve) => {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
      
      https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed && parsed[0]) {
              const resultText = parsed[0].map((item) => item[0]).join('');
              return resolve(resultText);
            }
            resolve(text);
          } catch (e) {
            resolve(text);
          }
        });
      }).on('error', () => {
        resolve(text);
      });
    });
  }

  fallbackTranslate(text, targetLang) {
    // Dynamic replacement dictionary for key vision & navigation terms
    const replacements = {
      hi: {
        'Clear path straight ahead': 'आगे का रास्ता साफ है',
        'Chair detected': 'कुर्सी का पता चला',
        'Door': 'दरवाजा',
        'meters': 'मीटर',
        'to your right': 'आपके दाहिने ओर',
        'in front': 'सामने',
        'Reading document text': 'दस्तावेज पढ़ा जा रहा है',
        'Prescription': 'पर्चा',
        'Take 1 tablet daily with water after meal': 'भोजन के बाद रोजाना पानी के साथ 1 गोली लें',
        'Pill bottle scanned': 'दवा की बोतल स्कैन की गई',
        'pills remaining': 'गोलियां बची हैं',
        'Bus stop sign detected': 'बस स्टॉप का बोर्ड दिखा',
        'arriving in': 'में पहुंच रही है',
        'minutes': 'मिनट',
        'Navigation guidance': 'मार्गदर्शन',
        'Walk straight': 'सीधे चलें',
        'towards': 'की ओर',
        'Flashlight enabled': 'टॉर्च चालू की गई',
        'Flashlight off': 'टॉर्च बंद की गई',
        'Switched to rear environment camera': 'पीछे के कैमरे पर स्विच किया गया',
        'Switched to front selfie camera': 'सामने के कैमरे पर स्विच किया गया',
        'Spatial audio enabled': 'स्थानिक ऑडियो चालू है',
        'Spatial audio off': 'स्थानिक ऑडियो बंद है',
        'AI vision enabled': 'एआई विज़न चालू है',
        'AI vision paused': 'एआई विज़न रोका गया है'
      },
      mr: {
        'Clear path straight ahead': 'पुढील मार्ग मोकळा आहे',
        'Chair detected': 'खुर्ची सापडली',
        'Door': 'दार',
        'meters': 'मीटर',
        'to your right': 'तुमच्या उजवीकडे',
        'in front': 'समोर',
        'Reading document text': 'कागदपत्र वाचले जात आहे',
        'Pill bottle scanned': 'गोळ्यांची बाटली स्कॅन झाली',
        'pills remaining': 'गोळ्या उरल्या आहेत',
        'Walk straight': 'सरळ चाला',
        'Flashlight enabled': 'टॉर्च चालू केला',
        'Flashlight off': 'टॉर्च बंद केला',
        'Switched to Location panel.': 'स्थान पॅनेलवर स्विच केले.',
        'Switched to Emergency Contacts panel.': 'आपत्कालीन संपर्क पॅनेलवर स्विच केले.',
        'Switched to Medical Info panel.': 'वैद्यकीय माहिती पॅनेलवर स्विच केले.',
        'Switched to Languages panel.': 'भाषा पॅनेलवर स्विच केले.',
        'Switched to Settings panel.': 'सेटिंग्ज पॅनेलवर स्विच केले.',
        'Switched to Read mode for document and text scanning.': 'वाचन मोडवर स्विच केले.',
        'Switched to Medicine mode for pill identification and dosage schedules.': 'औषध मोडवर स्विच केले.',
        'Switched to Transport mode for transit assistance.': 'वाहतूक मोडवर स्विच केले.',
        'Switched to Navigation mode for live obstacle avoidance.': 'दिशा मार्गदर्शन मोडवर स्विच केले.',
        'Switched to Family companion mode.': 'कुटुंब मोडवर स्विच केले.',
        'Switched to History log mode.': 'इतिहास मोडवर स्विच केले.',
        'Switched to next section.': 'पुढील विभागावर स्विच केले.',
        'Closing screen.': 'स्क्रीन बंद करत आहे.',
        'Opening User Profile and Medical ID.': 'वापरकर्ता प्रोफाइल आणि वैद्यकीय माहिती उघडत आहे.',
        'Logged out. Starting voice profile setup again.': 'लॉग आउट झाले. आवाज सेटअप पुन्हा सुरू करत आहे.',
        'Profile updated successfully.': 'प्रोफाइल यशस्वीरित्या अद्यतनित केले.',
        'Voice speed increased.': 'आवाजाचा वेग वाढवला.',
        'Voice speed decreased.': 'आवाजाचा वेग कमी केला.'
      },
      gu: {
        'Clear path straight ahead': 'આગળનો રસ્તો સાફ છે',
        'Chair detected': 'ખુરશી મળી',
        'Door': 'દરવાજો',
        'meters': 'મીટર',
        'to your right': 'તમારી જમણી બાજુએ',
        'Walk straight': 'સીધા ચાલો',
        'Flashlight enabled': 'ટોર્ચ ચાલુ કરી',
        'Flashlight off': 'ટોર્ચ બંધ કરી'
      },
      ta: {
        'Clear path straight ahead': 'முன்னால் பாதை தெளிவாக உள்ளது',
        'Chair detected': 'நாற்காலி கண்டறியப்பட்டது',
        'Door': 'கதவு',
        'meters': 'மீட்டர்',
        'to your right': 'உங்கள் வலதுபுறம்',
        'Walk straight': 'நேராக நடக்கவும்'
      },
      te: {
        'Clear path straight ahead': 'ముందు దారి ఖాళీగా ఉంది',
        'Chair detected': 'కుర్చీ గుర్తించబడింది',
        'Door': 'తలుపు',
        'meters': 'మీటర్లు',
        'to your right': 'మీ కుడి వైపున',
        'Walk straight': 'తిన్నగా నడవండి'
      },
      kn: {
        'Clear path straight ahead': 'ಮುಂದಿನ ಹಾದಿ ಸ್ಪಷ್ಟವಾಗಿದೆ',
        'Chair detected': 'ಕುರ್ಚಿ ಪತ್ತೆಯಾಗಿದೆ',
        'Door': 'ಬಾಗಿಲು',
        'meters': 'ಮೀಟರ್',
        'to your right': 'ನಿಮ್ಮ ಬಲಭಾಗದಲ್ಲಿ',
        'Walk straight': 'ನೇರವಾಗಿ ನಡೆಯಿರಿ'
      },
      ml: {
        'Clear path straight ahead': 'മുന്നിലെ വഴി വ്യക്തമാണ്',
        'Chair detected': 'കസേര കണ്ടെത്തി',
        'Door': 'വാതിൽ',
        'meters': 'മീറ്റർ',
        'to your right': 'നിങ്ങളുടെ വലതുവശത്ത്',
        'Walk straight': 'നേരെ നടക്കുക'
      }
    };

    let result = text;
    const dict = replacements[targetLang];
    if (dict) {
      Object.keys(dict).forEach((key) => {
        result = result.replace(new RegExp(key, 'gi'), dict[key]);
      });
    }
    return result;
  }
}

module.exports = new DynamicTranslationService();
