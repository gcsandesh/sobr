import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { BottomSheet } from './BottomSheet';
import { PlusIcon } from './icons';
import { Button, SectionHeader, Txt } from './ui';
import {
  useAddDayPhoto,
  useDayPhotos,
  useDeleteDayPhoto,
  useUpdateDayPhotoCaption,
} from '../data/hooks';
import { errorMessage } from '../lib/errorMessage';
import { colors } from '../theme';

const THUMB = 96;

type Photo = { id: string; url: string; objectPath: string; caption: string | null };

/**
 * Photo strip for one tracked day — "track memories as well".
 *
 * Photos hang off the day's entry row, so this stays a prompt until the day is
 * saved: without an entry id there is nothing to attach to, and the insert
 * policy's ownership check needs the parent row to exist.
 */
export function DayPhotos({ entryId }: { entryId: string | undefined }) {
  const photos = useDayPhotos(entryId);
  const add = useAddDayPhoto(entryId);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<Photo | null>(null);

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

    try {
      await add.mutateAsync({ uri: res.assets[0].uri, mimeType: res.assets[0].mimeType });
    } catch (e) {
      setError(`Couldn’t add that photo — ${errorMessage(e, 'upload failed.')}`);
    }
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

  const items = (photos.data ?? []) as Photo[];

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
              onPress={() => setOpen(p)}
              accessibilityLabel={p.caption ?? 'Photo'}
              style={{ width: THUMB, height: THUMB }}
              className="rounded-xl overflow-hidden bg-surface-raised active:opacity-80"
            >
              <Image source={{ uri: p.url }} style={{ width: THUMB, height: THUMB }} />
              {/* a captioned photo gets a quiet marker, so the strip shows which
                  ones carry a note without room for the text itself */}
              {p.caption ? (
                <View
                  className="absolute bottom-1 right-1 w-2 h-2 rounded-full"
                  style={{ backgroundColor: colors.card }}
                />
              ) : null}
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

      <Txt variant="caption" className="mt-2">
        {items.length > 0
          ? 'Tap a photo to add a note or remove it · long press Add for the camera.'
          : 'Long press Add for the camera.'}
      </Txt>

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

      <PhotoSheet entryId={entryId} photo={open} onClose={() => setOpen(null)} />
    </View>
  );
}

/**
 * Detail sheet for one photo: the picture, a caption field, and remove.
 *
 * Remove lives here rather than on the thumbnail — a long-press-only delete is
 * undiscoverable, and a destructive action hidden behind a gesture is the kind
 * people find by accident.
 */
function PhotoSheet({
  entryId,
  photo,
  onClose,
}: {
  entryId: string;
  photo: Photo | null;
  onClose: () => void;
}) {
  const save = useUpdateDayPhotoCaption(entryId);
  const remove = useDeleteDayPhoto(entryId);
  const [caption, setCaption] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Re-seed the field whenever a different photo opens; keying off photo.id
  // avoids one photo's draft leaking into the next.
  useEffect(() => {
    setCaption(photo?.caption ?? '');
    setError(null);
  }, [photo?.id, photo?.caption]);

  if (!photo) return null;

  return (
    <BottomSheet visible={!!photo} onClose={onClose} title="Photo">
      <Image
        source={{ uri: photo.url }}
        style={{ width: '100%', height: 260, borderRadius: 16 }}
        resizeMode="cover"
      />

      <Txt variant="label" className="mt-4 mb-2">
        A note about this moment
      </Txt>
      <TextInput
        value={caption}
        onChangeText={setCaption}
        placeholder="Where were you? Who with?"
        placeholderTextColor={colors.textFaint}
        multiline
        maxLength={280}
        className="bg-surface border border-border rounded-xl px-4 py-3 text-text font-sans text-base min-h-[80px]"
      />

      {error && (
        <Txt variant="body" className="text-slip text-sm mt-2">
          {error}
        </Txt>
      )}

      <Button
        label="Save note"
        className="mt-4"
        loading={save.isPending}
        onPress={() =>
          save.mutate(
            { id: photo.id, caption },
            {
              onSuccess: onClose,
              onError: (e) => setError(`Couldn’t save — ${errorMessage(e, 'try again.')}`),
            },
          )
        }
      />
      <Button
        label="Remove photo"
        tone="ghost"
        className="mt-2"
        loading={remove.isPending}
        onPress={() =>
          remove.mutate(
            { id: photo.id, objectPath: photo.objectPath },
            {
              onSuccess: onClose,
              onError: (e) => setError(`Couldn’t remove — ${errorMessage(e, 'try again.')}`),
            },
          )
        }
      />
    </BottomSheet>
  );
}
