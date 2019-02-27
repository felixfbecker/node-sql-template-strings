'use strict'

/**
 * @param {string[]} strings
 * @param {...any} values
 * @returns {SQLStatement}
 */
const SQL = (tpl, ...values) => {
  const strings = tpl.slice(0)
  return {
    // Accessors

    /** Returns values for Sequelize */
    get bind() {
      return this.bound ? values : void 0
    },

    /** Returns the SQL Statement for Sequelize */
    get query() {
      return this.bound ? this.text : this.sql
    },

    /** Returns the SQL Statement for mysql */
    get sql() {
      return strings.join('?')
    },

    /** Returns the SQL Statement for node-postgres */
    get text() {
      return strings.reduce((p, c, i) => `${p}$${i}${c}`)
    },

    /** Returns values for others */
    get values() {
      return this.bound ? void 0 : values
    },

    // Methods

    /**
     * @param {SQLStatement|string} statement
     * @returns {this}
     */
    append(statement) {
      if (typeof statement === 'string') {
        strings[strings.length - 1] += statement
      } else {
        strings[strings.length - 1] += statement.strings[0]
        strings.push(...statement.strings.slice(1))
        values.push(...statement.values)
      }
      return this
    },

    /**
     * @param {string} name
     * @returns {this}
     */
    setName(name) {
      this.name = name
      return this
    },

    /**
     * Use a prepared statement with Sequelize.
     * Makes `query` return a query with `$n` syntax instead of `?` and
     * uses `bind` instead of `values`
     * @param {boolean} [bound=true] bound If omitted, defaults to `true`
     * @returns this
     */
    useBind(bound = true) {
      this.bound = bound
      return this
    },

    // Properties

    /** Default bound value as false */
    bound: false,

    /** Default name as empty string */
    name: '',

    /** Initial strings */
    strings,
  }
}

module.exports = SQL
module.exports.SQL = SQL
module.exports.default = SQL
