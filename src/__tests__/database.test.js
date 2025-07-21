const mysql = require('mysql2/promise');
const { pool, testConnection } = require('../config/database');

// Mock mysql2/promise
jest.mock('mysql2/promise', () => ({
  createPool: jest.fn()
}));

// Mock dotenv
jest.mock('dotenv', () => ({
  config: jest.fn()
}));

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

describe('database.js', () => {
  let mockPool;
  let mockConnection;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock connection object
    mockConnection = {
      release: jest.fn()
    };

    // Mock pool object
    mockPool = {
      getConnection: jest.fn()
    };

    // Setup mysql.createPool mock
    mysql.createPool.mockReturnValue(mockPool);

    // Mock console methods
    console.log = jest.fn();
    console.error = jest.fn();
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  describe('Pool Configuration', () => {
    // Test pool creation with default values
    it('should create pool with default configuration when env vars are not set', () => {
      // Clear environment variables
      delete process.env.DB_HOST;
      delete process.env.DB_USER;
      delete process.env.DB_PASSWORD;
      delete process.env.DB_NAME;

      // Re-require the module to trigger pool creation
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

    // Test pool creation with environment variables
    it('should create pool with environment variables when set', () => {
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

  describe('testConnection', () => {
    // Test successful database connection
    it('should return true and log success message when connection is successful', async () => {
      mockPool.getConnection.mockResolvedValue(mockConnection);

      const result = await testConnection();

      expect(mockPool.getConnection).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith('MySQL veritabanına başarıyla bağlanıldı.');
      expect(result).toBe(true);
    });

    // Test failed database connection
    it('should return false and log error when connection fails', async () => {
      const mockError = new Error('Connection failed');
      mockPool.getConnection.mockRejectedValue(mockError);

      const result = await testConnection();

      expect(mockPool.getConnection).toHaveBeenCalled();
      expect(mockConnection.release).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith('Veritabanı bağlantı hatası:', mockError);
      expect(result).toBe(false);
    });

    // Test connection timeout scenario
    it('should handle connection timeout gracefully', async () => {
      const timeoutError = new Error('Connection timeout');
      timeoutError.code = 'ETIMEDOUT';
      mockPool.getConnection.mockRejectedValue(timeoutError);

      const result = await testConnection();

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Veritabanı bağlantı hatası:', timeoutError);
    });

    // Test authentication failure
    it('should handle authentication errors', async () => {
      const authError = new Error('Access denied');
      authError.code = 'ER_ACCESS_DENIED_ERROR';
      mockPool.getConnection.mockRejectedValue(authError);

      const result = await testConnection();

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Veritabanı bağlantı hatası:', authError);
    });

    // Test network error
    it('should handle network errors', async () => {
      const networkError = new Error('Network unreachable');
      networkError.code = 'ENETUNREACH';
      mockPool.getConnection.mockRejectedValue(networkError);

      const result = await testConnection();

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Veritabanı bağlantı hatası:', networkError);
    });

    // Test connection release on successful connection
    it('should always release connection even if other operations fail after getting connection', async () => {
      mockPool.getConnection.mockResolvedValue(mockConnection);
      // Mock console.log to throw error to simulate failure after connection
      const originalLog = console.log;
      console.log = jest.fn().mockImplementation(() => {
        throw new Error('Log error');
      });

      try {
        await testConnection();
      } catch (error) {
        // Expected to throw
      }

      expect(mockConnection.release).toHaveBeenCalled();
      console.log = originalLog;
    });
  });

  describe('Module Exports', () => {
    // Test that pool is exported
    it('should export pool object', () => {
      expect(pool).toBeDefined();
      expect(pool).toBe(mockPool);
    });

    // Test that testConnection function is exported
    it('should export testConnection function', () => {
      expect(testConnection).toBeDefined();
      expect(typeof testConnection).toBe('function');
    });

    // Test module exports structure
    it('should export only pool and testConnection', () => {
      const moduleExports = require('../config/database');
      const exportKeys = Object.keys(moduleExports);
      
      expect(exportKeys).toHaveLength(2);
      expect(exportKeys).toContain('pool');
      expect(exportKeys).toContain('testConnection');
    });
  });
});