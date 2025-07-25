
it('should create connection pool with default configuration when environment variables are not set', async () => {
  // Clear environment variables
  delete process.env.DB_HOST;
  delete process.env.DB_USER;
  delete process.env.DB_PASSWORD;
  delete process.env.DB_NAME;
  
  // Mock mysql2/promise
  const mockCreatePool = jest.fn();
  jest.doMock('mysql2/promise', () => ({
    createPool: mockCreatePool
  }));
  
  // Re-require the module to get fresh instance
  delete require.cache[require.resolve('../database')];
  require('../database');
  
  // Verify pool was created with default values
  expect(mockCreatePool).toHaveBeenCalledWith({
    host: 'localhost',
    user: 'root',
    password: '123456789',
    database: 'muhasebe',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
});
it('should create connection pool with environment variables when they are provided', async () => {
  // Mock environment variables
  const originalEnv = process.env;
  process.env = {
    ...originalEnv,
    DB_HOST: 'test-host',
    DB_USER: 'test-user', 
    DB_PASSWORD: 'test-password',
    DB_NAME: 'test-database'
  };

  // Mock mysql2/promise
  const mockCreatePool = jest.fn();
  jest.doMock('mysql2/promise', () => ({
    createPool: mockCreatePool
  }));

  // Re-require the module to get fresh instance
  delete require.cache[require.resolve('./db')];
  require('./db');

  // Verify pool was created with environment variables
  expect(mockCreatePool).toHaveBeenCalledWith({
    host: 'test-host',
    user: 'test-user',
    password: 'test-password',
    database: 'test-database',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  // Restore environment
  process.env = originalEnv;
});
it('should successfully test database connection and return true', async () => {
  // Mock the pool.getConnection method to simulate successful connection
  const mockConnection = {
    release: jest.fn()
  };
  
  const { pool, testConnection } = require('./database'); // Adjust path as needed
  
  jest.spyOn(pool, 'getConnection').mockResolvedValue(mockConnection);
  jest.spyOn(console, 'log').mockImplementation(() => {});
  
  const result = await testConnection();
  
  expect(result).toBe(true);
  expect(pool.getConnection).toHaveBeenCalled();
  expect(mockConnection.release).toHaveBeenCalled();
  expect(console.log).toHaveBeenCalledWith('MySQL veritabanına başarıyla bağlanıldı.');
});
it('should handle connection failure and return false', async () => {
  // Mock pool.getConnection to throw an error
  const mockGetConnection = jest.fn().mockRejectedValue(new Error('Connection failed'));
  pool.getConnection = mockGetConnection;
  
  // Mock console.error to avoid error output during test
  const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
  
  const result = await testConnection();
  
  expect(result).toBe(false);
  expect(mockGetConnection).toHaveBeenCalled();
  expect(consoleSpy).toHaveBeenCalledWith('Veritabanı bağlantı hatası:', expect.any(Error));
  
  consoleSpy.mockRestore();
});
it('should release connection after successful test', async () => {
  const mockConnection = {
    release: jest.fn()
  };
  
  pool.getConnection = jest.fn().mockResolvedValue(mockConnection);
  console.log = jest.fn();
  
  const result = await testConnection();
  
  expect(result).toBe(true);
  expect(pool.getConnection).toHaveBeenCalledTimes(1);
  expect(mockConnection.release).toHaveBeenCalledTimes(1);
  expect(console.log).toHaveBeenCalledWith('MySQL veritabanına başarıyla bağlanıldı.');
});
it('should log success message when connection is established', async () => {
  const mockConnection = { release: jest.fn() };
  const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  pool.getConnection = jest.fn().mockResolvedValue(mockConnection);
  
  const result = await testConnection();
  
  expect(consoleSpy).toHaveBeenCalledWith('MySQL veritabanına başarıyla bağlanıldı.');
  expect(mockConnection.release).toHaveBeenCalled();
  expect(result).toBe(true);
  
  consoleSpy.mockRestore();
});
it('should log error message when connection fails', async () => {
  const mockError = new Error('Connection failed');
  const mockGetConnection = jest.fn().mockRejectedValue(mockError);
  const mockPool = { getConnection: mockGetConnection };
  
  const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
  
  // Mock the pool temporarily
  const originalPool = require('../db').pool;
  require('../db').pool = mockPool;
  
  const result = await require('../db').testConnection();
  
  expect(consoleSpy).toHaveBeenCalledWith('Veritabanı bağlantı hatası:', mockError);
  expect(result).toBe(false);
  
  // Restore
  require('../db').pool = originalPool;
  consoleSpy.mockRestore();
});