"""
ThinkWise AI - Backend (Flask)
================================
Tamamen local çalışır, hiçbir dış yapay zeka servisine (OpenAI/Gemini/Claude
API vb.) bağlanmaz. Kullanıcının yazdığı serbest metni, kendi eğittiğimiz
4 kişilik ekseni modeliyle analiz eder; ayrıca hangi konuda karar veremediğini
(kıyafet, kariyer, ilişki, tatil, alışveriş vb.) basit anahtar kelime eşleşmesiyle
tespit edip, kişilik tarzına göre o konuya özel bir karar önerisi üretir.
"""
import os
import re
import json

import joblib
from flask import Flask, jsonify, request, send_from_directory

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR = os.path.join(BASE_DIR, "model")
SAVED_DIR = os.path.join(MODEL_DIR, "saved")
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")

app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path="")


@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return response


vectorizer = joblib.load(os.path.join(SAVED_DIR, "vectorizer.joblib"))
axis_models = {
    "IE": joblib.load(os.path.join(SAVED_DIR, "IE_model.joblib")),
    "NS": joblib.load(os.path.join(SAVED_DIR, "NS_model.joblib")),
    "TF": joblib.load(os.path.join(SAVED_DIR, "TF_model.joblib")),
    "JP": joblib.load(os.path.join(SAVED_DIR, "JP_model.joblib")),
}

with open(os.path.join(MODEL_DIR, "metrics.json"), encoding="utf-8") as f:
    METRICS = json.load(f)

MBTI_TYPES = ["infj", "entp", "intp", "intj", "entj", "enfj", "infp", "enfp",
              "isfp", "istp", "isfj", "istj", "estp", "esfp", "estj", "esfj"]


