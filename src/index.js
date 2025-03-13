const express = require('express');
const path = require('path');
const { testConnection } = require('./config/database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// View engine 
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
const indexRouter = require('../routes/index');
const ordersRouter = require('../routes/orders');

app.use('/', indexRouter);
app.use('/orders', ordersRouter);

// DB Bağlantısını test et
testConnection().then(connected => {
    if (connected) {
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } else {
        console.error('Veritabanı bağlantısı kurulamadı, uygulama başlatılamadı.');
        process.exit(1);
    }
});

// 404 Hata Sayfası
app.use((req, res) => {
    res.status(404).render('error', { 
        title: 'Sayfa Bulunamadı',
        message: 'Aradığınız sayfa bulunamadı.' 
    });
});

// Hata Yönetimi
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', { 
        title: 'Sunucu Hatası',
        message: 'Üzgünüz, bir hata oluştu.' 
    });
});

module.exports = app;