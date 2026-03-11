import { useApp } from '../../context/AppContext';
import CameraCard from './CameraCard';

export default function CameraGrid() {
  const { cameras } = useApp();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {cameras.map(camera => (
        <CameraCard key={camera.id} camera={camera} />
      ))}
    </div>
  );
}
