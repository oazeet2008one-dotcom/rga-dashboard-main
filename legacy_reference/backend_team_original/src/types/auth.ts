// FLOW START: Auth Types (EN)
// จุดเริ่มต้น: Types ของ Auth (TH)

export interface AuthUser {
  id: string;
  tenantId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  isActive: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// FLOW END: Auth Types (EN)
// จุดสิ้นสุด: Types ของ Auth (TH)
