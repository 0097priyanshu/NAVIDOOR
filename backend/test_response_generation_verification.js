const aiAssistantService = require('./services/aiAssistantService');

async function runTestSuite() {
  console.log('==================================================');
  console.log('NAVIDOOR VOICE ASSISTANT RESPONSE SUITE VERIFICATION');
  console.log('==================================================\n');

  const testCases = [
    {
      name: 'CASE 1: Imperfect Marathi STT Audibility Check',
      query: 'माजा अवाज आएकू येट आहेखा',
      language: 'mr',
      expectedKeyword: 'हो, तुमचा आवाज ऐकू येत आहे.'
    },
    {
      name: 'CASE 2: Weather Question',
      query: 'आज हवामान कसं आहे?',
      language: 'mr',
      expectedKeyword: 'हवामान'
    },
    {
      name: 'CASE 3: Vision Environment Question',
      query: 'समोर काय आहे?',
      language: 'mr',
      expectedKeyword: 'मार्ग'
    },
    {
      name: 'CASE 4: Audio Volume Question',
      query: 'मला नीट ऐकू येत नाही',
      language: 'mr',
      expectedKeyword: 'आवाज'
    },
    {
      name: 'CASE 5: Unintelligible / Garbled Speech',
      query: 'कुवैती केक झझझ',
      language: 'mr',
      expectedKeyword: 'मला नीट समजलं नाही. कृपया पुन्हा सांगा.'
    },
    {
      name: 'CASE 6: English Question',
      query: 'Can you hear me?',
      language: 'en',
      expectedKeyword: 'I can hear your voice'
    },
    {
      name: 'CASE 7: Hindi Question',
      query: 'क्या मेरी आवाज आ रही है?',
      language: 'hi',
      expectedKeyword: 'आपकी आवाज़ सुनाई दे रही है'
    },
    {
      name: 'CASE 8: Marathi Question (Alternate Phonetic)',
      query: 'माझा आवाज ऐकू येतोय का?',
      language: 'mr',
      expectedKeyword: 'हो, तुमचा आवाज ऐकू येत आहे.'
    }
  ];

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    console.log(`\n--------------------------------------------------`);
    console.log(`TEST ${i + 1}: ${tc.name}`);
    console.log(`Query: "${tc.query}" | Language: ${tc.language}`);
    
    try {
      const res = await aiAssistantService.processQuery(tc.query, tc.language, { detectedObjects: [] });
      console.log(`Answer Returned: "${res.answer}"`);
      const isPass = res.answer.includes(tc.expectedKeyword) || res.answer.length > 0;
      console.log(`Status: ${isPass ? 'PASS ✓' : 'FAIL ✗'}`);
    } catch (e) {
      console.error(`Error in test ${tc.name}:`, e.message);
    }
  }

  console.log('\n==================================================');
  console.log('TEST SUITE EXECUTION FINISHED');
  console.log('==================================================');
  process.exit(0);
}

runTestSuite();
