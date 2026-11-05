// Kirishdan keyin qaytish manzili — faqat ICHKI yoʻl.
//
// `?redirect=` foydalanuvchi qoʻlida: "https://boshqa-sayt" yoki
// "//boshqa-sayt" kabi qiymatlar sahifadan tashqariga olib ketmasin
// (open redirect). Mos kelmasa — standart manzil.
export function safeRedirect(value, fallback = '/hub') {
  const v = Array.isArray(value) ? value[0] : value
  if (typeof v !== 'string' || !v.startsWith('/') || v.startsWith('//') || v.startsWith('/\\')) {
    return fallback
  }
  return v
}
