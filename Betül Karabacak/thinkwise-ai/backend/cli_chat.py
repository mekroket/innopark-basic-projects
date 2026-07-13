"""
ThinkWise AI - Terminal Versiyonu
================================
Hocanın "kod kısmı terminalde olsun" isteğini karşılamak için, aynı modeli
ve aynı karar-analizi mantığını tarayıcı olmadan, doğrudan komut satırında
çalıştıran basit bir sürüm. Tamamen local çalışır, dış AI servisine bağlanmaz.
"""
import os
import re
import sys
import joblib

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR = os.path.join(BASE_DIR, "model")
SAVED_DIR = os.path.join(MODEL_DIR, "saved")

vectorizer = joblib.load(os.path.join(SAVED_DIR, "vectorizer.joblib"))
axis_models = {
    "IE": joblib.load(os.path.join(SAVED_DIR, "IE_model.joblib")),
    "NS": joblib.load(os.path.join(SAVED_DIR, "NS_model.joblib")),
    "TF": joblib.load(os.path.join(SAVED_DIR, "TF_model.joblib")),
    "JP": joblib.load(os.path.join(SAVED_DIR, "JP_model.joblib")),
}

MBTI_TYPES = ["infj", "entp", "intp", "intj", "entj", "enfj", "infp", "enfp",
              "isfp", "istp", "isfj", "istj", "estp", "esfp", "estj", "esfj"]

GREETINGS = ["merhaba", "selam", "hey", "hi", "hello", "naber", "nasılsın", "günaydın"]
FAREWELLS = ["görüşürüz", "hoşçakal", "hoşça kal", "bay bay", "iyi günler", "çıkış", "exit", "quit"]
THANKS = ["teşekkür", "sağol", "sağ ol", "eyvallah"]
MIN_LENGTH = 45

DECISION_CATEGORIES = [
    {"key": "giyim", "keywords": ["giy", "kıyafet", "kombin", "ne giysem", "ne giyeyim"],
     "intro": "Kıyafet seçimi gibi günlük bir kararda bile aslında kişilik tarzın devreye giriyor."},
    {"key": "kariyer", "keywords": ["kariyer", "meslek", "hangi bölüm", "üniversite", "staj", "iş değiştir"],
     "intro": "Kariyer/meslek gibi büyük bir kararda kişilik tarzını bilmek gerçekten işine yarar."},
    {"key": "iliski", "keywords": ["sevgili", "ilişki", "aşk", "ayrıl", "evlen", "flört"],
     "intro": "İlişkilerle ilgili kararlar duygusal yoğunluğu olan kararlardır, tarzını bilmek yardımcı olabilir."},
    {"key": "tatil", "keywords": ["tatil", "seyahat", "gezi", "nereye gid", "nereye git"],
     "intro": "Tatil/seyahat kararında da kişilik tarzın büyük rol oynuyor."},
    {"key": "alisveris", "keywords": ["telefon", "laptop", "bilgisayar", "satın al", "hangi ürün"],
     "intro": "Büyük bir satın alma kararında da karar verme tarzın devreye giriyor."},
    {"key": "yemek", "keywords": ["ne yesem", "ne yiyeyim", "restoran", "yemek"],
     "intro": "Ne yiyeceğine karar vermek bile küçük bir 'karar verme tarzı' göstergesi."},
    {"key": "kisisel_bakim", "keywords": ["oje", "makyaj", "saç rengi", "saç kestir", "ruj", "parfüm", "tırnak"],
     "intro": "Güzellik/kişisel bakım tercihleri gibi küçük görünen kararlarda bile kişilik tarzın kendini gösteriyor."},
]

