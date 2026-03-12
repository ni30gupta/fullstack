
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import QRScanner from '../screens/common/QRScanner';
import BodyPartActivitiesScreen from '../screens/main/BodyPartActivitiesScreen';
import { ProfileScreen } from '../screens/main/ProfileScreen';
import { EditProfileScreen } from '../screens/main/EditProfileScreen';
import { MembershipScreen } from '../screens/main/MembershipScreen';
import { useAuth } from '../hooks';
import { Loading } from '../components';
import { COLORS } from '../constants/theme';

const Stack = createNativeStackNavigator();

export const RootNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <Loading fullScreen message="Loading..." />;
  }

  return (
    <NavigationContainer
      theme={{
        dark: true,
        colors: {
          primary: COLORS.primary,
          background: COLORS.background,
          card: COLORS.card,
          text: COLORS.text,
          border: COLORS.border,
          notification: COLORS.primary,
        },
        // Ensure fonts object exists so native-stack doesn't throw when
        // accessing properties like `fonts.regular`.
        fonts: {
          regular: {},
          medium: {},
          heavy: {},
          bold: {},
        },
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false, gestureEnabled: true }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Main" component={MainNavigator} />
            <Stack.Screen name="QRScanner" component={QRScanner} />
            <Stack.Screen name="BodyPartActivities" component={BodyPartActivitiesScreen} />
            {/* include Profile */}
            {/* root-level profile screen; name unique to avoid tab collision */}
            <Stack.Screen name="ProfileRoot" component={ProfileScreen} />
            <Stack.Screen 
              name="EditProfile" 
              component={EditProfileScreen}
              options={{ gestureEnabled: true, animation: 'slide_from_right' }}
            />
            <Stack.Screen 
              name="Membership"
              component={MembershipScreen}
              options={{ gestureEnabled: true, animation: 'slide_from_right' }}
            />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
