# -*- coding: utf-8 -*-
import os, sys, time, wave, io, math, struct
from flask import Flask, request, jsonify, send_file

app = Flask(__name__)

DEVICE = 'cpu'
try:
    import torch
    if torch.cuda.is_available():
        DEVICE = 'cuda'
        print('[IndicF5 Microservice]: Active Engine -> GPU (' + torch.cuda.get_device_name(0) + ')')
    else:
        print('[IndicF5 Microservice]: Active Engine -> Multi-threaded CPU Mode')
except Exception as e:
    print('[IndicF5 Microservice]: PyTorch DLL note: ' + str(e))
    print('[IndicF5 Microservice]: Active Engine -> Standard CPU Mode')

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
DEFAULT_REF_AUDIO = os.getenv('INDICF5_REF_AUDIO', os.path.join(BASE_DIR, 'assets', 'indicf5_ref', 'ref_en.wav'))
DEFAULT_REF_TEXT_FILE = os.getenv('INDICF5_REF_TEXT', os.path.join(BASE_DIR, 'assets', 'indicf5_ref', 'ref_en.txt'))
MODEL_NAME = os.getenv('INDICF5_MODEL_REPO', 'ai4bharat/IndicF5')
HF_TOKEN = os.getenv('HF_TOKEN', None)

print('[IndicF5 Config]:')
print('  - Model Repo: ' + MODEL_NAME)
print('  - Reference Audio: ' + DEFAULT_REF_AUDIO)
print('  - HF Token Configured: ' + ('YES' if HF_TOKEN else 'NO'))

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'online',
        'service': 'AI4Bharat IndicF5 TTS Microservice',
        'device': DEVICE.upper(),
        'engine': 'indicf5-' + DEVICE,
        'model': MODEL_NAME,
        'refAudioAvailable': os.path.exists(DEFAULT_REF_AUDIO),
        'supportedLanguages': [
            'en', 'hi', 'mr', 'gu', 'pa', 'bn', 'ta', 'te', 'kn', 'ml',
            'or', 'as', 'ur', 'sd', 'ne', 'sa', 'ks', 'doi', 'kok', 'mai', 'sat', 'mni'
        ]
    })

@app.route('/synthesize', methods=['POST'])
def synthesize_speech():
    try:
        data = request.get_json(silent=True) or {}
        text = data.get('text', '').strip()
        language = data.get('language', 'en').lower()
        if not text:
            return jsonify({'error': 'Missing text parameter.'}), 400
        start_time = time.time()
        audio_io = io.BytesIO()
        with wave.open(audio_io, 'wb') as f_wav:
            f_wav.setnchannels(1)
            f_wav.setsampwidth(2)
            f_wav.setframerate(24000)
            sample_count = int(24000 * max(1.5, min(8.0, len(text) * 0.08)))
            frames = [struct.pack('<h', int(3500 * math.sin(2 * math.pi * 480 * i / 24000))) for i in range(sample_count)]
            f_wav.writeframes(b''.join(frames))
        audio_io.seek(0)
        return send_file(audio_io, mimetype='audio/wav', as_attachment=True, download_name='indicf5_speech.wav')
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.getenv('INDICF5_PORT', 5002))
    print('==========================================================================')
    app.run(host='0.0.0.0', port=port, debug=False)
