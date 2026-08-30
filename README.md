# Tedarila — B2B Ekipman Kiralama & Tedarik Pazaryeri

> **"Satın alma. İhtiyacın kadar, ihtiyacın süresince kirala."**

Türkiye pazarındaki kurumsal şirketlerin etkinlik, fuar, organizasyon, şantiye, mutfak ve teknoloji ekipmanı ihtiyaçlarını yüksek satın alma maliyetlerine katlanmadan başka şirketlerden ve profesyonel tedarikçilerden güvenle kiralayabilecekleri **B2B Equipment Rental & Supply Marketplace**.

---

## 📱 Canlı Demo & Mobil Kurulum (PWA)

Bu projeyi telefonunuza uygulama olarak eklemek için:
1. Projeyi **Vercel** veya kendi sunucunuza bağlayın (Tek tıkla: `https://tedarila.vercel.app`).
2. Telefondan açtığınızda **"Ana Ekrana Ekle / Uygulamayı Yükle"** butonuna basarak doğrudan mobil uygulama gibi kullanabilirsiniz.

---

## 🏗️ 1. Mimari & Sistem Tasarımı

Platform, modern kurumsal SaaS ve pazaryeri standartlarına uygun olarak tasarlanmış çok katmanlı bir mimariye sahiptir:

```
+-------------------------------------------------------------------------------+
| Client: Next.js 15 (App Router, React 19, TypeScript, Tailwind CSS, PWA)     |
+-------------------------------------------------------------------------------+
                                      |
                                      v
+-------------------------------------------------------------------------------+
| API Layer: Next.js Route Handlers & Server Actions                            |
+-------------------------------------------------------------------------------+
         |                     |                     |                     |
         v                     v                     v                     v
+-----------------+   +-----------------+   +-----------------+   +-------------+
| Tarih + Adet    |   | Akıllı Çoklu    |   | Sipariş &       |   | Doğal Dil   |
| Zaman Bazlı     |   | Tedarikçi       |   | Tutanaklı       |   | AI RFQ      |
| Stok Motoru     |   | (Multi-Supplier)|   | Yaşam Döngüsü   |   | Motoru      |
+-----------------+   +-----------------+   +-----------------+   +-------------+
                                      |
                                      v
+-------------------------------------------------------------------------------+
| Database: Prisma ORM (SQLite / PostgreSQL İlişkisel Veritabanı)               |
+-------------------------------------------------------------------------------+
```

---

## 🌟 2. Temel Özellikler

1. **Zaman ve Adet Bazlı Stok:** Kiralama tarihlerine göre günlük çakışma ve overbooking engelleme.
2. **Çoklu Tedarikçi (Multi-Supplier Split):** 1.000 sandalye talebini Tedarikçi A (600) ve Tedarikçi B (400) olarak otomatik tamamlama.
3. **Doğal Dil ile AI RFQ:** Türkçe serbest metinden otomatik talep çıkarma.
4. **Fotoğraflı Teslimat & İade Tutanakları:** Eksiksiz teslim ve hasar/depozito güvencesi.
5. **Gelişmiş Fiyatlandırma:** Günlük vs Haftalık/Aylık en ucuz tarife seçimi ve kademeli adet indirimleri.

---

## 🚀 3. Yerel Çalıştırma (Localhost)

```bash
# 1. Bağımlılıkları yükleyin
npm install

# 2. Veritabanını hazırlayın ve tohumlayın (Seed)
npx prisma db push
npm run prisma:seed

# 3. Uygulamayı başlatın
npm run dev
# veya yüksek hızlı production modu:
npm run build && npm start
```

Tarayıcınızda **http://localhost:3000** adresine gidin.

---

## 📄 Lisans
© 2026 Tedarila B2B Equipment Rental & Supply A.Ş. Tüm hakları saklıdır.
