
module.exports = exports = SQL;

export class SQLStatement {

    /**
     * The SQL Statement for [mysql](https://www.npmjs.com/package/mysql)
     */
    public sql: string;

    /**
     * The SQL Statement for [Sequelize](https://www.npmjs.com/package/sequelize)
     */
    public get query() {
        return this.bind ? this.text : this.sql;
    }

    /**
     * The SQL Statement for [node-postgres](https://www.npmjs.com/package/pg)
     */
    public get text() {
        return this.strings.reduce((prev, curr, i) => prev + '$' + i + curr);
    }

    /**
     * The values to be inserted for the placeholders
     */
    public values: string[];

    /**
     * The name for postgres prepared statements, if set
     */
    public name: string;

    /**
     * Replacements for [Sequelize](https://www.npmjs.com/package/sequelize) in case bound queries are used
     */
    public bind: string[];

    private strings: string[];

    constructor(strings: string[], values: any[]) {
        this.strings = strings;
        this.values = values;
    }

    /**
     * Appends a string or another statement
     *
     * ```ts
     * query.append(SQL`AND genre = ${genre}`).append(' ORDER BY rating')
     * query.text   // => 'SELECT author FROM books WHERE name = $1 AND author = $2 AND genre = $3 ORDER BY rating'
     * query.sql    // => 'SELECT author FROM books WHERE name = ? AND author = ? AND genre = ? ORDER BY rating'
     * query.values // => ['harry potter', 'J. K. Rowling', 'Fantasy'] ORDER BY rating`
     *
     * const query = SQL`SELECT * FROM books`
     * if (params.name) {
     *   query.append(SQL` WHERE name = ${params.name}`)
     * }
     * query.append(SQL` LIMIT 10 OFFSET ${params.offset || 0}`)
     * ```
     */
    append(statement: SQLStatement | string | number): this {
        if (statement instanceof SQLStatement) {
            this.strings[this.strings.length - 1] += statement.strings[0];
            this.strings.push.apply(this.strings, statement.strings.slice(1));
            (this.values || this.bind).push.apply(this.values, statement.values);
        } else {
            this.strings[this.strings.length - 1] += statement;
        }
        return this;
    }

    /**
     * Use a prepared statement with Sequelize.
     * Makes `query` return a query with `$n` syntax instead of `?`  and switches the `values` key name to `bind`
     * If omitted, `value` defaults to `true`.
     */
    useBind(value: boolean = true): this {
        if (value && !this.bind) {
            this.bind = this.values;
            delete this.values;
        } else if (!value && this.bind) {
            this.values = this.bind;
            delete this.bind;
        }
        return this;
    }

    /**
     * @param {string} name
     * @returns {this}
     */
    setName(name: string): this {
        this.name = name;
        return this;
    }
}

Object.defineProperty(SQLStatement.prototype, 'sql', {
    enumerable: true,
    get() {
        return this.strings.join('?');
    }
});

/**
 * The template string tag
 *
 * ```ts
 * import {SQL} from 'sql-template-strings';
 *
 * pg.query(SQL`SELECT author FROM books WHERE name = ${book} AND author = ${author}`)
 * ```
 */
export function SQL(strings: string[], ...values: any[]) {
    // the strings argument is a read-only array, which is why we need to clone it
    return new SQLStatement(strings.slice(0), values.slice(0));
}

export default SQL;
