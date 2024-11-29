# Lab 08 | Fullstack Prints Part - Integration Testing

## Overview

For this lab, we will be adding unit tests to our Fullstack Prints application using Jest. We will be using NPM to install Jest and write tests for our models, routes, and other application logic. This will be based on our work from the previous Fullstack Prints labs, specifically Week 5. 


## Instructions

1. For this lab, we will return to our NodeJS codebase. Take a moment to quickly review the code from the previous labs. In this codebase, you'll see the following key files:

- `app.js` - Main application entry point. It is responsible for setting up the express application and starting the server.
- `api.js` - Contains route definitions for our API endpoints.
- `products.js` - Contains the Products model and business logic for CRUD operations on products.
- `orders.js` - Contains the Orders model and business logic for CRUD operations on orders.

2. Let's begin the lab by installing Jest. In previous labs we have had all of the dependencies available to you at the start of the lab. But for this excercise, we want to install Jest ourselves. Open a Shell tab in your Repl, and type the following:

```
$ npm install --save-dev jest supertest
```

Here, the `--save-dev` flag indicates that this is dependency that should only be available during the development build of the application. We are telling NPM that this is not a dependency that will be required by the production or final build of the application. 

You'll also note that we are installing a second dependency, `supertest`. This package is often used for making HTTP test assertions. 

