import '../models/nav_models.dart';

class ModeTranslation {
  final String name;
  final String description;

  const ModeTranslation({required this.name, required this.description});
}

class TranslationDictionary {
  final String readyAnnouncement;
  final String languageChanged;
  final Map<NavMode, ModeTranslation> modes;
  final Map<String, String> sceneDescriptions;
  final Map<String, String> actions;

  const TranslationDictionary({
    required this.readyAnnouncement,
    required this.languageChanged,
    required this.modes,
    required this.sceneDescriptions,
    required this.actions,
  });
}

final Map<String, TranslationDictionary> kTranslations = {
  'en': const TranslationDictionary(
    readyAnnouncement: 'NAVIDOOR AI Vision Assist Ready.',
    languageChanged: 'Voice language set to English.',
    modes: {
      NavMode.assist: ModeTranslation(name: 'ASSIST', description: 'Path ahead is clear.'),
      NavMode.navigate: ModeTranslation(name: 'NAVIGATE', description: 'Walk straight 45 meters towards MG Road.'),
      NavMode.read: ModeTranslation(name: 'READ', description: 'Prescription text detected in view.'),
      NavMode.medicine: ModeTranslation(name: 'MEDICINE', description: 'Lisinopril bottle scanned. 14 pills left.'),
      NavMode.transport: ModeTranslation(name: 'TRANSIT', description: 'Bus 42 Northbound arriving in 3 minutes.'),
      NavMode.location: ModeTranslation(name: 'LOCATION', description: 'Live location tracking.'),
      NavMode.emergency: ModeTranslation(name: 'CALL SOS', description: 'Emergency SOS ready. Broadcast standby.'),
      NavMode.medical: ModeTranslation(name: 'MEDICAL', description: 'Medical details and alerts.'),
      NavMode.family: ModeTranslation(name: 'FAMILY', description: 'Sunita Sharma ready for remote stream.'),
      NavMode.history: ModeTranslation(name: 'HISTORY', description: '3 recent text snippets saved in log.'),
      NavMode.languages: ModeTranslation(name: 'LANGUAGES', description: 'Active language: English.'),
      NavMode.settings: ModeTranslation(name: 'SETTINGS', description: 'System settings and contrast options.'),
    },
    sceneDescriptions: {
      'assist': 'Clear path straight ahead. Chair detected 1.2 meters in front. Door 2.8 meters to your right.',
      'read': 'Reading document text out loud: Prescription Lisinopril 10mg. Take 1 tablet daily with water after meal.',
      'medicine': 'Pill bottle scanned in view: Lisinopril 10mg. 14 pills remaining in bottle.',
      'transport': 'Bus stop sign detected 3 meters ahead. Bus 42 Northbound arriving in 3 minutes.',
      'navigate': 'Navigation guidance: Walk straight 45 meters towards MG Road. Doorways on your right.'
    },
    actions: {
      'flashlightOn': 'Flashlight enabled.',
      'flashlightOff': 'Flashlight off.',
      'rearCamera': 'Switched to rear environment camera.',
      'frontCamera': 'Switched to front selfie camera.',
      'spatialAudioOn': 'Spatial audio enabled.',
      'spatialAudioOff': 'Spatial audio off.',
      'visionActive': 'AI vision enabled.',
      'visionPaused': 'AI vision paused.'
    },
  ),
  'hi': const TranslationDictionary(
    readyAnnouncement: 'नेविडोर एआई विज़न असिस्टेंट तैयार है।',
    languageChanged: 'आवाज की भाषा हिंदी सेट की गई है।',
    modes: {
      NavMode.assist: ModeTranslation(name: 'सहायता', description: 'आगे का रास्ता साफ है।'),
      NavMode.navigate: ModeTranslation(name: 'मार्गदर्शन', description: 'ओक लेन की ओर 45 मीटर सीधे चलें।'),
      NavMode.read: ModeTranslation(name: 'पढ़ें', description: 'दवा के पर्चे का पाठ पहचाना गया।'),
      NavMode.medicine: ModeTranslation(name: 'दवा', description: 'दवा की शीशी स्कैन की गई। 14 गोलियां बची हैं।'),
      NavMode.transport: ModeTranslation(name: 'परिवहन', description: 'बस 42 उत्तर की ओर 3 मिनट में आ रही है।'),
      NavMode.location: ModeTranslation(name: 'स्थान', description: 'लाइव स्थान ट्रैकिंग।'),
      NavMode.emergency: ModeTranslation(name: 'आपातकाल', description: 'आपातकालीन एसओएस तैयार है।'),
      NavMode.medical: ModeTranslation(name: 'चिकित्सा', description: 'चिकित्सा विवरण।'),
      NavMode.family: ModeTranslation(name: 'परिवार', description: 'रिमोट स्ट्रीम के लिए परिवार तैयार है।'),
      NavMode.history: ModeTranslation(name: 'इतिहास', description: '3 हाल के टेक्स्ट सहेजे गए हैं।'),
      NavMode.languages: ModeTranslation(name: 'भाषाएं', description: 'सक्रिय भाषा: हिंदी।'),
      NavMode.settings: ModeTranslation(name: 'सेटिंग्स', description: 'सिस्टम सेटिंग्स और कंट्रास्ट विकल्प।'),
    },
    sceneDescriptions: {
      'assist': 'आगे का रास्ता साफ है। सामने 1.2 मीटर पर कुर्सी है। दाईं ओर 2.8 मीटर पर दरवाजा है।',
      'read': 'दस्तावेज़ पढ़ रहे हैं: लिसिनोप्रिल 10 मिलीग्राम। भोजन के बाद पानी के साथ दैनिक 1 गोली लें।',
      'medicine': 'दवा की शीशी: लिसिनोप्रिल 10 मिलीग्राम। शीशी में 14 गोलियां बची हैं।',
      'transport': 'बस स्टॉप साइन 3 मीटर आगे। बस 42 उत्तर की ओर 3 मिनट में आ रही है।',
      'navigate': 'नेविगेशन: एमजी रोड की ओर 45 मीटर सीधे चलें। आपके दाईं ओर दरवाजे हैं।'
    },
    actions: {
      'flashlightOn': 'फ्लैशलाइट चालू की गई।',
      'flashlightOff': 'फ्लैशलाइट बंद की गई।',
      'rearCamera': 'पीछे का कैमरा सक्रिय किया गया।',
      'frontCamera': 'सामने का कैमरा सक्रिय किया गया।',
      'spatialAudioOn': 'स्थानिक ऑडियो सक्षम है।',
      'spatialAudioOff': 'स्थानिक ऑडियो बंद है।',
      'visionActive': 'एआई दृष्टि सक्षम है।',
      'visionPaused': 'एआई दृष्टि रोकी गई।'
    },
  ),
  'mr': const TranslationDictionary(
    readyAnnouncement: 'नेव्हिडोअर एआय दृष्टी सहाय्यक तयार आहे.',
    languageChanged: 'आवाजाची भाषा मराठी निवडली आहे.',
    modes: {
      NavMode.assist: ModeTranslation(name: 'मदत', description: 'पुढील मार्ग मोकळा आहे.'),
      NavMode.navigate: ModeTranslation(name: 'दिशादर्शन', description: 'सरळ ४५ मीटर चालत जा.'),
      NavMode.read: ModeTranslation(name: 'वाचा', description: 'औषध चिठ्ठी मजकूर आढळला.'),
      NavMode.medicine: ModeTranslation(name: 'औषध', description: 'गोळ्यांची बाटली स्कॅन झाली.'),
      NavMode.transport: ModeTranslation(name: 'वाहतूक', description: 'बस ३ मिनिटांत येत आहे.'),
      NavMode.location: ModeTranslation(name: 'स्थान', description: 'थेट स्थान ट्रॅकिंग.'),
      NavMode.emergency: ModeTranslation(name: 'आपत्कालीन', description: 'एसओएस सज्ज आहे.'),
      NavMode.medical: ModeTranslation(name: 'वैद्यकीय', description: 'वैद्यकीय माहिती.'),
      NavMode.family: ModeTranslation(name: 'कुटुंब', description: 'कुटुंब सदस्य कनेक्ट आहे.'),
      NavMode.history: ModeTranslation(name: 'इतिहास', description: 'जतन केलेला मजकूर.'),
      NavMode.languages: ModeTranslation(name: 'भाषा', description: 'सक्रिय भाषा: मराठी.'),
      NavMode.settings: ModeTranslation(name: 'सेटिंग्ज', description: 'सिस्टम सेटिंग्ज.'),
    },
    sceneDescriptions: {
      'assist': 'पुढील रस्ता मोकळा आहे. १.२ मीटर अंतरावर खुर्ची आहे.',
      'read': 'लिसिनोप्रिल १० मिग्रॅ. जेवणानंतर १ गोळी घ्या.',
      'medicine': 'औषध बाटली: १४ गोळ्या शिल्लक आहेत.',
      'transport': 'बस थांबा ३ मीटर पुढे आहे.',
      'navigate': 'एमजी रोडकडे ४५ मीटर सरळ चालत जा.'
    },
    actions: {
      'flashlightOn': 'फ्लॅशलाइट सुरू झाली.',
      'flashlightOff': 'फ्लॅशलाइट बंद झाली.',
      'rearCamera': 'मागील कॅमेरा सुरू.',
      'frontCamera': 'पुढील कॅमेरा सुरू.',
      'spatialAudioOn': 'ऑडिओ सक्षम.',
      'spatialAudioOff': 'ऑडिओ बंद.',
      'visionActive': 'एआय सुरू.',
      'visionPaused': 'एआय थांबवले.'
    },
  ),
  'gu': const TranslationDictionary(
    readyAnnouncement: 'નેવિડોર એઆઈ વિઝન આસિસ્ટન્ટ તૈયાર છે.',
    languageChanged: 'અવાજની ભાષા ગુજરાતી સેટ થઈ છે.',
    modes: {
      NavMode.assist: ModeTranslation(name: 'મદદ', description: 'આગળનો રસ્તો સાફ છે.'),
      NavMode.navigate: ModeTranslation(name: 'માર્ગદર્શન', description: 'સીધા ચાલો.'),
      NavMode.read: ModeTranslation(name: 'વાંચો', description: 'લખાણ વંચાય છે.'),
      NavMode.medicine: ModeTranslation(name: 'દવા', description: 'દવાની બોટલ સ્કેન થઈ.'),
      NavMode.transport: ModeTranslation(name: 'પરિવહન', description: 'બસ આવી રહી છે.'),
      NavMode.location: ModeTranslation(name: 'સ્થાન', description: 'લાઈવ લોકેશન.'),
      NavMode.emergency: ModeTranslation(name: 'ઇમરજન્સી', description: 'એસઓએસ તૈયાર છે.'),
      NavMode.medical: ModeTranslation(name: 'મેડિકલ', description: 'તબીબી વિગતો.'),
      NavMode.family: ModeTranslation(name: 'પરિવાર', description: 'પરિવાર સદસ્ય તૈયાર છે.'),
      NavMode.history: ModeTranslation(name: 'ઇતિહાસ', description: 'ઇતિહાસ લોગ.'),
      NavMode.languages: ModeTranslation(name: 'ભાષા', description: 'સક્રિય ભાષા: ગુજરાતી.'),
      NavMode.settings: ModeTranslation(name: 'સેટિંગ્સ', description: 'સિસ્ટમ સેટિંગ્સ.'),
    },
    sceneDescriptions: {
      'assist': 'આગળનો રસ્તો સાફ છે.',
      'read': 'દસ્તાવેજ વંચાય છે: લિસિનોપ્રિલ ૧૦ મિગ્રા.',
      'medicine': 'દવા બોટલ: ૧૪ ગોળીઓ બાકી છે.',
      'transport': 'બસ ૩ મિનિટમાં આવી રહી છે.',
      'navigate': '૪૫ મીટર સીધા ચાલો.'
    },
    actions: {
      'flashlightOn': 'ટોર્ચ ચાલુ.',
      'flashlightOff': 'ટોર્ચ બંધ.',
      'rearCamera': 'પાછળનો કૅમેરો.',
      'frontCamera': 'આગળનો કૅમેરો.',
      'spatialAudioOn': 'ઓડિયો ચાલુ.',
      'spatialAudioOff': 'ઓડિયો બંધ.',
      'visionActive': 'વિઝન ચાલુ.',
      'visionPaused': 'વિઝન બંધ.'
    },
  ),
  'pa': const TranslationDictionary(
    readyAnnouncement: 'ਨੈਵੀਡੋਰ ਏਆਈ ਵਿਜ਼ਨ ਅਸਿਸਟੈਂਟ ਤਿਆਰ ਹੈ।',
    languageChanged: 'ਆਵਾਜ਼ ਦੀ ਭਾਸ਼ਾ ਪੰਜਾਬੀ ਚੁਣੀ ਗਈ।',
    modes: {
      NavMode.assist: ModeTranslation(name: 'ਮਦਦ', description: 'ਅੱਗੇ ਦਾ ਰਸਤਾ ਸਾਫ਼ ਹੈ।'),
      NavMode.navigate: ModeTranslation(name: 'ਨੇਵੀਗੇਟ', description: 'ਸਿੱਧੇ ਚੱਲੋ।'),
      NavMode.read: ModeTranslation(name: 'ਪੜ੍ਹੋ', description: 'ਲਿਖਤ ਪੜ੍ਹੀ ਜਾ ਰਹੀ ਹੈ।'),
      NavMode.medicine: ModeTranslation(name: 'ਦਵਾਈ', description: 'ਦਵਾਈ ਸਕੈਨ ਕੀਤੀ ਗਈ।'),
      NavMode.transport: ModeTranslation(name: 'ਆਵਾਜਾਈ', description: 'ਬੱਸ ਆ ਰਹੀ ਹੈ।'),
      NavMode.location: ModeTranslation(name: 'ਸਥਾਨ', description: 'ਲਾਈਵ ਸਥਾਨ।'),
      NavMode.emergency: ModeTranslation(name: 'ਐਮਰਜੈਂਸੀ', description: 'ਐਸਓਐਸ ਤਿਆਰ ਹੈ।'),
      NavMode.medical: ModeTranslation(name: 'ਮੈਡੀਕਲ', description: 'ਸਿਹਤ ਜਾਣਕਾਰੀ।'),
      NavMode.family: ModeTranslation(name: 'ਪਰਿਵਾਰ', description: 'ਪਰਿਵਾਰ ਨਾਲ ਜੁੜਿਆ।'),
      NavMode.history: ModeTranslation(name: 'ਇਤਿਹਾਸ', description: 'ਰਿਕਾਰਡ।'),
      NavMode.languages: ModeTranslation(name: 'ਭਾਸ਼ਾ', description: 'ਸਰਗਰਮ ਭਾਸ਼ਾ: ਪੰਜਾਬੀ।'),
      NavMode.settings: ModeTranslation(name: 'ਸੈਟਿੰਗਾਂ', description: 'ਸਿਸਟਮ ਸੈਟਿੰਗਾਂ।'),
    },
    sceneDescriptions: {
      'assist': 'ਸਾਹਮਣੇ ਦਾ ਰਸਤਾ ਸਾਫ਼ ਹੈ।',
      'read': 'ਲਿਸੀਨੋਪ੍ਰਿਲ 10 ਮਿ.ਗ੍ਰਾ.',
      'medicine': 'ਬੋਤਲ ਵਿੱਚ 14 ਗੋਲੀਆਂ ਬਾਕੀ ਹਨ।',
      'transport': 'ਬੱਸ 3 ਮਿੰਟ ਵਿੱਚ ਪਹੁੰਚ ਰਹੀ ਹੈ।',
      'navigate': '45 ਮੀਟਰ ਸਿੱਧੇ ਚੱਲੋ।'
    },
    actions: {
      'flashlightOn': 'ਟਾਰਚ ਚਾਲੂ।',
      'flashlightOff': 'ਟਾਰਚ ਬੰਦ।',
      'rearCamera': 'ਪਿੱਛੇ ਦਾ ਕੈਮਰਾ।',
      'frontCamera': 'ਮੂਹਰਲਾ ਕੈਮਰਾ।',
      'spatialAudioOn': 'ਆਡੀਓ ਚਾਲੂ।',
      'spatialAudioOff': 'ਆਡੀਓ ਬੰਦ।',
      'visionActive': 'ਵਿਜ਼ਨ ਸਰਗਰਮ।',
      'visionPaused': 'ਵਿਜ਼ਨ ਰੁਕਿਆ।'
    },
  ),
  'bn': const TranslationDictionary(
    readyAnnouncement: 'ন্যাভিডোর এআই ভিশন অ্যাসিস্ট্যান্ট প্রস্তুত।',
    languageChanged: 'কণ্ঠস্বরের ভাষা বাংলা সেট করা হয়েছে।',
    modes: {
      NavMode.assist: ModeTranslation(name: 'সাহায্য', description: 'সামনের পথ পরিষ্কার।'),
      NavMode.navigate: ModeTranslation(name: 'পথনির্দেশ', description: 'সোজা এগিয়ে চলুন।'),
      NavMode.read: ModeTranslation(name: 'পড়ুন', description: 'প্রেসক্রিপশন টেক্সট শনাক্ত।'),
      NavMode.medicine: ModeTranslation(name: 'ওষুধ', description: 'ওষুধের বোতল স্ক্যান হয়েছে।'),
      NavMode.transport: ModeTranslation(name: 'যানবাহন', description: 'বাস আসছে ৩ মিনিটে।'),
      NavMode.location: ModeTranslation(name: 'অবস্থান', description: 'লাইভ অবস্থান।'),
      NavMode.emergency: ModeTranslation(name: 'জরুরি', description: 'এসওএস প্রস্তুত।'),
      NavMode.medical: ModeTranslation(name: 'চিকিৎসা', description: 'চিকিৎসা তথ্য।'),
      NavMode.family: ModeTranslation(name: 'পরিবার', description: 'পরিবার সংযুক্ত।'),
      NavMode.history: ModeTranslation(name: 'ইতিহাস', description: 'ইতিহাস সংরক্ষিত।'),
      NavMode.languages: ModeTranslation(name: 'ভাষা', description: 'সক্রিয় ভাষা: বাংলা।'),
      NavMode.settings: ModeTranslation(name: 'সেটিংস', description: 'সিস্টেম সেটিংস।'),
    },
    sceneDescriptions: {
      'assist': 'সামনের পথ পরিষ্কার আছে।',
      'read': 'লিসিনোপ্রিল ১০ মিগ্রা। খাওয়ার পর ১টি ট্যাবলেট নিন।',
      'medicine': 'ওষুধের বোতলে ১৪টি পিল বাকি আছে।',
      'transport': 'বাস ৩ মিনিটের মধ্যে পৌঁছাবে।',
      'navigate': 'এমজি রোডের দিকে ৪৫ মিটার সোজা হাঁটুন।'
    },
    actions: {
      'flashlightOn': 'ফ্ল্যাশলাইট চালু।',
      'flashlightOff': 'ফ্ল্যাশলাইট বন্ধ।',
      'rearCamera': 'পেছনের ক্যামেরা।',
      'frontCamera': 'সামনের ক্যামেরা।',
      'spatialAudioOn': 'অডিও সক্রিয়।',
      'spatialAudioOff': 'অডিও বন্ধ।',
      'visionActive': 'ভিশন সক্রিয়।',
      'visionPaused': 'ভিশন বিরতি।'
    },
  ),
  'ta': const TranslationDictionary(
    readyAnnouncement: 'நேவிடோர் ஏஐ பார்வை உதவியாளர் தயார்.',
    languageChanged: 'குரல் மொழி தமிழ் தேர்ந்தெடுக்கப்பட்டது.',
    modes: {
      NavMode.assist: ModeTranslation(name: 'உதவி', description: 'முன்னால் பாதை தெளிவாக உள்ளது.'),
      NavMode.navigate: ModeTranslation(name: 'வழிகாட்டு', description: 'நேராக செல்லுங்கள்.'),
      NavMode.read: ModeTranslation(name: 'படி', description: 'மருந்து சீட்டு உரை கண்டறியப்பட்டது.'),
      NavMode.medicine: ModeTranslation(name: 'மருந்து', description: 'மருந்து பாட்டில் ஸ்கேன் செய்யப்பட்டது.'),
      NavMode.transport: ModeTranslation(name: 'போக்குவரத்து', description: 'பேருந்து வருகிறது.'),
      NavMode.location: ModeTranslation(name: 'இடம்', description: 'நேரலை இருப்பிடம்.'),
      NavMode.emergency: ModeTranslation(name: 'அவசரம்', description: 'எஸ்ஓஎஸ் தயார்.'),
      NavMode.medical: ModeTranslation(name: 'மருத்துவம்', description: 'மருத்துவ விவரங்கள்.'),
      NavMode.family: ModeTranslation(name: 'குடும்பம்', description: 'குடும்ப உறுப்பினர் இணைக்கப்பட்டார்.'),
      NavMode.history: ModeTranslation(name: 'வரலாறு', description: 'சேமிக்கப்பட்ட பதிவுகள்.'),
      NavMode.languages: ModeTranslation(name: 'மொழி', description: 'செயலில் உள்ள மொழி: தமிழ்.'),
      NavMode.settings: ModeTranslation(name: 'அமைப்புகள்', description: 'அமைப்புகள்.'),
    },
    sceneDescriptions: {
      'assist': 'முன்னால் பாதை தெளிவாக உள்ளது.',
      'read': 'லிசினோப்ரில் 10 மி.கி. உணவுக்குப் பின் 1 மாத்திரை எடுக்கவும்.',
      'medicine': 'பாட்டிலில் 14 மாத்திரைகள் மீதமுள்ளன.',
      'transport': 'பேருந்து 3 நிமிடங்களில் வருகிறது.',
      'navigate': '45 மீட்டர் நேராக நடக்கவும்.'
    },
    actions: {
      'flashlightOn': 'விளக்கு ஆன்.',
      'flashlightOff': 'விளக்கு ஆஃப்.',
      'rearCamera': 'பின்புற கேமரா.',
      'frontCamera': 'முன்புற கேமரா.',
      'spatialAudioOn': 'ஆடியோ ஆன்.',
      'spatialAudioOff': 'ஆடியோ ஆஃப்.',
      'visionActive': 'பார்வை ஆன்.',
      'visionPaused': 'பார்வை நிறுத்தம்.'
    },
  ),
  'te': const TranslationDictionary(
    readyAnnouncement: 'నావిడోర్ ఏఐ దృష్టి సహాయకుడు సిద్ధంగా ఉంది.',
    languageChanged: 'వాయిస్ భాష తెలుగు సెట్ చేయబడింది.',
    modes: {
      NavMode.assist: ModeTranslation(name: 'సహాయం', description: 'ముందు దారి స్పష్టంగా ఉంది.'),
      NavMode.navigate: ModeTranslation(name: 'దారిచూపు', description: 'నేరుగా వెళ్ళండి.'),
      NavMode.read: ModeTranslation(name: 'చదవండి', description: 'మందుల చీటీ గుర్తించబడింది.'),
      NavMode.medicine: ModeTranslation(name: 'మందులు', description: 'మందుల బాటిల్ స్కాన్ అయింది.'),
      NavMode.transport: ModeTranslation(name: 'రవాణా', description: 'బస్సు వస్తోంది.'),
      NavMode.location: ModeTranslation(name: 'స్థానం', description: 'లైవ్ స్థానం.'),
      NavMode.emergency: ModeTranslation(name: 'అత్యవసరం', description: 'ఎస్ఓఎస్ సిద్ధం.'),
      NavMode.medical: ModeTranslation(name: 'వైద్యం', description: 'వైద్య వివరాలు.'),
      NavMode.family: ModeTranslation(name: 'కుటుంబం', description: 'కుటుంబ సభ్యుడు కనెక్ట్ అయ్యాడు.'),
      NavMode.history: ModeTranslation(name: 'చరిత్ర', description: 'సేవ్ చేసిన వివరాలు.'),
      NavMode.languages: ModeTranslation(name: 'భాష', description: 'సక్రియ భాష: తెలుగు.'),
      NavMode.settings: ModeTranslation(name: 'సెట్టింగ్‌లు', description: 'సిస్టమ్ సెట్టింగ్‌లు.'),
    },
    sceneDescriptions: {
      'assist': 'ముందు దారి స్పష్టంగా ఉంది.',
      'read': 'లిసినోప్రిల్ 10 ఎంజీ. భోజనం తర్వాత 1 టాబ్లెట్ తీసుకోండి.',
      'medicine': 'బాటిల్‌లో 14 మాత్రలు మిగిలి ఉన్నాయి.',
      'transport': 'బస్సు 3 నిమిషాల్లో వస్తోంది.',
      'navigate': '45 మీటర్లు నేరుగా నడవండి.'
    },
    actions: {
      'flashlightOn': 'ఫ్లాష్‌లైట్ ఆన్.',
      'flashlightOff': 'ఫ్లాష్‌లైట్ ఆఫ్.',
      'rearCamera': 'వెనుక కెమెరా.',
      'frontCamera': 'ముందు కెమెరా.',
      'spatialAudioOn': 'ఆడియో ఆన్.',
      'spatialAudioOff': 'ఆడియో ఆఫ్.',
      'visionActive': 'విజన్ ఆన్.',
      'visionPaused': 'విజన్ పాజ్ అయింది.'
    },
  ),
  'kn': const TranslationDictionary(
    readyAnnouncement: 'ನ್ಯಾವಿಡೋರ್ ಎಐ ದೃಷ್ಟಿ ಸಹಾಯಕ ಸಿದ್ಧವಾಗಿದೆ.',
    languageChanged: 'ಧ್ವನಿ ಭಾಷೆ ಕನ್ನಡಕ್ಕೆ ಬದಲಾಗಿದೆ.',
    modes: {
      NavMode.assist: ModeTranslation(name: 'ಸಹಾಯ', description: 'ಮುಂದಿನ ಹಾದಿ ಸ್ಪಷ್ಟವಾಗಿದೆ.'),
      NavMode.navigate: ModeTranslation(name: 'ಮಾರ್ಗದರ್ಶನ', description: 'ನೇರವಾಗಿ ಸಾಗಿ.'),
      NavMode.read: ModeTranslation(name: 'ಓದು', description: 'ಔಷಧ ಚೀಟಿ ಪಠ್ಯ ಪತ್ತೆಯಾಗಿದೆ.'),
      NavMode.medicine: ModeTranslation(name: 'ಔಷಧ', description: 'ಔಷಧ ಸೀಸೆ ಸ್ಕ್ಯಾನ್ ಆಗಿದೆ.'),
      NavMode.transport: ModeTranslation(name: 'ಸಾರಿಗೆ', description: 'ಬಸ್ಸು ಬರುತ್ತಿದೆ.'),
      NavMode.location: ModeTranslation(name: 'ಸ್ಥಳ', description: 'ಲೈವ್ ಸ್ಥಳ.'),
      NavMode.emergency: ModeTranslation(name: 'ತುರ್ತು', description: 'ಎಸ್ಒಎಸ್ ಸಿದ್ಧ.'),
      NavMode.medical: ModeTranslation(name: 'ವೈದ್ಯಕೀಯ', description: 'ವೈದ್ಯಕೀಯ ವಿವರ.'),
      NavMode.family: ModeTranslation(name: 'ಕುಟುಂಬ', description: 'ಕುಟುಂಬ ಸಂಪರ್ಕಗೊಂಡಿದೆ.'),
      NavMode.history: ModeTranslation(name: 'ಇತಿಹಾಸ', description: 'ಇತಿಹಾಸ ದಾಖಲೆ.'),
      NavMode.languages: ModeTranslation(name: 'ಭಾಷೆ', description: 'ಸಕ್ರಿಯ ಭಾಷೆ: ಕನ್ನಡ.'),
      NavMode.settings: ModeTranslation(name: 'ಸೆಟ್ಟಿಂಗ್ಸ್', description: 'ಸಿಸ್ಟಮ್ ಸೆಟ್ಟಿಂಗ್ಸ್.'),
    },
    sceneDescriptions: {
      'assist': 'ಮುಂದಿನ ದಾರಿ ಸ್ಪಷ್ಟವಾಗಿದೆ.',
      'read': 'ಲಿಸಿನೊಪ್ರಿಲ್ 10 ಎಂಜಿ. ಊಟದ ನಂತರ 1 ಮಾತ್ರೆ ಸೇವಿಸಿ.',
      'medicine': 'ಸೀಸೆಯಲ್ಲಿ 14 ಮಾತ್ರೆಗಳು ಬಾಕಿ ಇವೆ.',
      'transport': 'ಬಸ್ಸು 3 ನಿಮಿಷಗಳಲ್ಲಿ ಬರುತ್ತದೆ.',
      'navigate': '45 ಮೀಟರ್ ನೇರವಾಗಿ ನಡೆಯಿರಿ.'
    },
    actions: {
      'flashlightOn': 'ಟಾರ್ಚ್ ಆನ್.',
      'flashlightOff': 'ಟಾರ್ಚ್ ಆಫ್.',
      'rearCamera': 'ಹಿಂಬದಿಯ ಕ್ಯಾಮೆರಾ.',
      'frontCamera': 'ಮುಂಭಾಗದ ಕ್ಯಾಮೆರಾ.',
      'spatialAudioOn': 'ಆಡಿಯೋ ಆನ್.',
      'spatialAudioOff': 'ಆಡಿಯೋ ಆಫ್.',
      'visionActive': 'ದೃಷ್ಟಿ ಆನ್.',
      'visionPaused': 'ದೃಷ್ಟಿ ವಿರಾಮ.'
    },
  ),
  'ml': const TranslationDictionary(
    readyAnnouncement: 'നാവിഡോർ എഐ കാഴ്ച സഹായി തയ്യാറാണ്.',
    languageChanged: 'ശബ്ദ ഭാഷ മലയാളം ആക്കി.',
    modes: {
      NavMode.assist: ModeTranslation(name: 'സഹായം', description: 'മുന്നിലെ പാത വ്യക്തമാണ്.'),
      NavMode.navigate: ModeTranslation(name: 'വഴികാട്ടി', description: 'നേരെ നടക്കുക.'),
      NavMode.read: ModeTranslation(name: 'വായിക്കുക', description: 'മരുന്ന് കുറിപ്പ് കണ്ടെത്തി.'),
      NavMode.medicine: ModeTranslation(name: 'മരുന്ന്', description: 'മരുന്ന് കുപ്പി സ്കാൻ ചെയ്തു.'),
      NavMode.transport: ModeTranslation(name: 'ഗതാഗതം', description: 'ബസ് വരുന്നു.'),
      NavMode.location: ModeTranslation(name: 'സ്ഥലം', description: 'തത്സമയ സ്ഥാനം.'),
      NavMode.emergency: ModeTranslation(name: 'അടിയന്തരം', description: 'എസ്ഒഎസ് തയ്യാറാണ്.'),
      NavMode.medical: ModeTranslation(name: 'ചികിത്സ', description: 'ആരോഗ്യ വിവരങ്ങൾ.'),
      NavMode.family: ModeTranslation(name: 'കുടുംബം', description: 'കുടുംബം ബന്ധപ്പെട്ടു.'),
      NavMode.history: ModeTranslation(name: 'ചരിത്രം', description: 'സംരക്ഷിച്ച വിവരങ്ങൾ.'),
      NavMode.languages: ModeTranslation(name: 'ഭാഷ', description: 'സജീവ ഭാഷ: മലയാളം.'),
      NavMode.settings: ModeTranslation(name: 'ക്രമീകരണങ്ങൾ', description: 'ക്രമീകരണങ്ങൾ.'),
    },
    sceneDescriptions: {
      'assist': 'മുന്നിലെ പാത വ്യക്തമാണ്.',
      'read': 'ലിസിനോപ്രിൽ 10 മില്ലിഗ്രാം. ഭക്ഷണത്തിന് ശേഷം 1 ഗുളിക കഴിക്കുക.',
      'medicine': 'കുപ്പിയിൽ 14 ഗുളികകൾ ബാക്കിയുണ്ട്.',
      'transport': 'ബസ് 3 മിനിറ്റിനുള്ളിൽ എത്തും.',
      'navigate': '45 മീറ്റർ നേരെ നടക്കുക.'
    },
    actions: {
      'flashlightOn': 'ടോർച്ച് ഓൺ.',
      'flashlightOff': 'ടോർച്ച് ഓഫ്.',
      'rearCamera': 'പിൻ ക്യാമറ.',
      'frontCamera': 'മുൻ ക്യാമറ.',
      'spatialAudioOn': 'ഓഡിയോ ഓൺ.',
      'spatialAudioOff': 'ഓഡിയോ ഓഫ്.',
      'visionActive': 'വിഷൻ ഓൺ.',
      'visionPaused': 'വിഷൻ താൽക്കാലികമായി നിർത്തി.'
    },
  ),
};

TranslationDictionary getTranslations(String langCode) {
  return kTranslations[langCode] ?? kTranslations['en']!;
}

ModeTranslation getModeTranslation(String langCode, NavMode mode) {
  final dict = getTranslations(langCode);
  return dict.modes[mode] ?? kTranslations['en']!.modes[mode]!;
}
