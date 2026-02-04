export interface BrevoEmailAddress {
  email: string;
  name?: string;
}

export interface BrevoSendEmailPayload {
  to: BrevoEmailAddress[];
  templateId: number;
  params?: Record<string, string | number>;
  sender?: BrevoEmailAddress;
}

export interface BrevoSendEmailResponse {
  messageId: string;
}
