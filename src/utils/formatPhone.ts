/**
 * Telefon raqamini +998 90 123 45 67 formatida formatlaydi
 * @param phone - Telefon raqami (string yoki number)
 * @returns Formatlangan telefon raqami yoki 'Mavjud emas'
 */
export const formatPhone = (phone: string | number | null | undefined): string => {
  if (!phone) return 'Mavjud emas'
  
  // Telefon raqamini stringga aylantirish va faqat raqamlarni qoldirish
  const cleanPhone = phone.toString().replace(/\D/g, '')
  
  // Agar telefon raqami bo'sh bo'lsa
  if (!cleanPhone) return 'Mavjud emas'
  
  // Agar telefon raqami 998 bilan boshlanmasa, uni qo'shish
  let formattedPhone = cleanPhone
  if (!formattedPhone.startsWith('998')) {
    // Agar 9 bilan boshlansa (masalan: 901234567), 998 qo'shish
    if (formattedPhone.startsWith('9') && formattedPhone.length === 9) {
      formattedPhone = '998' + formattedPhone
    }
    // Agar boshqa formatda bo'lsa, 998 qo'shish
    else if (formattedPhone.length === 9) {
      formattedPhone = '998' + formattedPhone
    }
  }
  
  // Agar telefon raqami 12 ta raqamdan iborat bo'lsa (998901234567)
  if (formattedPhone.length === 12 && formattedPhone.startsWith('998')) {
    // +998 90 123 45 67 formatida qaytarish
    return `+${formattedPhone.slice(0, 3)} ${formattedPhone.slice(3, 5)} ${formattedPhone.slice(5, 8)} ${formattedPhone.slice(8, 10)} ${formattedPhone.slice(10, 12)}`
  }
  
  // Agar telefon raqami 13 ta raqamdan iborat bo'lsa (+998901234567)
  if (formattedPhone.length === 13 && formattedPhone.startsWith('998')) {
    return `+${formattedPhone.slice(0, 3)} ${formattedPhone.slice(3, 5)} ${formattedPhone.slice(5, 8)} ${formattedPhone.slice(8, 10)} ${formattedPhone.slice(10, 13)}`
  }
  
  // Agar format mos kelmasa, asl qiymatni qaytarish
  return phone.toString()
}
