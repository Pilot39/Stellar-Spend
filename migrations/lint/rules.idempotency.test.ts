import { describe, it, expect } from 'vitest';
import { findNonIdempotentStatements } from './rules';

describe('findNonIdempotentStatements', () => {
  it('flags new migrations that create tables or indexes without IF NOT EXISTS', () => {
    const sql = 'CREATE TABLE foo (id INT);\nCREATE INDEX idx_foo ON foo(id);';
    expect(findNonIdempotentStatements(30, sql)).toEqual([
      'CREATE TABLE without IF NOT EXISTS',
      'CREATE INDEX without IF NOT EXISTS',
    ]);
  });

  it('accepts idempotent statements', () => {
    const sql = 'CREATE TABLE IF NOT EXISTS foo (id INT);\nCREATE UNIQUE INDEX IF NOT EXISTS u ON foo(id);';
    expect(findNonIdempotentStatements(30, sql)).toEqual([]);
  });

  it('ignores commented-out statements', () => {
    expect(findNonIdempotentStatements(30, '-- CREATE TABLE foo (id INT);')).toEqual([]);
  });

  it('leaves grandfathered migrations alone', () => {
    expect(findNonIdempotentStatements(6, 'CREATE TABLE foo (id INT);')).toEqual([]);
  });
});
