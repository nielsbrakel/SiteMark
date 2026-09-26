import { describe, expect, it } from 'vitest';
import type { MarkId, SiteGroupId } from './ids';
import { formatOptionsRoute, type OptionsRoute, parseOptionsRoute } from './options-route';

const groupId = 'group0000001' as SiteGroupId;
const markId = 'mark00000001' as MarkId;

describe('REQ-OPT-001 hash routes for deep links into the options page', () => {
  it.each<[string, OptionsRoute]>([
    ['/groups/group0000001', { page: 'group', groupId }],
    ['/groups/group0000001/marks/mark00000001', { page: 'mark', groupId, markId }],
    ['/settings', { page: 'settings' }],
    ['/data', { page: 'data' }],
    ['/welcome', { page: 'welcome' }],
  ])('reads %s and writes it back', (text, route) => {
    expect(parseOptionsRoute(text)).toEqual(route);
    expect(formatOptionsRoute(route)).toBe(text);
  });

  it.each([
    '',
    '/',
    'settings',
    '#/settings',
    '/settings/',
    '/Settings',
    '/groups',
    '/groups/',
    '/groups/short',
    '/groups/group0000001/',
    '/groups/group0000001/marks',
    '/groups/group0000001/marks/bad id here',
    '/groups/../../evil',
    '/groups/group0000001?x=1',
    'https://evil.example/',
    '//evil.example/settings',
    '/constructor',
    '/__proto__',
  ])('refuses %j', (text) => {
    expect(parseOptionsRoute(text)).toBeUndefined();
  });
});
