import { useApp } from '../context/AppContext';

/**
 * useAlerts - Hook to access global alert state.
 * Shared via AppContext to prevent multiple WebSocket connections.
 */
export function useAlerts() {
  const { alerts, activeAlerts, removeAlert } = useApp();
  return { alerts, activeAlerts, removeAlert };
}
