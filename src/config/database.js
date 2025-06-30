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

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Hata oluştu", error });
  }
};


// Export the pool and test function
module.exports = {
    pool,
    testConnection
};