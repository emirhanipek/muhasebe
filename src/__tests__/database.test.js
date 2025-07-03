const mysql = require('mysql2/promise');

// Mock mysql2/promise
jest.mock('mysql2/promise', () => ({
  createPool: jest.fn(() => ({
    getConnection: jest.fn(),
    query: jest.fn(),
    end: jest.fn()
  }))
}));

// Mock dotenv
jest.mock('dotenv', () => ({
  config: jest.fn()
}));

// Mock console methods
const consoleSpy = {
  log: jest.spyOn(console, 'log').mockImplementation(() => {}),
  error: jest.spyOn(console, 'error').mockImplementation(() => {})
};

describe('Database Configuration', () => {
  let mockPool;
  let mockConnection;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockConnection = {
      release: jest.fn()
    };
    
    mockPool = {
      getConnection: jest.fn(),
      query: jest.fn(),
      end: jest.fn()
    };
    
    mysql.createPool.mockReturnValue(mockPool);
    
    // Clear module cache to ensure fresh imports
    jest.resetModules();
  });

  afterEach(() => {
    consoleSpy.log.mockClear();
    consoleSpy.error.mockClear();
  });

  afterAll(() => {
    consoleSpy.log.mockRestore();
    consoleSpy.error.mockRestore();
  });

  describe('Pool Creation', () => {
    // Test: Pool is created with default configuration
    it('should create pool with default configuration when no env variables are set', () => {
      delete process.env.DB_HOST;
      delete process.env.DB_USER;
      delete process.env.DB_PASSWORD;
      delete process.env.DB_NAME;
      
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
    it('should create pool with environment variables when they are set', () => {
      process.env.DB_HOST = 'test-host';
      process.env.DB_USER = 'test-user';
      process.env.DB_PASSWORD = 'test-password';
      process.env.DB_NAME = 'test-database';
      
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
    let database;

    beforeEach(() => {
      database = require('../config/database');
    });

    // Test: Successful database connection
    it('should return true and log success message when connection is successful', async () => {
      mockPool.getConnection.mockResolvedValue(mockConnection);
      
      const result = await database.testConnection();
      
      expect(mockPool.getConnection).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
      expect(consoleSpy.log).toHaveBeenCalledWith('MySQL veritabanına başarıyla bağlanıldı.');
      expect(result).toBe(true);
    });

    // Test: Failed database connection
    it('should return false and log error when connection fails', async () => {
      const mockError = new Error('Connection failed');
      mockPool.getConnection.mockRejectedValue(mockError);
      
      const result = await database.testConnection();
      
      expect(mockPool.getConnection).toHaveBeenCalled();
      expect(mockConnection.release).not.toHaveBeenCalled();
      expect(consoleSpy.error).toHaveBeenCalledWith('Veritabanı bağlantı hatası:', mockError);
      expect(result).toBe(false);
    });

    // Test: Connection throws specific MySQL error
    it('should handle MySQL specific errors correctly', async () => {
      const mysqlError = new Error('ER_ACCESS_DENIED_ERROR');
      mysqlError.code = 'ER_ACCESS_DENIED_ERROR';
      mockPool.getConnection.mockRejectedValue(mysqlError);
      
      const result = await database.testConnection();
      
      expect(result).toBe(false);
      expect(consoleSpy.error).toHaveBeenCalledWith('Veritabanı bağlantı hatası:', mysqlError);
    });

    // Test: Connection timeout error
    it('should handle connection timeout errors', async () => {
      const timeoutError = new Error('Connection timeout');
      timeoutError.code = 'ETIMEDOUT';
      mockPool.getConnection.mockRejectedValue(timeoutError);
      
      const result = await database.testConnection();
      
      expect(result).toBe(false);
      expect(consoleSpy.error).toHaveBeenCalledWith('Veritabanı bağlantı hatası:', timeoutError);
    });
  });

  describe('Module Exports', () => {
    // Test: Module exports correct properties
    it('should export pool and testConnection', () => {
      const database = require('../config/database');
      
      expect(database).toHaveProperty('pool');
      expect(database).toHaveProperty('testConnection');
      expect(typeof database.testConnection).toBe('function');
    });

    // Test: Exported pool is the created pool instance
    it('should export the created pool instance', () => {
      const database = require('../config/database');
      
      expect(database.pool).toBe(mockPool);
    });
  });
});