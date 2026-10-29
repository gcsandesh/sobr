import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { BottomSheet } from './BottomSheet';
import { CameraIcon, ImageIcon, TrashIcon } from './icons';
import { Avatar, Card, ListRow, Notice } from './ui';
import { useSession } from '../data/SessionProvider';
import { useAvatarUrl, useRemoveAvatar, useSetAvatar } from '../data/hooks';
import { errorMessage } from '../lib/errorMessage';
import { colors } from '../theme';

/**
 * The avatar, editable: tap it to take a photo or pick one, crop it square in
 * the system cropper, and it's saved. Shows the initials until a photo exists.
 */
export function ProfilePhoto({ size = 84 }: { size?: number }) {
  const { greetingName, avatarPath } = useSession();
  const url = useAvatarUrl();
  const setAvatar = useSetAvatar();
  const removeAvatar = useRemoveAvatar();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busy = setAvatar.isPending || removeAvatar.isPending;

  async function pick(from: 'camera' | 'library') {
    setError(null);
    // asked at the point of use, never on mount
    const perm =
      from === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      return setError(
        from === 'camera'
          ? 'Camera access is off. You can turn it on in your phone’s Settings.'
          : 'Photo access is off. You can turn it on in your phone’s Settings.',
      );
    }
    const opts: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      // the system cropper, locked to a square, runs before we get the image
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
      exif: false,
    };
    const res =
      from === 'camera'
        ? await ImagePicker.launchCameraAsync(opts)
        : await ImagePicker.launchImageLibraryAsync(opts);
    if (res.canceled || !res.assets?.[0]) return;
    setOpen(false);
    try {
      await setAvatar.mutateAsync({ uri: res.assets[0].uri, mimeType: res.assets[0].mimeType });
    } catch (e) {
      setError(`Couldn’t save that photo. ${errorMessage(e, 'Upload failed.')}`);
      setOpen(true);
    }
  }

  return (
    <>
      <Pressable
        onPress={() => {
          setError(null);
          setOpen(true);
        }}
        accessibilityRole="button"
        accessibilityLabel={avatarPath ? 'Change your profile photo' : 'Add a profile photo'}
        className="active:opacity-80"
        disabled={busy}
      >
        <Avatar name={greetingName} size={size} uri={url.data ?? null} />
        {busy ? (
          <View
            className="absolute inset-0 items-center justify-center rounded-full"
            style={{ backgroundColor: 'rgba(22,33,31,0.35)' }}
          >
            <ActivityIndicator color="#FFFFFF" />
          </View>
        ) : null}
        <View
          className="absolute -right-1 -bottom-1 items-center justify-center rounded-full"
          style={{
            width: 32,
            height: 32,
            backgroundColor: colors.accent,
            borderWidth: 3,
            borderColor: colors.card,
          }}
        >
          <CameraIcon color="#FFFFFF" size={15} />
        </View>
      </Pressable>

      <BottomSheet visible={open} onClose={() => setOpen(false)} title="Profile photo">
        {error ? (
          <View className="mb-3">
            <Notice tone="error" title="Something went wrong" message={error} />
          </View>
        ) : null}
        <Card className="py-1 mb-2">
          <ListRow
            icon={<CameraIcon color={colors.accent} size={20} />}
            title="Take a photo"
            onPress={() => pick('camera')}
          />
          <ListRow
            icon={<ImageIcon color={colors.accent} size={20} />}
            title="Choose from your photos"
            onPress={() => pick('library')}
          />
          {avatarPath ? (
            <ListRow
              icon={<TrashIcon color={colors.slip} size={20} />}
              title="Remove photo"
              destructive
              onPress={async () => {
                setError(null);
                try {
                  await removeAvatar.mutateAsync();
                  setOpen(false);
                } catch (e) {
                  setError(errorMessage(e, 'Couldn’t remove the photo.'));
                }
              }}
            />
          ) : null}
        </Card>
      </BottomSheet>
    </>
  );
}
