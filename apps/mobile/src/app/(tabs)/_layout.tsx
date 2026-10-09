import { colors } from '@escargo/design-tokens';
import { Tabs } from 'expo-router';

// Barre d'onglets du design system : blanche, bordure haute `line`, onglet actif `orange-strong`.
// TODO : icônes Lucide au trait + rebond de l'onglet choisi.
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors['orange-strong'],
        tabBarInactiveTintColor: colors['ink-soft'],
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.line },
        sceneStyle: { backgroundColor: colors.cream },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Accueil' }} />
      <Tabs.Screen name="trajets" options={{ title: 'Trajets' }} />
      <Tabs.Screen name="classements" options={{ title: 'Classements' }} />
      <Tabs.Screen name="badges" options={{ title: 'Badges' }} />
    </Tabs>
  );
}
