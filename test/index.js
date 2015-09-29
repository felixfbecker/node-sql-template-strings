/* global describe, it */
'use strict'
let expect = require('chai').expect
let SQL = require('..')

describe('SQL', function () {
  it('should work with a simple query', function () {
    expect(SQL`SELECT * FROM table`).to.deep.equal({
      sql: 'SELECT * FROM table',
      text: 'SELECT * FROM table',
      values: []
    })
  })
  it('should work with a query with values', function () {
    let value = 1234
    expect(SQL`SELECT * FROM table WHERE column = ${value}`).to.deep.equal({
      sql: 'SELECT * FROM table WHERE column = ?',
      text: 'SELECT * FROM table WHERE column = $1',
      values: [value]
    })
  })
  it('should work with falsy values', function () {
    let value1 = false
    let value2 = null
    expect(SQL`SELECT * FROM table WHERE column1 = ${value1} AND column2 = ${value2}`).to.deep.equal({
      sql: 'SELECT * FROM table WHERE column1 = ? AND column2 = ?',
      text: 'SELECT * FROM table WHERE column1 = $1 AND column2 = $2',
      values: [value1, value2]
    })
  })
  it('should work with a query with raw values', function () {
    let value = 'table'
    expect(SQL`SELECT * FROM ${SQL.raw(value)}`).to.deep.equal({
      sql: 'SELECT * FROM table',
      text: 'SELECT * FROM table',
      values: []
    })
  })
  it('should work with a query with both raw and regular values', function () {
    let table = 'table'
    let column = 'column'
    let value = 'value'
    let order = 'desc'
    expect(SQL`SELECT * FROM ${SQL.raw(table)} WHERE ${column} = ${value} ORDER BY ${column} ${SQL.raw(order)}`).to.deep.equal({
      sql: 'SELECT * FROM table WHERE ? = ? ORDER BY ? desc',
      text: 'SELECT * FROM table WHERE $1 = $2 ORDER BY $3 desc',
      values: [column, value, column]
    })
  })
  it('should accept PG keyword', function () {
    let order = 'desc'
    expect(SQL`SELECT * FROM table ORDER BY blah ${SQL.PG.keyword(order)}`).to.deep.equal({
      sql: 'SELECT * FROM table ORDER BY blah DESC',
      text: 'SELECT * FROM table ORDER BY blah DESC',
      values: []
    })
  })
  it('should accept narrowed PG keyword', function () {
    let order = 'desc'
    expect(SQL`SELECT * FROM table ORDER BY blah ${SQL.PG.keyword(order, ['ASC', 'DESC'])}`).to.deep.equal({
      sql: 'SELECT * FROM table ORDER BY blah DESC',
      text: 'SELECT * FROM table ORDER BY blah DESC',
      values: []
    })
  })
  it('should accept narrowed outside PG keyword', function () {
    let order = 'desc'
    expect(() => SQL`SELECT * FROM table ORDER BY blah ${SQL.PG.keyword(order, ['STRICT', 'REPLACE'])}`).to.throw(SQL.InvalidValue)
  })
  it('should not accept PG non-keyword', function () {
    let order = 'descr'
    expect(() => SQL`SELECT * FROM table ORDER BY blah ${SQL.PG.keyword(order)}`).to.throw(SQL.InvalidValue)
  })
  it('should accept keyword', function () {
    let order = 'desc'
    expect(SQL`SELECT * FROM table ORDER BY blah ${SQL.PG.keyword(order)}`).to.deep.equal({
      sql: 'SELECT * FROM table ORDER BY blah DESC',
      text: 'SELECT * FROM table ORDER BY blah DESC',
      values: []
    })
  })
  it('should accept PG identifier', function () {
    let field = 'ham'
    expect(SQL`SELECT * FROM table WHERE ${SQL.PG.identifier(field)}=1`).to.deep.equal({
      sql: 'SELECT * FROM table WHERE "ham"=1',
      text: 'SELECT * FROM table WHERE "ham"=1',
      values: []
    })
  })
  it('should not accept PG invalid identifier', function () {
    let field = 'ham cheese'
    expect(() => SQL`SELECT * FROM table WHERE ${SQL.PG.identifier(field)}=1`).to.throw(SQL.InvalidValue)
  })
  it('should not accept PG valid excluded identifier', function () {
    let field = 'ham'
    expect(() => SQL`SELECT * FROM table WHERE ${SQL.PG.identifier(field, ['turkey', 'swiss'])}=1`).to.throw(SQL.InvalidValue)
  })
})
