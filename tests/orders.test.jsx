const { create, get, list, edit } = require('../orders');

const orderData = require('../data/order1.json');

const { create: createProduct } = require('../products');

const productData = require('../data/product1.json');
const { describe } = require('node:test');

describe('Orders Module', () => {
  let createdProduct;
  let createdOrder;

// Populate the database with dummy data

beforeAll(async () => {
  createdProduct = await createProduct(productData);
  orderData.products = [createdProduct._id];

});
describe('create', () => {
  it('should create an order', async () => {
    createdOrder = await create(orderData);
    expect(createdOrder).toBeDefined();
    expect(createdOrder.buyerEmail).toBe(orderData.buyerEmail);

  });

});

describe('list', () => {
  it('should list orders', async () => {
    const orders = await list();
    expect(orders.length).toBeGreaterThan(0);

    });

  });
describe('get' , () => {
  it('should get an order by id', async () => {
    const order = await get(createdOrder._id);
    expect(order).toBeDefined();
    expect(order._id).toBe(createdOrder._id);
    
  })
})
describe('edit', () => {
  it('should edit an order by id', async () => {
    const change = { buyerEmail: 'newemail@example.com' };

    const editedOrder = await edit(createdOrder._id, change); // Calling the edit method

    // Assertions
    expect(editedOrder).toBeDefined();
    expect(editedOrder.buyerEmail).toBe(change.buyerEmail);
    expect(editedOrder._id).toBe(createdOrder._id);
  });
});
});