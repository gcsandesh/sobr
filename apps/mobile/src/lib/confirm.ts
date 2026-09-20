import { Alert, Platform } from 'react-native';

/**
 * Cross-platform destructive-action confirm. Alert.alert silently no-ops on
 * web, which would make destructive buttons appear broken there — fall back
 * to window.confirm.
 */
export function confirmAction(opts: {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
}) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.confirm(`${opts.title}\n\n${opts.message}`)) {
      opts.onConfirm();
    }
    return;
  }
  Alert.alert(opts.title, opts.message, [
    { text: 'Cancel', style: 'cancel' },
    { text: opts.confirmLabel, style: 'destructive', onPress: opts.onConfirm },
  ]);
}
