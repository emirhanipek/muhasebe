/**
 * Tarihi Türkçe formatta düzenler
 * @param {Date} date 
 * @returns {String} Formatlanmış tarih string'i
 */
function formatTarih(date) {
    if (!date) return '';
    
    const options = { 
        year: 'numeric', 
        month: 'numeric', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    
    return new Date(date).toLocaleDateString('tr-TR', options);
}

module.exports = {
    formatTarih
};