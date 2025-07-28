import toast from "react-hot-toast";

// Re-export cn function from utils/index
export { cn } from "./utils/index";

interface ToastState {
  lastMessage: string;
  lastTimestamp: number;
  debounceMs: number;
}

class ToastManager {
  private state: ToastState = {
    lastMessage: "",
    lastTimestamp: 0,
    debounceMs: 3000, // 3 seconds debounce
  };

  private isDuplicate(message: string): boolean {
    const now = Date.now();
    const timeDiff = now - this.state.lastTimestamp;

    // Tratamento especial removido - agora todas as mensagens seguem o mesmo padrão

    if (
      this.state.lastMessage === message &&
      timeDiff < this.state.debounceMs
    ) {
      return true;
    }

    this.state.lastMessage = message;
    this.state.lastTimestamp = now;
    return false;
  }

  error(message: string): void {
    if (!this.isDuplicate(message)) {
      toast.error(message);
    }
  }

  success(message: string): void {
    if (!this.isDuplicate(message)) {
      toast.success(message);
    }
  }

  warning(message: string): void {
    if (!this.isDuplicate(message)) {
      toast(message, { icon: "⚠️" });
    }
  }

  info(message: string): void {
    if (!this.isDuplicate(message)) {
      toast(message, { icon: "ℹ️" });
    }
  }

  dismiss(): void {
    toast.dismiss();
  }

  clear(): void {
    this.state.lastMessage = "";
    this.state.lastTimestamp = 0;
    toast.dismiss();
  }
}

export const toastManager = new ToastManager();
