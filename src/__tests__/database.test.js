const mysql = require('mysql2/promise');
const { pool, testConnection } = require('../config/database');

// Mock mysql2/promise
jest.mock('mysql2/promise', () => ({
  createPool: jest.fn(() => ({
    getConnection: jest.fn(),
    end: jest.fn()
  }))
}));

// Mock dotenv
jest.mock('dotenv', () => ({
  config: jest.fn()
}));

// Mock console methods
console.log = jest.fn();
console.error = jest.fn();

describe('Database Configuration Tests', () => {
  let mockPool;
  let mockConnection;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockConnection = {
      release: jest.fn()
    };
    
    mockPool = {
      getConnection: jest.fn(),
      end: jest.fn()
    };
    
    mysql.createPool.mockReturnValue(mockPool);
  });

  describe('Pool Creation', () => {
    // Test: Pool is created with correct default configuration
    test('should create pool with default configuration when env vars are not set', () => {
      // Clear environment variables
      delete process.env.DB_HOST;
      delete process.env.DB_USER;
      delete process.env.DB_PASSWORD;
      delete process.env.DB_NAME;

      // Re-require the module to test with cleared env vars
      jest.resetModules();
      require('../config/database');

      expect(mysql.createPool).toHaveBeenCalledWith({
        host: 'localhost',
        user: 'root',
        password: '123456789',
        database: 'muhasebe',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });
    });

    // Test: Pool is created with environment variables
    test('should create pool with environment variables when provided', () => {
      process.env.DB_HOST = 'test-host';
      process.env.DB_USER = 'test-user';
      process.env.DB_PASSWORD = 'test-password';
      process.env.DB_NAME = 'test-database';

      jest.resetModules();
      require('../config/database');

      expect(mysql.createPool).toHaveBeenCalledWith({
        host: 'test-host',
        user: 'test-user',
        password: 'test-password',
        database: 'test-database',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });
    });
  });

  describe('testConnection Function', () => {
    // Test: Successful database connection
    test('should return true and log success message when connection is successful', async () => {
      mockPool.getConnection.mockResolvedValue(mockConnection);

      const result = await testConnection();

      expect(mockPool.getConnection).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith('MySQL veritabanına başarıyla bağlanıldı.');
      expect(result).toBe(true);
    });

    // Test: Database connection failure
    test('should return false and log error when connection fails', async () => {
      const mockError = new Error('Connection failed');
      mockPool.getConnection.mockRejectedValue(mockError);

      const result = await testConnection();

      expect(mockPool.getConnection).toHaveBeenCalled();
      expect(mockConnection.release).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith('Veritabanı bağlantı hatası:', mockError);
      expect(result).toBe(false);
    });

    // Test: Connection timeout scenario
    test('should handle connection timeout gracefully', async () => {
      const timeoutError = new Error('Connection timeout');
      timeoutError.code = 'ETIMEDOUT';
      mockPool.getConnection.mockRejectedValue(timeoutError);

      const result = await testConnection();

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Veritabanı bağlantı hatası:', timeoutError);
    });

    // Test: Authentication error scenario
    test('should handle authentication errors', async () => {
      const authError = new Error('Access denied');
      authError.code = 'ER_ACCESS_DENIED_ERROR';
      mockPool.getConnection.mockRejectedValue(authError);

      const result = await testConnection();

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Veritabanı bağlantı hatası:', authError);
    });

    // Test: Database not found error
    test('should handle database not found errors', async () => {
      const dbError = new Error('Unknown database');
      dbError.code = 'ER_BAD_DB_ERROR';
      mockPool.getConnection.mockRejectedValue(dbError);

      const result = await testConnection();

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Veritabanı bağlantı hatası:', dbError);
    });
  });

  describe('Module Exports', () => {
    // Test: Module exports pool and testConnection
    test('should export pool and testConnection', () => {
      expect(pool).toBeDefined();
      expect(testConnection).toBeDefined();
      expect(typeof testConnection).toBe('function');
    });
  });
});