const { mockModel } = require('./db.mock');
const { create, get, list, edit, destroy } = require('../products');

jest.mock('../db', () => ({
  model: jest.fn().mockReturnValue(mockModel),
}));

describe('Product Module', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // other tests here ... 
  describe('list', () => {
    it('should list products', async () => {
      const products = await list();
      expect(products.length).toBe(2);
      expect(products[0].description).toBe('Product 1');
      expect(products[1].description).toBe('Product 2');
    });
  });

  describe('get', () => {
    it('should get a product by id', async () => {
      mockModel.findById = jest.fn().mockResolvedValue({
        description: 'Product 1'
      });

      const product = await get('product-id');
      expect(product.description).toBe('Product 1');
      expect(mockModel.findById).toHaveBeenCalledWith('product-id');
    })
  })
  describe('destroy', () => {
    it('should delete a product by id', async () => {
      const productId = 'product123';

      mockModel.deleteOne = jest.fn().mockResolvedValue({ deletedCount: 1 }); // Mocking the delete

      const result = await destroy(productId); // Calling the destroy method

      // Assertions
      expect(result.deletedCount).toBe(1);
    });
  });

describe('edit', () => {
  it('should edit a product by id', async () => {
    const productId = 'product123';
    const change = { description: 'Updated Description' };

    // Mock the get method to return a product object with a save method
    mockModel.findById = jest.fn().mockResolvedValue({
      _id: productId,
      description: 'Old Description',
      save: jest.fn().mockResolvedValue({
        _id: productId,
        description: 'Updated Description',
      }),
    });

    const editedProduct = await edit(productId, change); // Calling the edit method

    // Assertions
    expect(editedProduct).toBeDefined();
    expect(editedProduct.description).toBe('Updated Description');
    expect(mockModel.findById).toHaveBeenCalledWith(productId);
    expect(editedProduct.save).toHaveBeenCalled();
  });
});





});