/**
 * @snt/core — platform-agnostic core.
 *
 * Types, design tokens, mock data and Zustand stores. Contains no DOM and no
 * CSS, so a future React Native / Expo app can import all of it and rebuild
 * only the views.
 *
 * Web-only React components live in `@snt/ui`.
 */

export * from './types';
export * from './mock';
export * from './stores';
export * as tokens from './tokens';
