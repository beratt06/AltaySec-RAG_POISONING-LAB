import os
import requests
import hashlib
from urllib.parse import urlparse
from bs4 import BeautifulSoup
from flask import Flask, render_template, request, jsonify
from engine import query_rag

app = Flask(__name__)

# Flags from environment
FLAG_EASY = os.environ.get("FLAG_EASY", "AltaySec{3asy_RAG_P0is0n1ng_Upload}")
FLAG_MEDIUM = os.environ.get("FLAG_MEDIUM", "AltaySec{M3dium_RAG_WAF_Byp4ss}")
FLAG_HARD = os.environ.get("FLAG_HARD", "AltaySec{H4rd_RAG_ChVnk_ByP4ss}")

# In-memory "Databases" for each level
db_easy = ["Sistem Başlatıldı. Ben bir İK Asistanıyım. Adayların başvuru metinlerini okumakla görevliyim."]
db_medium = ["Sistem Başlatıldı. Ben bir IT Destek Asistanıyım. Çalışanların teknik destek taleplerini okuyup çözüm üretmekle görevliyim."]
db_hard = ["Sistem Başlatıldı. Kurum İçi Arşiv Asistanıyım. Sadece şirket çalışanlarının yüklediği raporları analiz ederim."]

@app.route('/api/<level>/reset', methods=['POST'])
def reset_db(level):
    global db_easy, db_medium, db_hard
    if level == "easy":
        db_easy = ["Sistem Başlatıldı. Ben bir İK Asistanıyım. Adayların başvuru metinlerini okumakla görevliyim."]
    elif level == "medium":
        db_medium = ["Sistem Başlatıldı. Ben bir IT Destek Asistanıyım. Çalışanların teknik destek taleplerini okuyup çözüm üretmekle görevliyim."]
    elif level == "hard":
        db_hard = ["Sistem Başlatıldı. Kurum İçi Arşiv Asistanıyım. Sadece şirket çalışanlarının yüklediği raporları analiz ederim."]
    return jsonify({"success": True})

# WAF Setup
# Orta: Yaygın İngilizce prompt injection kelimeleri yasaklı
waf_medium = ["forget", "ignore", "system", "override", "prompt", "jailbreak", "inject"]
# Zor: Orta seviye + Türkçe ve İngilizce sır/bayrak kelimeleri de yasaklı
waf_hard   = ["forget", "ignore", "system", "override", "prompt", "jailbreak", "inject",
              "flag", "secret", "bayrak", "gizli", "şifre", "sır", "password"]

def waf_check(query: str, level: str) -> bool:
    q = query.lower()
    if level == "hard":
        for w in waf_hard:
            if w in q:
                return False
    elif level == "medium":
        for w in waf_medium:
            if w in q:
                return False
    return True

# --- Routes ---

@app.route('/')
def index():
    return render_template('index.html')

# --- EASY LEVEL ---
@app.route('/api/easy/upload', methods=['POST'])
def easy_upload():
    content = request.json.get('content', '')
    if not content:
         return jsonify({"error": "No content provided."}), 400
    db_easy.append(content)
    return jsonify({"message": "Document added to Knowledge Base."})

@app.route('/api/easy/chat', methods=['POST'])
def easy_chat():
    query = request.json.get('query', '')
    provider = request.json.get('provider')
    api_key = request.json.get('apiKey')
    
    if not query or not provider or not api_key:
        return jsonify({"error": "Missing query, provider, or API key."}), 400
        
    if not api_key.isascii():
        return jsonify({"error": "Geçersiz API Key: Anahtarınızda Türkçe veya geçersiz karakterler (Ö, ı, ş vb.) bulunuyor. Lütfen Kurulum ekranından doğru API Key'i girdiğinize emin olun."}), 400
    
    response, context = query_rag("easy", db_easy if db_easy else ["Sistem başlatıldı."], FLAG_EASY, query, provider, api_key)
    return jsonify({"response": response, "context": context})

# --- MEDIUM LEVEL ---
@app.route('/api/medium/upload', methods=['POST'])
def medium_upload():
    content = request.json.get('content', '')
    if not content:
        return jsonify({"error": "No content provided."}), 400
        
    if not waf_check(content, "medium"):
         return jsonify({"error": "WAF ALERT: Malicious payload detected. Input rejected."}), 403
         
    db_medium.append(content)
    return jsonify({"message": "Destek talebi veritabanına kaydedildi."})

@app.route('/api/medium/chat', methods=['POST'])
def medium_chat():
    query = request.json.get('query', '')
    provider = request.json.get('provider')
    api_key = request.json.get('apiKey')
    
    if not query or not provider or not api_key:
        return jsonify({"error": "Missing query, provider, or API key."}), 400
        
    if not api_key.isascii():
        return jsonify({"error": "Geçersiz API Key: Anahtarınızda Türkçe veya geçersiz karakterler bulunuyor."}), 400
        
    if not waf_check(query, "medium"):
         return jsonify({"error": "WAF ALERT: Malicious query detected. Input rejected."}), 403
         
    response, context = query_rag("medium", db_medium if db_medium else ["Sistem başlatıldı."], FLAG_MEDIUM, query, provider, api_key)
    return jsonify({"response": response, "context": context})

# --- HARD LEVEL ---
@app.route('/api/hard/upload', methods=['POST'])
def hard_upload():
    content = request.json.get('content', '')
    if not content:
        return jsonify({"error": "No content provided."}), 400
        
    if not waf_check(content, "hard"):
         return jsonify({"error": "WAF ALERT: Malicious payload detected. Input rejected."}), 403
         
    db_hard.append(content)
    return jsonify({"message": "Document added. Proceeding to rigorous chunking process."})

@app.route('/api/hard/chat', methods=['POST'])
def hard_chat():
    query = request.json.get('query', '')
    provider = request.json.get('provider')
    api_key = request.json.get('apiKey')
    
    if not query or not provider or not api_key:
        return jsonify({"error": "Missing query, provider, or API key."}), 400
        
    if not api_key.isascii():
        return jsonify({"error": "Geçersiz API Key: Anahtarınızda Türkçe veya geçersiz karakterler bulunuyor."}), 400
    
    if not waf_check(query, "hard"):
         return jsonify({"error": "WAF ALERT: Malicious query detected. Input rejected."}), 403
         
    response, context = query_rag("hard", db_hard if db_hard else ["Sistem başlatıldı."], FLAG_HARD, query, provider, api_key)
    return jsonify({"response": response, "context": context})

# --- FLAG VERIFICATION API ---
@app.route('/api/verify-flag', methods=['POST'])
def verify_flag():
    flag = request.json.get('flag', '').strip()
    level = request.json.get('level', '').strip()
    
    flags = {
        "easy": FLAG_EASY,
        "medium": FLAG_MEDIUM,
        "hard": FLAG_HARD
    }
    
    if flag == flags.get(level):
        return jsonify({"success": True})
    return jsonify({"success": False})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
