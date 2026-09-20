import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { PlusIcon } from './icons';
import { SectionHeader, Txt } from './ui';
import { useAddDayPhoto, useDayPhotos, useDeleteDayPhoto } from '../data/hooks';
import { confirmAction } from '../lib/confirm';
import { errorMessage } from '../lib/errorMessage';
import { colors } from '../theme';

const THUMB = 96;

/**
 * Photo strip for one tracked day — "track memories as well".
 *
 * Photos hang off the day's entry row, so this stays a prompt until the day is
 * saved: without an entry id there is nothing to attach to. Uploading also
 * needs the row to exist for the insert policy's ownership check to pass.
 */
export function DayPhotos({ entryId }: { entryId: string | undefined }) {
  const photos = useDayPhotos(entryId);
  const add = useAddDayPhoto(entryId);
  const remove = useDeleteDayPhoto(entryId);
  const [error, setError] = useState<string | null>(null);

  async function pick(from: 'library' | 'camera') {
    setError(null);
    // Permission is requested at the point of use, not on mount — asking before
    // the user has shown intent is the classic way to get a hard denial.
    const perm =
      from === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      return setError(
        from === 'camera'
          ? 'Camera access is off — you can turn it on in Settings.'
          : 'Photo access is off — you can turn it on in Settings.',
      );
    }

    const opts: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      // Downsize before upload: a modern phone photo is 3–8 MB, which is slow
      // on a poor connection and pointless for a thumbnail strip.
      quality: 0.7,
      exif: false,
    };
    const res =
      from === 'camera'
        ? await ImagePicker.launchCameraAsync(opts)
        : await ImagePicker.launchImageLibraryAsync(opts);
    if (res.canceled || !res.assets?.[0]) return;

    const asset = res.assets[0];
    try {
      await add.mutateAsync({ uri: asset.uri, mimeType: asset.mimeType });
    } catch (e) {
      setError(`Couldn’t add that photo — ${errorMessage(e, 'upload failed.')}`);
    }
  }

  function confirmRemove(photo: { id: string; objectPath: string }) {
    confirmAction({
      title: 'Remove photo?',
      message: 'This deletes it from this day for good.',
      confirmLabel: 'Remove',
      onConfirm: () => {
        remove.mutate(photo, {
          onError: (e) => setError(`Couldn’t remove that — ${errorMessage(e, 'delete failed.')}`),
        });
      },
    });
  }

  if (!entryId) {
    return (
      <View className="mt-6">
        <SectionHeader title="Photos" className="mb-2" />
        <Txt variant="bodyMuted" className="text-sm">
          Save this day first, then you can add photos to it.
        </Txt>
      </View>
    );
  }

  const items = photos.data ?? [];

  return (
    <View className="mt-6">
      <SectionHeader title="Photos" className="mb-2" />
      <Txt variant="bodyMuted" className="text-sm mb-3">
        A few moments from the day — yours only.
      </Txt>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-1">
        <View className="flex-row gap-2 px-1">
          {items.map((p) => (
            <Pressable
              key={p.id}
              onLongPress={() => confirmRemove(p)}
              accessibilityLabel="Photo — long press to remove"
              style={{ width: THUMB, height: THUMB }}
              className="rounded-xl overflow-hidden bg-surface-raised active:opacity-80"
            >
              <Image source={{ uri: p.url }} style={{ width: THUMB, height: THUMB }} />
            </Pressable>
          ))}

          {/* add tile — doubles as the empty state, so there is never a dead row */}
          <Pressable
            onPress={() => pick('library')}
            onLongPress={() => pick('camera')}
            disabled={add.isPending}
            accessibilityLabel="Add a photo — long press for camera"
            style={{ width: THUMB, height: THUMB }}
            className="rounded-xl border border-dashed border-border-strong items-center justify-center active:opacity-70"
          >
            {add.isPending ? (
              <ActivityIndicator color={colors.accent} />
            ) : (
              <>
                <PlusIcon color={colors.accent} />
                <Txt variant="caption" className="mt-1 text-accent">
                  Add
                </Txt>
              </>
            )}
          </Pressable>
        </View>
      </ScrollView>

      {items.length > 0 && (
        <Txt variant="caption" className="mt-2">
          Long press a photo to remove it · long press Add for the camera.
        </Txt>
      )}

      {photos.isError && (
        <Txt variant="body" className="text-slip text-sm mt-2">
          Couldn’t load photos for this day.
        </Txt>
      )}
      {error && (
        <Txt variant="body" className="text-slip text-sm mt-2">
          {error}
        </Txt>
      )}
    </View>
  );
}
