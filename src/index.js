const express = require('express');
const path = require('path');
const app = express();

// Static dosyalar için public klasörünü kullan
app.use(express.static(path.join(__dirname, '../public')));

// EJS şablon motorunu ayarla
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));


app.get('/', (req, res) => {
    res.render('index', {
        title: 'Anasayfa',
    });
});

// Orders sayfasını EJS ile render et
app.get('/orders', (req, res) => {
    res.render('orders', {
        title: 'Siparişler',
    });
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});