To learn more about NPM, see our course videos, or review the [NPM documentation](https://docs.npmjs.com/).

3. Next, we need to create our first test. Our first test will be simply to establish that the server has booted up successfully. We'll add tests to verify our Orders and Products modules later. Begin by creating a file called `app.test.js`. This file will reside in the `tests` directory. Where to place test files is often up to the project maintainer. Some developers choose to place their tests alongside the domain code, others choose to place them in a separate directory. For the simplicity of this lab, we will place them in a separate directory.

Place the following code in your `app.test.js` file:

```js
// tests/app.test.js
const request = require('supertest');
const app = require('../app.js');

describe('The Express Server', () => {
  beforeAll(done => {
    done()
  })

  test('should return response', async () => {
    const res = await request(app)
      .get('/');
    expect(res.statusCode).toEqual(200);
  });
});
```

This performs a very simple test, it will simply check that the server has booted up, and ensure that the HTTP status returned by the server is `200`. If an error is encountered, that error will be notified to the console.

The `beforeAll` callback is ran before each test in the test suite is run, this ensures that the previous job is done, and any dangling services have been shut down.

4. Great! We have our first test, but now we need to run it. We will continue to use the Shell tab to test our app. Open a new Shell window in Replit, and type the following:

```
$ npm run test
```
This will run your Jest tests in the shell window. If everything is configured correctly, you should see a successful status!

5. Now, we'll want to verify that all of the required routes are registered. This is what is called "smoke testing". Let's write our first smoke test:

```js
// tests/app.test.js
describe('The Express Server', () => {
  beforeAll(done => {
    done()
  })

  test('should return response', async () => {
    const res = await request(app)
      .get('/');
    expect(res.statusCode).toEqual(200);

  });

  test('should respond at /products', async () => {
    const res = await request(app)
      .get('/products')
    expect(res.statusCode).toEqual(200);
  });
});
```

Now, on your own, add a test for the `/orders` route. It should look very similar to the `/products` route test we just wrote. We want to check that the route exists,
and that it returns a 200 response. 

Excellent, now we could continue to write smoke tests for the API, and there is value in that, but if we were to disconnect the `Products` or `Orders` modules from the API
controller, our tests would fail. We'd have no way to verify that our `Products` or `Orders` modules worked correctly. So instead, let's begin to write some tests for the `Products` module.

6. Begin by creating a new test file to contain our test suite: `tests/products.test.js`. This file will be used to house our Products tests. In the file, we'll need to establish our test suite and setup some config:

```js
// tests/product.test.js
const { create, get, list, edit, destroy } = require('../products');
const db = require('../db'); 

describe('Product Module', () => {
  // your tests go here
})
```

Next, we'll add our first test. This test will verify that we can retireve a list of products from the database:

```js
// tests/product.test.js

// This test goes in the greater `describe('Product Module')` function
describe('list', () => {
  it('should list all products', async () => {
    const products = await list();
    expect(products.length).toBeGreaterThan(0);
  });
});
```

Now open your Shell tab and run `npm run test` again to verify that your test suite works. You should see an output simialr to this:

```
Test Suites: 2 passed, 2 total
Tests:       3 passed, 3 total
Snapshots:   0 total
Time:        5.341 s
```

Now this is fine, but things will get tricky if we start to test getting, creating or deleting individual products. This is because our test are actually integrationt tests, using the actual MongoDB database to run requests against. If we were to do something like this below: 

```js
describe('get', () => {
  it('should retrieve a product by id', async () => {
    // Assume there is a product with id 'abc123'
    const product = await get('abc123');
    expect(product).not.toBeNull();
  });
});
```

We'd run into an issue because we'd need to know what the product ID was before running the test. This gets further complicated when we start testing the delete method, because
the product would be deleted after the test. That would mean we would never be able to run the test again, it would not be sustainable or deterministic.

```js
// This would delete the product after the first test, and fail every other test afterwards.
 describe('destroy', () => {
  it('should delete a product', async () => {
    // Assume there is a product with id 'abc123'
    await destroy('abc123');
    const product = await get('abc123');
    expect(product).toBeNull();
  });
});
```

So in our next step, let's setup some mocking. Using mocks we can isolate the unit of work we are testing, ensuring that tests run quickly and are not affected by external dependencies (such as deletes on our database).

7. To configure our test to use mocks, we'll need to begin by defining the mock callback. At a high level, a mock is a simulated object or function that mimics the behavior of real objects in controlled ways. It's a kind of test double, which is a generic term for any case where you replace a production object for testing purposes.

So let's configure our mocks. First we'll need to create a new file to hold the mocks: `tests/db.mock.js`. Next add the following to the file:

```js
// tests/db.mock.js

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
```

Next, let's update our `product.test.js` file so that it uses our mocks instead of the actual database module.

```js
// tests/product.test.js
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
});
```

Lastly, we'll need to modify our test that checks for the list of products to be returned:

```js
// tests/products.test.js


// replace your current list test with this below:
  describe('list', () => {
    it('should list products', async () => {
      const products = await list();
      expect(products.length).toBe(2);
      expect(products[0].description).toBe('Product 1');
      expect(products[1].description).toBe('Product 2');
    });
  });
```

Alright - open your Shell and run `npm run test`. You should see all tests passing! What is happening here is instead of using the `mongoose` database module that we normally use, we are replacing it with our jest mock objects that exist in the `tests/db.mock.js` file. So when we call `.sort()` or `.find()` on the `db` module, instead of the "real" mongoose methods being called, we are using the ones we configured in `db.mock.js`. This allows us to produce stateless deterministic test results, and not worry about our delete or create tests modifying the database.

8. Mocking our tests is a great solution, but can lead down a rabbit hole, where our tests are more complicated than our actual application code. For instance, if we were to mock out the create and delete methods for our tests, we'd almost have to rebuild our entire application code. Luckily, Mongodb has a Jest package that we can use which actually creates an in memory lite weight version of the database. This is similar to how Java test suites use H2 or SQL Lite. We will use this to build out our test suite for the `orders`. 

Let's begin by installing the package, open your shell and run `npm install @shelf/jest-mongodb --save-dev`. This will install the Jest MongoDB package. 

Now we need to edit a config file, to enable the in-memory databse. Open the `jest.config.js` file and uncomment or add the following:

```js
module.exports = {
  preset: '@shelf/jest-mongodb', // uncomment this line!
  testEnvironment: 'node',
};
```

Next, let's create a new test suite file for our orders: `tests/orders.test.js`. Because orders require products, we'll need to do a bit of setup first.  

```js
// tests/orders.test.js
const { create, get, list, edit } = require('../orders');
const orderData = require('../data/order1.json');
const { create: createProduct } = require('../products');
const productData = require('../data/product1.json');

describe('Orders Module', () => {
  let createdProduct;
  let createdOrder;

  // Populate the database with dummy data
  beforeAll(async () => {
    // Create a product and capture it
    createdProduct = await createProduct(productData);
    // Use the product id and pass it to the order data product id array;
    orderData.products = [createdProduct._id];
  });

  describe('list', () => {
    it('should list orders', async () => {
      const orders = await list();
      expect(orders.length).toBeGreaterThan(0);
    });
  });
});
```

*Note there is some configuration that is occuring behind the scenes for this to work. You can watch the course video for some explanation*

Now, if you run this test using `npm run test` you'll see it fail. That is expected! We've not created any orders in the databse, we're requesting orders,
but nothing has been created. Let's remedy this with a quick tests to create an order:

```js
// tests/orders.test.js

// insert this before our "list" test

describe('create', () => {
    it('should create an order', async () => {
      createdOrder = await create(orderData);
      expect(createdOrder).toBeDefined();
      expect(createdOrder.buyerEmail).toBe(orderData.buyerEmail);
    });
  });
```

Run our `npm run test` again and we should see a successful pass of all our tests!


## Your Task

Now we have a fully functioning test suite for orders, products and our core app. Let's improve it a bit by adding a few more tests. This will be your responsiblity.

1.  ### Add "get" test to orders

  For this task you'll need to create a new test on the `orders.test.js` suite. This task will require you calling the get method, using the `createdOrder._id`
  
  ```js
  const order = await get(createdOrder._id);
  ```

  You'll then want to assert that the returned order id matches, and that the returned order is defined:
  
  ```js
  expect(order).toBeDefined();
  ```

2. ### Add "edit" test to orders

  For this task you'll need to create a new test for the `orders.test.js` suite. You'll want to create a change on the order, and call that change:

  ```js
    const change = {} // implement your change here
    const editedOrder = await edit(createdOrder._id, change)
  ```
  
  You'll then want to assert that the `editedOrder` exists or is defined, and that the change which was made exists on the new `editedOrder` object.

3. ### Add "get" test to products

  For this task you'll be creating a new test for the `products.test.js` suite. You'll want to create a mock response for the get method:

  ```js
  describe('get', () => {
    it('should get a product by id', async () => {
      // Mock the Product.findById method to return a specific product
      mockModel.findById = jest.fn().mockResolvedValue({ description: 'Product 1' });

      // call to get the product using the `get` method
      // your assertions
    });
  });
  ```

  You'll then make assertions to verify that the product description is correct.

4. ### Add "destroy" test to products

  For this task you'll be creating a new test for the `products.test.js` suite. You'll want to create a mock response for the delete method. Use the template provided above:

  ```js
  mockModel.deleteOne = jest.fn().mockResolvedValue({ deletedCount: 1 });
  ```

  Your assertion can then be to verify that the "deleteCount" is correct. 

While writing out the mocks, it should be apparent one of the downsides of mocking - our tests making lots of assumptions about our application code. If we were to change how the application code handled the delete method for instance, our tests would still pass until we updated the way we are mocking the test. Mocks are not _bad_ necessarily, it is just important to understand the trade offs.

## Guidance and Testing

1. This lab does not require that you have a connection to your MongoDB cluster from Week 5. We will be using an in memory database.
2. For this lab you will be using the Shell in Replit. This is not to be confused with the Console. Please make sure you are calling commands from the Shell

## Submission

Once you have completed the lab, please use the Invite button at the top right to collect a "Private Invite" link. Please copy that link into your Canvas submission and submit your assignment via Canvas for your instructor to grade.

