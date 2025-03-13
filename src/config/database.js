const mysql = require('mysql2/promise');
require('dotenv').config();

// Bağlantı havuzu oluşturma
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '123456789',
    database: process.env.DB_NAME || 'muhasebe',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Bağlantıyı test etme
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('MySQL veritabanına başarıyla bağlanıldı.');
        connection.release();
        return true;
    } catch (error) {
        console.error('Veritabanı bağlantı hatası:', error);
        return false;
    }
}

// Export the pool and test function
module.exports = {
    pool,
    testConnection
};