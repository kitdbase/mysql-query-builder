# @kitdbase/mysql-query-builder

## Language/Lenguaje

- [English](#english-documentation)
- [Español](#documentación-en-español)

## English documentation

## Table of contents 🚀

- [Introduction](#introduction)
- [Features](#features)
- [Installation](#installation)
- [Configuration](#configuration)
- [Basic Usage](#basic-usage)
  - [Database Connection](#database-connection)
- [Table Operations](#table-operations)
  - [Creating a Table](#creating-a-table)
  - [Dropping a Table](#dropping-a-table)
- [CRUD Operations](#crud-operations)
  - [Inserting Data](#inserting-data)
  - [Selecting Data](#selecting-data)
  - [Updating Data](#updating-data)
  - [Deleting Data](#deleting-data)
- [Advanced Queries](#advanced-queries)
  - [WHERE Query](#where-query)
  - [OR WHERE Query](#or-where-query)
  - [WHERE Condition Groups](#where-condition-groups)
  - [BETWEEN Query](#between-query)
  - [IN Query](#in-query)
  - [IS NULL / IS NOT NULL Query](#is-null--is-not-null-query)
  - [JOIN Query](#join-query)
  - [LEFT JOIN Query](#left-join-query)
  - [RIGHT JOIN Query](#right-join-query)
  - [ORDER BY Query](#order-by-query)
  - [LIMIT and OFFSET Query (Pagination)](#limit-and-offset-query-pagination)
  - [GROUP BY Query](#group-by-query)
  - [DISTINCT Query](#distinct-query)
- [Aggregate Functions](#aggregate-functions)
  - [count](#count)
  - [sum](#sum)
  - [avg](#avg)
  - [max](#max)
  - [min](#min)
- [Finding Records](#finding-records)
  - [find](#find)
  - [first](#first)
- [Column Management](#column-management)
  - [Adding Columns](#adding-columns)
  - [Editing Columns](#editing-columns)
  - [Deleting Columns](#deleting-columns)
- [Executing Raw SQL Queries](#executing-raw-sql-queries)
  - [Error Handling](#error-handling)
- [Complete API](#complete-api)
  - [MySQL Class](#mysql-class)
  - [TableQuery Class](#tablequery-class)
  - [Columns Class](#columns-class)
- [License](#license)

## Introduction

`@kitdbase/mysql-query-builder` is a Node.js library designed to simplify interactions with MySQL databases using an object-oriented approach. This library allows you to easily perform CRUD (Create, Read, Update, Delete) operations and manage your table structures.

## Features

- **MySQL Connection**: Database connection management using the Singleton pattern.
- **CRUD Operations**: Perform insertion, selection, update, and deletion operations.
- **Advanced Queries**: Support for queries with `JOIN`, `WHERE`, `ORDER BY`, `GROUP BY`, `LIMIT`, `OFFSET`, etc.
- **Table Management**: Create, drop, and modify tables and columns.
- **Data Validation**: Automatic validation of data types and values before executing queries.
- **Error Handling**: Efficient error management and reporting.

## Installation

To install the library, run the following command:

```bash
npm install @kitdbase/mysql-query-builder
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

### Database Connection

The connection is automatically established when creating a MySQL instance. You don't need to connect manually.

```typescript
import db from "@kitdbase/mysql-query-builder";
```

## Table Operations

### Creating a Table

You can create a table using the `create` method. Define the columns and their properties.

```typescript
const usersTable = db.table("users");
await usersTable.create([
  { name: "id", type: "INT", options: ["primary", "autoincrement"] },
  { name: "name", type: "VARCHAR", length: 255 },
  { name: "email", type: "VARCHAR", length: 255 },
  { name: "age", type: "INT", defaultValue: 18 },
]);
```

### Dropping a Table

You can drop a table using the `drop` method.

```typescript
await usersTable.drop();
```

## CRUD Operations

### Inserting Data

Use the `insert` method to add new records to a table.

```typescript
const newUsers = await usersTable.insert([
  { name: "Alice", email: "alice@example.com", age: 28 },
  { name: "Bob", email: "bob@example.com", age: 32 },
]);
console.log(newUsers); // [{ id: 1, name: 'Alice', ... }, { id: 2, name: 'Bob', ... }]
```

### Selecting Data

Use the `select` method to retrieve data from a table.

```typescript
const users = await usersTable.select(["id", "name", "email"]).get();
console.log(users); // [{ id: 1, name: 'Alice', email: 'alice@example.com' }, ...]
```

### Updating Data

Use the `update` method to modify existing records.

```typescript
await usersTable.where("id", "=", 1).update({ age: 29 });
```

### Deleting Data

Use the `delete` method to remove records from a table.

```typescript
await usersTable.where("id", "=", 2).delete();
```

## Advanced Queries

### WHERE Query

Filter records using the `where` method.

```typescript
const adultUsers = await usersTable.where("age", ">", 18).get();
console.log(adultUsers); // [{ id: 1, name: 'Alice', age: 28 }, ...]
```

### OR WHERE Query

Use `orWhere` to add OR conditions to your query.

```typescript
const users = await usersTable
  .where("age", ">", 25)
  .orWhere("name", "=", "Alice")
  .get();
console.log(users); // [{ id: 1, name: 'Alice', age: 28 }, ...]
```

### WHERE Condition Groups

Group conditions using `whereGroup`.

```typescript
const users = await usersTable
  .whereGroup((query) => {
    query.where("age", ">", 25).orWhere("name", "=", "Jane");
  })
  .get();
console.log(users); // [{ id: 1, name: 'Alice', age: 28 }, ...]
```

### BETWEEN Query

Search for values within a range using `whereBetween`.

```typescript
const users = await usersTable.whereBetween("age", [25, 35]).get();
console.log(users); // [{ id: 1, name: 'Alice', age: 28 }, { id: 2, name: 'Bob', age: 32 }]
```

### IN Query

Search for values that match a set of values using `whereIn`.

```typescript
const users = await usersTable.whereIn("id", [1, 3, 5]).get();
console.log(users); // [{ id: 1, name: 'Alice', age: 28 }, { id: 3, name: 'Charlie', age: 35 }]
```

### IS NULL / IS NOT NULL Query

Search for null or non-null values using `whereNull` and `whereNotNull`.

```typescript
const usersWithoutEmail = await usersTable.whereNull("email").get();
const usersWithEmail = await usersTable.whereNotNull("email").get();
```

### JOIN Query

Join tables using the `join` method.

```typescript
const usersWithOrders = await usersTable
  .join("orders", "users.id", "=", "orders.user_id")
  .select(["users.name", "orders.order_id"])
  .get();
console.log(usersWithOrders); // [{ name: 'Alice', order_id: 101 }, ...]
```

### LEFT JOIN Query

Perform a left join using the `leftJoin` method.

```typescript
const usersWithOrders = await usersTable
  .leftJoin("orders", "users.id", "=", "orders.user_id")
  .select(["users.name", "orders.order_id"])
  .get();
console.log(usersWithOrders); // [{ name: 'Alice', order_id: 101 }, { name: 'Bob', order_id: null }, ...]
```

### RIGHT JOIN Query

Perform a right join using the `rightJoin` method.

```typescript
const ordersWithUsers = await usersTable
  .rightJoin("orders", "users.id", "=", "orders.user_id")
  .select(["users.name", "orders.order_id"])
  .get();
console.log(ordersWithUsers); // [{ name: 'Alice', order_id: 101 }, { name: null, order_id: 102 }, ...]
```

### ORDER BY Query

Sort results using the `orderBy` method.

```typescript
const sortedUsers = await usersTable.orderBy("name", "ASC").get();
console.log(sortedUsers); // [{ id: 1, name: 'Alice', ... }, { id: 2, name: 'Bob', ... }]
```

### LIMIT and OFFSET Query (Pagination)

Limit the number of results and paginate using `limit` and `page`.

```typescript
const firstTwoUsers = await usersTable.limit(2).page(1).get();
const nextTwoUsers = await usersTable.limit(2).page(2).get();
console.log(firstTwoUsers); // [{ id: 1, name: 'Alice', ... }, { id: 2, name: 'Bob', ... }]
console.log(nextTwoUsers); // [{ id: 3, name: 'Charlie', ... }, { id: 4, name: 'Dave', ... }]
```

### GROUP BY Query

Group results using the `groupBy` method.

```typescript
const usersByAge = await usersTable.groupBy("age").get();
console.log(usersByAge); // [{ age: 28, count: 1 }, { age: 32, count: 1 }]
```

### DISTINCT Query

Retrieve unique records using the `distinct` method.

```typescript
const uniqueNames = await usersTable.distinct().select(["name"]).get();
console.log(uniqueNames); // [{ name: 'Alice' }, { name: 'Bob' }]
```

## Aggregate Functions

### count

Count the number of records.

```typescript
const userCount = await usersTable.count().first();
console.log(userCount); // { count: 2 }
```

### sum

Calculate the sum of a column.

```typescript
const totalAge = await usersTable.sum("age").first();
console.log(totalAge); // { sum: 60 }
```

### avg

Calculate the average of a column.

```typescript
const averageAge = await usersTable.avg("age").first();
console.log(averageAge); // { avg: 30 }
```

### max

Find the maximum value in a column.

```typescript
const maxAge = await usersTable.max("age").first();
console.log(maxAge); // { max: 32 }
```

### min

Find the minimum value in a column.

```typescript
const minAge = await usersTable.min("age").first();
console.log(minAge); // { min: 28 }
```

## Finding Records

### find

Find a record by a specific column value.

```typescript
const user = await usersTable.find(1, "id");
console.log(user); // { id: 1, name: 'Alice', email: 'alice@example.com', age: 28 }
```

### first

Get only the first record that meets the conditions.

```typescript
const firstUser = await usersTable.where("age", ">", 25).first();
console.log(firstUser); // { id: 1, name: 'Alice', age: 28, ... }
```

## Column Management

### Adding Columns

Add new columns to a table using the `add` method of `columns()`.

```typescript
await usersTable
  .columns()
  .add([{ name: "phone", type: "VARCHAR", length: 15 }]);
```

### Editing Columns

Modify existing columns using the `edit` method of `columns()`.

```typescript
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

Remove columns from a table using the `delete` method of `columns()`.

```typescript
await usersTable.columns().delete(["phone"]);
```

## Executing Raw SQL Queries

If you need to execute a raw SQL query, you can use the `query` method.

```typescript
const result = await db.query("SELECT * FROM users WHERE age > 25;");
console.log(result); // { status: 'success', message: 'Query executed successfully', data: [...] }
```

### Error Handling

The library captures common errors, such as SQL syntax errors or connection issues, and returns them in JSON format.

```typescript
try {
  const result = await db.query("INVALID SQL QUERY;");
} catch (error) {
  console.error(error); // { status: 'error', message: 'SQL syntax error', data: null }
}
```

## Complete API

### MySQL Class

#### `table(tableName: string): TableQuery`

Creates and returns a new `TableQuery` instance for the specified table.

```typescript
const usersTable = db.table("users");
```

#### `query(sqlQuery: string): Promise<{ status: string, message: string, data: any | null }>`

Executes a direct SQL query on the database.

```typescript
const result = await db.query("SELECT * FROM users;");
```

### TableQuery Class

#### `create(fields: Field[]): Promise<boolean>`

Creates a new table with the specified fields.

```typescript
await usersTable.create([
  { name: "id", type: "INT", options: ["primary", "autoincrement"] },
  { name: "name", type: "VARCHAR", length: 255 },
]);
```

#### `drop(): Promise<boolean>`

Drops the table.

```typescript
await usersTable.drop();
```

#### `select(fields: string[] = []): TableQuery`

Specifies the columns to select in a SELECT query.

```typescript
usersTable.select(["id", "name", "email"]);
```

#### `where(column: string, operator: string | undefined, value: any): TableQuery`

Adds a WHERE condition to the query.

```typescript
usersTable.where("age", ">", 25);
```

#### `orWhere(column: string, operator: string | undefined, value: any): TableQuery`

Adds an OR WHERE condition to the query.

```typescript
usersTable.orWhere("name", "=", "Jane");
```

#### `whereGroup(callback: any): TableQuery`

Adds a group of WHERE conditions to the query.

```typescript
usersTable.whereGroup((query) => {
  query.where("age", ">", 25).orWhere("name", "=", "Jane");
});
```

#### `whereBetween(column: string, [value1, value2]: any): TableQuery`

Adds a WHERE BETWEEN condition to the query.

```typescript
usersTable.whereBetween("age", [25, 35]);
```

#### `whereIn(column: string, values: any): TableQuery`

Adds a WHERE IN condition to the query.

```typescript
usersTable.whereIn("id", [1, 3, 5]);
```

#### `whereNull(column: string): TableQuery`

Adds a WHERE IS NULL condition to the query.

```typescript
usersTable.whereNull("email");
```

#### `whereNotNull(column: string): TableQuery`

Adds a WHERE IS NOT NULL condition to the query.

```typescript
usersTable.whereNotNull("email");
```

#### `join(table: string, column1: string, operator: string, column2: string): TableQuery`

Adds a JOIN clause to the query.

```typescript
usersTable.join("orders", "users.id", "=", "orders.user_id");
```

#### `leftJoin(table: string, column1: string, operator: string, column2: string): TableQuery`

Adds a LEFT JOIN clause to the query.

```typescript
usersTable.leftJoin("orders", "users.id", "=", "orders.user_id");
```

#### `rightJoin(table: string, column1: string, operator: string, column2: string): TableQuery`

Adds a RIGHT JOIN clause to the query.

```typescript
usersTable.rightJoin("orders", "users.id", "=", "orders.user_id");
```

#### `orderBy(column: string, direction: string = 'ASC'): TableQuery`

Adds an ORDER BY clause to the query.

```typescript
usersTable.orderBy("name", "ASC");
```

#### `groupBy(column: string): TableQuery`

Adds a GROUP BY clause to the query.

```typescript
usersTable.groupBy("age");
```

#### `distinct(): TableQuery`

Adds a DISTINCT clause to the query.

```typescript
usersTable.distinct();
```

#### `count(column = '*'): TableQuery`

Adds a COUNT clause to the query.

```typescript
usersTable.count();
```

#### `sum(column: string): TableQuery`

Adds a SUM clause to the query.

```typescript
usersTable.sum("age");
```

#### `avg(column: string): TableQuery`

Adds an AVG clause to the query.

```typescript
usersTable.avg("age");
```

#### `max(column: string): TableQuery`

Adds a MAX clause to the query.

```typescript
usersTable.max("age");
```

#### `min(column: string): TableQuery`

Adds a MIN clause to the query.

```typescript
usersTable.min("age");
```

#### `limit(number: number): TableQuery`

Adds a LIMIT clause to the query.

```typescript
usersTable.limit(10);
```

#### `page(number: number): TableQuery`

Adds pagination to the query using LIMIT and OFFSET.

```typescript
usersTable.limit(10).page(2);
```

#### `get(): Promise<any[]>`

Executes the query and returns all matching rows.

```typescript
const users = await usersTable.get();
```

#### `first(): Promise<any | null>`

Executes the query and returns the first matching row.

```typescript
const user = await usersTable.first();
```

#### `insert(data: Record<string, any>[]): Promise<Record<string, any>[]>`

Inserts new records into the table.

```typescript
const newUsers = await usersTable.insert([
  { name: "Alice", email: "alice@example.com" },
]);
```

#### `update(data: Record<string, any>): Promise<boolean>`

Updates records in the table based on WHERE conditions.

```typescript
await usersTable.where("id", "=", 1).update({ name: "Alice Smith" });
```

#### `delete(): Promise<boolean>`

Deletes records from the table based on WHERE conditions.

```typescript
await usersTable.where("id", "=", 1).delete();
```

#### `find(value: any, column: string = 'id'): Promise<any | null>`

Finds a record by its column value.

```typescript
const user = await usersTable.find(1);
```

#### `columns(): Columns`

Returns an instance of the Columns class to manage table columns.

```typescript
const columns = usersTable.columns();
```

### Columns Class

#### `add(columns: Field[]): Promise<boolean>`

Adds new columns to the table.

```typescript
await usersTable
  .columns()
  .add([{ name: "phone", type: "VARCHAR", length: 15 }]);
```

#### `edit(columns: Field[]): Promise<boolean>`

Modifies existing columns in the table.

```typescript
await usersTable.columns().edit([
  {
    name: "email",
    type: "VARCHAR",
    length: 255,
    defaultValue: "example@mail.com",
  },
]);
```

#### `delete(columns: string[]): Promise<boolean>`

Deletes columns from the table.

```typescript
await usersTable.columns().delete(["phone"]);
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Documentación en español

## Tabla de contenidos 🚀

- [Introducción](#introducción)
- [Características](#características)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Uso básico](#uso-básico)
  - [Conexión a la base de datos](#conexión-a-la-base-de-datos)
- [Operaciones de tabla](#operaciones-de-tabla)
  - [Crear una tabla](#crear-una-tabla)
  - [Eliminar una tabla](#eliminar-una-tabla)
- [Operaciones CRUD](#operaciones-crud)
  - [Insertar datos](#insertar-datos)
  - [Seleccionar datos](#seleccionar-datos)
  - [Actualizar datos](#actualizar-datos)
  - [Eliminar datos](#eliminar-datos)
- [Consultas avanzadas](#consultas-avanzadas)
  - [Consulta con WHERE](#consulta-con-where)
  - [Consulta con OR WHERE](#consulta-con-or-where)
  - [Consulta con grupos de condiciones WHERE](#consulta-con-grupos-de-condiciones-where)
  - [Consulta con BETWEEN](#consulta-con-between)
  - [Consulta con IN](#consulta-con-in)
  - [Consulta con IS NULL / IS NOT NULL](#consulta-con-is-null--is-not-null)
  - [Consulta con JOIN](#consulta-con-join)
  - [Consulta con LEFT JOIN](#consulta-con-left-join)
  - [Consulta con RIGHT JOIN](#consulta-con-right-join)
  - [Consulta con ORDER BY](#consulta-con-order-by)
  - [Consulta con LIMIT y OFFSET](#consulta-con-limit-y-offset-paginación)
  - [Consulta con GROUP BY](#consulta-con-group-by)
  - [Consulta con DISTINCT](#consulta-con-distinct)
- [Funciones de agregación](#funciones-de-agregación)
  - [count](#count)
  - [sum](#sum)
  - [avg](#avg)
  - [max](#max)
  - [min](#min)
- [Buscar registros](#buscar-registros)
  - [find](#find)
  - [first](#first)
- [Gestión de columnas](#gestión-de-columnas)
  - [Añadir columnas](#añadir-columnas)
  - [Editar columnas](#editar-columnas)
  - [Eliminar columnas](#eliminar-columnas)
- [Ejecutar consultas SQL crudas](#ejecutar-consultas-sql-crudas)
  - [Manejo de errores](#manejo-de-errores)
- [API completa](#api-completa)
  - [Clase MySQL](#clase-mysql)
  - [Clase TableQuery](#clase-tablequery)
  - [Clase Columns](#clase-columns)
- [Licencia](#licencia)

## Introducción

`@kitdbase/mysql-query-builder` es una biblioteca de Node.js diseñada para simplificar las interacciones con bases de datos MySQL utilizando un enfoque orientado a objetos. Esta biblioteca te permite realizar operaciones CRUD (Crear, Leer, Actualizar, Eliminar) fácilmente, así como gestionar la estructura de tus tablas.

## Características

- **Conexión a MySQL**: Gestión de conexiones a la base de datos utilizando el patrón Singleton.
- **Operaciones CRUD**: Realizar operaciones de inserción, selección, actualización y eliminación.
- **Consultas avanzadas**: Soporte para consultas con `JOIN`, `WHERE`, `ORDER BY`, `GROUP BY`, `LIMIT`, `OFFSET`, etc.
- **Gestión de tablas**: Crear, eliminar y modificar tablas y columnas.
- **Validación de datos**: Validación automática de tipos de datos y valores antes de ejecutar consultas.
- **Manejo de errores**: Gestión y reporte eficiente de errores.

## Instalación

Para instalar la biblioteca, ejecuta el siguiente comando:

```bash
npm install @kitdbase/mysql-query-builder
```

## Configuración

Antes de usar la biblioteca, asegúrate de configurar las variables de entorno necesarias en un archivo .env:

```sh
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=password
MYSQL_DATABASE=mydatabase
MYSQL_PORT=3306
```

## Uso básico

### Conexión a la base de datos

La conexión se establece automáticamente al crear una instancia de MySQL. No necesitas conectarte manualmente.

```typescript
import db from "@kitdbase/mysql-query-builder";
```

## Operaciones de tabla

### Crear una tabla

Puedes crear una tabla utilizando el método `create`. Define las columnas y sus propiedades.

```typescript
const usersTable = db.table("users");
await usersTable.create([
  { name: "id", type: "INT", options: ["primary", "autoincrement"] },
  { name: "name", type: "VARCHAR", length: 255 },
  { name: "email", type: "VARCHAR", length: 255 },
  { name: "age", type: "INT", defaultValue: 18 },
]);
```

### Eliminar una tabla

Puedes eliminar una tabla utilizando el método `drop`.

```typescript
await usersTable.drop();
```

## Operaciones CRUD

### Insertar datos

Utiliza el método `insert` para añadir nuevos registros a una tabla.

```typescript
const newUsers = await usersTable.insert([
  { name: "Alice", email: "alice@example.com", age: 28 },
  { name: "Bob", email: "bob@example.com", age: 32 },
]);
console.log(newUsers); // [{ id: 1, name: 'Alice', ... }, { id: 2, name: 'Bob', ... }]
```

### Seleccionar datos

Utiliza el método `select` para recuperar datos de una tabla.

```typescript
const users = await usersTable.select(["id", "name", "email"]).get();
console.log(users); // [{ id: 1, name: 'Alice', email: 'alice@example.com' }, ...]
```

### Actualizar datos

Utiliza el método `update` para modificar registros existentes.

```typescript
await usersTable.where("id", "=", 1).update({ age: 29 });
```

### Eliminar datos

Utiliza el método `delete` para eliminar registros de una tabla.

```typescript
await usersTable.where("id", "=", 2).delete();
```

## Consultas avanzadas

### Consulta con WHERE

Filtra registros utilizando el método `where`.

```typescript
const adultUsers = await usersTable.where("age", ">", 18).get();
console.log(adultUsers); // [{ id: 1, name: 'Alice', age: 28 }, ...]
```

### Consulta con OR WHERE

Utiliza `orWhere` para añadir condiciones OR a tu consulta.

```typescript
const users = await usersTable
  .where("age", ">", 25)
  .orWhere("name", "=", "Alice")
  .get();
console.log(users); // [{ id: 1, name: 'Alice', age: 28 }, ...]
```

### Consulta con grupos de condiciones WHERE

Agrupa condiciones utilizando `whereGroup`.

```typescript
const users = await usersTable
  .whereGroup((query) => {
    query.where("age", ">", 25).orWhere("name", "=", "Jane");
  })
  .get();
console.log(users); // [{ id: 1, name: 'Alice', age: 28 }, ...]
```

### Consulta con BETWEEN

Busca valores entre un rango utilizando `whereBetween`.

```typescript
const users = await usersTable.whereBetween("age", [25, 35]).get();
console.log(users); // [{ id: 1, name: 'Alice', age: 28 }, { id: 2, name: 'Bob', age: 32 }]
```

### Consulta con IN

Busca valores que coincidan con un conjunto de valores utilizando `whereIn`.

```typescript
const users = await usersTable.whereIn("id", [1, 3, 5]).get();
console.log(users); // [{ id: 1, name: 'Alice', age: 28 }, { id: 3, name: 'Charlie', age: 35 }]
```

### Consulta con IS NULL / IS NOT NULL

Busca valores nulos o no nulos utilizando `whereNull` y `whereNotNull`.

```typescript
const usersWithoutEmail = await usersTable.whereNull("email").get();
const usersWithEmail = await usersTable.whereNotNull("email").get();
```

### Consulta con JOIN

Une tablas utilizando el método `join`.

```typescript
const usersWithOrders = await usersTable
  .join("orders", "users.id", "=", "orders.user_id")
  .select(["users.name", "orders.order_id"])
  .get();
console.log(usersWithOrders); // [{ name: 'Alice', order_id: 101 }, ...]
```

### Consulta con LEFT JOIN

Realiza un left join utilizando el método `leftJoin`.

```typescript
const usersWithOrders = await usersTable
  .leftJoin("orders", "users.id", "=", "orders.user_id")
  .select(["users.name", "orders.order_id"])
  .get();
console.log(usersWithOrders); // [{ name: 'Alice', order_id: 101 }, { name: 'Bob', order_id: null }, ...]
```

### Consulta con RIGHT JOIN

Realiza un right join utilizando el método `rightJoin`.

```typescript
const ordersWithUsers = await usersTable
  .rightJoin("orders", "users.id", "=", "orders.user_id")
  .select(["users.name", "orders.order_id"])
  .get();
console.log(ordersWithUsers); // [{ name: 'Alice', order_id: 101 }, { name: null, order_id: 102 }, ...]
```

### Consulta con ORDER BY

Ordena resultados utilizando el método `orderBy`.

```typescript
const sortedUsers = await usersTable.orderBy("name", "ASC").get();
console.log(sortedUsers); // [{ id: 1, name: 'Alice', ... }, { id: 2, name: 'Bob', ... }]
```

### Consulta con LIMIT y OFFSET (paginación)

Limita el número de resultados y pagina utilizando `limit` y `page`.

```typescript
const firstTwoUsers = await usersTable.limit(2).page(1).get();
const nextTwoUsers = await usersTable.limit(2).page(2).get();
console.log(firstTwoUsers); // [{ id: 1, name: 'Alice', ... }, { id: 2, name: 'Bob', ... }]
console.log(nextTwoUsers); // [{ id: 3, name: 'Charlie', ... }, { id: 4, name: 'Dave', ... }]
```

### Consulta con GROUP BY

Agrupa resultados utilizando el método `groupBy`.

```typescript
const usersByAge = await usersTable.groupBy("age").get();
console.log(usersByAge); // [{ age: 28, count: 1 }, { age: 32, count: 1 }]
```

### Consulta con DISTINCT

Recupera registros únicos utilizando el método `distinct`.

```typescript
const uniqueNames = await usersTable.distinct().select(["name"]).get();
console.log(uniqueNames); // [{ name: 'Alice' }, { name: 'Bob' }]
```

## Funciones de agregación

### count

Cuenta el número de registros.

```typescript
const userCount = await usersTable.count().first();
console.log(userCount); // { count: 2 }
```

### sum

Calcula la suma de una columna.

```typescript
const totalAge = await usersTable.sum("age").first();
console.log(totalAge); // { sum: 60 }
```

### avg

Calcula el promedio de una columna.

```typescript
const averageAge = await usersTable.avg("age").first();
console.log(averageAge); // { avg: 30 }
```

### max

Encuentra el valor máximo en una columna.

```typescript
const maxAge = await usersTable.max("age").first();
console.log(maxAge); // { max: 32 }
```

### min

Encuentra el valor mínimo en una columna.

```typescript
const minAge = await usersTable.min("age").first();
console.log(minAge); // { min: 28 }
```

## Buscar registros

### find

Encuentra un registro por un valor específico de columna.

```typescript
const user = await usersTable.find(1, "id");
console.log(user); // { id: 1, name: 'Alice', email: 'alice@example.com', age: 28 }
```

### first

Obtiene solo el primer registro que cumple con las condiciones.

```typescript
const firstUser = await usersTable.where("age", ">", 25).first();
console.log(firstUser); // { id: 1, name: 'Alice', age: 28, ... }
```

## Gestión de columnas

### Añadir columnas

Añade nuevas columnas a una tabla utilizando el método `add` de `columns()`.

```typescript
await usersTable
  .columns()
  .add([{ name: "phone", type: "VARCHAR", length: 15 }]);
```

### Editar columnas

Modifica columnas existentes utilizando el método `edit` de `columns()`.

```typescript
await usersTable.columns().edit([
  {
    name: "email",
    type: "VARCHAR",
    length: 255,
    defaultValue: "new@example.com",
  },
]);
```

### Eliminar columnas

Elimina columnas de una tabla utilizando el método `delete` de `columns()`.

```typescript
await usersTable.columns().delete(["phone"]);
```

## Ejecutar consultas SQL crudas

Si necesitas ejecutar una consulta SQL cruda, puedes utilizar el método `query`.

```typescript
const result = await db.query("SELECT * FROM users WHERE age > 25;");
console.log(result); // { status: 'success', message: 'Query executed successfully', data: [...] }
```

### Manejo de errores

La biblioteca captura errores comunes, como errores de sintaxis SQL o problemas de conexión, y los devuelve en formato JSON.

```typescript
try {
  const result = await db.query("INVALID SQL QUERY;");
} catch (error) {
  console.error(error); // { status: 'error', message: 'SQL syntax error', data: null }
}
```

## API completa

### Clase MySQL

#### `table(tableName: string): TableQuery`

Crea y devuelve una nueva instancia de `TableQuery` para la tabla especificada.

```typescript
const usersTable = db.table("users");
```

#### `query(sqlQuery: string): Promise<{ status: string, message: string, data: any | null }>`

Ejecuta una consulta SQL directa en la base de datos.

```typescript
const result = await db.query("SELECT * FROM users;");
```

### Clase TableQuery

#### `create(fields: Field[]): Promise<boolean>`

Crea una nueva tabla con los campos especificados.

```typescript
await usersTable.create([
  { name: "id", type: "INT", options: ["primary", "autoincrement"] },
  { name: "name", type: "VARCHAR", length: 255 },
]);
```

#### `drop(): Promise<boolean>`

Elimina la tabla.

```typescript
await usersTable.drop();
```

#### `select(fields: string[] = []): TableQuery`

Especifica las columnas a seleccionar en una consulta SELECT.

```typescript
usersTable.select(["id", "name", "email"]);
```

#### `where(column: string, operator: string | undefined, value: any): TableQuery`

Añade una condición WHERE a la consulta.

```typescript
usersTable.where("age", ">", 25);
```

#### `orWhere(column: string, operator: string | undefined, value: any): TableQuery`

Añade una condición OR WHERE a la consulta.

```typescript
usersTable.orWhere("name", "=", "Jane");
```

#### `whereGroup(callback: any): TableQuery`

Añade un grupo de condiciones WHERE a la consulta.

```typescript
usersTable.whereGroup((query) => {
  query.where("age", ">", 25).orWhere("name", "=", "Jane");
});
```

#### `whereBetween(column: string, [value1, value2]: any): TableQuery`

Añade una condición WHERE BETWEEN a la consulta.

```typescript
usersTable.whereBetween("age", [25, 35]);
```

#### `whereIn(column: string, values: any): TableQuery`

Añade una condición WHERE IN a la consulta.

```typescript
usersTable.whereIn("id", [1, 3, 5]);
```

#### `whereNull(column: string): TableQuery`

Añade una condición WHERE IS NULL a la consulta.

```typescript
usersTable.whereNull("email");
```

#### `whereNotNull(column: string): TableQuery`

Añade una condición WHERE IS NOT NULL a la consulta.

```typescript
usersTable.whereNotNull("email");
```

#### `join(table: string, column1: string, operator: string, column2: string): TableQuery`

Añade una cláusula JOIN a la consulta.

```typescript
usersTable.join("orders", "users.id", "=", "orders.user_id");
```

#### `leftJoin(table: string, column1: string, operator: string, column2: string): TableQuery`

Añade una cláusula LEFT JOIN a la consulta.

```typescript
usersTable.leftJoin("orders", "users.id", "=", "orders.user_id");
```

#### `rightJoin(table: string, column1: string, operator: string, column2: string): TableQuery`

Añade una cláusula RIGHT JOIN a la consulta.

```typescript
usersTable.rightJoin("orders", "users.id", "=", "orders.user_id");
```

#### `orderBy(column: string, direction: string = 'ASC'): TableQuery`

Añade una cláusula ORDER BY a la consulta.

```typescript
usersTable.orderBy("name", "ASC");
```

#### `groupBy(column: string): TableQuery`

Añade una cláusula GROUP BY a la consulta.

```typescript
usersTable.groupBy("age");
```

#### `distinct(): TableQuery`

Añade una cláusula DISTINCT a la consulta.

```typescript
usersTable.distinct();
```

#### `count(column = '*'): TableQuery`

Añade una cláusula COUNT a la consulta.

```typescript
usersTable.count();
```

#### `sum(column: string): TableQuery`

Añade una cláusula SUM a la consulta.

```typescript
usersTable.sum("age");
```

#### `avg(column: string): TableQuery`

Añade una cláusula AVG a la consulta.

```typescript
usersTable.avg("age");
```

#### `max(column: string): TableQuery`

Añade una cláusula MAX a la consulta.

```typescript
usersTable.max("age");
```

#### `min(column: string): TableQuery`

Añade una cláusula MIN a la consulta.

```typescript
usersTable.min("age");
```

#### `limit(number: number): TableQuery`

Añade una cláusula LIMIT a la consulta.

```typescript
usersTable.limit(10);
```

#### `page(number: number): TableQuery`

Añade paginación a la consulta utilizando LIMIT y OFFSET.

```typescript
usersTable.limit(10).page(2);
```

#### `get(): Promise<any[]>`

Ejecuta la consulta y devuelve todas las filas coincidentes.

```typescript
const users = await usersTable.get();
```

#### `first(): Promise<any | null>`

Ejecuta la consulta y devuelve la primera fila coincidente.

```typescript
const user = await usersTable.first();
```

#### `insert(data: Record<string, any>[]): Promise<Record<string, any>[]>`

Inserta nuevos registros en la tabla.

```typescript
const newUsers = await usersTable.insert([
  { name: "Alice", email: "alice@example.com" },
]);
```

#### `update(data: Record<string, any>): Promise<boolean>`

Actualiza registros en la tabla según las condiciones WHERE.

```typescript
await usersTable.where("id", "=", 1).update({ name: "Alice Smith" });
```

#### `delete(): Promise<boolean>`

Elimina registros de la tabla según las condiciones WHERE.

```typescript
await usersTable.where("id", "=", 1).delete();
```

#### `find(value: any, column: string = 'id'): Promise<any | null>`

Encuentra un registro por su valor de columna.

```typescript
const user = await usersTable.find(1);
```

#### `columns(): Columns`

Devuelve una instancia de la clase Columns para gestionar columnas de la tabla.

```typescript
const columns = usersTable.columns();
```

### Clase Columns

#### `add(columns: Field[]): Promise<boolean>`

Añade nuevas columnas a la tabla.

```typescript
await usersTable
  .columns()
  .add([{ name: "phone", type: "VARCHAR", length: 15 }]);
```

#### `edit(columns: Field[]): Promise<boolean>`

Modifica columnas existentes en la tabla.

```typescript
await usersTable.columns().edit([
  {
    name: "email",
    type: "VARCHAR",
    length: 255,
    defaultValue: "example@mail.com",
  },
]);
```

#### `delete(columns: string[]): Promise<boolean>`

Elimina columnas de la tabla.

```typescript
await usersTable.columns().delete(["phone"]);
```

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - consulta el archivo LICENSE para más detalles.
