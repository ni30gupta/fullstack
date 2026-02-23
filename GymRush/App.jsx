import React from 'react';
import { StatusBar, View, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, CheckinProvider } from './src/context';
import { RootNavigator } from './src/navigation';
import { COLORS } from './src/constants/theme';

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: 'red', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>Something went wrong!</Text>
          <Text style={{ color: 'white', fontSize: 14, marginTop: 10 }}>{this.state.error?.message}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const App = () => {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <AuthProvider>
          <CheckinProvider>
            <RootNavigator />
          </CheckinProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
};

export default App;
