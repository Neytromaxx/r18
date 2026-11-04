# Egasi uchun vazifalar — donat komissiyasi va W

Bu roʻyxatdagi ishlarni kod emas, siz hal qilasiz: yuridik, PSP, sozlamalar,
deploy.

## 1. Huquqiy — qabul qiluvchi tomon (ishga tushirishdan oldin)

Hamyon yopildi, endi donator tomoni toza. Lekin pul hali ham Epsilon ichida
turadi:

- streamer ulushi Epsilon ledgeridagi streamer hamyoniga tushadi;
- streamer keyin uni Epsilon orqali yechib oladi.

Bu ham boshqalarning pulini ushlab turish va oʻtkazish deb qaralishi mumkin.

**Kerak:** yurist va PSP (Payme yoki ATMOS) bilan tekshirish — streamer ulushini
toʻlov paytidayoq split orqali toʻgʻridan-toʻgʻri uning kartasiga yuborish
mumkinmi? Shunda Epsilon hisobiga faqat komissiya tushadi.

Javob "ha" boʻlsa, bu alohida vazifa: `settle_psp_donation` va streamer
kabineti oʻzgaradi. Bu vazifada pul yechish va split **qurilmagan**.

## 2. Hamyondan donat — boshqa ilovalar

- **n20 (Epsilon Gaming):** bajarildi. Branch: `feat/donation-fees-w-claim`
  (alohida PR).
  - Streamer sahifasidagi hamyondan donat formasi oʻrniga
    "Karta orqali donat yuborish" havolasi qoʻyildi. U `VITE_DONATION_URL`
    `/s/{public_id}` manziliga olib boradi.
  - Hub dagi "Yuborish" tabi olib tashlandi.
  - n20 hamyonining oʻzi (toʻldirish, turnirlar) ishlashda davom etadi.
- **s22 (admin):** Faza 0 da hamyondan donat tugmasi topilmadi.
- **Backend:** `POST /donations` har qanday qabul qiluvchi (player, team,
  tournament) uchun `403 wallet_donations_disabled` qaytaradi. Faqat m21 env
  `DONATION_WALLET_ENABLED=true` bilan qaytadi. Bu bayroq admin panelda
  **yoʻq** va boʻlmasligi kerak.
- Foydalanuvchilarning mavjud hamyon balansi mydonation.uz da donat uchun
  ishlatilmaydi. Ular n20 da (turnirlar va h.k.) qoladi.

## 3. Ommaviy oferta va maxfiylik siyosati

`/legal/offer` va `/legal/privacy` sahifalari va footer havolalari tayyor.
Hozir ularda "Matn tez orada." turibdi. Matnni yurist bilan tayyorlab,
`src/features/legal/views/LegalView.vue` ga qoʻyish kerak. Matnda
quyidagilar boʻlishi kerak:

- komissiya (mehmon 1,5%, roʻyxatdan oʻtgan 1,0% — admin oʻzgartira oladi);
- W keshbek va birinchi donat bonusi shartlari;
- mehmon W ni olish muddati (7 kun).

## 4. PSP komissiyasi

Payme (yoki ATMOS) merchant komissiyasini tekshiring. U 1,0% ga yaqin yoki
undan katta boʻlsa, roʻyxatdan oʻtganlar donatida platforma zarar koʻradi.
Unda `member_fee_pct` ni admin sozlamasidan oshirish kerak boʻladi (deploysiz).

## 5. Bonus parametrlarini qayta koʻrish (2–4 haftadan keyin)

`donation_rewards` jadvali statistikasi asosida koʻrib chiqing:

- birinchi donat bonusi (hozir 100 W);
- bonus uchun minimal summa (10 000 soʻm);
- bitta streamerga kunlik limit (20).

Qarang:

- `bonus_refusal` taqsimoti (`daily_cap` koʻpmi?);
- `pending` → `expired` ulushi — mehmonlar W ni olmayaptimi?

**Qurilma cheklovi yoʻq.** "Bir qurilma — bitta birinchi donat bonusi"
qoidasi qoʻllanmadi, chunki vebda ishonchli qurilma signali yoʻq.
`account_devices` dagi fingerprint faqat User-Agent va platformadan hosil
qilinadi. Uni brauzerda bir zumda almashtirish mumkin, bir xil telefon
modellarida esa u turli odamlarda bir xil chiqadi.
Bonusni suisteʼmol qilishga qarshi hozirgi himoya:

- bitta hisobga bitta birinchi donat bonusi;
- oʻz sahifasiga donat uchun bonus yoʻq;
- minimal summa;
- streamerga kunlik limit;
- keshbek komissiyadan har doim kichik (admin validatsiyasi).

## 6. Deploy tartibi va env

1. **m21** (`feat/donation-fees-w-claim`) — avval shu.
   - Migratsiyalar: `d4b7e1f9a3c6` (intent ustunlari, ikki `coin_rules`
     qoidasi), keyin `e7c2a9d5f1b3` (`donation_rewards` jadvali).
   - `DONATION_WALLET_ENABLED` — qoʻshish shart emas, standart `false`.
   - Scheduler: `donation_reward_expiry` har soatda muddati oʻtgan mehmon W
     larini `expired` qiladi.
2. **r18** (`feat/donation-fees-w-claim` → `preview`), Vercel env:
   - `VITE_API_URL` — bor. Edge Middleware (OG) va `/api/og` ham shuni oʻqiydi.
     Agar u Vercel da faqat build vaqtiga berilgan boʻlsa, runtime uchun
     `API_URL` ni ham qoʻshing (qiymati bir xil, `/api/v1` bilan).
   - `VITE_TELEGRAM_URL`, `VITE_SUPPORT_URL` — footer havolalari (ixtiyoriy).
   - Yangi bogʻliqlik: `@vercel/og` (OG rasm uchun).
3. **n20** (`feat/donation-fees-w-claim`). `VITE_DONATION_URL` toʻgʻri
   boʻlishi kerak (`https://mydonation.uz`), aks holda havola yashiriladi.

## 7. Deploydan keyin tekshirish (staging + Payme test rejimi)

Productionʼda haqiqiy toʻlov qilmang.

- [ ] Mehmon donati → alert → "Olish" → **yangi hisob**: "+N W hisobingizga
      qoʻshildi."
- [ ] Mehmon donati → "Olish" → **avval donati bor hisob**: faqat keshbek,
      "… bonus faqat hisobdagi birinchi donat uchun beriladi …"
- [ ] Login donati → keshbek. Alertda tanlangan nom yoki "Anonim" chiqadi.
- [ ] mydonation da hamyon, balans va toʻldirish hech qayerda yoʻq: public
      sahifa, hub, yuqori panel, toʻlov holati.
- [ ] OG: `curl -sA TelegramBot https://<domen>/s/<public_id> | grep og:` —
      `og:title`, `og:image` chiqadi. Telegramda havola kartochkasi rasm bilan.
- [ ] Admin: `PUT /admin/catalog/donation-config` bilan komissiyani oʻzgartiring.
      Public sahifada yangi foiz darhol koʻrinadi. Oldin boshlangan toʻlov eski
      stavka bilan yakunlanadi.

Lokal E2E (Playwright, lokal m21 + r18, Payme Perform taqlidi) oʻtgan.
Skrinshotlar: `docs/donation/shots/`.
