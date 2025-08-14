# Skilins Backend

Skilins Backend adalah backend service untuk platform **Skilins**, dibangun menggunakan [NestJS](https://nestjs.com/) dan [Prisma](https://www.prisma.io/).  
Project ini menyediakan API untuk berbagai fitur seperti ebook, podcast, novel, dan manajemen konten siswa.

---

## 🚀 Installation (Using Docker Compose)

### **Prerequisites**

Pastikan server Anda sudah terinstall:

- [Docker](https://docs.docker.com/engine/install/)
- [Docker Compose](https://docs.docker.com/compose/install/)

> **Note:** Tidak perlu menginstall Node.js di server jika menggunakan Docker Compose, karena semua dependency akan di-handle di dalam container.

---

### **1. Clone Repository**

```bash
git clone https://github.com/dwiluthfianto/skilins-be.git
cd skilins-be
```

### **2. Konfigurasi environment**

Copy file .env.example lalu ubah jadi .env dan sesuaikan variable environment sesuai kebutuhan:

```bash
NODE_ENV=development
APP_VERSION=1.0.0
APP_PORT=7667
APP_NAME="Skilins API"
FRONTEND_DOMAIN=http://localhost:3000
BACKEND_DOMAIN=http://localhost:7667

MAIL_HOST='smtp.gmail.com'
MAIL_PORT=465
MAIL_USER=
MAIL_PASSWORD=
MAIL_IGNORE_TLS=false
MAIL_SECURE=true
MAIL_REQUIRE_TLS=true

# Database
POSTGRES_USER=
POSTGRES_PASSWORD=
POSTGRES_HOST_PORT=
POSTGRES_CONTAINER_PORT=
DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:${POSTGRES_HOST_PORT}/skilins"

COOKIE_SECRET=
AUTH_JWT_SECRET=
AUTH_REFRESH_SECRET=
AUTH_FORGOT_SECRET=
AUTH_CONFIRM_EMAIL_SECRET=

AUTH_JWT_TOKEN_EXPIRES_IN=15m
AUTH_REFRESH_TOKEN_EXPIRES_IN=1d
AUTH_FORGOT_TOKEN_EXPIRES_IN=2h
AUTH_CONFIRM_EMAIL_TOKEN_EXPIRES_IN=1d
```

### **3. Jalankan dengan Docker Compose**

```bash
docker compose up -d --build
```

Perintah ini akan:

- Membuat container untuk backend
- Membuat container untuk database
- Menjalankan service secara otomatis

### **4. Cek Log**

Untuk melihat log backend dan memastikan service berjalan tanpa adanya error

```bash
docker compose logs -f skilins
```

### **5. Akses aplikasi**

Jika deployment berhasil, backend akan berjalan di:

```bash
http://localhost:7667
```

```bash
http://<SERVER_IP>:7667
```

### **6. Menghentikan Service**

Untuk melihat log backend dan memastikan service berjalan tanpa adanya error

```bash
docker compose down
```

---

## 🚀 Installation (Development)

Jika ingin menjalankan project di local development tanpa Docker:

1. Pastikan Node.js & PostgreSQL sudah terinstall

2. Install dependency:

```bash
npm install
```

3. Jalankan migration database:

```bash
npx prisma migrate dev
```

4. Start development server:

```bash
npm run start:dev
```
