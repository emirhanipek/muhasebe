const express = require('express');
const router = express.Router();
const { pool } = require('../src/config/database');
const Siparis = require('../models/siparis');
const { formatTarih } = require('../utils/helpers');

// Detay sayfasını görüntüleme
router.get('/:id', async (req, res) => {
    try {
      const siparisId = req.params.id;
      
      // Ana sipariş bilgilerini getir
      const [siparisRows] = await pool.query('SELECT * FROM siparis WHERE idsiparis = ?', [siparisId]);
      
      if (siparisRows.length === 0) {
        return res.status(404).render('error', {
          title: 'Hata',
          message: 'Sipariş bulunamadı'
        });
      }
      
      const siparis = siparisRows[0];
      
      // Sipariş detaylarını getir
      const [detayRows] = await pool.query('SELECT * FROM siparis_detils WHERE idsiparis = ?', [siparisId]);
      
      // Mevcut renk-adet çiftlerini oluştur
      const renkAdetPairs = [];
      
      if (detayRows.length > 0) {
        const detay = detayRows[0];
        
        // 45 potansiyel renk-adet çifti için kontrol et
        for (let i = 1; i <= 45; i++) {
          const renkKey = `renk${i}`;
          const adetKey = `adet${i}`;
          
          // Eğer renk değeri varsa, bu bir geçerli renk-adet çiftidir
          if (detay[renkKey]) {
            renkAdetPairs.push({
              renk: detay[renkKey],
              adet: parseInt(detay[adetKey] || '0')
            });
          }
        }
        
        console.log('Bulunan renk-adet çiftleri:', renkAdetPairs); // Debug için
      }
      
      // Tarih formatını düzenle
      let formattedTarih = siparis.tarih;
      if (siparis.tarih) {
        formattedTarih = formatTarih(siparis.tarih);
      }
      
      // Bilgileri view'a gönder
      res.render('order_detail', {
        title: `Sipariş #${siparis.idsiparis} Detayları`,
        siparis: {
          ...siparis,
          formattedTarih
        },
        renkAdetPairs: renkAdetPairs // Burada çiftleri geçiriyoruz
      });
      
    } catch (error) {
      console.error('Sipariş detay sayfası hatası:', error);
      res.status(500).render('error', {
        title: 'Hata',
        message: 'Sipariş detaylarını getirirken bir hata oluştu'
      });
    }
  });

// Detayları kaydetme

router.post('/:id', async (req, res) => {
    try {
      const siparisId = req.params.id;
      console.log('Gelen veriler:', req.body); // Debug için
      const { renkler, adetler } = req.body;
      
      
      console.log('Gelen veriler:', { siparisId, renkler, adetler }); // Debug için
      
      if (!Array.isArray(renkler) || !Array.isArray(adetler)) {
        return res.status(400).json({
          success: false,
          message: 'Geçersiz veri formatı'
        });
      }
      
      // Önce sipariş var mı kontrol et
      const [siparisRows] = await pool.query('SELECT * FROM siparis WHERE idsiparis = ?', [siparisId]);
      
      if (siparisRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Sipariş bulunamadı'
        });
      }
      
      // Transaction başlat
      await pool.query('START TRANSACTION');
      
      try {
        // Önce mevcut detayları kontrol et
        const [detayRows] = await pool.query('SELECT idsiparis_detils FROM siparis_detils WHERE idsiparis = ?', [siparisId]);
        
        let detayId;
        let isUpdate = false;
        
        if (detayRows.length > 0) {
          // Güncelleme işlemi
          detayId = detayRows[0].idsiparis_detils;
          isUpdate = true;
          
          // Mevcut kaydı sil
          await pool.query('DELETE FROM siparis_detils WHERE idsiparis_detils = ?', [detayId]);
        } else {
          // Yeni kayıt oluştur
          const [idRows] = await pool.query('SELECT MAX(idsiparis_detils) as maxId FROM siparis_detils');
          detayId = (idRows[0].maxId || 0) + 1;
        }
        
        // Detay bilgilerini hazırla
        const fields = ['idsiparis_detils', 'idsiparis'];
        const values = [detayId, siparisId];
        const placeholders = ['?', '?'];
        
        // Renk ve adetleri ekle
        renkler.forEach((renk, index) => {
          if (renk && adetler[index]) {
            const i = index + 1; // 1-tabanlı index (renk1, adet1, ...)
            
            fields.push(`renk${i}`);
            values.push(renk);
            placeholders.push('?');
            
            fields.push(`adet${i}`);
            values.push(adetler[index]);
            placeholders.push('?');
          }
        });
        
        // Yeni detay kaydı oluştur
        await pool.query(
          `INSERT INTO siparis_detils (${fields.join(', ')}) VALUES (${placeholders.join(', ')})`,
          values
        );
        
        // Toplam adet hesapla
        const totalQuantity = adetler.reduce((total, adet) => total + (parseInt(adet) || 0), 0);
        
        // Sipariş tablosundaki toplam adeti güncelle
        await pool.query(
          'UPDATE siparis SET toplam_adet = ? WHERE idsiparis = ?',
          [totalQuantity, siparisId]
        );
        
        // İşlemi onayla
        await pool.query('COMMIT');
        
        res.status(200).json({
          success: true,
          message: isUpdate ? 'Sipariş detayları başarıyla güncellendi' : 'Sipariş detayları başarıyla kaydedildi'
        });
        
      } catch (error) {
        // Hata durumunda işlemi geri al
        await pool.query('ROLLBACK');
        console.error('Detay kaydetme hatası:', error);
        throw error;
      }
      
    } catch (error) {
      console.error('Sipariş detay kaydetme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Sipariş detayları kaydedilirken bir hata oluştu'
      });
    }
  });

module.exports = router;