# Backlog — donat platformasi

Bu vazifaga kirmaydi. Manba — raqiblar bilan taqqoslash (DonatePay,
Donatello) va shu ish davomida topilganlar.

## Raqiblar taqqoslashidan

- **TTS ovozini tanlash va tinglab koʻrish** (DonatePay). Hozir TTS faqat
  yoqiladi yoki oʻchiriladi.
- **Yigʻim maqsadi** (progress bar) **va Top donatorlar** (Donatello) —
  streamer sahifasida va OBS overlayʼda.
- **Bosh sahifani kengaytirish:**
  - alert animatsiyasi;
  - funksiyalar;
  - komissiya bloki (quote dan, konstantasiz);
  - FAQ;
  - "hozir efirda".
- **Qisqa havola** `mydonation.uz/nik` va QR kod (stream ekraniga).
- **Pullik bezaklar:** GIF, effektlar (DonatePay "+10 RUB uslub").
- **Rus tili.**

## Shu ish davomida topilgan

- **"Yuborilganlar" roʻyxatida qabul qiluvchi nomi.** Hozir faqat summa,
  komissiya va sana koʻrinadi. `GET /donations/sent` javobiga streamer
  nomi va `public_id` ni qoʻshish (m21) va r18 da havola qilib koʻrsatish
  kerak.
- **Qurilma boʻyicha bonus cheklovi.** Vebda ishonchli qurilma signali paydo
  boʻlsa (masalan, Telegram Mini App yoki SMS-tasdiq). Batafsil:
  `OWNER_TASKS.md` §5.
- **r18 uchun ESLint.** Repoda lint skripti yoʻq, tekshiruv faqat
  `vite build`. n20 dagi konfiguratsiyani olib, `npm run lint` qoʻshish
  mumkin. Yangi dev-bogʻliqlik boʻladi, shuning uchun alohida qaror kerak.
- **Mehmon W ni boshqa qurilmada olish.** "Olish" tokeni faqat donat
  qilingan brauzerning `localStorage` ida turadi. Toʻlov sahifasini boshqa
  qurilmada ochsa yoki maxfiy rejimda boʻlsa, taklif chiqmaydi. Kelajakda
  email yoki Telegram orqali bir martalik havola berish mumkin, lekin token
  URL ga qoʻyilmasin.
