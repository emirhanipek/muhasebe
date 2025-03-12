const express = require('express');
const path = require('path');

const app = express();

// Static dosyalar için public klasörünü kullan
app.use(express.static(path.join(__dirname, '../public')));

// EJS şablon motorunu ayarla
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Örnek sipariş verileri (gerçek uygulamada bir veritabanından gelecektir)
const siparisler = [
    {
        id: 1001,
        musteri: 'Ahmet Yılmaz',
        tarih: '22 Şubat 2025',
        tutar: '349.99',
        durum: 'delivered',
        durumMetni: 'Teslim Edildi'
    },
    {
        id: 1002,
        musteri: 'Ayşe Demir',
        tarih: '3 Mart 2025',
        tutar: '128.50',
        durum: 'pending',
        durumMetni: 'Hazırlanıyor'
    },
    {
        id: 1003,
        musteri: 'Mehmet Kaya',
        tarih: '1 Mart 2025',
        tutar: '521.75',
        durum: 'cancelled',
        durumMetni: 'İptal Edildi'
    }
];

app.get('/', (req, res) => {
    res.send('Anasayfaya Hoş Geldiniz');
});

// Orders sayfasını EJS ile render et
app.get('/orders', (req, res) => {
    res.render('orders', {
        title: 'Siparişler',
        siparisler: siparisler
    });
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});