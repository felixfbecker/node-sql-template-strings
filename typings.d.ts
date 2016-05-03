
declare class SQLStatement {

  private strings: string[]

  /** The SQL Statement for node-postgres */
  text: string

  /** The SQL Statement for mysql */
  sql: string

  /** The values to be inserted for the placeholders */
  values: any[]

  /** The name for postgres prepared statements, if set */
  name: string

  /** Appends a string or another statement */
  append(statement: SQLStatement|string|number): this

  /** Sets the name property of this statement for prepared statements in postgres */
  setName(name: string): this
}

/** Template string tag */
export default function SQL(strings: string[], values: any[]): SQLStatement
