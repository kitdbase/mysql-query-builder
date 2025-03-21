import dotenv from 'dotenv';
import mysql, { Pool } from 'mysql2/promise';
import { Condition, Field, OrderBy } from '../@types/Field.js';

dotenv.config();

const MYSQL_DATABASE = process.env.MYSQL_DATABASE;
const MYSQL_USER = process.env.MYSQL_USER;
const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD;
const MYSQL_HOST = process.env.MYSQL_HOST;
const MYSQL_PORT = process.env.MYSQL_PORT;

/**
 * Main class to handle MySQL database connections and queries.
 * Implements the Singleton pattern to ensure a single instance of the connection pool.
 */
class MySQL {
    private static instance: MySQL;
    private pool: Pool | null = null;

    constructor() {
        if (!MySQL.instance) {
            try {
                this.pool = mysql.createPool({
                    host: MYSQL_HOST,
                    user: MYSQL_USER,
                    password: MYSQL_PASSWORD,
                    database: MYSQL_DATABASE,
                    port: Number(MYSQL_PORT),
                });
                MySQL.instance = this;
            } catch (error) {
                console.error('Error al conectar con MySQL:', error);
            }
        }
  
        return MySQL.instance;
    }

    /**
     * Creates and returns a new instance of `TableQuery` for the specified table.
     * This method is used to start building queries for a specific table.
     * 
     * @param {string} tableName - The name of the table to query.
     * @returns {TableQuery} - Returns a new instance of `TableQuery` for the specified table.
     * 
     * @example
     * const usersTable = db.table('users');
     * const users = await usersTable.select(['id', 'name']).get();
     * console.log(users); // [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }]
     */
    public table(tableName: string): TableQuery {
        return new TableQuery(tableName, this.pool);
    }

    /**
     * Executes a SQL query on the currently set database.
     * 
     * @param {string} sqlQuery - The SQL query to execute.
     * @returns {Promise<{ status: string, message: string, data: any | null }>} - Returns a JSON object with the status, message, and data (if any).
     * 
     * @example
     * const result = await db.query('SELECT * FROM users;');
     * console.log(result); 
     * // { status: 'success', message: 'Query executed successfully', data: [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }] }
     * 
     * @example
     * const result = await db.query('INVALID SQL QUERY;');
     * console.log(result); 
     * // { status: 'error', message: 'SQL syntax error', data: null }
     */
    public async query(sqlQuery: string): Promise<{ status: string, message: string, data: any | null }> {
        // Validar que el parámetro sqlQuery sea una cadena de texto
        if (typeof sqlQuery !== 'string') {
            throw new Error('The SQL query must be a string.');
        }

        // Dividir la consulta en comandos individuales (si hay múltiples comandos separados por ';')
        const sqlCommands = sqlQuery.split(';').filter(cmd => cmd.trim().length > 0);

        try {
            // Verificar si el pool de conexiones está disponible
            if (!this.pool) {
                throw new Error('Database connection pool is not available.');
            }

            // Ejecutar cada comando SQL
            let results = [];
            for (const command of sqlCommands) {
                const query = `${command};`;
                const [result] = await this.pool.query(query);
                results.push(result);
            }

            // Devolver la respuesta en formato JSON
            return {
                status: 'success',
                message: 'Query executed successfully',
                data: results.length === 1 ? results[0] : results, // Si hay un solo comando, devolver solo ese resultado
            };
        } catch (error: any) {
            // Manejar errores y devolver la respuesta en formato JSON
            return {
                status: 'error',
                message: error.sqlMessage || error.message || 'An error occurred while executing the query.',
                data: null,
            };
        }
    }
}

/**
 * Class to build and execute SQL queries for a specific table.
 * Supports operations like SELECT, INSERT, UPDATE, DELETE, and more.
 */
class TableQuery {
    private conection: Pool | null; // Tipo de conexión, puedes reemplazar `any` con el tipo adecuado
    private nextType: string; // Almacenar el tipo para la próxima condición
    private joins: string[]; // Almacenar los JOINs
    private _orderBy: OrderBy[]; // Almacenar los ORDER BY
    private _distinct: boolean; // Para controlar si se utiliza DISTINCT
    private _groupBy: string[]; // Almacenar los GROUP BY
    private tableName: string; // Nombre de la tabla
    private fields: string[]; // Campos seleccionados
    private query: string; // Consulta SQL construida
    private conditions: Condition[]; // Condiciones WHERE
    private limitValue: number | null = null; // Límite de resultados
    private pageValue: number | null = null; // Límite de resultados


    constructor(tableName: string, conection: Pool | null = null) {
        this.tableName = tableName;
        this.fields = [];
        this.nextType = 'AND';
        this.joins = [];
        this.query = `SELECT * FROM \`${tableName}\``;
        this.conditions = [];
        this._distinct = false;
        this._orderBy = [];
        this._groupBy = [];
        this.conection = conection;
    }

