'use strict'

class SQLStatement {

  /**
   * @param {string[]} strings
   * @param {any[]} values
   */
  constructor(strings, values) {
    this.strings = strings
    this.unflattenedValues = values
    this.values = this.unflattenedValues.reduce((a, b) => {
      return a.concat(b)
    }, [])
  }

  /** Returns the SQL Statement for Sequelize */
  get query() {
    return this.bind ? this.text : this.sql
  }

  /** Returns the SQL Statement for node-postgres */
  get text() {
    let counter = 0
    return this.strings.reduce((prev, curr, i) => {
      let valuesIndex = i - 1
      if (this.unflattenedValues && Array.isArray(this.unflattenedValues[valuesIndex])) {
        let statement = prev
        statement += this.unflattenedValues[valuesIndex]
          .map((val) => '$' + ++counter)
          .join(', ')
        statement += curr
        return statement
      } else {
        return prev + '$' + ++counter + curr
      }
    })
  }

  /**
   * @param {SQLStatement|string} statement
   * @returns {this}
   */
  append(statement) {
    if (statement instanceof SQLStatement) {
      this.strings[this.strings.length - 1] += statement.strings[0]
      this.strings.push.apply(this.strings, statement.strings.slice(1));
      (this.values || this.bind).push.apply(this.values, statement.values)
    } else {
      this.strings[this.strings.length - 1] += statement
    }
    return this
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
    return this.strings.reduce((prev, curr, i) => {
      let valuesIndex = i - 1
      if (this.unflattenedValues && Array.isArray(this.unflattenedValues[valuesIndex])) {
        let statement = prev
        statement += this.unflattenedValues[valuesIndex]
          .map((val) => '?')
          .join(', ')
        statement += curr
        return statement
      } else {
        return prev + '?' + curr
      }
    })
  }
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
