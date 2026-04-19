import { describe, expect, it } from 'vitest';
import { LinearClient } from '../core/linear-client.js';

const client = (prefix: string): LinearClient =>
  new LinearClient({ apiKey: 'test-key', issuePrefix: prefix });

describe('LinearClient.parseIssueKey', () => {
  describe('prefix AI', () => {
    const c = client('AI');

    it('matches AI-47 inside prose', () => {
      expect(c.parseIssueKey('Working on AI-47 today')).toBe('AI-47');
    });

    it('matches lowercase ai-47 and returns uppercase', () => {
      expect(c.parseIssueKey('Working on ai-47 today')).toBe('AI-47');
    });

    it('rejects VVD-47 when prefix is AI', () => {
      expect(c.parseIssueKey('See VVD-47 for context')).toBeNull();
    });

    it('rejects MOD-47 when prefix is AI', () => {
      expect(c.parseIssueKey('See MOD-47 for context')).toBeNull();
    });
  });

  describe('prefix VVD', () => {
    const c = client('VVD');

    it('matches VVD-150', () => {
      expect(c.parseIssueKey('issue VVD-150')).toBe('VVD-150');
    });

    it('matches lowercase vvd-150', () => {
      expect(c.parseIssueKey('issue vvd-150')).toBe('VVD-150');
    });

    it('rejects AI-150 when prefix is VVD', () => {
      expect(c.parseIssueKey('issue AI-150')).toBeNull();
    });
  });

  describe('prefix MOD', () => {
    const c = client('MOD');

    it('matches MOD-9', () => {
      expect(c.parseIssueKey('linked: MOD-9')).toBe('MOD-9');
    });

    it('matches lowercase mod-9', () => {
      expect(c.parseIssueKey('linked: mod-9')).toBe('MOD-9');
    });

    it('rejects VVD-9 when prefix is MOD', () => {
      expect(c.parseIssueKey('linked: VVD-9')).toBeNull();
    });
  });

  it('returns null when no issue key is present', () => {
    expect(client('AI').parseIssueKey('nothing to see here')).toBeNull();
  });
});

describe('LinearClient.formatIssueKey', () => {
  it('composes uppercase prefix and number', () => {
    expect(client('AI').formatIssueKey(47)).toBe('AI-47');
  });

  it('works for other prefixes', () => {
    expect(client('VVD').formatIssueKey(150)).toBe('VVD-150');
    expect(client('MOD').formatIssueKey(9)).toBe('MOD-9');
  });
});
