const { pool } = require('../src/config/database.js');

class SiparisDetay {
    constructor(data = {}) {
        this.idsiparis_detils = data.idsiparis_detils;
        this.idsiparis = data.idsiparis;

        // Dinamik olarak renk ve adet alanlarını ekleyelim
        for (let i = 1; i <= 45; i++) {
            this[`renk${i}`] = data[`renk${i}`] || null;
            this[`adet${i}`] = data[`adet${i}`] || null;
        }
    }

    // Sipariş ID'sine göre detayları getir
    static async getBySiparisId(siparisId) {
        try {
            const [rows] = await pool.query(
                'SELECT * FROM siparis_detils WHERE idsiparis = ?', 
                [siparisId]
            );
            return rows.length > 0 ? new SiparisDetay(rows[0]) : null;
        } catch (error) {
            console.error('Sipariş detayı getirme hatası:', error);
            throw error;
        }
    }

    // Detay kaydı varsa güncelle, yoksa yeni ekle
    async save() {
        try {
            // Önce bu siparişe ait detay var mı kontrol et
            const [existing] = await pool.query(
                'SELECT siparis_detils FROM siparis_detils WHERE idsiparis = ?',
                [this.idsiparis]
            );

            // Kaydetme veya güncelleme için sütun ve değerleri hazırla
            const columns = ['idsiparis'];
            const placeholders = ['?'];
            const values = [this.idsiparis];
            
            // Renk ve adet değerlerini ekle
            for (let i = 1; i <= 45; i++) {
                if (this[`renk${i}`] || this[`adet${i}`]) {
                    columns.push(`renk${i}`);
                    placeholders.push('?');
                    values.push(this[`renk${i}`]);
                    
                    columns.push(`adet${i}`);
                    placeholders.push('?');
                    values.push(this[`adet${i}`]);
                }
            }

            if (existing.length > 0) {
                // Güncelleme
                this.idsiparis_detils = existing[0].idsiparis_detils;
                
                // UPDATE sorgusu için set ifadelerini oluştur
                const setClause = columns.map((col, idx) => `${col} = ?`).join(', ');
                
                const [result] = await pool.query(
                    `UPDATE siparis_detils SET ${setClause} WHERE idsiparis_detils = ?`,
                    [...values, this.idsiparis_detils]
                );
                
                return result.affectedRows > 0;
            }
            
            const [rows] = await pool.query('SELECT MAX(idsiparis_detils) as maxId FROM siparis_detils');
            const nextId = (rows[0].maxId || 0) + 1;
            this.idsiparis_detils = nextId;
            
            // ID ekle
            columns.unshift('idsiparis_detils');
            placeholders.unshift('?');
            values.unshift(this.idsiparis_detils);
            
            const [result] = await pool.query(
                `INSERT INTO siparis_detils (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`,
                values
            );
            
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Sipariş detayı kaydetme hatası:', error);
            throw error;
        }
    }

    // Toplam adet sayısını hesapla
    getTotalQuantity() {
        let total = 0;
        for (let i = 1; i <= 45; i++) {
            if (this[`adet${i}`]) {
                total += Number.parseInt(this[`adet${i}`], 10) || 0;
            }
        }
        return total;
    }

    // Renk-adet çiftlerini al
    getColorQuantityPairs() {
        const pairs = [];
        for (let i = 1; i <= 45; i++) {
            if (this[`renk${i}`] && this[`adet${i}`]) {
                pairs.push({
                    renk: this[`renk${i}`],
                    adet: this[`adet${i}`]
                });
            }
        }
        return pairs;
    }
}

module.exports = SiparisDetay;