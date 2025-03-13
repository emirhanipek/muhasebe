const { pool } = require('../src/config/database.js');

class Siparis {
    constructor(data = {}) {
        this.idsiparis = data.idsiparis;
        this.model_no = data.model_no;
        this.tarih = data.tarih;
        this.toplam_adet = data.toplam_adet;
        this.marka = data.marka;
    }

    async save() {
        try {
            // Tarihi MySQL uyumlu formata dönüştür
            let formattedDate = this.tarih;
            
            if (this.tarih && typeof this.tarih === 'string') {
                // ISO formatındaki tarihi MySQL'in anlayacağı formata çevir
                const dateObj = new Date(this.tarih);
                
                if (!Number.isNaN(dateObj.getTime())) {
                    // 'YYYY-MM-DD HH:MM:SS' formatına dönüştür
                    formattedDate = dateObj.toISOString().slice(0, 19).replace('T', ' ');
                }
            }
            
            if (this.idsiparis) {
                // Güncelleme işlemi
                const [result] = await pool.query(
                    'UPDATE siparis SET model_no = ?, tarih = ?, toplam_adet = ?, marka = ? WHERE idsiparis = ?',
                    [this.model_no, formattedDate, this.toplam_adet, this.marka, this.idsiparis]
                );
                return result.affectedRows > 0;
            }
            
            // İki seçeneğiniz var:
            
            // 1. Seçenek: Veritabanının AUTO_INCREMENT özelliğini kullanın (önerilen)
            const [result] = await pool.query(
                'INSERT INTO siparis (model_no, tarih, toplam_adet, marka) VALUES (?, ?, ?, ?)',
                [this.model_no, formattedDate, this.toplam_adet, this.marka]
            );
            
            // Veritabanının atadığı ID'yi nesneye atayın
            if (result.insertId) {
                this.idsiparis = result.insertId;
            }
            
            // 2. Seçenek: Kendiniz ID atayın ve bunu da INSERT sorgusunda kullanın
            /* 
            // ID ataması için son ID'yi bulalım
            const [rows] = await pool.query('SELECT MAX(idsiparis) as maxId FROM siparis');
            const nextId = (rows[0].maxId || 0) + 1;
            this.idsiparis = nextId;
            
            // Yeni kayıt oluşturma - idsiparis dahil edildi!
            const [result] = await pool.query(
                'INSERT INTO siparis (idsiparis, model_no, tarih, toplam_adet, marka) VALUES (?, ?, ?, ?, ?)',
                [this.idsiparis, this.model_no, formattedDate, this.toplam_adet, this.marka]
            );
            */
            
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Sipariş kaydetme hatası:', error);
            throw error;
        }
    }


    static async getAll() {
        try {
            const [rows] = await pool.query('SELECT * FROM siparis ORDER BY tarih DESC');
            return rows.map(row => new Siparis(row));
        } catch (error) {
            console.error('Siparişleri getirme hatası:', error);
            throw error;
        }
    }

    static async getById(id) {
        try {
            const [rows] = await pool.query('SELECT * FROM siparis WHERE idsiparis = ?', [id]);
            return rows[0] ? new Siparis(rows[0]) : null;
        } catch (error) {
            console.error('Sipariş getirme hatası:', error);
            throw error;
        }
    }
    
    // Yeni eklenen metotlar
    static async delete(id) {
        try {
            const siparis = await id;
            if (!siparis) {
                console.warn(`Sipariş bulunamadı: ${id}`);
                return false;
            }
            const [result] = await pool.query('DELETE FROM siparis WHERE idsiparis = ?', [id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Sipariş silme hatası:', error);
            throw error;
        }
    }
    
   
}

module.exports = Siparis;