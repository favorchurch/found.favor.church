import assert from 'node:assert/strict';
import test from 'node:test';
import { isAdmin } from '../src/utils/admin.ts';

test('recognized Favor domain is authorized', () => {
  assert.equal(isAdmin('staff@favor.church'), true);
});

test('domain check is case insensitive', () => {
  assert.equal(isAdmin('Staff@FAVOR.CHURCH'), true);
});

test('other domains and lookalike suffixes are not authorized', () => {
  assert.equal(isAdmin('staff@example.com'), false);
  assert.equal(isAdmin('staff@sub.favor.church'), false);
  assert.equal(isAdmin('staff@favor.church.evil.example'), false);
});

test('missing identities cannot be administrators', () => {
  assert.equal(isAdmin(null), false);
  assert.equal(isAdmin(undefined), false);
  assert.equal(isAdmin(''), false);
});
