'use strict'

class SQLStatement {
  /**
   * @param {string[]} strings
   * @param {any[]} values
   */
  constructor(strings, values) {
    this.strings = strings
    this.values = values
  }

  /** Returns the SQL Statement for Sequelize */
  get query() {
    return this.bind ? this.text : this.sql
  }

  /** Returns the SQL Statement for node-postgres */
  get text() {
    return this.strings.reduce((prev, curr, i) => prev + '$' + i + curr)
  }

  /**
   * @param {SQLStatement|string} statement
   * @returns {this}
   */
  append(statement) {
    if (statement instanceof SQLStatement) {
      this.strings[this.strings.length - 1] += statement.strings[0]
      this.strings.push.apply(this.strings, statement.strings.slice(1))
      const list = this.values || this.bind
      list.push.apply(list, statement.values)
    } else {
      this.strings[this.strings.length - 1] += statement
    }
    return this
  }

  /**
   * @param {SQLStatement|string} statement
   * @returns {SQLStatement}
   */
  concat(statement) {
    const sqlStatement = new SQLStatement(this.strings.slice())

    if (this.bind) {
      sqlStatement.bind = this.bind.slice()
      delete sqlStatement.values
    } else {
      sqlStatement.values = this.values.slice()
    }

    if (statement instanceof SQLStatement) {
      sqlStatement.strings[sqlStatement.strings.length - 1] += statement.strings[0]
      sqlStatement.strings.push.apply(sqlStatement.strings, statement.strings.slice(1))
      ;(sqlStatement.values || sqlStatement.bind).push.apply(sqlStatement.values, statement.values)
    } else {
      sqlStatement.strings[sqlStatement.strings.length - 1] += statement
    }
    return sqlStatement
  }

  /**
   * Use a prepared statement with Sequelize.
   * Makes `query` return a query with `$n` syntax instead of `?`  and switches the `values` key name to `bind`
   * @param {boolean} [value=true] value If omitted, defaults to `true`
   * @returns this
   */
  useBind(value) {
    if (value === undefined) {
      value = true
    }
    if (value && !this.bind) {
      this.bind = this.values
      delete this.values
    } else if (!value && this.bind) {
      this.values = this.bind
      delete this.bind
    }
    return this
  }

  /**
   * @param {string} name
   * @returns {this}
   */
  setName(name) {
    this.name = name
    return this
  }
}

/** Returns the SQL Statement for mysql */
Object.defineProperty(SQLStatement.prototype, 'sql', {
  enumerable: true,
  get() {
    return this.strings.join('?')
  },
})

/**
 * @param {string[]} strings
 * @param {...any} values
 * @returns {SQLStatement}
 */
function SQL(strings) {
  return new SQLStatement(strings.slice(0), Array.from(arguments).slice(1))
}

module.exports = SQL
module.exports.SQL = SQL
module.exports.default = SQL
module.exports.SQLStatement = SQLStatement
