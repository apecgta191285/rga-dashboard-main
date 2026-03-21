# 📋 ดึงข้อมูล Supabase ไปใส่ในไฟล์ .env

## 📌 ขั้นตอน 1: Supabase Database Connection

1. ไปที่ **Supabase Dashboard** > Project ของคุณ
2. คลิก **Settings** (⚙️) > **Database** (ด้านซ้าย)
3. ดูส่วน **Connection String**
4. เลือก **Session Pooler** (recommended)

### ต้องคัดลอกมา:
```
DATABASE_URL = postgresql://postgres:[PASSWORD]@[PROJECT_REFERENCE].supabase.co:5432/postgres
DIRECT_URL = postgresql://postgres:[PASSWORD]@db.[PROJECT_REFERENCE].supabase.co:5432/postgres
```

**หมายเหตุ:**
- ค้นหาคำว่า `[PROJECT_REFERENCE]` จากโครงสร้าง URL
- ค้นหา `[PASSWORD]` ที่คุณตั้งไว้ตอน setup Supabase
- หากลืม password ให้ไปที่ **Database** > **Reset password**

---

## 📌 ขั้นตอน 2: Generate Encryption Keys

เปิด Terminal/PowerShell แล้วรัน:

```powershell
# สร้าง ENCRYPTION_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# สร้าง JWT_SECRET  
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# สร้าง JWT_REFRESH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

คัดลอกผลลัพธ์ 3 ตัวนี้ไปใส่ใน `.env` ตามแต่ละช่อง

---

## 📌 ขั้นตอน 3: Google OAuth (ถ้ามี)

ไปที่ **Google Cloud Console** > Project ของคุณ:
1. **Credentials** > **OAuth 2.0 Client ID**
2. คัดลอก: `GOOGLE_CLIENT_ID` และ `GOOGLE_CLIENT_SECRET`

---

## 📌 ขั้นตอน 4: Email (SMTP - Gmail)

1. เปิด Gmail
2. ไปที่ **Account** > **Security**
3. ค้นหา "App passwords"
4. สร้าง App Password สำหรับ SMTP
5. ใส่ใน `SMTP_PASSWORD`

---

## 📌 ไฟล์ที่ต้องกรอก:
- ✅ `/backend/.env` - ใส่ข้อมูล Database + Keys
- ✅ `/frontend/.env` - เสร็จแล้วแล้ว ✓

---

## 🚀 ขั้นตอนต่อเมื่อเสร็จแล้ว:

เมื่อใส่ข้อมูลเสร็จแล้ว รันคำสั่งนี้:

```powershell
# Backend
cd backend
npm run build
npm run start:dev

# Frontend (terminal อื่น)
cd frontend  
pnpm dev
```

เข้าไป http://localhost:5173 ได้เลย!

