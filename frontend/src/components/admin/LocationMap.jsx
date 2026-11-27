'use client';
// Google Map: one bubble per district with the number of members living there.
// Only counts are shown — no member names or details.
import { useState } from 'react';
import { APIProvider, Map, AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps';

const BANGLADESH_CENTER = { lat: 23.7, lng: 90.35 };

export default function LocationMap({ districts = [] }) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [active, setActive] = useState(null);

  if (!apiKey) {
    return (
      <div className="grid h-[460px] place-items-center rounded-2xl border bg-slate-50 p-6 text-center text-sm text-slate-500">
        Google Maps is not configured. Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to the frontend .env file.
      </div>
    );
  }

  const max = Math.max(1, ...districts.map((d) => d.count));
  const withMembers = districts.filter((d) => d.count > 0);
  const selected = withMembers.find((d) => d.name === active);

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        className="h-[460px] w-full rounded-2xl"
        defaultCenter={BANGLADESH_CENTER}
        defaultZoom={7}
        gestureHandling="cooperative"
        disableDefaultUI={false}
        mapId={process.env.NEXT_PUBLIC_GOOGLE_MAP_ID || 'DEMO_MAP_ID'}
      >
        {withMembers.map((d) => {
          const size = 34 + 40 * Math.sqrt(d.count / max);
          return (
            <AdvancedMarker key={d.name} position={{ lat: d.lat, lng: d.lng }} onClick={() => setActive(d.name)}>
              <div
                style={{ width: size, height: size }}
                className="grid place-items-center rounded-full border-2 border-white bg-emerald-600/80 text-xs font-extrabold text-white shadow-lg"
              >
                {d.count}
              </div>
            </AdvancedMarker>
          );
        })}
        {selected && (
          <InfoWindow position={{ lat: selected.lat, lng: selected.lng }} onCloseClick={() => setActive(null)}>
            <div className="text-sm">
              <b>{selected.name}</b> · {selected.division}
              <div>{selected.count} member{selected.count === 1 ? '' : 's'}</div>
            </div>
          </InfoWindow>
        )}
      </Map>
    </APIProvider>
  );
}
