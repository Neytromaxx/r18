# Skrinshotlar — donat komissiyasi va W

Lokal E2E (Playwright): lokal m21 + r18 vite, Payme checkout stub,
settle — Payme `PerformTransaction` taqlidi. Mobil — 375×812 (2x),
desktop — 1440×900 (1x), toʻliq sahifa.

| Fayl | Nima koʻrinadi |
|---|---|
| `01_guest_mobile.jpg` | Mehmon: 1.5%, "Kirsangiz: 1.0% + 0.5% W", darajalar, avatar harfi, chek (20 000 → 300 komissiya, 20 300 jami, "+100 W (+100 W birinchi donat uchun)") |
| `02_pay_claim_offer_mobile.jpg` | Toʻlovdan keyin: "Sizga 200 W ajratildi: … — 7 kun ichida." va "Olish" |
| `03_pay_claimed_mobile.jpg` | Yangi hisob bilan olindi: "+200 W hisobingizga qoʻshildi." |
| `04_hub_sent_mobile.jpg` | Hub → Yuborilganlar: olingan mehmon donati shu hisobda |
| `05_claim_not_first_mobile.jpg` | Avval donati bor hisob: faqat keshbek, `not_first_donation` matni |
| `06_member_desktop.jpg` | Aʼzo: 1.0%, ism oldindan toʻldirilgan, "Anonim", chekda W keshbek va birinchi donat bonusi |
| `07_member_paid_desktop.jpg` | Aʼzo toʻlovdan keyin: "+75 W keshbek + 100 W birinchi donat bonusi" |
| `08_hub_desktop.jpg` | Aʼzo hub |
| `09_find_desktop.jpg` | `/find` — streamer qidiruvi |
| `10_legal_desktop.jpg` | `/legal/offer` — placeholder, footer |
| `11_guest_desktop.jpg` | Mehmon, desktop |
| `12_home_mobile.jpg` | Bosh sahifa: "Donat yuborish" → `/find`, footer |

Hech bir sahifada hamyon, balans yoki toʻldirish yoʻq. E2E buni matn
boʻyicha tekshiradi.