    columns(){
        return new Columns(this.tableName, this.conection);
    }
    
    async create(fields: Field[]) {
        try {
            const fieldsDefinition = fields.map(field => {
                const { name, type, defaultValue, length, options, foreing } = field;
    
                if (!name || !type) {
                    throw new Error('Cada campo debe tener un nombre y un tipo.');
                }
    
                let fieldDefinition = (length && type != "text") ? `\`${name}\` ${type}(${length})` : `\`${name}\` ${type}`;

                if(defaultValue){
                    fieldDefinition += (['VARCHAR', 'CHAR', 'TEXT', 'ENUM', 'SET'].includes(type.toUpperCase())) 
                    ? (defaultValue ? ` DEFAULT '${defaultValue}'` : ` DEFAULT NULL`)
                    : (defaultValue === 'NONE' || defaultValue === null) 
                        ? ''
                        : (defaultValue ? ` DEFAULT ${defaultValue}` : ` DEFAULT NULL`);
                }
    
                // Si tiene opciones adicionales como primary o unique
                if (options) {
                    if (options.includes('primary')) {
                        fieldDefinition += ' PRIMARY KEY';
                    }
                    if (options.includes('autoincrement')) {
                        fieldDefinition += ' AUTO_INCREMENT';
                    }
                    if (options.includes('unique')) {
                        fieldDefinition += ' UNIQUE';
                    }
                }
    
                // Si es una llave foránea
                if (foreing) {
                    fieldDefinition += `, FOREIGN KEY (\`${name}\`) REFERENCES \`${foreing.table}\`(\`${foreing.column}\`)`;
                }
    
                return fieldDefinition;
            }).join(', ');
    
            let sqlQuery = `CREATE TABLE IF NOT EXISTS \`${this.tableName}\` (${fieldsDefinition}`;
    
            sqlQuery += ')';
            await this.#get_response(sqlQuery);
            return true;
    
        } catch (error) {
            //console.error('Error al crear la tabla.', error);
            throw error;
        }
    }

    async drop() {
        try {
            const sqlQuery = `DROP TABLE IF EXISTS \`${this.tableName}\``;
            await this.#get_response(sqlQuery);
            return true;
        } catch (error:any) {
            throw new Error('Error al eliminar la tabla: ' + error.message);
        }
    }
    
    /**
     * Specifies the columns to select in a SELECT query.
     * 
     * @param {string[]} fields - Array of column names to select. If empty, selects all columns.
     * @returns {TableQuery} - Returns the current instance of TableQuery for method chaining.
     * 
     * @example
     * const users = await db.table('users').select(['id', 'name']).get();
     * console.log(users); // [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }]
     */
    select(fields: string[] = []) {
        if (fields.length > 0) {
            this.query = `SELECT ${this._distinct ? 'DISTINCT ' : ''}${fields.join(', ')} FROM \`${this.tableName}\``;
        }
        return this;
    }

    /**
     * Adds a WHERE condition to the query.
     * 
     * @param {string} column - The column to filter by.
     * @param {string} operator - The comparison operator (e.g., '=', '>', '<').
     * @param {any} value - The value to compare against.
     * @returns {TableQuery} - Returns the current instance of TableQuery for method chaining.
     * 
     * @example
     * const users = await db.table('users').where('age', '>', 25).get();
     * console.log(users); // [{ id: 1, name: 'John', age: 30 }]
     */
    where(column: string, operator: string | undefined, value: any) {
        if (operator === undefined) {
            operator = "=";
        }
        this.conditions.push({ column, operator, value, type: this.nextType, isGroup: false });
        this.nextType = 'AND';
        return this;
    }

    /**
     * Adds an OR WHERE condition to the query.
     * 
     * @param {string} column - The column to filter by.
     * @param {string} operator - The comparison operator (e.g., '=', '>', '<').
     * @param {any} value - The value to compare against.
     * @returns {TableQuery} - Returns the current instance of TableQuery for method chaining.
     * 
     * @example
     * const users = await db.table('users').where('age', '>', 25).orWhere('name', '=', 'Jane').get();
     * console.log(users); // [{ id: 1, name: 'John', age: 30 }, { id: 2, name: 'Jane', age: 25 }]
     */
    orWhere(column: string, operator: string | undefined, value: any) {
        if (operator === undefined) {
            operator = "=";
        }
        this.conditions.push({ column, operator, value, type: 'OR', isGroup: false });
        return this;
    }

