# Muhasebe Projesi

Bu proje, işletmeler için modern ve kullanıcı dostu bir muhasebe yönetim sistemidir.

## Özellikler

- Gelir ve gider takibi
- Fatura yönetimi
- Müşteri ve tedarikçi kayıtları
- Finansal raporlama
- Çok kullanıcılı sistem desteği
- Kapsamlı hata yakalama ve loglama
- Güvenli kimlik doğrulama sistemi

## Sistem Gereksinimleri

### Desteklenen Tarayıcılar
- Google Chrome (v90+)
- Mozilla Firefox (v88+)
- Microsoft Edge (v90+)
- Safari (v14+)

### Sunucu Gereksinimleri
- Node.js v14.x veya üzeri
- PostgreSQL v12.x veya üzeri
- 2GB RAM (minimum)
- 4GB disk alanı

## Kurulum

1. Projeyi klonlayın:
```bash
git clone https://github.com/your-username/muhasebe.git
cd muhasebe
```

2. Bağımlılıkları yükleyin:
```bash
npm install
```

3. Ortam değişkenlerini yapılandırın:
```bash
cp .env.example .env
# .env dosyasını kendi ortamınıza göre düzenleyin
# NOT: .env dosyası asla versiyon kontrolüne eklenmemelidir
```

4. İlk kurulum ve yönetici hesabı oluşturma:
```bash
npm run setup
# Bu komut ilk yönetici hesabınızı oluşturmanızı sağlayacaktır
```

5. Uygulamayı başlatın:
```bash
npm run dev
```

## Veritabanı Yapısı

### Şema Diyagramı
Veritabanı şema diyagramına [buradan](docs/database-schema.pdf) ulaşabilirsiniz.

### Ana Tablolar
- `users`: Kullanıcı hesapları ve yetkilendirme bilgileri
- `transactions`: Finansal işlem kayıtları
- `customers`: Müşteri bilgileri
- `suppliers`: Tedarikçi bilgileri
- `invoices`: Fatura kayıtları
- `accounts`: Hesap planı

Detaylı tablo yapıları için [veritabanı dokümantasyonunu](docs/database.md) inceleyebilirsiniz.

## Hata Yakalama ve Loglama

### Log Seviyeleri
- ERROR: Kritik sistem hataları
- WARN: Önemli uyarılar
- INFO: Bilgilendirme mesajları
- DEBUG: Geliştirici detayları

### Log Lokasyonları
- Uygulama logları: `/logs/app.log`
- Hata logları: `/logs/error.log`
- Güvenlik logları: `/logs/security.log`

## Güvenlik

- Tüm API istekleri JWT token doğrulaması gerektirir
- Parolalar bcrypt ile hashlenir
- İki faktörlü kimlik doğrulama (2FA) desteği
- Rate limiting ve brute force koruması
- SQL injection koruması
- XSS koruması

## Kullanım

1. Tarayıcınızda `http://localhost:3000` adresine gidin
2. Kurulum sırasında oluşturduğunuz yönetici hesabıyla giriş yapın
3. Dashboard üzerinden muhasebe işlemlerinizi yönetmeye başlayın

## Katkıda Bulunma

1. Bu repository'yi fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'feat: Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasını inceleyebilirsiniz.