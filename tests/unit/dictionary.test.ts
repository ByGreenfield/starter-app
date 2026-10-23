import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { gaps, newestSnapshot } from '../../scripts/check-dictionary.mjs';

describe('data dictionary', () => {
  it('covers every table and column in the schema', () => {
    const dictionary = parse(readFileSync('data/dictionary.yaml', 'utf8'));
    expect(gaps(dictionary, newestSnapshot())).toEqual([]);
  });

  it('reports what is missing', () => {
    const dictionary = { version: 1, tables: { customers: { columns: { id: {} } } } };
    const snapshot = {
      tables: {
        'public.customers': {
          name: 'customers',
          schema: '',
          columns: { id: { name: 'id' }, email: { name: 'email' } },
        },
        'public.orders': { name: 'orders', schema: '', columns: { id: { name: 'id' } } },
      },
    };
    expect(gaps(dictionary, snapshot)).toEqual(['customers.email', 'orders']);
  });
});
