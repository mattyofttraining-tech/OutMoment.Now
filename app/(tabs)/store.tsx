import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { BrandMark, Screen, Text } from '@/components/ui';
import { FirstRunTip } from '@/components/FirstRunTip';
import { EventWorldCard } from '@/features/store/EventWorldCard';
import { EVENT_WORLD_LIST } from '@/data/eventWorlds';
import { useTranslation } from '@/i18n/useTranslation';

export default function StoreScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <View style={{ flex: 1 }}>
      <Screen scroll edges={['top']}>
        <BrandMark variant="badge" style={{ paddingTop: 4 }} />

        <View style={{ paddingTop: 16, paddingBottom: 16 }}>
          <Text variant="largeTitle">{t('store.headline')}</Text>
          <Text variant="callout" dim style={{ marginTop: 4 }}>
            {t('store.subtitle')}
          </Text>
        </View>

        {EVENT_WORLD_LIST.map((world) => (
          <EventWorldCard key={world.type} world={world} onPress={() => router.push(`/book/${world.type}`)} />
        ))}

        <View style={{ alignItems: 'center', paddingVertical: 16 }}>
          <Text variant="caption" dim align="center" style={{ maxWidth: 280 }}>
            {t('store.footer')}
          </Text>
        </View>
      </Screen>

      <FirstRunTip tipKey="store" />
    </View>
  );
}
