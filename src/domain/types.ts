export type Category = {
  id: string;
  name: string;
  color: string;
  description: string;
  isActive: boolean;
};

export type Rule = {
  id: string;
  name: string;
  priority: number;
  isActive: boolean;
  matchMode: "all" | "any";
  senderContains: string;
  subjectContains: string;
  bodyContains: string;
  hasAttachments: boolean | null;
  categoryId: string;
  categoryName: string;
  stopProcessing: boolean;
};

export type Mailbox = {
  id: string;
  name: string;
  emailAddress: string;
  credentialId: string;
  credentialName: string;
  monitorEnabled: boolean;
  folder: string;
  pollingMinutes: number;
  status: string;
  lastCheckedAt: string | null;
};

export type Credential = {
  id: string;
  name: string;
  tenantId: string;
  clientId: string;
  graphBaseUrl: string;
  authorityHost: string;
  status: string;
  lastVerifiedAt: string | null;
};

export type MessageForClassification = {
  id: string;
  subject: string;
  bodyPreview: string;
  sender: string;
  hasAttachments: boolean;
  internetMessageId?: string;
};
