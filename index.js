'use strict'

class SQLStatement {
  /**
   * @param {string[]} strings
   * @param {any[]} values
   */
  constructor(strings, values) {
    strings = strings.concat()
    this.strings = []
    this.values = []
    
    let curStr = 0
    values.forEach(v => {
      if (v instanceof SQLStatement) {
        if (v.strings.length == 1) {
          strings[curStr + 1] = strings[curStr] + v.strings[0] + strings[curStr + 1]
          curStr += 1
          return
        }
        this.values = this.values.concat(v.values)
        this.strings.push((strings[curStr++] || '') + v.strings[0])
        this.strings = this.strings.concat(v.strings.slice(1, -1))
        strings[curStr] = v.strings[v.strings.length - 1] + strings[curStr]
        return
      }

      this.values.push(v)
      this.strings.push(strings[curStr++])
    })

    const lastStr = strings[curStr++]
    if (lastStr !== undefined)
      this.strings.push(lastStr)
    
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

SQL.raw = function(str) {
  return new SQLStatement([str], [])
}

module.exports = SQL
module.exports.SQL = SQL
module.exports.default = SQL
module.exports.SQLStatement = SQLStatement
