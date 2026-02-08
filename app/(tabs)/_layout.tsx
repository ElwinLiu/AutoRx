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
      <NativeTabs.Trigger name="settings">
        <Label>Settings</Label>
        <Icon
          sf={{ default: 'gear', selected: 'gear.fill' }}
          androidSrc={<VectorIcon family={MaterialIcons} name="settings" />}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
