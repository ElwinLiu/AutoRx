import React from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { NativeTabs, Icon, Label, VectorIcon } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Label>Recipes</Label>
        <Icon
          sf={{ default: 'book', selected: 'book.fill' }}
          androidSrc={<VectorIcon family={MaterialIcons} name="menu-book" />}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="templates">
        <Label>Templates</Label>
        <Icon
          sf={{ default: 'square.stack.3d.up', selected: 'square.stack.3d.up.fill' }}
          androidSrc={<VectorIcon family={MaterialIcons} name="layers" />}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
