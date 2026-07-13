import pandas as pd

df = pd.read_csv("data/mbti_1.csv")

print("Veri boyutu (satır, sütun):", df.shape)
print()
print("İlk 5 satır:")
print(df.head())
print()
print("Kişilik tipi dağılımı:")
print(df["type"].value_counts())
print()
print("Eksik değer var mı?")
print(df.isnull().sum())