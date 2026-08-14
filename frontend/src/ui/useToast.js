import { useContext } from "react";
import { ToastContext } from "./toastContext";

/**
 * Devuelve `avisar(mensaje, tipo)` donde tipo es "ok" | "error" | "info".
 * Reemplaza a window.alert: no bloquea al mecánico en medio de la carga.
 */
export function useToast() {
  return useContext(ToastContext);
}
