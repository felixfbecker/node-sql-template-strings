const SQL = require('../..')
const Sequelize = require('sequelize')
const assert = require('assert')

describe('sequelize', () => {
  it('should work with a simple query', () => {
    const sequelize = new Sequelize(process.env.PG_CONN, { logging: false })
    return sequelize.query(SQL`SELECT ${1} + 1 as result`, { type: Sequelize.QueryTypes.SELECT }).then(rows => {
      assert.equal(rows[0].result, 2)
    })
  })
  it('should work with a bound statement', () => {
    const sequelize = new Sequelize(process.env.PG_CONN, { logging: false })
    return sequelize
      .query(SQL`SELECT ${1} + 1 as result`.useBind(true), { type: Sequelize.QueryTypes.SELECT })
      .then(rows => {
        assert.equal(rows[0].result, 2)
      })
  })
})
