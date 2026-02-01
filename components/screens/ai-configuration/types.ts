import type { ProviderId } from '@/hooks/use-ai';

export type AIConfigSection = 'main' | 'modelSelection' | 'modelRoleSelection';

export type ProviderItemProps = {
  provider: ProviderId;
  isExpanded: boolean;
  isVerified: boolean;
  isVerifying: boolean;
  apiKey: string;
  verificationError: string | null;
  onToggle: () => void;
  onApiKeyChange: (value: string) => void;
  onVerify: () => void;
  onRemove: () => void;
};

export type ProviderIconProps = {
  provider: ProviderId;
  size?: number;
};
