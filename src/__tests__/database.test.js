const mysql = require('mysql2/promise');
const { pool, testConnection } = require('../config/database');

// Mock mysql2/promise
jest.mock('mysql2/promise');

// Mock dotenv
jest.mock('dotenv', () => ({
    config: jest.fn()
}));

// Mock console methods
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();

describe('Database Configuration Tests', () => {
    let mockPool;
    let mockConnection;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Setup mock connection
        mockConnection = {
            release: jest.fn()
        };
        
        // Setup mock pool
        mockPool = {
            getConnection: jest.fn(),
            createPool: jest.fn()
        };
        
        mysql.createPool.mockReturnValue(mockPool);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    afterAll(() => {
        mockConsoleLog.mockRestore();
        mockConsoleError.mockRestore();
    });

    describe('Pool Configuration', () => {
        // Test: Pool is created with correct default configuration
        test('should create pool with default configuration when no environment variables are set', () => {
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
            const originalEnv = process.env;
            process.env = {
                ...originalEnv,
                DB_HOST: 'test-host',
                DB_USER: 'test-user',
                DB_PASSWORD: 'test-password',
                DB_NAME: 'test-database'
            };

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

            process.env = originalEnv;
        });
    });

    describe('testConnection Function', () => {
        // Test: Successful connection test
        test('should return true and log success message when connection is successful', async () => {
            mockPool.getConnection.mockResolvedValue(mockConnection);

            const result = await testConnection();

            expect(mockPool.getConnection).toHaveBeenCalledTimes(1);
            expect(mockConnection.release).toHaveBeenCalledTimes(1);
            expect(mockConsoleLog).toHaveBeenCalledWith('MySQL veritabanına başarıyla bağlanıldı.');
            expect(result).toBe(true);
        });

        // Test: Failed connection test
        test('should return false and log error when connection fails', async () => {
            const mockError = new Error('Connection failed');
            mockPool.getConnection.mockRejectedValue(mockError);

            const result = await testConnection();

            expect(mockPool.getConnection).toHaveBeenCalledTimes(1);
            expect(mockConnection.release).not.toHaveBeenCalled();
            expect(mockConsoleError).toHaveBeenCalledWith('Veritabanı bağlantı hatası:', mockError);
            expect(result).toBe(false);
        });

        // Test: Connection throws specific database error
        test('should handle specific database errors correctly', async () => {
            const dbError = new Error('ER_ACCESS_DENIED_ERROR');
            dbError.code = 'ER_ACCESS_DENIED_ERROR';
            mockPool.getConnection.mockRejectedValue(dbError);

            const result = await testConnection();

            expect(result).toBe(false);
            expect(mockConsoleError).toHaveBeenCalledWith('Veritabanı bağlantı hatası:', dbError);
        });

        // Test: Connection succeeds but release throws error
        test('should handle release errors gracefully', async () => {
            const releaseError = new Error('Release failed');
            mockConnection.release.mockImplementation(() => {
                throw releaseError;
            });
            mockPool.getConnection.mockResolvedValue(mockConnection);

            const result = await testConnection();

            expect(result).toBe(true);
            expect(mockConsoleLog).toHaveBeenCalledWith('MySQL veritabanına başarıyla bağlanıldı.');
        });
    });

    describe('Module Exports', () => {
        // Test: Module exports correct objects
        test('should export pool and testConnection', () => {
            const database = require('../config/database');
            
            expect(database).toHaveProperty('pool');
            expect(database).toHaveProperty('testConnection');
            expect(typeof database.testConnection).toBe('function');
        });
    });

    describe('Edge Cases', () => {
        // Test: Multiple concurrent connection attempts
        test('should handle multiple concurrent connection attempts', async () => {
            mockPool.getConnection.mockResolvedValue(mockConnection);

            const promises = Array(5).fill().map(() => testConnection());
            const results = await Promise.all(promises);

            expect(results).toEqual([true, true, true, true, true]);
            expect(mockPool.getConnection).toHaveBeenCalledTimes(5);
            expect(mockConnection.release).toHaveBeenCalledTimes(5);
        });

        // Test: Connection timeout
        test('should handle connection timeout', async () => {
            const timeoutError = new Error('Connection timeout');
            timeoutError.code = 'PROTOCOL_CONNECTION_LOST';
            mockPool.getConnection.mockRejectedValue(timeoutError);

            const result = await testConnection();

            expect(result).toBe(false);
            expect(mockConsoleError).toHaveBeenCalledWith('Veritabanı bağlantı hatası:', timeoutError);
        });

        // Test: Null/undefined connection
        test('should handle null connection gracefully', async () => {
            mockPool.getConnection.mockResolvedValue(null);

            const result = await testConnection();

            expect(result).toBe(true);
            expect(mockConsoleLog).toHaveBeenCalledWith('MySQL veritabanına başarıyla bağlanıldı.');
        });
    });
});