import type { ProviderId, FetchedModel, ModelConfig } from '@/hooks/use-ai';

export type AIConfigSection = 'main' | 'primary' | 'secondary';

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

export type ModelListProps = {
  models: (FetchedModel & { provider: ProviderId })[];
  selectedModel: ModelConfig | null;
  isSaving: boolean;
  onSelect: (model: ModelConfig) => void;
  emptyMessage: string;
};

export type ModelCardProps = {
  model: FetchedModel & { provider: ProviderId };
  isSelected: boolean;
  isDisabled: boolean;
  onPress: () => void;
};