def clean_text(text):
    text = text.lower()
    text = re.sub(r"https?://\S+|www\.\S+", " ", text)
    text = re.sub(r"\|\|\|", " ", text)
    text = re.sub(r"[^a-z\s]", " ", text)
    for t in MBTI_TYPES:
        text = re.sub(rf"\b{t}\b", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


TRAITS = {
    "I": {
        "kariyer": "Yalnız çalışabildiğin, derinlemesine odaklanma gerektiren roller (araştırma, yazılım geliştirme, analiz, yazarlık) sana enerji verebilir.",
        "calisma_tarzi": "Kesintisiz, sessiz bir ortamda tek başına derinlemesine çalışmak seni daha üretken yapar.",
        "iletisim": "Büyük gruplar yerine küçük, samimi sohbetlerde kendini daha rahat ifade edersin.",
        "hobi": "Kitap okumak, yazı yazmak, tek başına yürüyüş yapmak gibi içe dönük aktiviteler seni dinlendirir.",
        "guclu_yonler": "Derin odaklanma, bağımsız düşünme, dikkatli gözlem.",
        "gelisim": "Fikirlerini daha sık sesli paylaşmak, ağ kurma (networking) konusunda kendini zorlamak faydalı olabilir.",
        "karar_tarzi": "kararlarını genelde yalnız başına, sessizce düşünerek verirsin, acele etmezsin",
    },
    "E": {
        "kariyer": "İnsanlarla sürekli etkileşim gerektiren roller (satış, halkla ilişkiler, eğitmenlik, proje yöneticiliği) sana uygun olabilir.",
        "calisma_tarzi": "Takım içinde, fikir alışverişi yaparak çalışmak seni motive eder.",
        "iletisim": "Kalabalık ortamlarda rahatça konuşur, yeni insanlarla tanışmaktan enerji alırsın.",
        "hobi": "Grup aktiviteleri, sosyal etkinlikler, takım sporları seni canlandırır.",
        "guclu_yonler": "Kolay iletişim kurma, enerjik liderlik, hızlı sosyal adaptasyon.",
        "gelisim": "Bazen yalnız kalıp düşüncelerini sindirmek için zaman ayırmak faydalı olabilir.",
        "karar_tarzi": "kararlarını genelde başkalarıyla konuşup fikir alarak netleştirirsin",
    },
    "N": {
        "kariyer": "Yeni fikirler üretmeyi gerektiren alanlar (strateji, ürün tasarımı, girişimcilik, akademik araştırma) seni heyecanlandırabilir.",
        "calisma_tarzi": "Büyük resmi görmek, olasılıkları keşfetmek, yaratıcı çözümler üretmek senin doğal tarzın.",
        "iletisim": "Soyut kavramlar, gelecek senaryoları ve fikirler üzerine konuşmaktan keyif alırsın.",
        "hobi": "Yeni konular keşfetmek, hayal gücünü kullanan aktiviteler (yaratıcı yazarlık, sanat, strateji oyunları).",
        "guclu_yonler": "Yaratıcılık, büyük resmi görme, gelecek odaklı düşünme.",
        "gelisim": "Fikirleri somut adımlara dökme ve detaylara da dikkat etme konusunda kendini geliştirebilirsin.",
        "karar_tarzi": "kararlarında olası sonuçları ve farklı alternatifleri hayal ederek ilerlersin",
    },
    "S": {
        "kariyer": "Somut, pratik sonuçlar gerektiren alanlar (mühendislik, operasyon yönetimi, sağlık, finans) sana uygun olabilir.",
        "calisma_tarzi": "Net, adım adım talimatlar ve ölçülebilir hedeflerle çalışmak sana huzur verir.",
        "iletisim": "Somut örnekler ve gerçek deneyimler üzerinden konuşmayı tercih edersin.",
        "hobi": "El becerisi gerektiren, somut sonuç veren aktiviteler (yemek yapmak, spor, el sanatları).",
        "guclu_yonler": "Pratiklik, güvenilirlik, detaylara dikkat.",
        "gelisim": "Bazen büyük resme de bakıp uzun vadeli olasılıkları değerlendirmek faydalı olabilir.",
        "karar_tarzi": "kararlarında geçmiş deneyimlerine ve somut gerçeklere güvenirsin",
    },
    "T": {
        "kariyer": "Mantık ve analiz gerektiren alanlar (mühendislik, hukuk, bilim, veri analizi) güçlü yanlarını kullanmanı sağlar.",
        "calisma_tarzi": "Kararları objektif verilere ve mantığa dayandırarak çalışmak sana daha doğal gelir.",
        "iletisim": "Doğrudan, net ve mantık temelli konuşmayı tercih edersin.",
        "hobi": "Strateji oyunları, bulmacalar, teknik/analitik hobiler ilgini çekebilir.",
        "guclu_yonler": "Objektif karar verme, problem çözme, mantıksal analiz.",
        "gelisim": "Kararlarında insanların duygusal tarafını da göz önünde bulundurmak ilişkilerini güçlendirebilir.",
        "karar_tarzi": "kararlarını mantık ve artı/eksi analiziyle verirsin, duygusal değil objektif düşünürsün",
    },
    "F": {
        "kariyer": "İnsan odaklı alanlar (psikoloji, eğitim, insan kaynakları, sanat) değerlerinle uyumlu olabilir.",
        "calisma_tarzi": "Takım uyumunu ve insanların iyi hissetmesini önemseyerek çalışmak sana enerji verir.",
        "iletisim": "Empatik, destekleyici bir dil kullanır, karşındakinin duygularını önemsersin.",
        "hobi": "Gönüllülük, sanat, insanlarla derin bağlar kurmayı sağlayan aktiviteler.",
        "guclu_yonler": "Empati, takım uyumu, insan ilişkilerinde derinlik.",
        "gelisim": "Zor kararlarda duyguların yanında verileri de değerlendirmek dengeyi artırabilir.",
        "karar_tarzi": "kararlarını o an nasıl hissettiğine ve değerlerine göre verirsin",
    },
    "J": {
        "kariyer": "Planlama ve düzen gerektiren roller (proje yönetimi, operasyon, hukuk) sana uygun olabilir.",
        "calisma_tarzi": "Net planlar, net teslim tarihleri ve düzenli bir program içinde daha rahat çalışırsın.",
        "iletisim": "Net kararlar almayı ve konuşmaları sonuca bağlamayı tercih edersin.",
        "hobi": "Planlı geziler, düzenli rutinler içeren aktiviteler seni rahatlatır.",
        "guclu_yonler": "Organizasyon, kararlılık, güvenilirlik.",
        "gelisim": "Bazen plana çok sıkı bağlı kalmak yerine anlık fırsatlara da açık olmak yeni deneyimler katabilir.",
        "karar_tarzi": "hızlı karar verip konuyu kapatmak seni rahatlatır, uzun süre kararsız kalmak seni yorar",
    },
    "P": {
        "kariyer": "Esneklik ve değişkenlik içeren roller (girişimcilik, yaratıcı sektörler, danışmanlık) sana uygun olabilir.",
        "calisma_tarzi": "Esnek bir programda, seçenekleri açık tutarak çalışmak sana daha rahat gelir.",
        "iletisim": "Konuşmalarda spontane olmayı, yeni fikirlere açık kalmayı seversin.",
        "hobi": "Plansız geziler, doğaçlama aktiviteler, yeni deneyimler keşfetmek.",
        "guclu_yonler": "Uyum sağlama, yaratıcı esneklik, açık fikirlilik.",
        "gelisim": "Önemli görevlerde son teslim tarihlerini daha erken planlamak stresini azaltabilir.",
        "karar_tarzi": "seçenekleri açık tutup son ana kadar esnek kalmak sana daha rahat gelir, aceleye getirmezsin",
    },
}

DOMAIN_LABELS = {
    "kariyer": "💼 Kariyer Önerisi",
    "calisma_tarzi": "🧠 Çalışma Tarzı",
    "iletisim": "💬 İletişim Tarzı",
    "hobi": "🎨 Hobi Önerisi",
    "guclu_yonler": "💪 Güçlü Yönler",
    "gelisim": "🌱 Gelişim Alanları",
}

DECISION_CATEGORIES = [
    {
        "key": "giyim",
        "keywords": ["giy", "kıyafet", "kombin", "ne giysem", "ne giyeyim"],
        "intro": "Kıyafet seçimi gibi günlük bir kararda bile aslında kişilik tarzın devreye giriyor.",
    },
    {
        "key": "kariyer",
        "keywords": ["kariyer", "meslek", "hangi bölüm", "üniversite", "staj", "iş değiştir", "hangi işe"],
        "intro": "Kariyer/meslek gibi büyük bir kararda kişilik tarzını bilmek gerçekten işine yarar.",
    },
    {
        "key": "iliski",
        "keywords": ["sevgili", "ilişki", "aşk", "ayrıl", "evlen", "flört"],
        "intro": "İlişkilerle ilgili kararlar duygusal yoğunluğu olan kararlardır, tarzını bilmek yardımcı olabilir.",
    },
    {
        "key": "tatil",
        "keywords": ["tatil", "seyahat", "gezi", "nereye gid", "nereye git"],
        "intro": "Tatil/seyahat kararında da kişilik tarzın büyük rol oynuyor.",
    },
    {
        "key": "alisveris",
        "keywords": ["telefon", "laptop", "bilgisayar", "satın al", "hangi ürün", "hangi marka"],
        "intro": "Büyük bir satın alma kararında da karar verme tarzın devreye giriyor.",
    },
    {
        "key": "yemek",
        "keywords": ["ne yesem", "ne yiyeyim", "restoran", "yemek"],
        "intro": "Ne yiyeceğine karar vermek bile küçük bir 'karar verme tarzı' göstergesi.",
    },
    {
        "key": "kisisel_bakim",
        "keywords": ["oje", "makyaj", "saç rengi", "saç kestir", "ruj", "parfüm", "tırnak"],
        "intro": "Güzellik/kişisel bakım tercihleri gibi küçük görünen kararlarda bile kişilik tarzın kendini gösteriyor.",
    },
]



def detect_category(raw_text_lower):
    for cat in DECISION_CATEGORIES:
        if any(kw in raw_text_lower for kw in cat["keywords"]):
            return cat
    return {"key": "genel", "intro": "Bu konudaki kararsızlığında da kişilik tarzın devreye giriyor."}


def build_report(predicted_type):
    report = {}
    for domain, label in DOMAIN_LABELS.items():
        parts = [TRAITS[letter][domain] for letter in predicted_type]
        report[label] = parts
    return report

def build_explainability(cleaned_text, predicted_type):
    words_in_text = set(cleaned_text.split())
    axis_keys = ["IE", "NS", "TF", "JP"]
    matches = []
    for axis_col in axis_keys:
        axis_info = METRICS.get("axes", {}).get(axis_col, {})
        top_words = axis_info.get("top_words", [])
        overlap = [w for w in top_words if w in words_in_text and len(w) >= 3]
        if overlap:
            matches.append(", ".join(overlap[:3]))
    return matches


def confidence_caveat(axis_confidences):
    confidences = [v["confidence"] for v in axis_confidences.values()]
    avg_conf = sum(confidences) / len(confidences)
    if avg_conf < 0.6:
        return "Not: Bu tahminlerimden tam emin değilim (güvenim düşük) — biraz daha uzun yazarsan daha güvenilir olur."
    return None
def build_decision_answer(raw_text, predicted_type):
    category = detect_category(raw_text.lower())
    jp_letter = predicted_type[3]
    tf_letter = predicted_type[2]
    answer = (
        f"{category['intro']} Sen {TRAITS[jp_letter]['karar_tarzi']}. "
        f"Ayrıca {TRAITS[tf_letter]['karar_tarzi']}. "
        f"Bu ikisini birleştirince: bu konuda kendine çok fazla baskı yapmadan, "
        f"kendi doğal tarzına güvenerek ilerlemen en iyisi olur."
    )
    return answer, category["key"]


@app.route("/")
def index():
    return send_from_directory(FRONTEND_DIR, "index.html")


@app.route("/api/health")
def health():
    return jsonify({"status": "ok", "message": "ThinkWise AI API çalışıyor (tamamen local, dış API yok)."})


@app.route("/model-info")
def model_info():
    return jsonify(METRICS)


@app.route("/charts/<path:filename>")
def charts(filename):
    if filename != "confusion_matrices.png":
        return jsonify({"error": "Böyle bir grafik yok."}), 404
    return send_from_directory(MODEL_DIR, filename)


@app.route("/predict", methods=["POST"])
def predict():
    payload = request.get_json(silent=True)
    if not payload or "text" not in payload:
        return jsonify({"error": "'text' alanı gönderilmedi."}), 400

    raw_text = str(payload["text"]).strip()
    if len(raw_text) < 15:
        return jsonify({"error": "Lütfen en az birkaç cümlelik bir metin yaz, çok kısa metinlerde güvenilir tahmin yapamıyoruz."}), 400

    cleaned = clean_text(raw_text)
    X_vec = vectorizer.transform([cleaned])

    predicted_type = ""
    axis_confidences = {}

    for axis_col, model in axis_models.items():
        pred = model.predict(X_vec)[0]
        proba = model.predict_proba(X_vec)[0]
        classes = list(model.classes_)
        confidence = float(max(proba))
        predicted_type += pred
        axis_confidences[axis_col] = {
            "prediction": pred,
            "confidence": round(confidence, 4),
            "probabilities": {classes[i]: round(float(proba[i]), 4) for i in range(len(classes))},
        }

    decision_answer, category_key = build_decision_answer(raw_text, predicted_type)
    report = build_report(predicted_type)
    explainability = build_explainability(cleaned, predicted_type)
    caveat = confidence_caveat(axis_confidences)

    return jsonify({
        "predicted_type": predicted_type,
        "axis_confidences": axis_confidences,
        "decision_answer": decision_answer,
        "category": category_key,
        "report": report,
        "explainability": explainability,
        "confidence_caveat": caveat,
    })

@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Endpoint bulunamadı."}), 404


@app.errorhandler(405)
def method_not_allowed(e):
    return jsonify({"error": "Bu endpoint için yanlış HTTP metodu kullandınız."}), 405


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=False)