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
const consoleSpy = {
  log: jest.spyOn(console, 'log').mockImplementation(),
  error: jest.spyOn(console, 'error').mockImplementation()
};

describe('Database Module', () => {
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

  afterEach(() => {
    consoleSpy.log.mockClear();
    consoleSpy.error.mockClear();
  });

  afterAll(() => {
    consoleSpy.log.mockRestore();
    consoleSpy.error.mockRestore();
  });

  describe('Pool Configuration', () => {
    // Test: Pool is created with correct default configuration
    it('should create pool with default configuration when env vars are not set', () => {
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
    it('should create pool with environment variables when available', () => {
      const originalEnv = process.env;
      process.env = {
        ...originalEnv,
        DB_HOST: 'test-host',
        DB_USER: 'test-user',
        DB_PASSWORD: 'test-password',
        DB_NAME: 'test-database'
      };

      // Re-require the module to apply new env vars
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

      process.env = originalEnv;
    });
  });

  describe('testConnection Function', () => {
    // Test: Successful database connection
    it('should return true and log success message when connection is successful', async () => {
      mockPool.getConnection.mockResolvedValue(mockConnection);

      const result = await testConnection();

      expect(mockPool.getConnection).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
      expect(consoleSpy.log).toHaveBeenCalledWith('MySQL veritabanına başarıyla bağlanıldı.');
      expect(result).toBe(true);
    });

    // Test: Database connection failure
    it('should return false and log error when connection fails', async () => {
      const connectionError = new Error('Connection failed');
      mockPool.getConnection.mockRejectedValue(connectionError);

      const result = await testConnection();

      expect(mockPool.getConnection).toHaveBeenCalled();
      expect(mockConnection.release).not.toHaveBeenCalled();
      expect(consoleSpy.error).toHaveBeenCalledWith('Veritabanı bağlantı hatası:', connectionError);
      expect(result).toBe(false);
    });

    // Test: Connection timeout scenario
    it('should handle connection timeout gracefully', async () => {
      const timeoutError = new Error('Connection timeout');
      timeoutError.code = 'ETIMEDOUT';
      mockPool.getConnection.mockRejectedValue(timeoutError);

      const result = await testConnection();

      expect(result).toBe(false);
      expect(consoleSpy.error).toHaveBeenCalledWith('Veritabanı bağlantı hatası:', timeoutError);
    });

    // Test: Authentication failure
    it('should handle authentication errors', async () => {
      const authError = new Error('Access denied');
      authError.code = 'ER_ACCESS_DENIED_ERROR';
      mockPool.getConnection.mockRejectedValue(authError);

      const result = await testConnection();

      expect(result).toBe(false);
      expect(consoleSpy.error).toHaveBeenCalledWith('Veritabanı bağlantı hatası:', authError);
    });

    // Test: Database not found error
    it('should handle database not found errors', async () => {
      const dbError = new Error('Unknown database');
      dbError.code = 'ER_BAD_DB_ERROR';
      mockPool.getConnection.mockRejectedValue(dbError);

      const result = await testConnection();

      expect(result).toBe(false);
      expect(consoleSpy.error).toHaveBeenCalledWith('Veritabanı bağlantı hatası:', dbError);
    });
  });

  describe('Module Exports', () => {
    // Test: Pool is exported correctly
    it('should export pool object', () => {
      expect(pool).toBeDefined();
      expect(typeof pool).toBe('object');
    });

    // Test: testConnection function is exported correctly
    it('should export testConnection function', () => {
      expect(testConnection).toBeDefined();
      expect(typeof testConnection).toBe('function');
    });
  });
});