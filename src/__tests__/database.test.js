const mysql = require('mysql2/promise');
const { pool, testConnection } = require('../config/database');

// Mock mysql2/promise module
jest.mock('mysql2/promise', () => ({
    createPool: jest.fn()
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
            createPool: jest.fn()
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

    describe('Pool Creation', () => {
        // Test: Database pool is created with correct configuration
        it('should create database pool with default configuration', () => {
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

        // Test: Database pool uses environment variables when available
        it('should create database pool with environment variables', () => {
            process.env.DB_HOST = 'test-host';
            process.env.DB_USER = 'test-user';
            process.env.DB_PASSWORD = 'test-password';
            process.env.DB_NAME = 'test-database';

            // Re-require the module to pick up new env vars
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

            // Clean up
            delete process.env.DB_HOST;
            delete process.env.DB_USER;
            delete process.env.DB_PASSWORD;
            delete process.env.DB_NAME;
        });
    });

    describe('testConnection', () => {
        // Test: Successful database connection
        it('should return true and log success message when connection is successful', async () => {
            mockPool.getConnection.mockResolvedValue(mockConnection);

            const result = await testConnection();

            expect(mockPool.getConnection).toHaveBeenCalled();
            expect(mockConnection.release).toHaveBeenCalled();
            expect(consoleSpy.log).toHaveBeenCalledWith('MySQL veritabanına başarıyla bağlanıldı.');
            expect(result).toBe(true);
        });

        // Test: Failed database connection
        it('should return false and log error when connection fails', async () => {
            const mockError = new Error('Connection failed');
            mockPool.getConnection.mockRejectedValue(mockError);

            const result = await testConnection();

            expect(mockPool.getConnection).toHaveBeenCalled();
            expect(mockConnection.release).not.toHaveBeenCalled();
            expect(consoleSpy.error).toHaveBeenCalledWith('Veritabanı bağlantı hatası:', mockError);
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

        // Test: Connection pool exhausted scenario
        it('should handle pool exhaustion error', async () => {
            const poolError = new Error('Pool exhausted');
            poolError.code = 'POOL_EXHAUSTED';
            mockPool.getConnection.mockRejectedValue(poolError);

            const result = await testConnection();

            expect(result).toBe(false);
            expect(consoleSpy.error).toHaveBeenCalledWith('Veritabanı bağlantı hatası:', poolError);
        });

        // Test: Connection release throws error
        it('should still return true even if connection release fails', async () => {
            mockConnection.release.mockImplementation(() => {
                throw new Error('Release failed');
            });
            mockPool.getConnection.mockResolvedValue(mockConnection);

            const result = await testConnection();

            expect(result).toBe(true);
            expect(consoleSpy.log).toHaveBeenCalledWith('MySQL veritabanına başarıyla bağlanıldı.');
        });
    });

    describe('Module Exports', () => {
        // Test: Module exports correct objects
        it('should export pool and testConnection', () => {
            const databaseModule = require('../config/database');
            
            expect(databaseModule).toHaveProperty('pool');
            expect(databaseModule).toHaveProperty('testConnection');
            expect(typeof databaseModule.testConnection).toBe('function');
        });
    });
});