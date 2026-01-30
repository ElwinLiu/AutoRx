import { useLocalSearchParams } from 'expo-router';

import { TemplateEditorScreen } from '@/components/screens/template-editor-screen';

export default function TemplateEditorRoute() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const templateId = Array.isArray(id) ? id[0] : id;
  return <TemplateEditorScreen templateId={templateId} />;
}
