// This object represents a mock of a Mongoose Query.
// Each method (sort, skip, limit, and exec) is mocked to return a predictable value,
// enabling the testing of method chaining and query execution.
const mockQuery = {
  sort: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  exec: jest.fn().mockResolvedValue([{ description: 'Product 1' }, { description: 'Product 2' }]),
};


// This object represents a mock of a Mongoose Model.
// The find and findById methods are mocked to return the mockQuery object,
// while save and deleteOne are simply mocked as empty functions.
// This setup allows testing the behavior of model methods and query execution.
const mockModel = {
  find: jest.fn().mockReturnValue(mockQuery),
  findById: jest.fn(),
  save: jest.fn(),
  deleteOne: jest.fn(),
};

module.exports = {
  mockModel,
  mockQuery,
};
