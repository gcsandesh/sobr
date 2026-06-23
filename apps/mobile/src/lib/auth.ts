import { Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import { getQueryParams } from 'expo-auth-session/build/QueryParams';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from './supabase';

// Lets the auth popup/redirect complete and dismiss cleanly.
WebBrowser.maybeCompleteAuthSession();

/**
 * Where the OAuth provider sends the user back. On web this is the page origin;
 * on native it's the app's "sobr://auth-callback" deep link. Both must be added
 * to the Supabase project's allowed redirect URLs.
 */
const redirectTo = AuthSession.makeRedirectUri({ scheme: 'sobr', path: 'auth-callback' });

/** Turn the redirect URL (PKCE code, or implicit tokens) into a Supabase session. */
export async function completeSessionFromUrl(url: string): Promise<void> {
  const { params, errorCode } = getQueryParams(url);
  if (errorCode) throw new Error(errorCode);

  if (params.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (error) throw error;
    return;
  }
  if (params.access_token) {
    const { error } = await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token ?? '',
    });
    if (error) throw error;
  }
}

/**
 * Google sign-in via Supabase OAuth.
 *  - Web: navigate to the provider; Supabase's detectSessionInUrl finishes it on return.
 *  - Native: open an in-app auth session and exchange the returned code for a session.
 *    (Native needs a custom dev build — the "sobr://" redirect doesn't work in Expo Go.)
 */
export async function signInWithGoogle(): Promise<void> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw error;
  if (!data?.url) throw new Error('Could not start Google sign-in.');

  if (Platform.OS === 'web') {
    window.location.href = data.url;
    return;
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type === 'success') {
    await completeSessionFromUrl(result.url);
  }
}
