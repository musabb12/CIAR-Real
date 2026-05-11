'use client';

import { useMemo, type ComponentProps, type ComponentType } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

/** Runtime MapContainer props are valid; local `leaflet` / `react-leaflet` typings omit inherited `MapOptions` fields in strict mode. */
const MapRoot = MapContainer as ComponentType<ComponentProps<typeof MapContainer> & Record<string, unknown>>;
const Tiles = TileLayer as ComponentType<ComponentProps<typeof TileLayer> & Record<string, unknown>>;

function MapClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

const DEFAULT_CENTER: [number, number] = [24.7136, 46.6753];

export function PropertyAdminMapPicker({
  latitude,
  longitude,
  onPick,
  height = 220,
  helperText,
}: {
  latitude: string;
  longitude: string;
  onPick: (lat: number, lng: number) => void;
  height?: number;
  /** Optional one-line helper; map uses dark tiles to match the admin UI. */
  helperText?: string;
}) {
  const latN = latitude ? parseFloat(latitude) : NaN;
  const lngN = longitude ? parseFloat(longitude) : NaN;
  const hasPin = Number.isFinite(latN) && Number.isFinite(lngN);

  const center = useMemo((): [number, number] => {
    if (hasPin) return [latN, lngN];
    return DEFAULT_CENTER;
  }, [hasPin, latN, lngN]);

  return (
    <div className="space-y-2">
      {helperText ? (
        <p className="text-[11px] text-[var(--admin-text-faint)] leading-snug">{helperText}</p>
      ) : null}
      <div
        className="rounded-xl overflow-hidden border border-[var(--admin-border-strong)] bg-[#0d1117] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
        style={{ height }}
      >
        <MapRoot
          key={hasPin ? `${latN.toFixed(5)}-${lngN.toFixed(5)}` : 'no-pin'}
          center={center}
          zoom={hasPin ? 15 : 6}
          scrollWheelZoom
          style={{ height: '100%', width: '100%', background: '#0d1117' }}
          className="z-0 [&_.leaflet-control-attribution]:!text-[10px] [&_.leaflet-control-attribution]:!bg-black/50 [&_.leaflet-control-attribution]:!text-white/50"
        >
          <Tiles
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          <MapClickHandler onPick={onPick} />
          {hasPin && <Marker position={[latN, lngN]} />}
        </MapRoot>
      </div>
    </div>
  );
}