    /**
     * Adds a grouped WHERE condition to the query.
     * 
     * @param {Function} callback - A callback function that receives a new TableQuery instance to build the grouped conditions.
     * @returns {TableQuery} - Returns the current instance of TableQuery for method chaining.
     * 
     * @example
     * const users = await db.table('users').whereGroup(query => {
     *     query.where('age', '>', 25).orWhere('name', '=', 'Jane');
     * }).get();
     * console.log(users); // [{ id: 1, name: 'John', age: 30 }, { id: 2, name: 'Jane', age: 25 }]
     */
    whereGroup(callback:any) {
        const groupQuery = new TableQuery(this.tableName);
        callback(groupQuery);
        const groupConditions = groupQuery.buildConditions(); // Construir solo las condiciones sin SELECT ni WHERE
        this.conditions.push({ query: groupConditions, type: this.nextType, isGroup: true });
        this.nextType = 'AND'; // Reiniciar el tipo después de agregar un grupo
        return this;
    }
    
    or() {
        this.nextType = 'OR';
        return this;
    }

    and() {
        this.nextType = 'AND';
        return this;
    }

    /**
     * Adds a WHERE BETWEEN condition to the query.
     * 
     * @param {string} column - The column to filter by.
     * @param {Array<any>} values - An array with two values representing the range.
     * @returns {TableQuery} - Returns the current instance of TableQuery for method chaining.
     * 
     * @example
     * const users = await db.table('users').whereBetween('age', [20, 30]).get();
     * console.log(users); // [{ id: 1, name: 'John', age: 30 }, { id: 2, name: 'Jane', age: 25 }]
     */
    whereBetween(column:string, [value1, value2]:any) {
        if (Array.isArray([value1, value2]) && value1 !== undefined && value2 !== undefined) {
            this.conditions.push({ column, operator: 'BETWEEN', value: [value1, value2], type: this.nextType, isGroup: false });
            this.nextType = 'AND'; // Reiniciar el tipo después de agregar una condición
        }
        return this;
    }

    /**
     * Adds a WHERE IN condition to the query.
     * 
     * @param {string} column - The column to filter by.
     * @param {Array<any>} values - An array of values to match.
     * @returns {TableQuery} - Returns the current instance of TableQuery for method chaining.
     * 
     * @example
     * const users = await db.table('users').whereIn('id', [1, 2]).get();
     * console.log(users); // [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }]
     */
    whereIn(column:string, values:any) {
        if (Array.isArray(values) && values.length > 0) {
            this.conditions.push({ column, operator: 'IN', value: values, type: this.nextType, isGroup: false });
            this.nextType = 'AND'; // Reiniciar el tipo después de agregar una condición
        }
        return this;
    }

    /**
    * Adds a WHERE IS NULL condition to the query.
    * 
    * @param {string} column - The column to filter by.
    * @returns {TableQuery} - Returns the current instance of TableQuery for method chaining.
    * 
    * @example
    * const users = await db.table('users').whereNull('email').get();
    * console.log(users); // [{ id: 3, name: 'Alice', email: null }]
    */
    whereNull(column:string) {
        this.conditions.push({ column, operator: 'IS NULL', type: this.nextType, isGroup: false });
        this.nextType = 'AND'; // Reiniciar el tipo después de agregar una condición
        return this;
    }

    /**
     * Adds a WHERE IS NOT NULL condition to the query.
     * 
     * @param {string} column - The column to filter by.
     * @returns {TableQuery} - Returns the current instance of TableQuery for method chaining.
     * 
     * @example
     * const users = await db.table('users').whereNotNull('email').get();
     * console.log(users); // [{ id: 1, name: 'John', email: 'john@example.com' }]
     */
    whereNotNull(column:string) {
        this.conditions.push({ column, operator: 'IS NOT NULL', type: this.nextType, isGroup: false });
        this.nextType = 'AND'; // Reiniciar el tipo después de agregar una condición
        return this;
    }

    buildQuery(includeSelect = true) {
        let query = includeSelect ? this.query : ''; // Si se incluye el SELECT o no

        // Añadir JOINs
        if (this.joins.length > 0) {
            query += ` ${this.joins.join(' ')}`;
        }

        const whereClauses = this.buildConditions();

        if (whereClauses.length > 0) {
            query += ` WHERE ${whereClauses}`;
        }

        // Añadir GROUP BY
        if (this._groupBy.length > 0) {
            query += ` GROUP BY ${this._groupBy.join(', ')}`;
        }

        if (this.limitValue !== null && this.limitValue !== undefined && !Number.isNaN(this.limitValue)) {
            query += ` LIMIT ${this.limitValue}`;
          }
      
          if (this.limitValue && this.pageValue !== null && this.pageValue !== undefined && !Number.isNaN(this.pageValue)) {
            const offset = (this.pageValue - 1) * this.limitValue;
            query += ` OFFSET ${offset}`;
          }

        // Añadir ORDER BY solo si no es una consulta agregada (como COUNT, SUM, etc.)
        if (this._orderBy.length > 0 && !this.query.startsWith('SELECT COUNT') && !this.query.startsWith('SELECT SUM') && !this.query.startsWith('SELECT AVG') && !this.query.startsWith('SELECT MAX') && !this.query.startsWith('SELECT MIN')) {
            const orderByClauses = this._orderBy
                .map(order => `${order.column} ${order.direction}`)
                .join(', ');
            query += ` ORDER BY ${orderByClauses}`;
        }

        return query;
    }