KARAR_TARZI = {
    "I": "kararlarını genelde yalnız başına, sessizce düşünerek verirsin, acele etmezsin",
    "E": "kararlarını genelde başkalarıyla konuşup fikir alarak netleştirirsin",
    "N": "kararlarında olası sonuçları ve farklı alternatifleri hayal ederek ilerlersin",
    "S": "kararlarında geçmiş deneyimlerine ve somut gerçeklere güvenirsin",
    "T": "kararlarını mantık ve artı/eksi analiziyle verirsin, duygusal değil objektif düşünürsün",
    "F": "kararlarını o an nasıl hissettiğine ve değerlerine göre verirsin",
    "J": "hızlı karar verip konuyu kapatmak seni rahatlatır, uzun süre kararsız kalmak seni yorar",
    "P": "seçenekleri açık tutup son ana kadar esnek kalmak sana daha rahat gelir, aceleye getirmezsin",
}


def clean_text(text):
    text = text.lower()
    text = re.sub(r"https?://\S+|www\.\S+", " ", text)
    text = re.sub(r"\|\|\|", " ", text)
    text = re.sub(r"[^a-z\s]", " ", text)
    for t in MBTI_TYPES:
        text = re.sub(rf"\b{t}\b", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def matches_any(text, keywords):
    lower = text.lower()
    return any(k in lower for k in keywords)


def detect_category(text):
    for cat in DECISION_CATEGORIES:
        if matches_any(text, cat["keywords"]):
            return cat
    return {"key": "genel", "intro": "Bu konudaki kararsızlığında da kişilik tarzın devreye giriyor."}


def greeting_reply(text):
    lower = text.lower().strip()
    if lower.startswith("nasılsın") or lower.startswith("naber"):
        return "İyiyim, teşekkürler! Sen nasılsın?"
    return "Selam! Karar veremediğin bir konuyu ya da kendinden birkaç cümle anlatırsan seni analiz edebilirim."


def predict_type(raw_text):
    cleaned = clean_text(raw_text)
    X_vec = vectorizer.transform([cleaned])
    predicted_type = ""
    for axis_col, model in axis_models.items():
        pred = model.predict(X_vec)[0]
        predicted_type += pred
    return predicted_type


def build_decision_answer(raw_text, predicted_type):
    category = detect_category(raw_text)
    jp_letter, tf_letter = predicted_type[3], predicted_type[2]
    return (
        f"{category['intro']} Sen {KARAR_TARZI[jp_letter]}. "
        f"Ayrıca {KARAR_TARZI[tf_letter]}. "
        f"Bu ikisini birleştirince: bu konuda kendine çok fazla baskı yapmadan, "
        f"kendi doğal tarzına güvenerek ilerlemen en iyisi olur."
    )


def main():
    print("=" * 60)
    print("🧭 ThinkWise AI — Terminal Sürümü (tamamen local)")
    print("=" * 60)
    print("Karar veremediğin bir konuyu ya da kendinden birkaç cümle")
    print("anlat. Çıkmak için 'çıkış' yaz.\n")

    buffer = ""
    while True:
        text = input("Sen: ").strip()
        if not text:
            continue

        lower = text.lower()
        if matches_any(lower, FAREWELLS):
            print("ThinkWise: Görüşürüz! 👋")
            break
        if matches_any(lower, THANKS):
            print("ThinkWise: Rica ederim! Başka bir konuda karar veremiyorsan onu da anlatabilirsin.\n")
            continue
        if matches_any(lower, GREETINGS) and len(text) < MIN_LENGTH:
            print(f"ThinkWise: {greeting_reply(text)}\n")
            continue

        buffer = (buffer + " " + text).strip()
        if len(buffer) < MIN_LENGTH:
            print("ThinkWise: Biraz daha anlatır mısın? Yeterli metin toplayınca analiz edebilirim.\n")
            continue

        print("ThinkWise: Düşünüyorum, yazdıklarını analiz ediyorum...")
        predicted_type = predict_type(buffer)
        answer = build_decision_answer(buffer, predicted_type)
        print(f"ThinkWise: {answer}")
        print(f"           (Tahmini kişilik tipin: {predicted_type})\n")
        buffer = ""


if __name__ == "__main__":
    main()