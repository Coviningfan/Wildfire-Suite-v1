import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface State { hasError: boolean; error?: Error; }
interface Props { children: React.ReactNode; fallback?: string; }

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error.message, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={s.container}>
          <Text style={s.title}>Something went wrong</Text>
          <Text style={s.desc}>{this.props.fallback ?? 'This section encountered an error.'}</Text>
          <TouchableOpacity style={s.btn} onPress={() => this.setState({ hasError: false })}>
            <Text style={s.btnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const s = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 12, backgroundColor: '#0f172a' },
  title: { fontSize: 18, fontWeight: '700', color: '#ef4444' },
  desc: { fontSize: 14, color: '#94a3b8', textAlign: 'center', lineHeight: 20 },
  btn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', marginTop: 4 },
  btnText: { fontSize: 14, fontWeight: '600', color: '#e2e8f0' },
});
