export const PLAN_ORDER: Record<"basic" | "standard" | "pro", number> = {
  basic:    1,
  standard: 2,
  pro:      3,
};

export type Plan = keyof typeof PLAN_ORDER;