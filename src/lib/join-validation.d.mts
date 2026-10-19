export type JoinInterest = "academic" | "community" | "both";

export type ValidatedJoinApplication = {
  name: string;
  email: string;
  interest: JoinInterest;
  motivation: string;
};

export type JoinValidationResult =
  | { ok: true; value: ValidatedJoinApplication }
  | { ok: false; error: "invalid_request" | "invalid_fields" };

export function validateJoinApplication(body: unknown): JoinValidationResult;
