# @kitdbase/mysql-orm

`@kitdbase/mysql-orm` is a Node.js library designed to simplify interactions with MySQL databases using an object-oriented approach. With this library, you can perform CRUD (Create, Read, Update, Delete) operations easily, as well as manage the structure of your tables.

## Features

- **MySQL Connection**: Database connection management using the Singleton pattern.
- **CRUD Operations**: Perform insert, select, update, and delete operations.
- **Advanced Queries**: Support for queries with `JOIN`, `WHERE`, `ORDER BY`, `GROUP BY`, `LIMIT`, `OFFSET`, etc.
- **Table Management**: Create, drop, and modify tables and columns.
- **Data Validation**: Automatic validation of data types and values before executing queries.
- **Error Handling**: Efficient error handling and reporting.

## Installation

To install the library, run the following command:

```bash
npm install @kitdbase/mysql-orm
```

## Configuration

Before using the library, make sure to configure the necessary environment variables in a .env file:

```sh
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=password
MYSQL_DATABASE=mydatabase
MYSQL_PORT=3306
```

## Basic Usage

### Connecting to the Database

The connection is automatically established when creating an instance of MySQL. You don't need to manually connect.

```javascript
import db from "@kitdbase/mysql-orm";
```

## Table Operations

### Creating a Table

You can create a table using the create method. Define the columns and their properties.

```javascript
const usersTable = db.table("users");

await usersTable.create([
  { name: "id", type: "INT", options: ["primary", "autoincrement"] },
  { name: "name", type: "VARCHAR", length: 255 },
  { name: "age", type: "INT", defaultValue: 18 },
]);
```

### Dropping a Table

You can drop a table using the drop method.

```javascript
await usersTable.drop();
```

## CRUD Operations

### Inserting Data

Use the insert method to add new records to a table.

```javascript
const newUsers = await usersTable.insert([
  { name: "Alice", email: "alice@example.com", age: 28 },
  { name: "Bob", email: "bob@example.com", age: 32 },
]);

console.log(newUsers); // [{ id: 1, name: 'Alice', ... }, { id: 2, name: 'Bob', ... }]
```

### Selecting Data

Use the select method to retrieve data from a table.

```javascript
const users = await usersTable.select(["id", "name", "email"]).get();
console.log(users); // [{ id: 1, name: 'Alice', email: 'alice@example.com' }, ...]
```

### Updating Data

Use the update method to modify existing records.

```javascript
await usersTable.where("id", "=", 1).update({ age: 29 });
```

### Deleting Data

Use the delete method to remove records from a table.

```javascript
await usersTable.where("id", "=", 2).delete();
```

## Advanced Queries

### Query with WHERE

Filter records using the where method.

```javascript
const adultUsers = await usersTable.where("age", ">", 18).get();

console.log(adultUsers); // [{ id: 1, name: 'Alice', age: 28 }, ...]
```

### Query with OR WHERE

Use orWhere to add OR conditions to your query.

```javascript
const users = await usersTable
  .where("age", ">", 25)
  .orWhere("name", "=", "Alice")
  .get();

console.log(users); // [{ id: 1, name: 'Alice', age: 28 }, ...]
```

### Query with JOIN

Join tables using the join method.

```javascript
const usersWithOrders = await usersTable
  .join("orders", "users.id", "=", "orders.user_id")
  .select(["users.name", "orders.order_id"])
  .get();

console.log(usersWithOrders); // [{ name: 'Alice', order_id: 101 }, ...]
```

### Query with LEFT JOIN

Perform a left join using the leftJoin method.

```javascript
const usersWithOrders = await usersTable
  .leftJoin("orders", "users.id", "=", "orders.user_id")
  .select(["users.name", "orders.order_id"])
  .get();

console.log(usersWithOrders); // [{ name: 'Alice', order_id: 101 }, ...]
```

### Query with ORDER BY

Sort results using the orderBy method.

```javascript
const sortedUsers = await usersTable.orderBy("name", "ASC").get();

console.log(sortedUsers); // [{ id: 2, name: 'Bob', ... }, { id: 1, name: 'Alice', ... }]
```

### Query with LIMIT and OFFSET

Limit the number of results and paginate using limit and page.

```javascript
const firstTwoUsers = await usersTable.limit(2).page(1).get();

console.log(firstTwoUsers); // [{ id: 1, name: 'Alice', ... }, { id: 2, name: 'Bob', ... }]
```

### Query with GROUP BY

Group results using the groupBy method.

```javascript
const usersByAge = await usersTable.groupBy("age").get();

console.log(usersByAge); // [{ age: 28, count: 1 }, { age: 32, count: 1 }]
```

### Query with DISTINCT

Retrieve unique records using the distinct method.

```javascript
const uniqueNames = await usersTable.distinct().select(["name"]).get();

console.log(uniqueNames); // [{ name: 'Alice' }, { name: 'Bob' }]
```

## Aggregation Functions

### count

Count the number of records.

```javascript
const userCount = await usersTable.count().first();
console.log(userCount); // { count: 2 }
```

### sum

Calculate the sum of a column.

```javascript
const totalAge = await usersTable.sum("age").first();
console.log(totalAge); // { sum: 60 }
```

### avg

Calculate the average of a column.

```javascript
const averageAge = await usersTable.avg("age").first();
console.log(averageAge); // { avg: 30 }
```

### max

Find the maximum value in a column.

```javascript
const maxAge = await usersTable.max("age").first();
console.log(maxAge); // { max: 32 }
```

### min

Find the minimum value in a column.

```javascript
const minAge = await usersTable.min("age").first();
console.log(minAge); // { min: 28 }
```

## Finding Records

### find

Find a record by a specific column value.

```javascript
const user = await usersTable.find(1, "id");
console.log(user); // { id: 1, name: 'Alice', email: 'alice@example.com', age: 28 }
```

## Column Management

### Adding Columns

Add new columns to a table using the add method.

```javascript
await usersTable
  .columns()
  .add([{ name: "phone", type: "VARCHAR", length: 15 }]);
```

### Editing Columns

Modify existing columns using the edit method.

```javascript
await usersTable.columns().edit([
  {
    name: "email",
    type: "VARCHAR",
    length: 255,
    defaultValue: "new@example.com",
  },
]);
```

### Deleting Columns

Remove columns from a table using the delete method.

```javascript
await usersTable.columns().delete(["phone"]);
```

## Executing Raw SQL Queries

If you need to execute a raw SQL query, you can use the query method.

```javascript
const result = await db.query("SELECT * FROM users WHERE age > 25;");
console.log(result); // { status: 'success', message: 'Query executed successfully', data: [...] }
```

### Error Handling

The library captures common errors, such as SQL syntax errors or connection issues, and returns them in a JSON format.

```javascript
try {
  const result = await db.query("INVALID SQL QUERY;");
} catch (error) {
  console.error(error); // { status: 'error', message: 'SQL syntax error', data: null }
}
```

## Contributing

If you'd like to contribute to this project, please follow these steps:

1.- Fork the repository.

2.- Create a new branch (git checkout -b feature/new-feature).

3.- Make your changes and commit them (git commit -am 'Add new feature').

4.- Push to the branch (git push origin feature/new-feature).

5.- Open a Pull Request.
