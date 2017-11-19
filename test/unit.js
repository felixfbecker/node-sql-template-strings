'use strict'
let assert = require('assert')
let SQL = require('..')
let RAW = SQL.RAW

describe('SQL', () => {

  it('should work with a simple query', () => {
    const query = SQL`SELECT * FROM table`
    assert.equal(query.sql, 'SELECT * FROM table')
    assert.equal(query.text, 'SELECT * FROM table')
    assert.equal(query.query, 'SELECT * FROM table')
    assert.deepEqual(query.values, [])
  })

  it('should work with a query with values', () => {
    const value = 1234
    const query = SQL`SELECT * FROM table WHERE column = ${value}`
    assert.equal(query.sql, 'SELECT * FROM table WHERE column = ?')
    assert.equal(query.query, 'SELECT * FROM table WHERE column = ?')
    assert.equal(query.text, 'SELECT * FROM table WHERE column = $1')
    assert.deepEqual(query.values, [value])
  })

  it('should work with falsy values', () => {
    const value1 = false
    const value2 = null
    const query = SQL`SELECT * FROM table WHERE column1 = ${value1} AND column2 = ${value2}`
    assert.equal(query.sql, 'SELECT * FROM table WHERE column1 = ? AND column2 = ?')
    assert.equal(query.query, 'SELECT * FROM table WHERE column1 = ? AND column2 = ?')
    assert.equal(query.text, 'SELECT * FROM table WHERE column1 = $1 AND column2 = $2')
    assert.deepEqual(query.values, [value1, value2])
  })

  it('should expose "sql" as an enumerable property', () => {
    const query = SQL`SELECT * FROM table`
    for (const key in query) {
      if (key === 'sql') {
        return
      }
    }
    throw new assert.AssertionError({message: 'expected enumerable property "sql"'})
  })

  describe('SQLStatement values', () => {

    it('should substitute SQLStatements', () => {
      const value = 1234
      const where = SQL`1=1`
      const query = SQL`SELECT * FROM table column1 = ${value} AND ${where}`
      assert.equal(query.sql, 'SELECT * FROM table column1 = ? AND 1=1')
      assert.equal(query.query, 'SELECT * FROM table column1 = ? AND 1=1')
      assert.equal(query.text, 'SELECT * FROM table column1 = $1 AND 1=1')
      assert.deepEqual(query.values, [value])
    })

    it('should work with values after', () => {
      const value1 = 1234
      const value2 = 4321
      const where = SQL`column2 = ${value2}`
      const query = SQL`SELECT * FROM table column1 = ${value1} AND ${where}`
      assert.equal(query.sql, 'SELECT * FROM table column1 = ? AND column2 = ?')
      assert.equal(query.query, 'SELECT * FROM table column1 = ? AND column2 = ?')
      assert.equal(query.text, 'SELECT * FROM table column1 = $1 AND column2 = $2')
      assert.deepEqual(query.values, [value1, value2])
    })

    it('should work with values before', () => {
      const value1 = 1234
      const value2 = 4321
      const where = SQL`column2 = ${value2}`
      const query = SQL`SELECT * FROM table ${where} AND column1 = ${value1}`
      assert.equal(query.sql, 'SELECT * FROM table column2 = ? AND column1 = ?')
      assert.equal(query.query, 'SELECT * FROM table column2 = ? AND column1 = ?')
      assert.equal(query.text, 'SELECT * FROM table column2 = $1 AND column1 = $2')
      assert.deepEqual(query.values, [value2, value1])
    })

    it('should work with a bound statement as the input', () => {
      const value1 = 1234
      const value2 = 4321
      const where = SQL`column2 = ${value2}`.useBind(true)
      const query = SQL`SELECT * FROM table column1 = ${value1} AND ${where}`
      assert.equal(query.sql, 'SELECT * FROM table column1 = ? AND column2 = ?')
      assert.equal(query.query, 'SELECT * FROM table column1 = ? AND column2 = ?')
      assert.equal(query.text, 'SELECT * FROM table column1 = $1 AND column2 = $2')
      assert.deepEqual(query.values, [value1, value2])
    })

  })


  describe('append()', () => {

    it('should return this', () => {
      const query = SQL`SELECT * FROM table`
      assert.strictEqual(query, query.append('whatever'))
    })

    it('should append a second SQLStatement', () => {
      const value1 = 1234
      const value2 = 5678
      const query = SQL`SELECT * FROM table WHERE column = ${value1}`.append(SQL` AND other_column = ${value2}`)
      assert.equal(query.sql, 'SELECT * FROM table WHERE column = ? AND other_column = ?')
      assert.equal(query.text, 'SELECT * FROM table WHERE column = $1 AND other_column = $2')
      assert.deepEqual(query.values, [value1, value2])
    })

    it('should append a string', () => {
      const value = 1234
      const query = SQL`SELECT * FROM table WHERE column = ${value}`.append(' ORDER BY other_column')
      assert.equal(query.sql, 'SELECT * FROM table WHERE column = ? ORDER BY other_column')
      assert.equal(query.text, 'SELECT * FROM table WHERE column = $1 ORDER BY other_column')
      assert.deepEqual(query.values, [value])
    })

    it('should append a RAW string', () => {
      const value = 1234
      const query = SQL`SELECT * FROM table WHERE column = ${value}`.append(RAW(' ORDER BY other_column'))
      assert.equal(query.sql, 'SELECT * FROM table WHERE column = ? ORDER BY other_column')
      assert.equal(query.text, 'SELECT * FROM table WHERE column = $1 ORDER BY other_column')
      assert.deepEqual(query.values, [value])
    })

    it('should work on a bound statement', () => {
      const value = 1234
      const statement = SQL`SELECT * FROM table WHERE column = ${value}`.useBind(true).append(' ORDER BY other_column')
      assert.equal(statement.sql, 'SELECT * FROM table WHERE column = ? ORDER BY other_column')
      assert.equal(statement.text, 'SELECT * FROM table WHERE column = $1 ORDER BY other_column')
      assert.strictEqual(statement.query, 'SELECT * FROM table WHERE column = $1 ORDER BY other_column')
      assert.strictEqual(statement.values, undefined)
      assert.strictEqual('values' in statement, false)
      assert.deepStrictEqual(statement.bind, [1234])
    })

    it('should work with a bound statement as the input', () => {
      const value1 = 1234
      const value2 = 4321
      const where = SQL`column2 = ${value2}`.useBind(true)
      const query = SQL`SELECT * FROM table column1 = ${value1} AND `.append(where)
      assert.equal(query.sql, 'SELECT * FROM table column1 = ? AND column2 = ?')
      assert.equal(query.query, 'SELECT * FROM table column1 = ? AND column2 = ?')
      assert.equal(query.text, 'SELECT * FROM table column1 = $1 AND column2 = $2')
      assert.deepEqual(query.values, [value1, value2])
    })

  })

  describe('setName()', () => {

    it('should set the name and return this', () => {
      assert.equal(SQL`SELECT * FROM table`.setName('my_query').name, 'my_query')
    })
  })

  describe('useBind()', () => {

    it('should change query to $n syntax and swap values with bind', () => {
      const value = 123
      const statement = SQL`SELECT * FROM table WHERE column = ${value}`.useBind(true)
      assert.strictEqual(statement.query, 'SELECT * FROM table WHERE column = $1')
      assert.strictEqual(statement.values, undefined)
      assert.strictEqual('values' in statement, false)
      assert.deepStrictEqual(statement.bind, [123])
    })

    it('should allow to omit the parameter', () => {
      const value = 123
      const statement = SQL`SELECT * FROM table WHERE column = ${value}`.useBind()
      assert.strictEqual(statement.query, 'SELECT * FROM table WHERE column = $1')
      assert.strictEqual(statement.values, undefined)
      assert.strictEqual('values' in statement, false)
      assert.deepStrictEqual(statement.bind, [123])
    })

    it('should be idempotent', () => {
      const value = 123
      const statement = SQL`SELECT * FROM table WHERE column = ${value}`.useBind(true).useBind(true)
      assert.strictEqual(statement.query, 'SELECT * FROM table WHERE column = $1')
      assert.strictEqual(statement.values, undefined)
      assert.strictEqual('values' in statement, false)
      assert.deepStrictEqual(statement.bind, [123])
    })

    it('should be reversable', () => {
      const value = 123
      const statement = SQL`SELECT * FROM table WHERE column = ${value}`.useBind(true).useBind(false)
      assert.strictEqual(statement.query, 'SELECT * FROM table WHERE column = ?')
      assert.strictEqual(statement.bind, undefined)
      assert.strictEqual('bind' in statement, false)
      assert.deepStrictEqual(statement.values, [123])
    })
  })

  describe('RAW', () => {
    it('should accept a string', () => {
      const raw = RAW('SELECT * FROM table')
      assert.strictEqual(raw.value, 'SELECT * FROM table')
    })

    it('should work as a template function', () => {
      const ins = 1234
      const value = `SELECT * FROM table WHERE column=${ins}`
      const raw = RAW`SELECT * FROM table WHERE column=${ins}`
      assert.strictEqual(raw.value, value)
    })   

    it('should return its value from toString()', () => {
      const str = 'SELECT * FROM table'
      const raw = RAW(str)
      assert.strictEqual('' + raw, str)
      assert.equal(raw, str)
    })
  })
})
