# Bright Sales App 🎤

แอปพลิเคชันขายของที่เน้นฟีเจอร์บันทึกเสียงและ AI Transcription สำหรับจัดการกิจกรรมการขาย

## ✨ ฟีเจอร์หลัก

### 📊 Dashboard - ภาพรวมและสถิติ
- แสดงสถิติการขายทั้งหมด
- กิจกรรมล่าสุด 5 รายการ
- ยอดขายรายเดือนและอัตราความสำเร็จ
- การแสดงผล AI Insights จากการบันทึกเสียง

### 📋 Activities List - รายการกิจกรรมทั้งหมด
- ค้นหาและกรองกิจกรรมตามสถานะ
- แสดงข้อมูลบันทึกเสียงและ transcription
- จัดการสถานะกิจกรรม (รอดำเนินการ/เสร็จสิ้น/ยกเลิก)
- แท็กและหมวดหมู่
- AI-generated action items

### ➕ Add Activity - เพิ่มกิจกรรมใหม่
- ฟอร์มเพิ่มกิจกรรมแบบครบถ้วน
- บันทึกเสียงในขณะกรอกฟอร์ม
- Auto-fill ข้อมูลจาก voice transcription
- แท็กและการจัดหมวดหมู่

### 🎤 Voice Recording - บันทึกเสียงเต็มรูปแบบ
- การบันทึกเสียงแบบ real-time
- Live transcription (จำลอง)
- เล่นเสียงที่บันทึกไว้
- AI Analysis preview
- บันทึกเป็นกิจกรรมโดยตรง

## 🎯 Voice-First Features

### 🔴 ปุ่มบันทึกเสียงบนทุกหน้า
- ปุ่มแดงโดดเด่นบน Navigation Bar
- สถานะการบันทึกแบบ real-time
- Floating indicator เมื่อกำลังบันทึก

### 🤖 AI Processing
- **Live Transcription**: แปลงเสียงเป็นข้อความโดยอัตโนมัติ
- **Sentiment Analysis**: วิเคราะห์อารมณ์ของการสนทนา
- **Action Items Extraction**: สร้างรายการสิ่งที่ต้องทำ
- **Priority Assessment**: กำหนดระดับความสำคัญ

### 📱 Mobile-Responsive
- การแสดงผลที่เหมาะสมกับมือถือ
- Navigation menu แบบ collapsible
- ปุ่มบันทึกเสียงใหญ่สำหรับการใช้งานบนมือถือ

## 🛠 เทคโนโลยีที่ใช้

- **React 18** with TypeScript
- **Tailwind CSS** สำหรับ styling
- **Lucide React** สำหรับ icons
- **Web Audio API** สำหรับการบันทึกเสียง
- **Context API** สำหรับ state management
- **Responsive Design** mobile-first approach

## 🚀 การติดตั้งและรัน

1. **Clone repository**
   ```bash
   git clone [repository-url]
   cd bright-sales-app
   ```

2. **ติดตั้ง dependencies**
   ```bash
   npm install
   ```

3. **รันแอปพลิเคชัน**
   ```bash
   npm start
   ```

4. **เปิดเบราว์เซอร์ไปที่**
   ```
   http://localhost:3000
   ```

## 🎮 วิธีการใช้งาน

### การบันทึกเสียง
1. คลิกปุ่มไมโครโฟนสีแดงในแถบ Navigation
2. อนุญาตการใช้งานไมโครโฟน
3. พูดข้อความที่ต้องการบันทึก
4. คลิกหยุดเพื่อสิ้นสุดการบันทึก
5. รอการ transcription (จำลอง 2 วินาที)

### การเพิ่มกิจกรรม
1. ไปหน้า "เพิ่มกิจกรรม"
2. กรอกข้อมูลในฟอร์ม หรือ
3. ใช้การบันทึกเสียงและคลิก "นำข้อมูลไปใส่ในฟอร์ม"
4. แก้ไขข้อมูลตามต้องการ
5. คลิก "บันทึกกิจกรรม"

### การจัดการกิจกรรม
1. ไปหน้า "รายการกิจกรรม"
2. ใช้ช่องค้นหาเพื่อหากิจกรรม
3. กรองตามสถานะ
4. เปลี่ยนสถานะหรือลบกิจกรรม

## 🎨 Design System

### สีหลัก
- **Primary**: Blue (#3b82f6 - #1e3a8a)
- **Accent**: Cyan (#0ea5e9 - #0c4a6e)
- **Voice Button**: Red (#ef4444 - #dc2626)

### Typography
- **Font**: Kanit (Thai) + System fonts
- **Heading**: Bold weights (600-700)
- **Body**: Regular (400) และ Medium (500)

### Components
- **Card**: White background, rounded corners, subtle shadow
- **Buttons**: Rounded, hover effects, loading states
- **Voice Elements**: Red accent, pulse animations

## 🔮 AI Features (จำลอง)

แอปใช้ Mock AI functions ที่จำลองการทำงานจริง:

- **Transcription**: สุ่มข้อความตัวอย่างภาษาไทย
- **Sentiment Analysis**: กำหนดเป็น positive/neutral/negative
- **Action Items**: สร้างรายการสิ่งที่ต้องทำอัตโนมัติ
- **Priority**: กำหนดระดับความสำคัญ

## 📱 Browser Support

- **Chrome** ✅ (แนะนำ - รองรับ Web Audio API เต็มรูปแบบ)
- **Firefox** ✅ 
- **Safari** ✅ 
- **Edge** ✅ 

**หมายเหตุ**: ฟีเจอร์บันทึกเสียงต้องการ HTTPS หรือ localhost เพื่อเข้าถึง microphone

## 🔒 Privacy & Security

- บันทึกเสียงจัดเก็บใน memory เท่านั้น
- ไม่มีการส่งข้อมูลออกจากเบราว์เซอร์
- ข้อมูลหายไปเมื่อรีเฟรชหน้า
- ไม่มีการบันทึกข้อมูลลงเซิร์ฟเวอร์

## 🛣 Future Roadmap

- [ ] เชื่อมต่อ API บันทึกเสียงจริง
- [ ] Database integration
- [ ] ส่งออกรายงาน PDF
- [ ] การแจ้งเตือน follow-up
- [ ] Multi-language support
- [ ] Real-time collaboration

## 🤝 Contributing

1. Fork the project
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

MIT License - ดูไฟล์ [LICENSE](LICENSE) สำหรับรายละเอียด

---

**สร้างด้วย ❤️ สำหรับทีมขายที่ต้องการเครื่องมือที่ทันสมัย** 