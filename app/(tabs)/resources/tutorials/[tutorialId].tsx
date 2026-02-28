import React from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, Animated } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { AlertCircle } from 'lucide-react-native';
import { TUTORIALS } from '@/constants/tutorials';

const { width } = Dimensions.get('window');

export default function TutorialDetailScreen() {
  const { tutorialId } = useLocalSearchParams();
  const tutorial = TUTORIALS.find((t) => t.id === tutorialId);

  // Staggered entrance animations for sections
  const animatedValues = React.useRef(
    Array(tutorial?.sections.length || 0)
      .fill(0)
      .map(() => new Animated.Value(0))
  ).current;

  React.useEffect(() => {
    if (tutorial) {
      const animations = animatedValues.map((anim, index) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 500,
          delay: index * 100,
          useNativeDriver: true,
        })
      );
      Animated.stagger(50, animations).start();
    }
  }, [tutorial]);

  if (!tutorial) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Tutorial Not Found' }} />
        <Text style={styles.errorText}>Tutorial not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: tutorial.title,
          headerStyle: { backgroundColor: tutorial.color },
          headerTintColor: '#fff',
        }}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Header */}
        <LinearGradient
          colors={[tutorial.color, `${tutorial.color}CC`]}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>{tutorial.title}</Text>
          <Text style={styles.headerSubtitle}>{tutorial.subtitle}</Text>
        </LinearGradient>

        {/* Safety Warning Card (for specific tutorials) */}
        {(tutorial.id === 'uv-science' || tutorial.id === 'shooting-uv') && (
          <View style={styles.warningCard}>
            <AlertCircle size={20} color="#F59E0B" style={styles.warningIcon} />
            <View style={styles.warningContent}>
              <Text style={styles.warningTitle}>Safety Notice</Text>
              <Text style={styles.warningText}>
                {tutorial.id === 'uv-science'
                  ? 'Always use proper eye protection when working directly with UV light sources. Avoid prolonged skin exposure to intense UV radiation.'
                  : 'UV lighting environments can be disorienting. Ensure clear sight lines and avoid tripping hazards when shooting in darkened UV-lit spaces.'}
              </Text>
            </View>
          </View>
        )}

        {/* Content Sections with Staggered Animation */}
        {tutorial.sections.map((section, index) => {
          const translateY = animatedValues[index].interpolate({
            inputRange: [0, 1],
            outputRange: [30, 0],
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.section,
                {
                  opacity: animatedValues[index],
                  transform: [{ translateY }],
                },
              ]}
            >
              <View
                style={[
                  styles.sectionHeader,
                  { borderLeftColor: tutorial.color },
                ]}
              >
                <Text style={styles.sectionNumber}>{index + 1}</Text>
                <Text style={styles.sectionTitle}>{section.title}</Text>
              </View>
              <Text style={styles.sectionContent}>{section.content}</Text>
            </Animated.View>
          );
        })}

        {/* Footer Spacing */}
        <View style={styles.footer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  warningCard: {
    flexDirection: 'row',
    backgroundColor: '#422006',
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  warningIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FCD34D',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 13,
    color: '#FEF3C7',
    lineHeight: 18,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderLeftWidth: 4,
    paddingLeft: 12,
  },
  sectionNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#64748b',
    marginRight: 12,
    minWidth: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f1f5f9',
    flex: 1,
  },
  sectionContent: {
    fontSize: 15,
    color: '#cbd5e1',
    lineHeight: 24,
  },
  footer: {
    height: 20,
  },
  errorText: {
    color: '#f87171',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
});
