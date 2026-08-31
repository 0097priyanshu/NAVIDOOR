import { SupportedLanguageCode, NavMode } from '../types';

export interface TranslationDictionary {
  readyAnnouncement: string;
  languageChanged: string;
  modes: Record<NavMode, { name: string; description: string }>;
  sceneDescriptions: {
    assist: string;
    read: string;
    medicine: string;
    transport: string;
    navigate: string;
  };
  actions: {
    flashlightOn: string;
    flashlightOff: string;
    rearCamera: string;
    frontCamera: string;
    spatialAudioOn: string;
    spatialAudioOff: string;
    visionActive: string;
    visionPaused: string;
  };
}

export const TRANSLATIONS: Record<SupportedLanguageCode, TranslationDictionary> = {
  en: {
    readyAnnouncement: 'NAVIDOOR AI Vision Assist Ready.',
    languageChanged: 'Voice language set to English.',
    modes: {
      assist: { name: 'ASSIST', description: 'Path ahead is clear.' },
      navigate: { name: 'GUIDE', description: 'Walk straight 45 meters towards MG Road.' },
      read: { name: 'READ', description: 'Prescription text detected in view.' },
      medicine: { name: 'MEDICINE', description: 'Lisinopril bottle scanned. 14 pills left.' },
      transport: { name: 'TRANSIT', description: 'Bus 42 Northbound arriving in 3 minutes.' },
      emergency: { name: 'EMERGENCY', description: 'Emergency SOS ready. Broadcast standby.' },
      family: { name: 'FAMILY', description: 'Sunita Sharma ready for remote stream.' },
      history: { name: 'HISTORY', description: '3 recent text snippets saved in log.' },
      settings: { name: 'SETTINGS', description: 'System settings and contrast options.' },
      languages: { name: 'LANGUAGES', description: 'Active language: English.' },
      location: { name: 'LOCATION', description: 'Live location tracking' },
      medical: { name: 'MEDICAL', description: 'Medical details' },
    },
    sceneDescriptions: {
      assist: 'Clear path straight ahead. Chair detected 1.2 meters in front. Door 2.8 meters to your right.',
      read: 'Reading document text out loud: Prescription Lisinopril 10mg. Take 1 tablet daily with water after meal.',
      medicine: 'Pill bottle scanned in view: Lisinopril 10mg. 14 pills remaining in bottle.',
      transport: 'Bus stop sign detected 3 meters ahead. Bus 42 Northbound arriving in 3 minutes.',
      navigate: 'Navigation guidance: Walk straight 45 meters towards MG Road. Doorways on your right.'
    },
    actions: {
      flashlightOn: 'Flashlight enabled.',
      flashlightOff: 'Flashlight off.',
      rearCamera: 'Switched to rear environment camera.',
      frontCamera: 'Switched to front selfie camera.',
      spatialAudioOn: 'Spatial audio enabled.',
      spatialAudioOff: 'Spatial audio off.',
      visionActive: 'AI vision enabled.',
      visionPaused: 'AI vision paused.'
    }
  },
  hi: {
    readyAnnouncement: 'नेविडोर एआई विज़न असिस्टेंट तैयार है।',
    languageChanged: 'आवाज की भाषा हिंदी सेट की गई है।',
    modes: {
      assist: { name: 'सहायता', description: 'आगे का रास्ता साफ है।' },
      navigate: { name: 'मार्गदर्शन', description: 'ओक लेन की ओर 45 मीटर सीधे चलें।' },
      read: { name: 'पढ़ें', description: 'दवा के पर्चे का पाठ पहचाना गया।' },
      medicine: { name: 'दवा', description: 'दवा की शीशी स्कैन की गई। 14 गोलियां बची हैं।' },
      transport: { name: 'परिवहन', description: 'बस 42 उत्तर की ओर 3 मिनट में आ रही है।' },
      emergency: { name: 'आपातकाल', description: 'आपातकालीन एसओएस तैयार है।' },
      family: { name: 'परिवार', description: 'रिमोट स्ट्रीम के लिए परिवार तैयार है।' },
      history: { name: 'इतिहास', description: '3 हाल के टेक्स्ट सहेजे गए हैं।' },
      settings: { name: 'सेटिंग्स', description: 'सिस्टम सेटिंग्स और कंट्रास्ट विकल्प।' },
      languages: { name: 'भाषाएं', description: 'सक्रिय भाषा: हिंदी।' },
      location: { name: 'LOCATION', description: 'Live location tracking' },
      medical: { name: 'MEDICAL', description: 'Medical details' },
    },
    sceneDescriptions: {
      assist: 'आगे का रास्ता साफ है। 1.2 मीटर आगे कुर्सी है। आपके दाहिने 2.8 मीटर पर दरवाजा है।',
      read: 'दस्तावेज पढ़ा जा रहा है: पर्चा लिसिनोप्रिल 10 मिग्रा। भोजन के बाद रोज 1 गोली पानी के साथ लें।',
      medicine: 'दवा की शीशी स्कैन की गई: लिसिनोप्रिल 10 मिग्रा। शीशी में 14 गोलियां बची हैं।',
      transport: '3 मीटर आगे बस स्टॉप का बोर्ड है। बस 42 उत्तर दिशा 3 मिनट में पहुंचेगी।',
      navigate: 'नेविगेशन मार्गदर्शन: ओक लेन की तरफ 45 मीटर सीधे चलें। दाहिनी तरफ दरवाजे हैं।'
    },
    actions: {
      flashlightOn: 'टॉर्च चालू की गई।',
      flashlightOff: 'टॉर्च बंद की गई।',
      rearCamera: 'पीछे के कैमरे पर स्विच किया गया।',
      frontCamera: 'सामने के कैमरे पर स्विच किया गया।',
      spatialAudioOn: 'स्थानिक ऑडियो चालू है।',
      spatialAudioOff: 'स्थानिक ऑडियो बंद है।',
      visionActive: 'एआई विज़न चालू है।',
      visionPaused: 'एआई विज़न रोका गया है।'
    }
  },
  mr: {
    readyAnnouncement: 'नेव्हिडोअर एआय व्हिजन असिस्टंट तयार आहे.',
    languageChanged: 'आवाजाची भाषा मराठी सेट केली आहे.',
    modes: {
      assist: { name: 'मदत', description: 'पुढील रस्ता मोकळा आहे.' },
      navigate: { name: 'मार्गदर्शन', description: 'ऑक लेनकडे ४५ मीटर सरळ चाला.' },
      read: { name: 'वाचा', description: 'औषधाच्या चिठ्ठीचे लिखाण सापडले.' },
      medicine: { name: 'औषध', description: 'औषधाची बाटली स्कॅन झाली. १४ गोळ्या शिल्लक आहेत.' },
      transport: { name: 'वाहतूक', description: 'बस ४२ उत्तर दिशेने ३ मिनिटांत येत आहे.' },
      emergency: { name: 'आणीबाणी', description: 'आणीबाणी एसओएस तयार आहे.' },
      family: { name: 'कुटुंब', description: 'कुटुंब थेट प्रवाहासाठी तयार आहे.' },
      history: { name: 'इतिहास', description: '३ अलीकडील मजकूर जतन केले आहेत.' },
      settings: { name: 'सेटिंग्ज', description: 'प्रणाली सेटिंग्ज आणि पर्याय.' },
      languages: { name: 'भाषा', description: 'सक्रिय भाषा: मराठी.' },
      location: { name: 'LOCATION', description: 'Live location tracking' },
      medical: { name: 'MEDICAL', description: 'Medical details' },
    },
    sceneDescriptions: {
      assist: 'पुढील मार्ग मोकळा आहे. १.२ मीटरवर खुर्ची आहे. उजवीकडे २.८ मीटरवर दार आहे.',
      read: 'कागदपत्र वाचत आहे: लिसिनोप्रिल १० मिग्रॅ. जेवणानंतर रोज १ गोळी पाण्यासोबत घ्या.',
      medicine: 'गोळ्यांची बाटली स्कॅन केली: लिसिनोप्रिल १० मिग्रॅ. बाटलीत १४ गोळ्या उरल्या आहेत.',
      transport: '३ मीटरवर बस थांब्याचा फलक आहे. बस ४२ उत्तर दिशेने ३ मिनिटांत येत आहे.',
      navigate: 'दिशा मार्गदर्शन: ऑक लेनकडे ४५ मीटर सरळ चाला. तुमच्या उजवीकडे दारे आहेत.'
    },
    actions: {
      flashlightOn: 'टॉर्च चालू केला.',
      flashlightOff: 'टॉर्च बंद केला.',
      rearCamera: 'मागील कॅमेऱ्यावर स्विच केले.',
      frontCamera: 'पुढील कॅमेऱ्यावर स्विच केले.',
      spatialAudioOn: 'स्थानिक ऑडिओ चालू केला.',
      spatialAudioOff: 'स्थानिक ऑडिओ बंद केला.',
      visionActive: 'एआय व्हिजन चालू आहे.',
      visionPaused: 'एआय व्हिजन थांबवले आहे.'
    }
  },
  gu: {
    readyAnnouncement: 'નેવિડોર એઆઈ વિઝન આસિસ્ટન્ટ તૈયાર છે.',
    languageChanged: 'અવાજની ભાષા ગુજરાતી સેટ કરવામાં આવી છે.',
    modes: {
      assist: { name: 'મદદ', description: 'આગળનો રસ્તો સાફ છે.' },
      navigate: { name: 'માર્ગદર્શન', description: 'ઓક લેન તરફ 45 મીટર સીધા ચાલો.' },
      read: { name: 'વાંચો', description: 'દવાના પ્રિસ્ક્રિપ્શનનું લખાણ મળ્યું.' },
      medicine: { name: 'દવા', description: 'દવાની શીશી સ્કેન થઈ. 14 ગોળીઓ બાકી છે.' },
      transport: { name: 'પરિવહન', description: 'બસ 42 ઉત્તર તરફ 3 મિનિટમાં આવી રહી છે.' },
      emergency: { name: 'ઈમરજન્સી', description: 'ઈમરજન્સી એસઓએસ તૈયાર છે.' },
      family: { name: 'પરિવાર', description: 'પરિવાર લાઈવ સ્ટ્રીમ માટે તૈયાર છે.' },
      history: { name: 'ઇતિહાસ', description: '3 તાજેતરના લખાણ સેવ થયા છે.' },
      settings: { name: 'સેટિંગ્સ', description: 'સિસ્ટમ સેટિંગ્સ અને વિકલ્પો.' },
      languages: { name: 'ભાષાઓ', description: 'સક્રિય ભાષા: ગુજરાતી.' },
      location: { name: 'LOCATION', description: 'Live location tracking' },
      medical: { name: 'MEDICAL', description: 'Medical details' },
    },
    sceneDescriptions: {
      assist: 'આગળનો રસ્તો સાફ છે. 1.2 મીટર આગળ ખુરશી છે. જમણી બાજુએ 2.8 મીટર પર દરવાજો છે.',
      read: 'લખાણ વંચાઈ રહ્યું છે: લિસિનોપ્રિલ 10 મિલિગ્રામ. જમ્યા પછી રોજ 1 ગોળી લો.',
      medicine: 'દવાની બોટલ સ્કેન થઈ: લિસિનોપ્રિલ 10 મિલિગ્રામ. બોટલમાં 14 ગોળીઓ બાકી છે.',
      transport: '3 મીટર આગળ બસ સ્ટોપનું બોર્ડ છે. બસ 42 ઉત્તર તરફ 3 મિનિટમાં પહોંચશે.',
      navigate: 'નેવિગેશન માર્ગદર્શન: ઓક લેન તરફ 45 મીટર સીધા ચાલો. જમણી બાજુએ દરવાજા છે.'
    },
    actions: {
      flashlightOn: 'ટોર્ચ ચાલુ કરી.',
      flashlightOff: 'ટોર્ચ બંધ કરી.',
      rearCamera: 'પાછળના કેમેરા પર સ્વિચ કર્યું.',
      frontCamera: 'આગળના કેમેરા પર સ્વિચ કર્યું.',
      spatialAudioOn: 'સ્પેસિયલ ઓડિયો ચાલુ કર્યો.',
      spatialAudioOff: 'સ્પેસિયલ ઓડિયો બંધ કર્યો.',
      visionActive: 'એઆઈ વિઝન સક્રિય છે.',
      visionPaused: 'એઆઈ વિઝન અટકાવ્યું છે.'
    }
  },
  pa: {
    readyAnnouncement: 'ਨੇਵੀਡੋਰ ਏਆਈ ਵਿਜ਼ਨ ਅਸਿਸਟੈਂਟ ਤਿਆਰ ਹੈ।',
    languageChanged: 'ਆਵਾਜ਼ ਦੀ ਭਾਸ਼ਾ ਪੰਜਾਬੀ ਸੈੱਟ ਕੀਤੀ ਗਈ ਹੈ।',
    modes: {
      assist: { name: 'ਮਦਦ', description: 'ਅੱਗੇ ਦਾ ਰਸਤਾ ਸਾਫ਼ ਹੈ।' },
      navigate: { name: 'ਮਾਰਗਦਰਸ਼ਨ', description: 'ਓਕ ਲੇਨ ਵੱਲ 45 ਮੀਟਰ ਸਿੱਧੇ ਚੱਲੋ।' },
      read: { name: 'ਪੜ੍ਹੋ', description: 'ਦਵਾਈ ਦੀ ਪਰਚੀ ਦਾ ਲਿਖਿਆ ਪਛਾਣਿਆ ਗਿਆ।' },
      medicine: { name: 'ਦਵਾਈ', description: 'ਦਵਾਈ ਦੀ ਬੋਤਲ ਸਕੈਨ ਕੀਤੀ ਗਈ। 14 ਗੋਲੀਆਂ ਬਾਕੀ ਹਨ।' },
      transport: { name: 'ਟਰਾਂਸਪੋਰਟ', description: 'ਬੱਸ 42 ਉੱਤਰ ਵੱਲ 3 ਮਿੰਟ ਵਿੱਚ ਆ ਰਹੀ ਹੈ।' },
      emergency: { name: 'ਐਮਰਜੈਂਸੀ', description: 'ਐਮਰਜੈਂਸੀ ਐਸਓਐਸ ਤਿਆਰ ਹੈ।' },
      family: { name: 'ਪਰਿਵਾਰ', description: 'ਪਰਿਵਾਰ ਲਾਈਵ ਸਟ੍ਰੀਮ ਲਈ ਤਿਆਰ ਹੈ।' },
      history: { name: 'ਇਤਿਹਾਸ', description: '3 ਹਾਲੀਆ ਲਿਖਤਾਂ ਸੰਭਾਲੀਆਂ ਗਈਆਂ ਹਨ।' },
      settings: { name: 'ਸੈੱਟਿੰਗਾਂ', description: 'ਸਿਸਟਮ ਸੈੱਟਿੰਗਾਂ ਅਤੇ ਵਿਕਲਪ।' },
      languages: { name: 'ਭਾਸ਼ਾਵਾਂ', description: 'ਸਰਗਰਮ ਭਾਸ਼ਾ: ਪੰਜਾਬੀ।' },
      location: { name: 'LOCATION', description: 'Live location tracking' },
      medical: { name: 'MEDICAL', description: 'Medical details' },
    },
    sceneDescriptions: {
      assist: 'ਅੱਗੇ ਦਾ ਰਸਤਾ ਸਾਫ਼ ਹੈ। 1.2 ਮੀਟਰ ਅੱਗੇ ਕੁਰਸੀ ਹੈ। ਸੱਜੇ ਪਾਸੇ 2.8 ਮੀਟਰ ਤੇ ਦਰਵਾਜ਼ਾ ਹੈ।',
      read: 'ਦਸਤਾਵੇਜ਼ ਪੜ੍ਹਿਆ ਜਾ ਰਹਾ ਹੈ: ਲਿਸਿਨੋਪ੍ਰਿਲ 10 ਮਿਲੀਗ੍ਰਾਮ। ਰੋਟੀ ਤੋਂ ਬਾਅਦ ਰੋਜ਼ 1 ਗੋਲੀ ਲਵੋ।',
      medicine: 'ਦਵਾਈ ਦੀ ਬੋਤਲ ਸਕੈਨ ਕੀਤੀ ਗਈ: ਲਿਸਿਨੋਪ੍ਰਿਲ 10 ਮਿਲੀਗ੍ਰਾਮ। ਬੋਤਲ ਵਿੱਚ 14 ਗੋਲੀਆਂ ਬਾਕੀ ਹਨ।',
      transport: '3 ਮੀਟਰ ਅੱਗੇ ਬੱਸ ਸਟਾਪ ਦਾ ਬੋਰਡ ਹੈ। ਬੱਸ 42 ਉੱਤਰ ਵੱਲ 3 ਮਿੰਟ ਵਿੱਚ ਪਹੁੰਚੇਗੀ।',
      navigate: 'ਨੇਵੀਗੇਸ਼ਨ ਮਾਰਗਦਰਸ਼ਨ: ਓਕ ਲੇਨ ਵੱਲ 45 ਮੀਟਰ ਸਿੱਧੇ ਚੱਲੋ। ਸੱਜੇ ਪਾਸੇ ਦਰਵਾਜ਼ੇ ਹਨ।'
    },
    actions: {
      flashlightOn: 'ਟਾਰਚ ਚਾਲੂ ਕੀਤੀ ਗਈ।',
      flashlightOff: 'ਟਾਰਚ ਬੰਦ ਕੀਤੀ ਗਈ।',
      rearCamera: 'ਪਿੱਛਲੇ ਕੈਮਰੇ ਤੇ ਸਵਿੱਚ ਕੀਤਾ।',
      frontCamera: 'ਅਗਲੇ ਕੈਮਰੇ ਤੇ ਸਵਿੱਚ ਕੀਤਾ।',
      spatialAudioOn: 'ਸਪੇਸ਼ਲ ਆਡੀਓ ਚਾਲੂ ਹੈ।',
      spatialAudioOff: 'ਸਪੇਸ਼ਲ ਆਡੀਓ ਬੰਦ ਹੈ।',
      visionActive: 'ਏਆਈ ਵਿਜ਼ਨ ਸਰਗਰਮ ਹੈ।',
      visionPaused: 'ਏਆਈ ਵਿਜ਼ਨ ਰੋਕਿਆ ਗਿਆ ਹੈ।'
    }
  },
  bn: {
    readyAnnouncement: 'ন্যাভিডোর এআই ভিশন অ্যাসিস্ট্যান্ট প্রস্তুত।',
    languageChanged: 'ভয়েসের ভাষা বাংলায় সেট করা হয়েছে।',
    modes: {
      assist: { name: 'সহায়তা', description: 'সামনের পথ পরিষ্কার।' },
      navigate: { name: 'দিকনির্দেশ', description: 'ওক লেনের দিকে ৪৫ মিটার সোজা হাঁটুন।' },
      read: { name: 'পড়ুন', description: 'প্রেসক্রিপশনের লেখা শনাক্ত হয়েছে।' },
      medicine: { name: 'ঔষধ', description: 'ঔষধের বোতল স্ক্যান করা হয়েছে। ১৪ টি বড়ি বাকি আছে।' },
      transport: { name: 'পরিবহন', description: 'বাস ৪২ উত্তরমুখী ৩ মিনিটের মধ্যে আসছে।' },
      emergency: { name: 'জরুরি', description: 'জরুরি এসওএস প্রস্তুত।' },
      family: { name: 'পরিবার', description: 'পরিবার লাইভ স্ট্রিমের জন্য প্রস্তুত।' },
      history: { name: 'ইতিহাস', description: '৩ টি সাম্প্রতিক লেখা সংরক্ষিত হয়েছে।' },
      settings: { name: 'সেটিংস', description: 'সিস্টেম সেটিংস এবং অপশন।' },
      languages: { name: 'ভাষা', description: 'সক্রিয় ভাষা: বাংলা।' },
      location: { name: 'LOCATION', description: 'Live location tracking' },
      medical: { name: 'MEDICAL', description: 'Medical details' },
    },
    sceneDescriptions: {
      assist: 'সামনের পথ পরিষ্কার। ১.২ মিটার সামনে চেয়ার রয়েছে। ডানদিকে ২.৮ মিটারে একটি দরজা আছে।',
      read: 'লেখা পড়া হচ্ছে: লিসিনোপ্রিল ১০ মিগ্রা। খাওয়ার পর প্রতিদিন ১ টি বড়ি পানিসহ খাবেন।',
      medicine: 'ঔষধের বোতল স্ক্যান করা হয়েছে: লিসিনোপ্রিল ১০ মিগ্রা। বোতলে ১৪ টি বড়ি অবশিষ্ট আছে।',
      transport: '৩ মিটার সামনে বাস স্টপের সাইনবোর্ড। ৪২ নম্বর বাস ৩ মিনিটে পৌঁছাবে।',
      navigate: 'ন্যাভিগেশন নির্দেশিকা: ওক লেনের দিকে ৪৫ মিটার সোজা হাঁটুন। ডানদিকে দরজা রয়েছে।'
    },
    actions: {
      flashlightOn: 'ফ্ল্যাশলাইট চালু করা হয়েছে।',
      flashlightOff: 'ফ্ল্যাশলাইট বন্ধ করা হয়েছে।',
      rearCamera: 'পিছনের ক্যামেরায় স্যুইচ করা হয়েছে।',
      frontCamera: 'সামনের ক্যামেরায় স্যুইচ করা হয়েছে।',
      spatialAudioOn: 'স্প্যাশিয়াল অডিও চালু হয়েছে।',
      spatialAudioOff: 'স্প্যাশিয়াল অডিও বন্ধ হয়েছে।',
      visionActive: 'এআই ভিশন সক্রিয় করা হয়েছে।',
      visionPaused: 'এআই ভিশন সাময়িক বন্ধ।'
    }
  },
  ta: {
    readyAnnouncement: 'நேவிடோர் ஏஐ விஷன் உதவித் தயார்.',
    languageChanged: 'குரல் மொழி தமிழில் அமைக்கப்பட்டுள்ளது.',
    modes: {
      assist: { name: 'உதவி', description: 'முன்னால் பாதை தெளிவாக உள்ளது.' },
      navigate: { name: 'வழிகாட்டி', description: 'ஓக் லேன் நோக்கி 45 மீட்டர் நேராக நடக்கவும்.' },
      read: { name: 'படிக்க', description: 'மருந்துச் சீட்டு உரை கண்டறியப்பட்டது.' },
      medicine: { name: 'மருந்து', description: 'மருந்து பாட்டில் ஸ்கேன் செய்யப்பட்டது. 14 மாத்திரைகள் உள்ளன.' },
      transport: { name: 'போக்குவரத்து', description: 'பேருந்து 42 வடக்கு நோக்கி 3 நிமிடங்களில் வருகிறது.' },
      emergency: { name: 'அவசரம்', description: 'அவசர SOS தயார் நிலையில் உள்ளது.' },
      family: { name: 'குடும்பம்', description: 'குடும்பத்தினர் நேரலைக்குத் தயார்.' },
      history: { name: 'வரலாறு', description: '3 சமீபத்திய உரைகள் சேமிக்கப்பட்டுள்ளன.' },
      settings: { name: 'அமைப்புகள்', description: 'அமைப்புகள் மற்றும் விருப்பங்கள்.' },
      languages: { name: 'மொழிகள்', description: 'செயல்பாட்டில் உள்ள மொழி: தமிழ்.' },
      location: { name: 'LOCATION', description: 'Live location tracking' },
      medical: { name: 'MEDICAL', description: 'Medical details' },
    },
    sceneDescriptions: {
      assist: 'முன்னால் பாதை தெளிவாக உள்ளது. 1.2 மீட்டரில் நாற்காலி உள்ளது. வலதுபுறம் 2.8 மீட்டரில் கதவு உள்ளது.',
      read: 'உரை படிக்கப்படுகிறது: லிசினோபிரில் 10 மிகிராம். உணவுக்குப் பிறகு தினமும் 1 மாத்திரை எடுக்கவும்.',
      medicine: 'மருந்து பாட்டில் ஸ்கேன் செய்யப்பட்டது: லிசினோபிரில் 10 மிகிராம். 14 மாத்திரைகள் பாட்டிலில் உள்ளன.',
      transport: '3 மீட்டரில் பேருந்து நிறுத்தப் பலகை உள்ளது. பேருந்து 42 இன்னும் 3 நிமிடத்தில் வரும்.',
      navigate: 'வழிசெலுத்தல் வழிகாட்டல்: ஓக் லேன் நோக்கி 45 மீட்டர் நேராக நடக்கவும். வலதுபுறம் கதவுகள் உள்ளன.'
    },
    actions: {
      flashlightOn: 'ஃபிளாஷ்லைட் இயக்கப்பட்டது.',
      flashlightOff: 'ஃபிளாஷ்லைட் அணைக்கப்பட்டது.',
      rearCamera: 'பின்புற கேமராவுக்கு மாற்றப்பட்டது.',
      frontCamera: 'முன்புற கேமராவுக்கு மாற்றப்பட்டது.',
      spatialAudioOn: 'ஸ்பேஷியல் ஆடியோ இயக்கப்பட்டது.',
      spatialAudioOff: 'ஸ்பேஷியல் ஆடியோ அணைக்கப்பட்டது.',
      visionActive: 'ஏஐ விஷன் இயக்கப்பட்டது.',
      visionPaused: 'ஏஐ விஷன் நிறுத்தப்பட்டது.'
    }
  },
  te: {
    readyAnnouncement: 'నావిడోర్ ఏఐ విజన్ అసిస్టెంట్ సిద్ధంగా ఉంది.',
    languageChanged: 'వాయిస్ భాష తెలుగుకి మార్చబడింది.',
    modes: {
      assist: { name: 'సహాయం', description: 'ముందు దారి స్పష్టంగా ఉంది.' },
      navigate: { name: 'మార్గదర్శనం', description: 'ఓక్ లేన్ వైపు 45 మీటర్లు తిన్నగా నడవండి.' },
      read: { name: 'చదవండి', description: 'మందుల చీటీ పాఠం గుర్తించబడింది.' },
      medicine: { name: 'మందులు', description: 'మందుల సీసా స్కాన్ చేయబడింది. 14 మాత్రలు మిగిలి ఉన్నాయి.' },
      transport: { name: 'రవాణా', description: 'బస్సు 42 ఉత్తర దిశగా 3 నిమిషాల్లో వస్తోంది.' },
      emergency: { name: 'అత్యవసరం', description: 'అత్యవసర SOS సిద్ధంగా ఉంది.' },
      family: { name: 'కుటుంబం', description: 'కుటుంబ సభ్యులు లైవ్ స్ట్రీమ్ కొరకు సిద్ధంగా ఉన్నారు.' },
      history: { name: 'చరిత్ర', description: '3 ఇటీవలి పాఠాలు భద్రపరచబడ్డాయి.' },
      settings: { name: 'సెట్టింగ్‌లు', description: 'సిస్టమ్ సెట్టింగ్‌లు మరియు ఎంపికలు.' },
      languages: { name: 'భాషలు', description: 'ప్రస్తుత భాష: తెలుగు.' },
      location: { name: 'LOCATION', description: 'Live location tracking' },
      medical: { name: 'MEDICAL', description: 'Medical details' },
    },
    sceneDescriptions: {
      assist: 'ముందు దారి ఖాళీగా ఉంది. 1.2 మీటర్ల ముందు కుర్చీ ఉంది. కుడి వైపున 2.8 మీటర్ల దూరంలో తలుపు ఉంది.',
      read: 'పాఠం చదవబడుతోంది: లిసినోప్రిల్ 10mg. భోజనం తర్వాత రోజుకి 1 మాత్ర వేసుకోండి.',
      medicine: 'మందుల సీసా స్కాన్ చేయబడింది: లిసినోప్రిల్ 10mg. సీసాలో 14 మాత్రలు ఉన్నాయి.',
      transport: '3 మీటర్ల ముందు బస్ స్టాప్ బోర్డు ఉంది. 42వ నంబర్ బస్సు 3 నిమిషాల్లో వస్తుంది.',
      navigate: 'నేవిగేషన్ మార్గదర్శనం: ఓక్ లేన్ వైపు 45 మీటర్లు తిన్నగా నడవండి. కుడి వైపున తలుపులు ఉన్నాయి.'
    },
    actions: {
      flashlightOn: 'టార్చ్ లైట్ ఆన్ చేయబడింది.',
      flashlightOff: 'టార్చ్ లైట్ ఆఫ్ చేయబడింది.',
      rearCamera: 'వెనుక కెమెరాకి మార్చబడింది.',
      frontCamera: 'ముందు కెమెరాకి మార్చబడింది.',
      spatialAudioOn: 'స్పేషియల్ ఆడియో ఆన్ చేయబడింది.',
      spatialAudioOff: 'స్పేషియల్ ఆడియో ఆఫ్ చేయబడింది.',
      visionActive: 'ఏఐ విజన్ ఆన్ చేయబడింది.',
      visionPaused: 'ఏఐ విజన్ ఆపబడింది.'
    }
  },
  kn: {
    readyAnnouncement: 'ನ್ಯಾವಿಡೋರ್ ಎಐ ವಿಷನ್ ಅಸಿಸ್ಟೆಂಟ್ ಸಿದ್ಧವಾಗಿದೆ.',
    languageChanged: 'ಧ್ವನಿ ಭಾಷೆಯನ್ನು ಕನ್ನಡಕ್ಕೆ ಹೊಂದಿಸಲಾಗಿದೆ.',
    modes: {
      assist: { name: 'ಸಹಾಯ', description: 'ಮುಂದಿನ ಹಾದಿ ಸ್ಪಷ್ಟವಾಗಿದೆ.' },
      navigate: { name: 'ಮಾರ್ಗದರ್ಶನ', description: 'ಓಕ್ ಲೇನ್ ಕಡೆಗೆ 45 ಮೀಟರ್ ನೇರವಾಗಿ ನಡೆಯಿರಿ.' },
      read: { name: 'ಓದಿ', description: 'ಔಷಧಿ ಚೀಟಿಯ ಬರಹ ಪತ್ತೆಯಾಗಿದೆ.' },
      medicine: { name: 'ಔಷಧಿ', description: 'ಔಷಧಿ ಸೀಸೆ ಸ್ಕ್ಯಾನ್ ಆಗಿದೆ. 14 ಮಾತ್ರೆಗಳು ಬಾಕಿ ಇವೆ.' },
      transport: { name: 'ಸಾರಿಗೆ', description: 'ಬಸ್ 42 ಉತ್ತರ ದಿಕ್ಕಿಗೆ 3 ನಿಮಿಷದಲ್ಲಿ ಬರಲಿದೆ.' },
      emergency: { name: 'ತುರ್ತು', description: 'ತುರ್ತು SOS ಸಿದ್ಧವಾಗಿದೆ.' },
      family: { name: 'ಕುಟುಂಬ', description: 'ಕುಟುಂಬಸ್ಥರು ಲೈವ್ ಸ್ಟ್ರೀಮ್‌ಗೆ ಸಿದ್ಧರಾಗಿದ್ದಾರೆ.' },
      history: { name: 'ಇತಿಹಾಸ', description: '3 ಇತ್ತೀಚಿನ ಬರಹಗಳನ್ನು ಉಳಿಸಲಾಗಿದೆ.' },
      settings: { name: 'ಸೇಟಿಂಗ್ಸ್', description: 'ಸಿಸ್ಟಮ್ ಸೇಟಿಂಗ್ಸ್ ಮತ್ತು ಆಯ್ಕೆಗಳು.' },
      languages: { name: 'ಭಾಷೆಗಳು', description: 'ಸಕ್ರಿಯ ಭಾಷೆ: ಕನ್ನಡ.' },
      location: { name: 'LOCATION', description: 'Live location tracking' },
      medical: { name: 'MEDICAL', description: 'Medical details' },
    },
    sceneDescriptions: {
      assist: 'ಮುಂದಿನ ಹಾದಿ ಸ್ಪಷ್ಟವಾಗಿದೆ. 1.2 ಮೀಟರ್ ಮುಂದೆ ಕುರ್ಚಿ ಇದೆ. ಬಲಭಾಗದಲ್ಲಿ 2.8 ಮೀಟರ್ ದೂರದಲ್ಲಿ ಬಾಗಿಲಿದೆ.',
      read: 'ಬರಹ ಓದಲಾಗುತ್ತಿದೆ: ಲಿಸಿನೊಪ್ರಿಲ್ 10mg. ಊಟದ ನಂತರ ಪ್ರತಿದಿನ 1 ಮಾತ್ರೆ ತೆಗೆದುಕೊಳ್ಳಿ.',
      medicine: 'ಔಷಧಿ ಸೀಸೆ ಸ್ಕ್ಯಾನ್ ಆಗಿದೆ: ಲಿಸಿನೊಪ್ರಿಲ್ 10mg. ಸೀಸೆಯಲ್ಲಿ 14 ಮಾತ್ರೆಗಳು ಬಾಕಿ ಇವೆ.',
      transport: '3 ಮೀಟರ್ ಮುಂದೆ ಬಸ್ ನಿಲ್ದಾಣದ ಫಲಕವಿದೆ. 42 ನೇ ಸಂಖ್ಯೆಯ ಬಸ್ 3 ನಿಮಿಷದಲ್ಲಿ ತಲುಪಲಿದೆ.',
      navigate: 'ನ್ಯಾವಿಗೇಷನ್ ಮಾರ್ಗದರ್ಶನ: ಓಕ್ ಲೇನ್ ಕಡೆಗೆ 45 ಮೀಟರ್ ನೇರವಾಗಿ ನಡೆಯಿರಿ. ಬಲಭಾಗದಲ್ಲಿ ಬಾಗಿಲುಗಳಿವೆ.'
    },
    actions: {
      flashlightOn: 'ಟಾರ್ಚ್ ಲೈಟ್ ಆನ್ ಮಾಡಲಾಗಿದೆ.',
      flashlightOff: 'ಟಾರ್ಚ್ ಲೈಟ್ ಆಫ್ ಮಾಡಲಾಗಿದೆ.',
      rearCamera: 'ಹಿಂಭಾಗದ ಕ್ಯಾಮೆರಾಗೆ ಬದಲಾಯಿಸಲಾಗಿದೆ.',
      frontCamera: 'ಮುಂಬಾಗದ ಕ್ಯಾಮೆರಾಗೆ ಬದಲಾಯಿಸಲಾಗಿದೆ.',
      spatialAudioOn: 'ಸ್ಪೇಷಿಯಲ್ ಆಡಿಯೋ ಆನ್ ಆಗಿದೆ.',
      spatialAudioOff: 'ಸ್ಪೇಷಿಯಲ್ ಆಡಿಯೋ ಆಫ್ ಆಗಿದೆ.',
      visionActive: 'ಎಐ ವಿಷನ್ ಸಕ್ರಿಯವಾಗಿದೆ.',
      visionPaused: 'ಎಐ ವಿಷನ್ ತಡೆಹಿಡಿಯಲಾಗಿದೆ.'
    }
  },
  ml: {
    readyAnnouncement: 'നാവിഡോർ എഐ വിഷൻ അസിസ്റ്റന്റ് സജ്ജമാണ്.',
    languageChanged: 'ശബ്ദ ഭാഷ മലയാളത്തിലേക്ക് മാറ്റി.',
    modes: {
      assist: { name: 'സഹായം', description: 'മുന്നിലെ പാത വ്യക്തമാണ്.' },
      navigate: { name: 'വഴികാട്ടി', description: 'ഓക്ക് ലെയ്നിലേക്ക് 45 മീറ്റർ നേരെ നടക്കുക.' },
      read: { name: 'വായിക്കുക', description: 'മരുന്ന് കുറിപ്പിലെ വരികൾ കണ്ടെത്തി.' },
      medicine: { name: 'മരുന്ന്', description: 'മരുന്ന് കുപ്പി സ്കാൻ ചെയ്തു. 14 ഗുളികകൾ ബാക്കിയുണ്ട്.' },
      transport: { name: 'ഗതാഗതം', description: 'ബസ് 42 വടക്കോട്ട് 3 മിനിറ്റിനുള്ളിൽ എത്തും.' },
      emergency: { name: 'അടിയന്തിരം', description: 'അടിയന്തിര SOS സജ്ജമാണ്.' },
      family: { name: 'കുടുംബം', description: 'കുടുംബാംഗങ്ങൾ ലൈവ് സ്ട്രീമിനായി സജ്ജമാണ്.' },
      history: { name: 'ചരിത്രം', description: '3 സമീപകാല കുറിപ്പുകൾ സൂക്ഷിച്ചിരിക്കുന്നു.' },
      settings: { name: 'സെറ്റിംഗ്സ്', description: 'സിസ്റ്റം സെറ്റിംഗ്സുകളും ഓപ്ഷനുകളും.' },
      languages: { name: 'ഭാഷകൾ', description: 'നിലവിലെ ഭാഷ: മലയാളം.' },
      location: { name: 'LOCATION', description: 'Live location tracking' },
      medical: { name: 'MEDICAL', description: 'Medical details' },
    },
    sceneDescriptions: {
      assist: 'മുന്നിലെ വഴി വ്യക്തമാണ്. 1.2 മീറ്റർ മുന്നിൽ കസേരയുണ്ട്. വലതുവശത്ത് 2.8 മീറ്ററിൽ വാതിലുണ്ട്.',
      read: 'രേഖ വായിക്കുന്നു: ലിസിനോപ്രിൽ 10mg. ഭക്ഷണത്തിന് ശേഷം ദിവസവും 1 ഗുളിക കഴിക്കുക.',
      medicine: 'മരുന്ന് കുപ്പി സ്കാൻ ചെയ്തു: ലിസിനോപ്രിൽ 10mg. കുപ്പിയിൽ 14 ഗുളികകൾ ബാക്കിയുണ്ട്.',
      transport: '3 മീറ്റർ മുന്നിൽ ബസ് സ്റ്റോപ്പ് ബോർഡ് ഉണ്ട്. ബസ് 42 ഇനിയും 3 മിനിറ്റിൽ എത്തും.',
      navigate: 'വഴികാട്ടൽ നിർദ്ദേശം: ഓക്ക് ലെയ്നിലേക്ക് 45 മീറ്റർ നേരെ നടക്കുക. വലതുവശത്ത് വാതിലുകളുണ്ട്.'
    },
    actions: {
      flashlightOn: 'ടോർച്ച് ലൈറ്റ് ഓൺ ചെയ്തു.',
      flashlightOff: 'ടോർച്ച് ലൈറ്റ് ഓഫ് ചെയ്തു.',
      rearCamera: 'പിൻ ക്യാമറയിലേക്ക് മാറ്റി.',
      frontCamera: 'മുൻ ക്യാമറയിലേക്ക് മാറ്റി.',
      spatialAudioOn: 'സ്പേഷ്യൽ ഓഡിയോ ഓൺ ചെയ്തു.',
      spatialAudioOff: 'സ്പേഷ്യൽ ഓഡിയോ ഓഫ് ചെയ്തു.',
      visionActive: 'എഐ വിഷൻ സജീവമാക്കി.',
      visionPaused: 'എഐ വിഷൻ നിർത്തിവെച്ചു.'
    }
  }
};

export function getTranslation(code: SupportedLanguageCode): TranslationDictionary {
  return TRANSLATIONS[code] || TRANSLATIONS.en;
}
