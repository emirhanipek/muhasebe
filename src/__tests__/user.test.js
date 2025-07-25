
it('should create user successfully with valid request body', async () => {
  const mockUser = { name: 'John Doe', email: 'john@example.com' };
  const mockSavedUser = { _id: '123', ...mockUser };
  
  const mockSave = jest.fn().mockResolvedValue(mockSavedUser);
  User.mockImplementation(() => ({ save: mockSave }));
  
  const req = { body: mockUser };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  };
  
  await createUser(req, res);
  
  expect(User).toHaveBeenCalledWith(mockUser);
  expect(mockSave).toHaveBeenCalled();
  expect(res.status).toHaveBeenCalledWith(201);
  expect(res.json).toHaveBeenCalledWith(expect.objectContaining(mockUser));
});
it('should return 201 status and user data when user is created', async () => {
  const userData = { name: 'Test User', email: 'test@example.com' };
  const savedUser = { _id: '507f1f77bcf86cd799439011', ...userData };
  
  User.prototype.save = jest.fn().mockResolvedValue(savedUser);
  
  const req = { body: userData };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  };
  
  await createUser(req, res);
  
  expect(res.status).toHaveBeenCalledWith(201);
  expect(res.json).toHaveBeenCalledWith(savedUser);
});
it('should return 400 error when user creation fails', async () => {
  const userData = { name: 'Test User', email: 'test@example.com' };
  const mockError = new Error('Validation failed');
  
  User.prototype.save = jest.fn().mockRejectedValue(mockError);
  
  const req = { body: userData };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  };
  
  await createUser(req, res);
  
  expect(res.status).toHaveBeenCalledWith(400);
  expect(res.json).toHaveBeenCalledWith({
    message: "Kullanıcı oluşturulamadı",
    error: mockError
  });
});
it('should delete user successfully when valid ID is provided', async () => {
  const mockUser = { _id: '507f1f77bcf86cd799439011', name: 'Test User' };
  User.findByIdAndDelete = jest.fn().mockResolvedValue(mockUser);
  
  const req = { params: { id: '507f1f77bcf86cd799439011' } };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  };
  
  await deleteUser(req, res);
  
  expect(User.findByIdAndDelete).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
  expect(res.status).toHaveBeenCalledWith(200);
  expect(res.json).toHaveBeenCalledWith({ message: "Kullanıcı silindi" });
});
it('should return 404 error when user to delete is not found', async () => {
  User.findByIdAndDelete.mockResolvedValue(null);
  
  const req = { params: { id: 'nonexistent-id' } };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  };
  
  await deleteUser(req, res);
  
  expect(res.status).toHaveBeenCalledWith(404);
  expect(res.json).toHaveBeenCalledWith({ message: "Kullanıcı bulunamadı" });
});
it('should return 500 error when deletion process fails', async () => {
  const mockReq = {
    params: { id: 'valid-id' }
  };
  const mockRes = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  };

  User.findByIdAndDelete = jest.fn().mockRejectedValue(new Error('Database error'));

  await deleteUser(mockReq, mockRes);

  expect(mockRes.status).toHaveBeenCalledWith(500);
  expect(mockRes.json).toHaveBeenCalledWith({
    message: "Silme sırasında hata oluştu",
    error: expect.any(Error)
  });
});