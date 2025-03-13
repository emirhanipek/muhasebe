const express = require('express');
const router = express.Router();
const Siparis = require('../models/siparis');
const { formatTarih } = require('../utils/helpers');
const { pool } = require('../src/config/database'); // Pool'u burada içe aktarın

// Tüm siparişleri listele
router.get('/', async (req, res) => {
    try {
        const siparisler = await Siparis.getAll();
        
        // Tarih formatını düzenle
        const formattedSiparisler = siparisler.map(siparis => {
            return {
                ...siparis,
                formattedTarih: formatTarih(siparis.tarih)
            };
        });
        
        res.render('orders', { 
            title: 'Siparişler',
            siparisler: formattedSiparisler
        });
    } catch (error) {
        console.error('Siparişleri getirme hatası:', error);
        res.status(500).render('error', { 
            title: 'Hata',
            message: 'Siparişleri getirirken bir hata oluştu.' 
        });
    }
});

// Yeni sipariş oluştur
router.post('/create', async (req, res) => {
    try {
        const { model_no, tarih, toplam_adet, marka } = req.body;
        
        // Sipariş.create metodunu kullanarak oluşturun
        const yeniSiparis = new Siparis({
            model_no,
            tarih,
            toplam_adet,
            marka
        });
        
        await yeniSiparis.save();
        
        res.status(201).json({ success: true, message: 'Sipariş başarıyla eklendi.' });
    } catch (error) {
        console.error('Sipariş oluşturma hatası:', error);
        res.status(500).json({ success: false, message: 'Sipariş oluşturulurken bir hata oluştu.' });
    }
});

// Sipariş silme
router.get('/delete/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const siparis = await Siparis.getById(id);
        
        if (siparis) {
            await Siparis.delete(id);
            res.redirect('/orders');
        } else {
            res.status(404).render('error', { 
                title: 'Hata',
                message: 'Silinecek sipariş bulunamadı.' 
            });
        }
    } catch (error) {
        console.error('Sipariş silme hatası:', error);
        res.status(500).render('error', { 
            title: 'Hata',
            message: 'Sipariş silinirken bir hata oluştu.' 
        });
    }
});

// Sipariş detay sayfası
router.get('/:id', async (req, res) => {
    try {
        const siparis = await Siparis.getById(req.params.id);
        if (siparis) {
            res.render('order-detail', { 
                title: `Sipariş #${siparis.idsiparis}`,
                siparis: {
                    ...siparis,
                    formattedTarih: formatTarih(siparis.tarih)
                }
            });
        } else {
            res.status(404).render('error', { 
                title: 'Hata',
                message: 'Sipariş bulunamadı.' 
            });
        }
    } catch (error) {
        console.error('Sipariş detayı getirme hatası:', error);
        res.status(500).render('error', { 
            title: 'Hata',
            message: 'Sipariş detayını getirirken bir hata oluştu.' 
        });
    }
});

module.exports = router;