    buildConditions() {
      return this.conditions
          .map((cond, index) => {
              const prefix = index === 0 ? '' : ` ${cond.type} `;
              if (cond.isGroup) {
                  return `${prefix}(${cond.query})`;
              }
              let conditionStr = '';
              if (cond.operator === 'BETWEEN') {
                  const [value1, value2] = cond.value;
                  const formattedValue1 = typeof value1 === 'string' ? `'${value1}'` : value1;
                  const formattedValue2 = typeof value2 === 'string' ? `'${value2}'` : value2;
                  conditionStr = `${cond.column} BETWEEN ${formattedValue1} AND ${formattedValue2}`;
              } else if (cond.operator === 'IN') {
                  const values = cond.value.map((val:any) => typeof val === 'string' ? `'${val}'` : val).join(', ');
                  conditionStr = `${cond.column} IN (${values})`;
              } else if (cond.operator === 'IS NULL') {
                  conditionStr = `${cond.column} IS NULL`;
              } else if (cond.operator === 'IS NOT NULL') {
                  conditionStr = `${cond.column} IS NOT NULL`;
              } else {
                  const value = typeof cond.value === 'string' ? `'${cond.value}'` : cond.value;
                  conditionStr = `${cond.column} ${cond.operator} ${value}`;
              }
              return `${prefix}${conditionStr}`;
          })
          .join('');
    }

    /**
     * Adds a JOIN clause to the query.
     * 
     * @param {string} table - The table to join.
     * @param {string} column1 - The column from the current table.
     * @param {string} operator - The comparison operator (e.g., '=', '>', '<').
     * @param {string} column2 - The column from the joined table.
     * @returns {TableQuery} - Returns the current instance of TableQuery for method chaining.
     * 
     * @example
     * const users = await db.table('users').join('orders', 'users.id', '=', 'orders.user_id').get();
     * console.log(users); // [{ id: 1, name: 'John', order_id: 101 }]
     */
    join(table: string, column1:string, operator:string, column2:string) {
        this.joins.push(`JOIN ${table} ON ${column1} ${operator} ${column2}`);
        return this;
    }

    /**
     * Adds a LEFT JOIN clause to the query.
     * 
     * @param {string} table - The table to join.
     * @param {string} column1 - The column from the current table.
     * @param {string} operator - The comparison operator (e.g., '=', '>', '<').
     * @param {string} column2 - The column from the joined table.
     * @returns {TableQuery} - Returns the current instance of TableQuery for method chaining.
     * 
     * @example
     * const users = await db.table('users').leftJoin('orders', 'users.id', '=', 'orders.user_id').get();
     * console.log(users); // [{ id: 1, name: 'John', order_id: 101 }, { id: 2, name: 'Jane', order_id: null }]
     */
    leftJoin(table: string, column1: string, operator: string, column2: string) {
        this.joins.push(`LEFT JOIN ${table} ON ${column1} ${operator} ${column2}`);
        return this;
    }

    /**
     * Adds a RIGHT JOIN clause to the query.
     * 
     * @param {string} table - The table to join.
     * @param {string} column1 - The column from the current table.
     * @param {string} operator - The comparison operator (e.g., '=', '>', '<').
     * @param {string} column2 - The column from the joined table.
     * @returns {TableQuery} - Returns the current instance of TableQuery for method chaining.
     * 
     * @example
     * const users = await db.table('users').rightJoin('orders', 'users.id', '=', 'orders.user_id').get();
     * console.log(users); // [{ id: 1, name: 'John', order_id: 101 }, { id: null, name: null, order_id: 102 }]
     */
    rightJoin(table: string, column1: string, operator: string, column2: string) {
        this.joins.push(`RIGHT JOIN ${table} ON ${column1} ${operator} ${column2}`);
        return this;
    }

    /**
     * Adds an ORDER BY clause to the query.
     * 
     * @param {string} column - The column to order by.
     * @param {string} direction - The sorting direction ('ASC' or 'DESC').
     * @returns {TableQuery} - Returns the current instance of TableQuery for method chaining.
     * 
     * @example
     * const users = await db.table('users').orderBy('name', 'ASC').get();
     * console.log(users); // [{ id: 2, name: 'Jane' }, { id: 1, name: 'John' }]
     */
    orderBy(column: string, direction: string = 'ASC') {
      const validDirections = ['ASC', 'DESC'];
      if (validDirections.includes(direction.toUpperCase())) {
          this._orderBy.push({ column, direction: direction.toUpperCase() });
      } else {
          throw new Error(`Invalid direction: ${direction}. Use 'ASC' or 'DESC'.`);
      }
      return this;
    }

