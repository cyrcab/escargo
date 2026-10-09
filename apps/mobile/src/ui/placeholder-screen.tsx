import { colors, spacing, typography } from '@escargo/design-tokens';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function PlaceholderScreen({ title }: { title: string }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }}>
      <View style={{ padding: spacing['5'] }}>
        <Text style={{ ...typography['title-xl'], color: colors.ink }}>{title}</Text>
      </View>
    </SafeAreaView>
  );
}
