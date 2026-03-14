import React, { useEffect } from 'react';
import { StatusBar, View, Text, Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, CheckinProvider, NotificationBadgeProvider, NotificationBadgeContext } from './src/context';
import { BodyPartLoadProvider } from './src/hooks/useBodyPartLoad';
import { RootNavigator } from './src/navigation';
import { COLORS } from './src/constants/theme';
import { onForegroundMessage, onNotificationOpenedApp } from './src/services/notifications';

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

const NotificationHandler = () => {
  const { incrementBadge } = React.useContext(NotificationBadgeContext);

  useEffect(() => {
    const unsubscribeForeground = onForegroundMessage(async (remoteMessage) => {
      const category = remoteMessage?.data?.category;
      if (category === 'gym_update') {
        incrementBadge();
        return;
      }

      const title = remoteMessage?.notification?.title;
      const body = remoteMessage?.notification?.body;
      if (title || body) {
        Alert.alert(title ?? 'Notification', body ?? '');
      }
    });

    const unsubscribeOpened = onNotificationOpenedApp((remoteMessage) => {
      const category = remoteMessage?.data?.category;
      if (category === 'gym_update') {
        incrementBadge();
      }
    });

    return () => {
      unsubscribeForeground();
      unsubscribeOpened();
    };
  }, [incrementBadge]);

  return null;
};

const App = () => {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>        
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <AuthProvider>
          <CheckinProvider>
            <NotificationBadgeProvider>
              <BodyPartLoadProvider>
                <NotificationHandler />
                <RootNavigator />
              </BodyPartLoadProvider>
            </NotificationBadgeProvider>
          </CheckinProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
};

export default App;
