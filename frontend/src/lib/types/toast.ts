export enum ToastType {
  Success = "success",
  Error = "error",
  Warning = "warning",
  Info = "info",
}

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
}
