const SQL = require('../..')
const pg = require('pg')
const assert = require('assert')

describe('pg', () => {
  it('should work with a simple query', done => {
    const client = new pg.Client(process.env.PG_CONN)
    client.connect(err => {
      if (err) {
        return done(err)
      }
      client.query(SQL`SELECT ${1} + 1 as result`, (err, result) => {
        if (err) {
          return done(err)
        }
        assert.equal(result.rows[0].result, 2)
        done()
      })
    })
  })
  it('should work with a named statement', done => {
    const client = new pg.Client(process.env.PG_CONN)
    client.connect(err => {
      if (err) {
        return done(err)
      }
      client.query(SQL`SELECT ${1} + 1 as result`.setName('my_query'), (err, result) => {
        if (err) {
          return done(err)
        }
        assert.equal(result.rows[0].result, 2)
        done()
      })
    })
  })
})
