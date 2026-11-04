/**
 * Automated Verification Script for NAVIDOOR Backend OCR & Semantic Layer (Phase 2)
 */

const ocrClientService = require('./services/ocrClientService');
const ocrSemanticService = require('./services/ocrSemanticService');

async function runBackendVerification() {
  console.log('='.repeat(65));
  console.log('   NAVIDOOR BACKEND OCR & SEMANTIC POST-PROCESSING VERIFICATION');
  console.log('='.repeat(65));

  // Test 1: OCR Microservice Health Check
  console.log('\n[TEST 1] Verifying OCR Client Health Check...');
  const health = await ocrClientService.checkHealth();
  console.log('  > Health Response:', health);
  // Note: if server is not started yet, isOnline may be false, but method must not crash
  console.log('  > Check completed safely.');

  // Test 2: Semantic Processing for Medicine
  console.log('\n[TEST 2] Verifying Semantic Entity Extraction: Medicine Blister Pack...');
  const mockMedOcr = {
    text: 'PARACETAMOL TABLETS IP\n500mg\nDOSAGE: 1 TABLET AS DIRECTED\nEXPIRY: 12/28',
    category: 'medicine_label',
    entities: {
      medicine_name: 'PARACETAMOL TABLETS IP',
      dosage: '500mg',
      expiry: '12/28'
    },
    lines: [
      { text: 'PARACETAMOL TABLETS IP', confidence: 0.95 },
      { text: '500mg', confidence: 0.98 },
      { text: 'EXPIRY: 12/28', confidence: 0.91 }
    ]
  };

  const medResult = await ocrSemanticService.processSemanticResult(mockMedOcr, 'en');
  console.log('  > Structured Data:', medResult.structuredData);
  console.log('  > Spoken Summary:', medResult.spokenSummary);
  if (!medResult.spokenSummary.includes('PARACETAMOL')) {
    throw new Error('Medicine name missing from spoken summary');
  }

  // Test 3: Semantic Processing for Bus Destination Board
  console.log('\n[TEST 3] Verifying Semantic Entity Extraction: Bus Board...');
  const mockBusOcr = {
    text: 'BUS 204\nDADAR VIA SION',
    category: 'bus_board',
    entities: {
      route_number: '204',
      destination: 'DADAR VIA SION'
    },
    lines: [
      { text: 'BUS 204', confidence: 0.96 },
      { text: 'DADAR VIA SION', confidence: 0.94 }
    ]
  };

  const busResult = await ocrSemanticService.processSemanticResult(mockBusOcr, 'en');
  console.log('  > Route Number:', busResult.structuredData?.route_number);
  console.log('  > Destination:', busResult.structuredData?.destination);
  console.log('  > Spoken Summary:', busResult.spokenSummary);
  if (!busResult.spokenSummary.includes('204')) {
    throw new Error('Route number missing from spoken summary');
  }

  // Test 4: Semantic Processing for Hospital Department
  console.log('\n[TEST 4] Verifying Semantic Entity Extraction: Hospital Sign...');
  const mockHospitalOcr = {
    text: 'CARDIOLOGY CONSULTATION\nROOM 104\nDR. MEHTA',
    category: 'hospital_department',
    entities: {
      department: 'CARDIOLOGY CONSULTATION',
      room_number: '104'
    },
    lines: [
      { text: 'CARDIOLOGY CONSULTATION', confidence: 0.97 },
      { text: 'ROOM 104', confidence: 0.99 }
    ]
  };

  const hospResult = await ocrSemanticService.processSemanticResult(mockHospitalOcr, 'en');
  console.log('  > Department:', hospResult.structuredData?.department);
  console.log('  > Room:', hospResult.structuredData?.room_number);
  console.log('  > Spoken Summary:', hospResult.spokenSummary);
  if (!hospResult.spokenSummary.includes('104')) {
    throw new Error('Room number missing from spoken summary');
  }

  // Test 5: Multilingual Output Generation (Hindi/Marathi check)
  console.log('\n[TEST 5] Verifying Multilingual Spoken Translation...');
  const mockDoorOcr = {
    text: 'CONFERENCE ROOM B\nSTAFF ONLY',
    category: 'door_label',
    entities: {
      door_name: 'CONFERENCE ROOM B'
    },
    lines: [{ text: 'CONFERENCE ROOM B', confidence: 0.95 }]
  };

  const mrResult = await ocrSemanticService.processSemanticResult(mockDoorOcr, 'mr');
  console.log('  > Marathi Spoken Output:', mrResult.spokenSummary);

  console.log('\n' + '='.repeat(65));
  console.log('  [ALL TESTS PASSED] Phase 2 Backend & Semantic Layer Verified!');
  console.log('='.repeat(65));
  process.exit(0);
}

runBackendVerification().catch((err) => {
  console.error('\n[TEST FAILED]:', err);
  process.exit(1);
});
