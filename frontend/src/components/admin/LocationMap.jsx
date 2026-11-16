'use client';
// Bubble map of members per district. Bubble size grows with the member count.
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';

const BANGLADESH_CENTER = [23.7, 90.35];

export default function LocationMap({ districts = [] }) {
  const max = Math.max(1, ...districts.map((d) => d.count));
  const withMembers = districts.filter((d) => d.count > 0);

  return (
    <MapContainer center={BANGLADESH_CENTER} zoom={7} scrollWheelZoom={false} className="h-[460px] w-full rounded-2xl z-0">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {withMembers.map((d) => (
        <CircleMarker
          key={d.name}
          center={[d.lat, d.lng]}
          radius={6 + 22 * Math.sqrt(d.count / max)}
          pathOptions={{ color: '#176b43', fillColor: '#22c55e', fillOpacity: 0.55, weight: 1 }}
        >
          <Tooltip>
            <b>{d.name}</b> · {d.division}: {d.count} member{d.count === 1 ? '' : 's'}
          </Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
