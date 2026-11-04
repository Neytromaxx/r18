# Admin panel (s22) — donat sozlamalari va W

Bu vazifalar **bajarilmagan**. Backend tayyor, s22 da ekran yoʻq. Hozircha
qiymatlarni API orqali oʻzgartirish mumkin (pastda).

## 1. "Donat sozlamalari" ekrani

**API (m21, tayyor):** `GET` / `PUT /api/v1/admin/catalog/donation-config`.
Guard `catalog.manage` — `topup-bonus` bilan bir xil. s22 da namuna:
`src/features/coin/components/TopUpBonusEditor.vue`.

| Maydon | Standart | Cheklov | Maʼnosi |
|---|---|---|---|
| `guest_fee_pct` | 1.5 | 0–10 | Mehmon komissiyasi, % |
| `member_fee_pct` | 1.0 | 0–10 | Roʻyxatdan oʻtgan foydalanuvchi komissiyasi, % |
| `claim_ttl_days` | 7 | 1–90 | Mehmon W ni necha kun ichida oladi |
| `first_bonus_min_amount` | 10 000 | ≥ 0, butun soʻm | Birinchi donat bonusi uchun minimal summa |
| `first_bonus_daily_cap_per_recipient` | 20 | ≥ 0 | Bitta streamerga kuniga nechta birinchi donat bonusi |

`PUT` da barcha maydonlar ixtiyoriy: yuborilmagan maydon oʻzgarmaydi.

**Javob:** sozlamalar va qoʻshimcha maydonlar:
- `w_rules` — `donation.cashback_pct` va `donation.first_bonus` qoidalarining
  joriy qiymati va `is_active` holati. Ekranda faqat oʻqish uchun
  koʻrsatiladi, tahrirlash — W qoidalari ekranida (2-band).
- `warnings: string[]` — saqlangan, lekin admin bilishi kerak boʻlgan holatlar.
  Masalan: birinchi donat bonusi minimal summadagi komissiyadan katta.
  Ekranda sariq ogohlantirish boʻlib chiqishi kerak.

**Xatolar:** `400` va `error.code = "donation_config_invalid"`. `error.message` ni
koʻrsatish kerak, masalan:
"Keshbek (1.0%) roʻyxatdan oʻtgan foydalanuvchi komissiyasidan (1.0%) kichik boʻlishi kerak."

**Retroaktiv emas.** Ekranda shu izoh boʻlsin: "Oʻzgarish faqat yangi
donatlarga taʼsir qiladi. Allaqachon boshlangan toʻlovlar eski stavka bilan
yakunlanadi."

## 2. W qoidalari ekrani (`CoinManageView.vue`)

- Yangi qoidalar: `donation.cashback_pct` (FOIZ) va `donation.first_bonus` (W).
  Ikkalasi `ACTIVITY` toifasida ("Faollik") va mavjud roʻyxatda oʻz-oʻzidan
  chiqadi.
- **Tuzatish kerak:** `PERCENT_RULES` toʻplamiga `donation.cashback_pct` ni
  qoʻshing. Hozir unda faqat `activity.tournament_cashback` bor, shuning uchun
  `0.5` qiymati "0.5 W" boʻlib koʻrinadi. Toʻgʻrisi "0.5%".
- `PUT /admin/coin/rules/donation.cashback_pct` keshbekni aʼzo komissiyasi
  bilan solishtiradi. Keshbek komissiyadan kichik boʻlmasa, `400
  donation_config_invalid` qaytadi. Shu xabar ekranda koʻrsatilishi kerak.

## 3. `donation_rewards` roʻyxati

Har bir PSP donati uchun bitta qator yoziladi (mehmon ham, aʼzo ham — audit
uchun).

- **Backend endpointi hali yoʻq.** `GET /admin/donations/rewards` qoʻshish
  kerak, sahifalash bilan.
- Filtrlar:
  - `status` (`pending`, `claimed`, `expired`);
  - `bonus_refusal` (`not_first_donation`, `below_min`, `self_recipient`,
    `daily_cap`, `disabled`);
  - qabul qiluvchi (streamer);
  - sana.
- Ustunlar:
  - sana;
  - qabul qiluvchi;
  - summa (`base_amount`);
  - `cashback_w`;
  - `first_bonus_w_offered`;
  - `bonus_granted`;
  - `bonus_refusal`;
  - `status`;
  - kim oldi (`claimed_account_id`) va qachon (`claimed_at`);
  - `expires_at`.

## 4. Refundda W ni qaytarib olish

Payme `PerformTransaction` dan keyin toʻlovni bekor qilmaydi. Shuning uchun
refund qoʻlda qilinadi va unga bogʻliq W ham qoʻlda qaytariladi.

- `donation_rewards` qatorida **"W ni qaytarib olish"** tugmasi boʻlsin.
- Tugma mavjud `POST /admin/coin/adjust` ni chaqiradi: manfiy miqdor
  (`cashback_w` + bergan boʻlsa bonus), sabab majburiy.
- Ledgerdagi kalitlar:
  - keshbek — `donation_cashback:{donation_id}`;
  - bonus — `first_donation_bonus:{account_id}`.
- Bonus qaytarib olinsa ham, hisob uchun "birinchi donat" ishlatilgan
  hisoblanadi. Bonus qayta berilmaydi.

## Bayroq (admin panelga chiqarilmaydi)

`DONATION_WALLET_ENABLED` — **faqat env** (m21). Uni s22 ga chiqarmang.
Hamyon orqali donatni qaytarish huquqiy qaror talab qiladi (`OWNER_TASKS.md`).
