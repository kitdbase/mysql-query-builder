# @kitdbase/mysql-orm

`@kitdbase/mysql-orm` es una biblioteca de Node.js diseñada para simplificar las interacciones con bases de datos MySQL utilizando un enfoque orientado a objetos. Esta biblioteca te permite realizar operaciones CRUD (Crear, Leer, Actualizar, Eliminar) fácilmente, así como gestionar la estructura de tus tablas.

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
npm install @kitdbase/mysql-orm
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
import db from "@kitdbase/mysql-orm";
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
await usersTable
  .columns()
  .edit([
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
