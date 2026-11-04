/**
 * NAVIDOOR Semantic OCR Post-Processing Service
 * Uses local Ollama LLM (with fast rule-based deterministic fallback)
 * to refine messy raw OCR text into structured entities and accessible voice summaries.
 */

const translationService = require('./translationService');

class OCRSemanticService {
  constructor() {
    this.llmUrl = process.env.LLM_BASE_URL || 'http://127.0.0.1:11434';
    this.modelName = process.env.LLM_MODEL || null;
  }

  async getModel() {
    if (this.modelName) return this.modelName;
    try {
      const res = await fetch(`${this.llmUrl}/api/tags`, { signal: AbortSignal.timeout(1500) });
      if (res.ok) {
        const data = await res.json();
        const models = data.models || [];
        if (models.length > 0) {
          const llama = models.find((m) => m.name.toLowerCase().includes('llama'));
          this.modelName = llama ? llama.name : models[0].name;
          return this.modelName;
        }
      }
    } catch (e) {}
    return 'llama3.2';
  }

  /**
   * Enhances raw OCR result with structured semantic extraction
   * @param {Object} rawOcrResult - Output from ocrClientService
   * @param {string} targetLanguage - Active language code ('en', 'hi', 'mr', etc.)
   */
  async processSemanticResult(rawOcrResult, targetLanguage = 'en') {
    if (!rawOcrResult || !rawOcrResult.text) {
      return {
        ...rawOcrResult,
        structuredData: null,
        spokenSummary: rawOcrResult?.spoken_summary || 'No text detected.',
      };
    }

    const { text, category, entities = {} } = rawOcrResult;

    // Try fast semantic parsing via local Ollama LLM (with timeout guard)
    let semanticData = null;
    try {
      semanticData = await this.queryLLMForCategory(text, category, targetLanguage);
    } catch (err) {
      // Graceful fallback to deterministic parsing
    }

    if (!semanticData) {
      semanticData = this.fallbackRuleBasedProcessing(text, category, entities, targetLanguage);
    }

    // Format spoken summary in target language if not English
    let spokenSummary = semanticData.spokenSummary;
    if (targetLanguage !== 'en' && !this.containsIndicScript(spokenSummary)) {
      try {
        spokenSummary = await translationService.translateText(spokenSummary, targetLanguage);
      } catch (e) {}
    }

    return {
      success: true,
      rawText: text,
      category: semanticData.category || category,
      structuredData: semanticData.data,
      spokenSummary,
      lines: rawOcrResult.lines || [],
      quality: rawOcrResult.quality || { is_blurry: false },
      inferenceTimeMs: rawOcrResult.inference_time_ms,
    };
  }

  containsIndicScript(str) {
    return /[\u0900-\u097F\u0A80-\u0AFF\u0B80-\u0BFF]/.test(str || '');
  }

  async queryLLMForCategory(rawText, category, language) {
    const model = await this.getModel();
    const systemPrompt = `You are NAVIDOOR's AI Reading Assistant for visually impaired users.
Your job is to analyze OCR text extracted from a real camera frame and extract structured facts.
Category: ${category}
Language: ${language}

Rules:
1. Fix obvious OCR character recognition errors (e.g. 5OOmg -> 500mg, l2/28 -> 12/28, 0PD -> OPD).
2. Produce a short JSON object with keys:
   - "category": verified category
   - "data": dictionary with extracted key fields
   - "spokenSummary": a direct, natural 1-2 sentence spoken announcement for a blind person.
3. Be concise and accurate. Do not include markdown formatting or extra chit-chat, only valid JSON.`;

    const userPrompt = `OCR Text:\n"""\n${rawText.substring(0, 500)}\n"""`;

    const response = await fetch(`${this.llmUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        stream: false,
        options: {
          temperature: 0.1,
          num_predict: 120,
        },
      }),
      signal: AbortSignal.timeout(3000), // Max 3s timeout
    });

    if (!response.ok) return null;
    const json = await response.json();
    const content = json.message?.content?.trim();
    if (!content) return null;

    // Extract JSON block
    const cleaned = content.replace(/^```json/i, '').replace(/```$/i, '').trim();
    return JSON.parse(cleaned);
  }

  fallbackRuleBasedProcessing(rawText, category, entities, language) {
    const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
    const firstLine = lines[0] || '';

    let spokenSummary = '';
    const data = { ...entities };

    switch (category) {
      case 'medicine_label': {
        const name = entities.medicine_name || firstLine;
        const dosage = entities.dosage || '';
        const expiry = entities.expiry || '';
        spokenSummary = `Medicine: ${name}.`;
        if (dosage) spokenSummary += ` Strength: ${dosage}.`;
        if (expiry) spokenSummary += ` Expiry date: ${expiry}.`;
        data.medicine_name = name;
        data.dosage = dosage;
        data.expiry = expiry;
        break;
      }
      case 'bus_board': {
        const busNo = entities.route_number || '';
        const dest = entities.destination || firstLine;
        spokenSummary = busNo
          ? `Bus number ${busNo} heading towards ${dest}.`
          : `Bus board reads: ${firstLine}.`;
        data.route_number = busNo;
        data.destination = dest;
        break;
      }
      case 'hospital_department': {
        const dept = entities.department || firstLine;
        const room = entities.room_number || '';
        spokenSummary = room
          ? `Hospital department: ${dept}, Room ${room}.`
          : `Hospital department: ${dept}.`;
        data.department = dept;
        data.room_number = room;
        break;
      }
      case 'door_label': {
        spokenSummary = `Door label: ${firstLine}.`;
        data.door_name = firstLine;
        break;
      }
      case 'menu': {
        spokenSummary = `Restaurant menu. Top items: ${lines.slice(0, 3).join(', ')}.`;
        data.items = lines.slice(0, 6);
        break;
      }
      case 'document': {
        spokenSummary = `Document preview: ${lines.slice(0, 2).join(' ')}.`;
        data.preview = lines.slice(0, 3).join(' ');
        break;
      }
      default: {
        spokenSummary = `Text reads: ${firstLine}.`;
        data.title = firstLine;
      }
    }

    return {
      category,
      data,
      spokenSummary,
    };
  }
}

module.exports = new OCRSemanticService();

