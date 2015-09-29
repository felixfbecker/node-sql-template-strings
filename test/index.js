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
})
