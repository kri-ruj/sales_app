// CEO Inspiration Quotes for Freshket Sales Team
export const ceoQuotes = [
  {
    quote: "ความสำเร็จของทีมขายคือหัวใจสำคัญของ Freshket เราเชื่อว่าการส่งมอบวัตถุดิบสดใหม่คุณภาพสูงให้กับร้านอาหาร ไม่ใช่แค่การขาย แต่คือการสร้างความสัมพันธ์ที่ยั่งยืน",
    context: "main"
  },
  {
    quote: "ทุกการขายคือโอกาสในการสร้างคุณค่า",
    context: "short"
  },
  {
    quote: "ทีมขายที่แข็งแกร่งคือรากฐานของ Freshket ทุกวันคือโอกาสใหม่ในการสร้างความสัมพันธ์ที่ดีกับลูกค้า",
    context: "dashboard"
  },
  {
    quote: "เราไม่ได้แค่ขายวัตถุดิบ แต่เรากำลังส่งมอบความสดใหม่และคุณภาพให้กับทุกจานอาหาร",
    context: "sales"
  },
  {
    quote: "ความไว้วางใจจากลูกค้าคือสิ่งที่เราภูมิใจที่สุด จงรักษามันไว้ด้วยการบริการที่ดีที่สุด",
    context: "customer"
  },
  {
    quote: "นวัตกรรมในการจัดส่งวัตถุดิบสดคือสิ่งที่ทำให้ Freshket แตกต่าง",
    context: "innovation"
  },
  {
    quote: "ทุกความคิดเห็นจากลูกค้าคือโอกาสในการพัฒนา",
    context: "feedback"
  },
  {
    quote: "การเติบโตของธุรกิจลูกค้าคือการเติบโตของเรา",
    context: "growth"
  }
];

export const getRandomQuote = (context?: string): string => {
  if (context) {
    const contextQuotes = ceoQuotes.filter(q => q.context === context);
    if (contextQuotes.length > 0) {
      return contextQuotes[Math.floor(Math.random() * contextQuotes.length)].quote;
    }
  }
  return ceoQuotes[Math.floor(Math.random() * ceoQuotes.length)].quote;
};

export const getDailyQuote = (): string => {
  // Use date as seed for consistent daily quote
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
  return ceoQuotes[dayOfYear % ceoQuotes.length].quote;
};