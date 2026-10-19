import { Alert, Platform } from 'react-native';
import { presentConfirm, type ConfirmRequest } from '../components/ConfirmHost';

/**
 * Destructive-action confirm. Uses the app's own dialog (<ConfirmHost /> in the
 * root layout). Falls back to the platform prompt only if no host is mounted:
 * Alert.alert silently no-ops on web, hence window.confirm there.
 */
export function confirmAction(opts: ConfirmRequest) {
  if (presentConfirm(opts)) return;
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.confirm(`${opts.title}\n\n${opts.message}`)) {
      opts.onConfirm();
    }
    return;
  }
  Alert.alert(opts.title, opts.message, [
    { text: opts.cancelLabel ?? 'Cancel', style: 'cancel' },
    { text: opts.confirmLabel, style: 'destructive', onPress: opts.onConfirm },
  ]);
}