    /**
     * Adds a GROUP BY clause to the query.
     * 
     * @param {string} column - The column to group by.
     * @returns {TableQuery} - Returns the current instance of TableQuery for method chaining.
     * 
     * @example
     * const users = await db.table('users').groupBy('age').get();
     * console.log(users); // [{ age: 30, count: 1 }, { age: 25, count: 1 }]
     */
    groupBy(column:string) {
        this._groupBy.push(column);
        return this;
    }

    /**
     * Adds a DISTINCT clause to the query.
     * 
     * @returns {TableQuery} - Returns the current instance of TableQuery for method chaining.
     * 
     * @example
     * const users = await db.table('users').distinct().select(['name']).get();
     * console.log(users); // [{ name: 'John' }, { name: 'Jane' }]
     */
    distinct() {
      this._distinct = true;
      this.query = this.query.replace(/^SELECT /, 'SELECT DISTINCT '); // Cambia SELECT a SELECT DISTINCT si ya se ha establecido DISTINCT
      return this;
    }

    /**
     * Adds a COUNT clause to the query.
     * 
     * @param {string} column - The column to count (default is '*').
     * @returns {TableQuery} - Returns the current instance of TableQuery for method chaining.
     * 
     * @example
     * const count = await db.table('users').count().first();
     * console.log(count); // { count: 2 }
     */
    count(column = '*') {
        this.query = `SELECT COUNT(${column}) AS count FROM ${this.tableName}`;
        return this;
    }

    /**
     * Adds a SUM clause to the query.
     * 
     * @param {string} column - The column to sum.
     * @returns {TableQuery} - Returns the current instance of TableQuery for method chaining.
     * 
     * @example
     * const totalAge = await db.table('users').sum('age').first();
     * console.log(totalAge); // { sum: 55 }
     */
    sum(column: string) {
        this.query = `SELECT SUM(${column}) AS sum FROM \`${this.tableName}\``;
        return this;
    }

    /**
     * Adds an AVG clause to the query.
     * 
     * @param {string} column - The column to calculate the average.
     * @returns {TableQuery} - Returns the current instance of TableQuery for method chaining.
     * 
     * @example
     * const avgAge = await db.table('users').avg('age').first();
     * console.log(avgAge); // { avg: 27.5 }
     */
    avg(column:string) {
        this.query = `SELECT AVG(${column}) AS avg FROM \`${this.tableName}\``;
        return this;
    }

    /**
     * Adds a MAX clause to the query.
     * 
     * @param {string} column - The column to find the maximum value.
     * @returns {TableQuery} - Returns the current instance of TableQuery for method chaining.
     * 
     * @example
     * const maxAge = await db.table('users').max('age').first();
     * console.log(maxAge); // { max: 30 }
     */
    max(column:string) {
        this.query = `SELECT MAX(${column}) AS max FROM \`${this.tableName}\``;
        return this;
    }

    /**
     * Adds a MIN clause to the query.
     * 
     * @param {string} column - The column to find the minimum value.
     * @returns {TableQuery} - Returns the current instance of TableQuery for method chaining.
     * 
     * @example
     * const minAge = await db.table('users').min('age').first();
     * console.log(minAge); // { min: 25 }
     */
    min(column: string) {
        this.query = `SELECT MIN(${column}) AS min FROM \`${this.tableName}\``;
        return this;
    }

    /**
     * Adds a LIMIT clause to the query.
     * 
     * @param {number} number - The maximum number of rows to return.
     * @returns {TableQuery} - Returns the current instance of TableQuery for method chaining.
     * 
     * @example
     * const users = await db.table('users').limit(1).get();
     * console.log(users); // [{ id: 1, name: 'John', age: 30 }]
     */
    limit(number:number) {
        this.limitValue = number;
        return this; 
    }

    /**
     * Adds pagination to the query using LIMIT and OFFSET.
     * 
     * @param {number} number - The page number (starting from 1).
     * @returns {TableQuery} - Returns the current instance of TableQuery for method chaining.
     * 
     * @example
     * const users = await db.table('users').limit(1).page(2).get();
     * console.log(users); // [{ id: 2, name: 'Jane', age: 25 }]
     */
    page(number:number) {
        this.pageValue = number;
        return this; 
    }

    /**
    * Executes the query and returns all matching rows.
    * 
    * @returns {Promise<Array<Object>>} - Returns an array of rows.
    * 
    * @example
    * const users = await db.table('users').get();
    * console.log(users); // [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }]
    */
    async get() {
      const sqlQuery = this.buildQuery();
      try {
          const result = await this.#get_response(sqlQuery);
          return result; // Devuelve todos los resultados
      } catch (error) {
          throw error;
      }
    }

    /**
     * Executes the query and returns the first matching row.
     * 
     * @returns {Promise<Object | null>} - Returns the first row or null if no rows match.
     * 
     * @example
     * const user = await db.table('users').first();
     * console.log(user); // { id: 1, name: 'John' }
     */
    async first() {
        const sqlQuery = this.buildQuery();
        try {
            const result:any = await this.#get_response(sqlQuery);
            return result[0] || null; // Devuelve el primer resultado o null si no hay resultados
        } catch (error) {
            //console.error('Error al obtener el primer resultado.', error);
            throw error;
        }
    }

