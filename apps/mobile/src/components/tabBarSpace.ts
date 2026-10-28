import { createContext, useContext } from 'react';

/**
 * The tab bar floats over the content, so tab screens scroll under it. This is
 * how much room the bar takes at the bottom (bar + gap + device inset); 0
 * outside the tabs. Screen pads its scroll content by it, and floating buttons
 * sit above it.
 */
export const TabBarSpaceContext = createContext(0);

export function useTabBarSpace(): number {
  return useContext(TabBarSpaceContext);
}
