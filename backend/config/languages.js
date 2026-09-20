// Configuration mapping for 10 Offline Languages supported by Whisper.cpp
const SUPPORTED_LANGUAGES = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English (US)',
    flag: '🇬🇧',
    whisperLang: 'en',
    sampleGreeting: 'NAVIDOOR AI Vision Assist Ready.'
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिंदी',
    flag: '🇮🇳',
    whisperLang: 'hi',
    sampleGreeting: 'नेविडोर एआई विज़न असिस्टेंट तैयार है।'
  },
  {
    code: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    flag: '🇮🇳',
    whisperLang: 'mr',
    sampleGreeting: 'नेव्हिडोअर एआय व्हिजन असिस्टंट तयार आहे.'
  },
  {
    code: 'gu',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    flag: '🇮🇳',
    whisperLang: 'gu',
    sampleGreeting: 'નેવિડોર એઆઈ વિઝન આસિસ્ટન્ટ તૈયાર છે.'
  },
  {
    code: 'pa',
    name: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    flag: '🇮🇳',
    whisperLang: 'pa',
    sampleGreeting: 'ਨੇਵੀਡੋਰ ਏਆਈ ਵਿਜ਼ਨ ਅਸਿਸਟੈਂਟ ਤਿਆਰ ਹੈ।'
  },
  {
    code: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    flag: '🇮🇳',
    whisperLang: 'bn',
    sampleGreeting: 'ন্যাভিডোর এআই ভিশন অ্যাসিস্ট্যান্ট প্রস্তুত।'
  },
  {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    flag: '🇮🇳',
    whisperLang: 'ta',
    sampleGreeting: 'நேவிடோர் ஏஐ விஷன் உதவித் தயார்.'
  },
  {
    code: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    flag: '🇮🇳',
    whisperLang: 'te',
    sampleGreeting: 'నావిడోర్ ఏఐ విజన్ అసిస్టెంట్ సిద్ధంగా ఉంది.'
  },
  {
    code: 'kn',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    flag: '🇮🇳',
    whisperLang: 'kn',
    sampleGreeting: 'ನ್ಯಾವಿಡೋರ್ ಎಐ ವಿಷನ್ ಅಸಿಸ್ಟೆಂಟ್ ಸಿದ್ಧವಾಗಿದೆ.'
  },
  {
    code: 'ml',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    flag: '🇮🇳',
    whisperLang: 'ml',
    sampleGreeting: 'നാവിഡോർ എഐ വിഷൻ അസിസ്റ്റന്റ് സജ്ജമാണ്.'
  }
];

function getLanguageMeta(code) {
  return SUPPORTED_LANGUAGES.find((l) => l.code === code) || SUPPORTED_LANGUAGES[0];
}

module.exports = {
  SUPPORTED_LANGUAGES,
  getLanguageMeta
};