    /**
     * Finds a row by a specific column value.
     * 
     * @param {any} value - The value to search for.
     * @param {string} column - The column to search in (default is 'id').
     * @returns {Promise<Object | null>} - Returns the first matching row or null if no rows match.
     * 
     * @example
     * const user = await db.table('users').find(1);
     * console.log(user); // { id: 1, name: 'John' }
     */
    async find(value:any, column = 'id') {
        this.where(column, '=', value); // Agregar una condición WHERE
        const sqlQuery = this.buildQuery();
        try {
            const result:any = await this.#get_response(sqlQuery);
            return result[0] || null; // Devuelve el primer resultado o null si no hay resultados
        } catch (error) {
            //console.error('Error al encontrar el registro.', error);
            throw error;
        }
    }
    
    /**
     * Inserts one or more rows into the table.
     * 
     * @param {Array<Object>} data - An array of objects representing the rows to insert.
     * @returns {Promise<Array<Object>>} - Returns an array of the inserted rows.
     * 
     * @example
     * const newUsers = await db.table('users').insert([
     *     { name: 'Alice', age: 28 },
     *     { name: 'Bob', age: 32 }
     * ]);
     * console.log(newUsers); // [{ id: 3, name: 'Alice', age: 28 }, { id: 4, name: 'Bob', age: 32 }]
     */
    async insert(data:any) {
        // Verifica si data NO es un array
        if (!Array.isArray(data)) {
            throw new Error('El método insert requiere un array de objetos con pares clave-valor.');
        }
    
        // Asegúrate de que el array contenga solo objetos
        if (!data.every(item => typeof item === 'object' && item !== null)) {
            throw new Error('El array debe contener solo objetos válidos.');
        }
    
        try {
            const results: any = [];
    
            for (const row of data) {
                const keys = Object.keys(row).map(key => `\`${key}\``);
                const values = Object.values(row).map(value => {
                    if (value === undefined || value === null) {
                        return 'NULL'; // Maneja valores undefined o null
                    }
                    return typeof value === 'string' ? `'${value}'` : value;
                });
    
                const columns = keys.join(', ');
                const placeholders = values.join(', ');
    
                const sqlQuery = `INSERT INTO \`${this.tableName}\` (${columns}) VALUES (${placeholders})`;
    
                const result:any = await this.#get_response(sqlQuery);
                const insertedRow = await this.where('id', '=', result.insertId || 0).first();
                results.push(insertedRow);
            }
    
            return results;
        } catch (error:any) {
            throw new Error('Error al insertar los datos: ' + error.message);
        }
    }

    /**
     * Inserts one or more rows into the table.
     * 
     * @param {Array<Object>} data - An array of objects representing the rows to insert.
     * @returns {Promise<Array<Object>>} - Returns an array of the inserted rows.
     * 
     * @example
     * const newUsers = await db.table('users').insert([
     *     { name: 'Alice', age: 28 },
     *     { name: 'Bob', age: 32 }
     * ]);
     * console.log(newUsers); // [{ id: 3, name: 'Alice', age: 28 }, { id: 4, name: 'Bob', age: 32 }]
     */
    async update(data:any) {
      if (typeof data !== 'object' || Array.isArray(data)) {
          throw new Error('El método update requiere un objeto con pares clave-valor.');
      }

      const updates = Object.keys(data).map(key => {
          const value = data[key];
          return `${key} = ${typeof value === 'string' ? `'${value}'` : value}`;
      }).join(', ');

      const whereClauses = this.buildConditions();

      if (whereClauses.length === 0) {
          throw new Error('Debe especificar al menos una condición WHERE para realizar un update.');
      }

      const sqlQuery = `UPDATE \`${this.tableName}\` SET ${updates} WHERE ${whereClauses}`;

      try {
          const result = await this.#get_response(sqlQuery);
          return result;
      } catch (error) {
          //console.error('Error al actualizar los datos.', error);
          throw error;
      }
    }

    /**
     * Deletes rows from the table based on the defined conditions.
     * 
     * @returns {Promise<Object>} - Returns the result of the delete operation.
     * 
     * @example
     * const result = await db.table('users').where('id', '=', 1).delete();
     * console.log(result); // { affectedRows: 1 }
     */
    async delete() {
        const whereClauses = this.buildConditions();

        if (whereClauses.length === 0) {
            throw new Error('Debe especificar al menos una condición WHERE para realizar un delete.');
        }

        const sqlQuery = `DELETE FROM \`${this.tableName}\` WHERE ${whereClauses}`;

        try {
            const result = await this.#get_response(sqlQuery);
            return result;
        } catch (error) {
            //console.error('Error al eliminar los datos.', error);
            throw error;
        }
    }

