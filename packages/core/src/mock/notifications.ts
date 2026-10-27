/**
 * Mock notifications: Tarisai's (the signed in person) and Kopje Computers'
 * (the shop in the console), newest first. Each points at something already
 * in the mock: an offer, a deal check, a lead.
 */

import type { AppNotification } from '../types/notification';

export const mockNotifications: AppNotification[] = [
  // --- Tarisai -------------------------------------------------------------
  {
    id: 'n-u1',
    audience: 'user',
    kind: 'offer',
    text: 'Chipo N. made an offer on your MacBook Air 2017 swap',
    atLabel: '1h ago',
    href: '/me/offers',
    read: false,
  },
  {
    id: 'n-u2',
    audience: 'user',
    kind: 'deal',
    text: 'Rudo K. says your MacBook Air 2017 swap went through. Is that right?',
    atLabel: '3h ago',
    href: '/deals/dc-4/confirm',
    read: false,
  },
  {
    id: 'n-u3',
    audience: 'user',
    kind: 'deal',
    text: 'Did you buy the Lenovo ThinkPad T480 from Kopje Computers?',
    atLabel: 'Yesterday',
    href: '/deals/dc-1/confirm',
    read: false,
  },
  {
    id: 'n-u4',
    audience: 'user',
    kind: 'listing',
    text: 'Your PS5 controller Wanted listing expires in 3 days',
    atLabel: '2 days ago',
    href: '/listing/wanted-ps5-controller-mt-pleasant-8e55',
    read: true,
  },
  {
    id: 'n-u5',
    audience: 'user',
    kind: 'saved',
    text: 'The iPhone 12 64GB you saved is no longer available',
    atLabel: '4 days ago',
    href: '/saved',
    read: true,
  },
  {
    id: 'n-u6',
    audience: 'user',
    kind: 'offer-reply',
    text: 'Blessing T. accepted your offer on the GTX 1650 swap',
    atLabel: 'Last week',
    href: '/me/offers',
    read: true,
  },
  {
    id: 'n-u7',
    audience: 'user',
    kind: 'deal',
    text: 'Deal confirmed with Avondale Games. It now counts on your record.',
    atLabel: 'Last week',
    href: '/me/deals',
    read: true,
  },

  // --- Kopje Computers -------------------------------------------------------
  {
    id: 'n-s1',
    audience: 'shop',
    kind: 'lead',
    text: 'New lead: Tarisai M. wants Any Core i7. Matches your Dell Latitude 7490.',
    atLabel: '12 minutes ago',
    href: '/console/leads',
    read: false,
  },
  {
    id: 'n-s2',
    audience: 'shop',
    kind: 'offer',
    text: 'Chipo N. made an offer on your Lenovo ThinkPad T480',
    atLabel: '1h ago',
    href: '/console/trade-ins',
    read: false,
  },
  {
    id: 'n-s3',
    audience: 'shop',
    kind: 'deal',
    text: 'Farai D. says they bought your HP EliteBook 840 G5. Is that right?',
    atLabel: '3 days ago',
    href: '/deals/dc-8/confirm',
    read: false,
  },
  {
    id: 'n-s7',
    audience: 'shop',
    kind: 'sponsor',
    text: 'Your Dell Latitude 7490 sponsorship ends in 7 days. Extend it from Stats.',
    atLabel: 'Today',
    href: '/console/stats',
    read: true,
  },
  {
    id: 'n-s4',
    audience: 'shop',
    kind: 'offer-reply',
    text: 'Rudo K. accepted your offer on their Redmi Note 12 Wanted listing',
    atLabel: 'Yesterday',
    href: '/console/trade-ins',
    read: true,
  },
  {
    id: 'n-s5',
    audience: 'shop',
    kind: 'reveal',
    text: 'This week: 49 number reveals, up 17% on last week',
    atLabel: '2 days ago',
    href: '/console/stats',
    read: true,
  },
  {
    id: 'n-s6',
    audience: 'shop',
    kind: 'account',
    text: 'Your lead alerts renew in 3 days, at $10 a month',
    atLabel: '4 days ago',
    href: '/console/leads',
    read: true,
  },
];
