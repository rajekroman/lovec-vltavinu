export interface InteractableComponent {
  kind: string;
  label: string;
  radius: number;
  enabled: boolean;
  payload?: {
    stoneName?: string;
    baseScore?: number;
    locality?: string;
    siteIndex?: number;
    provenanceDocumented?: boolean;
  };
}
