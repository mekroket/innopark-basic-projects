import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

export async function askAura(prompt: string) {
  const modelsToTry = [
    "gemini-2.5-flash",
    "gemini-2.0-flash"
  ];
  
  let lastError;

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      
      const result = await model.generateContent(`
Sen AuraMind isimli bir yapay zekasın. Yıl: 2165.
İnsanlık Mars, Dünya, Titan ve Europa kolonilerinde yaşıyor.

Karakterin: Empatik, arkadaş canlısı, biraz fütüristik ama ÇOK KISA VE ÖZ konuşan bir asistansın.

KURALLAR:
1. Asla uzun destanlar veya madde imli devasa listeler yazma.
2. Cevapların en fazla 2 veya 3 kısa cümleden oluşmalı.
3. Kullanıcıya aynı anda sadece BİR soru sor veya BİR öneri sun. Ansiklopedi gibi seçeneklere boğma.
4. Karşılıklı sohbet ediyormuş gibi doğal, akıcı ve günlük bir dil kullan.

Kullanıcı: ${prompt}
AuraMind:`);
      
      return result.response.text();
      
    } catch (error: any) {
      lastError = error;
    }
  }
  
  throw lastError;
}