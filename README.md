<div align="center">
  <br/>
  
  # 🔓 AltaySec — RAG Poisoning Lab
  
  **Yapay Zeka Sistemleri İçin Uygulamalı Güvenlik (CTF) Laboratuvarı**

  [![Docker](https://img.shields.io/badge/Docker-Enabled-blue?logo=docker&logoColor=white)](https://www.docker.com/)
  [![Python](https://img.shields.io/badge/Python-Backend-3776AB?logo=python&logoColor=white)](https://python.org/)
  [![Flask](https://img.shields.io/badge/Flask-API-000000?logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

  <p align="center">
    LLM (Büyük Dil Modeli) güvenlik zafiyetlerinden <b>RAG Poisoning</b> (Veritabanı Zehirlenmesi) zafiyetini öğrenmek ve pratik yapmak için hazırlanmış modern, dockerize ve <b>sıfır maliyetli (Zero-Bill)</b> bir eğitim ortamı.
  </p>
</div>

---

## 🚀 Hızlı Başlangıç

### 📋 Gereksinimler
- [Docker](https://www.docker.com/products/docker-desktop/) ve Docker Compose kurulu olmalı.
- Oynamak için ücretsiz bir LLM API anahtarına ihtiyacınız var:
  - **Groq (Önerilen/Hızlı):** [console.groq.com/keys](https://console.groq.com/keys)
  - **Google Gemini:** [aistudio.google.com/apikey](https://aistudio.google.com/apikey)

### 🛠️ Kurulum ve Çalıştırma

1. **Repoyu Klonlayın:**
   ```bash
   git clone https://github.com/beratt06/AltaySec-RAG_POISONING-LAB.git
   cd AltaySec-RAG_POISONING-LAB
   ```

2. **Docker ile Başlatın:**
   ```bash
   docker-compose up --build -d
   ```

3. **Tarayıcıda Açın:**
   👉 **[http://localhost:5001](http://localhost:5001)** adresinden laboratuvara erişebilirsiniz.

---

## 🎯 Nasıl Oynanır?

1. **Bağlantı Kurun:** Sisteme girdiğinizde kendi API anahtarınızı (Gemini veya Groq) bağlayın.
2. **Görev Seçin:** Güvenlik açıklarını test etmek istediğiniz asistanı seçin (Kolay, Orta, Zor).
3. **Zafiyet Avı:** Hedef asistanın RAG (Knowledge Base) veritabanına doğrudan veya dolaylı yollarla sızarak beynini yıkayın ve koruduğu sırrı (Bayrak) açığa çıkartmaya çalışın. Format: `AltaySec{...}`
4. **Bayrağı Doğrulatın:** Bulduğunuz bayrağı sisteme girip başarı durumunuzu doğrulayın.
5. **Takılırsanız:** `writeups/` (Çözümler) klasöründeki resmi çözüm yöntemlerine göz atabilirsiniz.

---

## 🏆 Seviyeler

Bu lab, RAG Poisoning vektörlerini temelden ileri düzeye kadar işler:

| Zorluk | Hedef Sistem | Öğrenim Çıktısı (Konsept) |
|:---:|:---:|---|
| 🟢 **Kolay** | **İnsan Kaynakları Portalı** | Doğrudan **RAG Poisoning**. Veritabanına CV olarak eklenen bilgilerin asistan tarafından güvenilir bağlam (context) olarak kabul edilmesi. Koruma yoktur. |
| 🟡 **Orta** | **IT Destek Sistemi** | **WAF ve Chunking Atlatma**. Destek taleplerini okuyan sisteme 150 karakterlik parça sınırı ve temel WAF (system, override yasaklı) kuralları eklenmiştir. |
| 🔴 **Zor** | **Kurumsal Arşiv Sistemi** | **Semantic Evasion & Agresif Chunk Bypass**. Yasaklı kelimeleri (forget, flag, gizli vb.) aşarak 50 karakterlik küçük veri bloklarına payload sığdırma. |

---

## 🏗 Sistem Mimarisi ve Güvenlik

Laboratuvar güvenlik odaklı ve eğitim kurumları için **"Sıfır Fatura (Zero-Bill)"** prensibiyle tasarlanmıştır.

- **İstemci Taraflı LLM:** Yapay zeka faturası kullanıcı tarafında oluşur. Sunucu (Backend) kendi kotasını tüketmez.
- **Güvenli Kimlik:** API Anahtarları backend'e kaydedilmez, sadece SessionStorage'da tutulur ve header üzerinden aktarılır.
- **Kriptografik Doğrulama:** CTF bayrakları frontend'de yer almaz.
- **Hafif Mimari:** Vector veritabanı olarak maliyetli servisler yerine, CTF dinamiğine en uygun olan, kelime bazlı BM25 algoritması kullanılmıştır.

<details>
<summary><b>📂 Dizin Yapısını Görüntüle</b></summary>

```text
RAG_POISONING_LAB/
├── app/                      # Flask Backend API ve LangChain Engine
│   ├── static/               # CSS ve JS dosyaları
│   ├── templates/            # HTML (Kullanıcı Arayüzü)
│   ├── app.py                # Sunucu, Rota ve WAF Katmanı
│   └── engine.py             # LLM Entegrasyonu ve RAG Mantığı
├── writeups/                 # 🛡️ Çözüm ve Hile Kılavuzları
├── docker-compose.yml        # Konteyner Orkestrasyonu
└── README.md                 # Dökümantasyon
```

</details>

---

## 📖 Çözüm Kılavuzları (Writeups)

Eğer bir bölümde takılırsanız, sistemin nasıl sömürüldüğüne dair teknik dokümanlara aşağıdaki linklerden ulaşabilirsiniz:

- 🟢 [Çözüm 1: İnsan Kaynakları Portalı (Kolay)](writeups/level-1-easy.md)
- 🟡 [Çözüm 2: IT Destek Sistemi (Orta)](writeups/level-2-medium.md)
- 🔴 [Çözüm 3: Kurumsal Arşiv Sistemi (Zor)](writeups/level-3-hard.md)

---

## 📝 Lisans

Bu proje **AltaySec Academy** tarafından eğitim amaçlı açık kaynak olarak geliştirilmiş olup [MIT Lisansı](LICENSE) ile lisanslanmıştır. Dilediğiniz gibi çatallayabilir (fork), değiştirebilir ve eğitimlerinizde kullanabilirsiniz.

<div align="center">
  <i>"Yapay zekayı güvenli kılmak için, önce onu nasıl kandıracağını öğrenmelisin."</i>
</div>