    async #get_response(sql:string) {
        const pool = await this.conection;
        if(!pool){
            throw new Error('No se ha establecido una conexión a la base de datos.');
        }
        try {
            const [result] = await pool.query(sql);
            return result;
        } catch (error:any) {
            if (error.code === 'ER_BAD_DB_ERROR') {
                try {
                    if(!this.conection){
                        throw new Error('No se ha establecido una conexión a la base de datos.');
                    }
                    await this.conection.end();
                    this.conection = mysql.createPool({
                        host: MYSQL_HOST,
                        user: MYSQL_USER,
                        password: MYSQL_PASSWORD,
                        port: Number(MYSQL_PORT),
                    });
                    const pool_aux = await this.conection;
                    await pool_aux.query(`CREATE DATABASE \`${MYSQL_DATABASE}\``);
                    await this.conection.end();
                    this.conection = mysql.createPool({
                        host: MYSQL_HOST,
                        user: MYSQL_USER,
                        password: MYSQL_PASSWORD,
                        database: MYSQL_DATABASE,
                        port: Number(MYSQL_PORT),
                    });
                    const pool = await this.conection;
                    const [result] = await pool.query(sql);
                    return result;
                } catch (error) {
                    //console.error('Error al crear la base de datos:', error);
                    throw error;
                }
            }
            //console.error('Error al ejecutar la consulta.', error);
            throw error;
        }
    }
}

/**
 * Class to manage table columns, allowing adding, editing, or deleting columns.
 */
class Columns {
    private conection: Pool | null; 
    private tableName: string; // Nombre de la tabla

    constructor(tableName: string, conection: Pool | null = null) {
        this.tableName = tableName;
        this.conection = conection; // Inicializar GROUP BY
    }

    /**
     * Retrieves the structure of the table columns.
     * 
     * @returns {Promise<Object>} - Returns an object with the column details.
     * 
     * @example
     * const columns = await db.table('users').columns().get();
     * console.log(columns); // { id: { type: 'INT', defaultValue: null, key: 'PRI', extra: 'auto_increment' } }
     */
    async get(){
        try {
            // Verifica si la tabla ya existe
            const tableExistsQuery = `SHOW TABLES LIKE '${this.tableName}'`;
            const tableExistsResult:any = await this.#get_response(tableExistsQuery);
    
            if (tableExistsResult && tableExistsResult.length > 0) {
                // La tabla existe, obtenemos su estructura actual
                const existingFieldsQuery = `SHOW COLUMNS FROM \`${this.tableName}\``;
                const existingFields:any = await this.#get_response(existingFieldsQuery);
    
                // Mapeamos los campos actuales en un formato más manejable
                return existingFields.reduce((acc:any, field:any) => {
                    acc[field.Field] = {
                        type: field.Type,
                        defaultValue: field.Default,
                        key: field.Key,
                        extra: field.Extra
                    };
                    return acc;
                }, {});
            } else {
                return {}; // La tabla no existe
            }
        } catch (error) {
            throw error;
        }
    }
    
    /**
     * Adds new columns to the table.
     * 
     * @param {Array<Field>} fields - An array of objects defining the new columns.
     * @returns {Promise<boolean>} - Returns `true` if the operation was successful.
     * 
     * @example
     * await db.table('users').columns().add([
     *     { name: 'email', type: 'VARCHAR', length: 255, defaultValue: 'example@example.com' }
     * ]);
     */
    async add(fields: Field[]) {
        try {
            const currentFields = await this.get();
    
            for (const field of fields) {
                const { name, type, length, defaultValue, options, foreing } = field;
                const fullType = (length && type !== "TEXT") ? `${type}(${length})` : type;
    
                if (!currentFields[name]) {
                    // El campo no existe, agregamos una nueva columna
                    let alterQuery = `ALTER TABLE \`${this.tableName}\` ADD COLUMN \`${name}\` ${fullType}`;
                    
                    if(defaultValue){
                        alterQuery += (['varchar', 'char', 'text', 'enum', 'set'].includes(type)) 
                        ? (defaultValue ? ` DEFAULT '${defaultValue}'` : ` DEFAULT NULL`)
                        : (defaultValue === 'NONE' || defaultValue === null) 
                            ? ''
                            : (defaultValue ? ` DEFAULT ${defaultValue}` : ` DEFAULT NULL`);
                    }

                    if (options) {
                        if (options.includes('primary')) {
                            alterQuery += ' PRIMARY KEY';
                        }
                        if (options.includes('autoincrement')) {
                            alterQuery += ' AUTO_INCREMENT';
                        }
                        if (options.includes('unique')) {
                            alterQuery += ' UNIQUE';
                        }
                    }
                    if (foreing) {
                        alterQuery += `, ADD FOREIGN KEY (\`${name}\`) REFERENCES \`${foreing.table}\`(\`${foreing.column}\`)`;
                    }

                    await this.#get_response(alterQuery);
                }
            }
    
            return true;
        } catch (error) {
            console.error('Error al agregar columnas.', error);
            throw error;
        }
    }
    
