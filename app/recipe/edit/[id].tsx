import { EditRecipeScreen } from '@/components/screens/edit-recipe-screen';
import { Stack } from 'expo-router';

export default function EditRecipeRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <EditRecipeScreen />
    </>
  );
}
