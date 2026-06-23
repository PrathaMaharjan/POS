

export type ControllerResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; status: number };

  