    /**
     * Edits existing columns in the table.
     * 
     * @param {Array<Field>} fields - An array of objects defining the columns to edit.
     * @returns {Promise<boolean>} - Returns `true` if the operation was successful.
     * 
     * @example
     * await db.table('users').columns().edit([
     *     { name: 'email', type: 'VARCHAR', length: 255, defaultValue: 'new@example.com' }
     * ]);
     */
    async edit(fields: Field[]) {
        try {
            const currentFields = await this.get();
    
            for (const field of fields) {
                const { name, type, length, defaultValue, options, foreing } = field;
                const fullType = (length && type !== "TEXT") ? `${type}(${length})` : type;
    
                if (currentFields[name]) {
                    // El campo existe, verificamos si tiene diferencias
                    const existingField = currentFields[name];

                    if (existingField.type !== fullType || existingField.defaultValue !== defaultValue ||
                        (options && options.includes('autoincrement') && existingField.extra !== 'auto_increment') ||
                        (options && options.includes('unique') && existingField.key !== 'UNI') ||
                        (options && options.includes('primary') && existingField.key !== 'PRI')) { 

                        // Modificamos la columna existente
                        let modifyQuery = `ALTER TABLE \`${this.tableName}\` MODIFY COLUMN \`${name}\` ${fullType}`;

                        if(existingField.defaultValue !== defaultValue){
                            modifyQuery += (['varchar', 'char', 'text', 'enum', 'set'].includes(type)) 
                            ? (defaultValue ? ` DEFAULT '${defaultValue}'` : ` DEFAULT NULL`)
                            : (defaultValue === 'NONE' || defaultValue === null) 
                                ? ''
                                : (defaultValue ? ` DEFAULT ${defaultValue}` : ` DEFAULT NULL`);
                        }

                        if (options) {
                            if (options.includes('primary')) {
                                modifyQuery += ' PRIMARY KEY';
                            }
                            if (options.includes('autoincrement')) {
                                modifyQuery += ' AUTO_INCREMENT';
                            }
                            if (options.includes('unique')) {
                                modifyQuery += ' UNIQUE';
                            }
                        }
                        
                        if (foreing) {
                            modifyQuery += `, ADD FOREIGN KEY (\`${name}\`) REFERENCES \`${foreing.table}\`(\`${foreing.column}\`)`;
                        }

                        await this.#get_response(modifyQuery);
                    }
                }
            }
    
            return true;
        } catch (error) {
            console.error('Error al editar columnas.', error);
            throw error;
        }
    }

    /**
     * Deletes columns from the table.
     * 
     * @param {Array<string>} fields - An array of column names to delete.
     * @returns {Promise<boolean>} - Returns `true` if the operation was successful.
     * 
     * @example
     * await db.table('users').columns().delete(['email']);
     */
    async delete(fields: string[]) {
        try {
            const currentFields: any = await this.get();
    
            for (const key of fields) {
                if (currentFields[key]) {
                    // Eliminar columna existente
                    let dropQuery = `ALTER TABLE ${this.tableName} DROP COLUMN \`${key}\`;`;
                    await this.#get_response(dropQuery);
                }
            }
    
            return true;
        } catch (error) {
            //console.error('Error al eliminar columnas.', error);
            throw error;
        }
    }

    async #get_response(sql:string) {
        const pool = await this.conection;
        if(!pool){
            throw new Error('No se ha establecido una conexión a la base de datos.');
        }
        try {
            const [result] = await pool.query(sql);
            return result;
        } catch (error:any) {
            if (error.code === 'ER_BAD_DB_ERROR') {
                try {
                    if(!this.conection){
                        throw new Error('No se ha establecido una conexión a la base de datos.');
                    }
                    await this.conection.end();
                    this.conection = mysql.createPool({
                        host: MYSQL_HOST,
                        user: MYSQL_USER,
                        password: MYSQL_PASSWORD,
                        port: Number(MYSQL_PORT),
                    });
                    const pool_aux = await this.conection;
                    await pool_aux.query(`CREATE DATABASE \`${MYSQL_DATABASE}\``);
                    await this.conection.end();
                    this.conection = mysql.createPool({
                        host: MYSQL_HOST,
                        user: MYSQL_USER,
                        password: MYSQL_PASSWORD,
                        database: MYSQL_DATABASE,
                        port: Number(MYSQL_PORT),
                    });
                    const pool = await this.conection;
                    const [result] = await pool.query(sql);
                    return result;
                } catch (error) {
                    //console.error('Error al crear la base de datos:', error);
                    throw error;
                }
            }
            //console.error('Error al ejecutar la consulta.', error);
            throw error;
        }
    }
}

const db = new MySQL();
export default db;