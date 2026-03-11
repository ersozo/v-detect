import { useAlerts } from '../../hooks/useAlerts';
import NotificationToast from '../common/NotificationToast';

export default function AlertContainer() {
  const { alerts, removeAlert } = useAlerts();

  if (alerts.length === 0) return null;

  return (
    <div className="fixed top-24 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
      {alerts.map((alert) => (
        alert.id && (
          <NotificationToast
            key={alert.id}
            alert={alert}
            onDismiss={() => removeAlert(alert.id)}
          />
        )
      ))}
    </div>
  );
}
