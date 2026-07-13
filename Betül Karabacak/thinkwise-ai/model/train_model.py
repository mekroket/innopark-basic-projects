import re
import os
import json
import joblib
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import LinearSVC
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import accuracy_score, f1_score, confusion_matrix

# ============================================================
# 1) VERİYİ YÜKLE
# ============================================================
df = pd.read_csv("data/mbti_1.csv")
print("Veri boyutu:", df.shape)
print(df["type"].value_counts())

# ============================================================
# 2) METNİ TEMİZLE (veri sızıntısını önlemek için kişilik tipi
#    kelimelerini de metinden çıkarıyoruz)
# ============================================================
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


df["clean_posts"] = df["posts"].apply(clean_text)

# ============================================================
# 3) TRAIN/TEST BÖL + TF-IDF
# ============================================================
X = df["clean_posts"]
y = df["type"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

vectorizer = TfidfVectorizer(max_features=10000, ngram_range=(1, 2), min_df=3)
X_train_vec = vectorizer.fit_transform(X_train)
X_test_vec = vectorizer.transform(X_test)
print("Eğitim seti boyutu:", X_train_vec.shape)
print("Test seti boyutu:", X_test_vec.shape)

# ============================================================
# 4) 4 KİŞİLİK EKSENİ İÇİN MODEL EĞİT + KARŞILAŞTIR
#    (her model için 5 katlamalı cross-validation da uygulanıyor)
# ============================================================
df["IE"] = df["type"].str[0]
df["NS"] = df["type"].str[1]
df["TF"] = df["type"].str[2]
df["JP"] = df["type"].str[3]

axes = {
    "IE": "İçe Dönük (I) / Dışa Dönük (E)",
    "NS": "Sezgisel (N) / Gerçekçi (S)",
    "TF": "Düşünen (T) / Hisseden (F)",
    "JP": "Yargılayan (J) / Algılayan (P)",
}

os.makedirs("model/saved", exist_ok=True)
axis_summary = {}
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

fig, subplots = plt.subplots(2, 2, figsize=(10, 9))
subplot_list = subplots.flatten()

for idx, (axis_col, axis_name) in enumerate(axes.items()):
    print(f"\n{'='*50}\nEKSEN: {axis_name}\n{'='*50}")
    print(df[axis_col].value_counts())

    y_train_axis = df[axis_col].loc[X_train.index]
    y_test_axis = df[axis_col].loc[X_test.index]

    models = {
        "Logistic Regression": LogisticRegression(max_iter=1000, class_weight="balanced"),
        "Random Forest": RandomForestClassifier(n_estimators=150, random_state=42, class_weight="balanced", max_depth=30, n_jobs=-1),
        "SVM (Linear)": CalibratedClassifierCV(LinearSVC(class_weight="balanced", max_iter=5000)),
    }

    best_model, best_f1, best_name, best_pred, best_acc, best_train_acc, best_cv_mean, best_cv_std = None, -1, None, None, None, None, None, None
    all_scores = {}

    for name, model in models.items():
        cv_scores = cross_val_score(model, X_train_vec, y_train_axis, cv=cv, scoring="f1_macro", n_jobs=-1)

        model.fit(X_train_vec, y_train_axis)
        y_pred = model.predict(X_test_vec)
        acc = accuracy_score(y_test_axis, y_pred)
        f1 = f1_score(y_test_axis, y_pred, average="macro")
        train_acc = accuracy_score(y_train_axis, model.predict(X_train_vec))
        print(f"  {name}: Test Acc={acc:.4f}  Train Acc={train_acc:.4f}  F1(macro)={f1:.4f}  CV F1={cv_scores.mean():.4f} ± {cv_scores.std():.4f}")
        all_scores[name] = {
            "accuracy": round(acc, 4), "f1_macro": round(f1, 4), "train_accuracy": round(train_acc, 4),
            "cv_f1_mean": round(cv_scores.mean(), 4), "cv_f1_std": round(cv_scores.std(), 4),
        }

        if f1 > best_f1:
            best_f1, best_model, best_name, best_pred, best_acc, best_train_acc = f1, model, name, y_pred, acc, train_acc
            best_cv_mean, best_cv_std = cv_scores.mean(), cv_scores.std()

    print(f"  >>> Bu eksen için en iyi: {best_name} (F1={best_f1:.4f}, CV F1={best_cv_mean:.4f} ± {best_cv_std:.4f})")

    cm = confusion_matrix(y_test_axis, best_pred, labels=sorted(y_test_axis.unique()))
    labels = sorted(y_test_axis.unique())
    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues", ax=subplot_list[idx],
                xticklabels=labels, yticklabels=labels)
    subplot_list[idx].set_title(f"{axis_name}\n({best_name})")
    subplot_list[idx].set_xlabel("Tahmin")
    subplot_list[idx].set_ylabel("Gerçek")

    top_words = []
    try:
        if hasattr(best_model, "coef_"):
            coefs = best_model.coef_[0]
        else:
            coefs = best_model.calibrated_classifiers_[0].estimator.coef_[0]
        feature_names = vectorizer.get_feature_names_out()
        top_idx = coefs.argsort()[-10:][::-1]
        top_words = [feature_names[i] for i in top_idx]
    except Exception:
        top_words = []

    axis_summary[axis_col] = {
        "axis_name": axis_name,
        "classes": labels,
        "best_model": best_name,
        "accuracy": round(best_acc, 4),
        "train_accuracy": round(best_train_acc, 4),
        "f1_macro": round(best_f1, 4),
        "cv_f1_mean": round(best_cv_mean, 4),
        "cv_f1_std": round(best_cv_std, 4),
        "all_models": all_scores,
        "confusion_matrix": cm.tolist(),
        "top_words": top_words,
    }

    joblib.dump(best_model, f"model/saved/{axis_col}_model.joblib")

plt.tight_layout()
plt.savefig("model/confusion_matrices.png", dpi=120)
plt.close()

joblib.dump(vectorizer, "model/saved/vectorizer.joblib")

with open("model/metrics.json", "w", encoding="utf-8") as f:
    json.dump({
        "dataset": {
            "name": "(MBTI) Myers-Briggs Personality Type Dataset (Kaggle)",
            "n_samples": int(df.shape[0]),
            "n_features": int(X_train_vec.shape[1]),
            "type_distribution": df["type"].value_counts().to_dict(),
        },
        "axes": axis_summary,
    }, f, ensure_ascii=False, indent=2)

print("\n\n✅ Tüm eksenler için modeller, grafik ve metrics.json kaydedildi (cross-validation dahil): model/ klasörü")