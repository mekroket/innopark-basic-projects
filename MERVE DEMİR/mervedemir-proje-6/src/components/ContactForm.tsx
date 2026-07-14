"use client";

import { useState } from "react";
import styles from "./ContactForm.module.css";

export default function ContactForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [feedback, setFeedback] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    const payload = {
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      message: String(formData.get("message") || ""),
    };

    setStatus("loading");
    setFeedback("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        setStatus("error");
        setFeedback(result.message || "Mesaj gönderilemedi.");
        return;
      }

      setStatus("success");
      setFeedback("Mesajın başarıyla gönderildi.");
      form.reset();
    } catch {
      setStatus("error");
      setFeedback("Bağlantı hatası oluştu. Lütfen tekrar dene.");
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.row}>
        <label>
          <span>Ad Soyad</span>
          <input name="name" type="text" placeholder="Adını yaz" required />
        </label>

        <label>
          <span>E-posta</span>
          <input name="email" type="email" placeholder="mail@ornek.com" required />
        </label>
      </div>

      <label>
        <span>Mesaj</span>
        <textarea
          name="message"
          rows={6}
          placeholder="Mesajını buraya yaz..."
          required
        />
      </label>

      <button type="submit" disabled={status === "loading"}>
        {status === "loading" ? "Gönderiliyor..." : "Mesaj Gönder"}
        <span>→</span>
      </button>

      {feedback && (
        <p className={status === "success" ? styles.success : styles.error}>
          {feedback}
        </p>
      )}
    </form>
  );
}