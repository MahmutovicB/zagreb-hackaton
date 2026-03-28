/** ZagrebBike (Nextbike) stations — key docking points across Zagreb */
export interface BikeStation {
  id: string
  name: string
  lat: number
  lng: number
  bikes: number   // approximate available bikes (mock)
  docks: number   // total docks
}

export const BIKE_STATIONS: BikeStation[] = [
  { id: 'b01', name: 'Trg bana Jelačića',      lat: 45.8128, lng: 15.9777, bikes: 8,  docks: 15 },
  { id: 'b02', name: 'Zrinjevac',              lat: 45.8096, lng: 15.9793, bikes: 5,  docks: 12 },
  { id: 'b03', name: 'Britanski trg',          lat: 45.8178, lng: 15.9640, bikes: 3,  docks: 10 },
  { id: 'b04', name: 'Glavni kolodvor',        lat: 45.8045, lng: 15.9793, bikes: 6,  docks: 15 },
  { id: 'b05', name: 'Savski most',            lat: 45.7902, lng: 15.9560, bikes: 4,  docks: 10 },
  { id: 'b06', name: 'Jarun — jezero',         lat: 45.7891, lng: 15.9308, bikes: 7,  docks: 12 },
  { id: 'b07', name: 'Maksimir — ulaz',        lat: 45.8184, lng: 16.0288, bikes: 2,  docks: 10 },
  { id: 'b08', name: 'Bundek',                 lat: 45.7952, lng: 16.0054, bikes: 5,  docks: 12 },
  { id: 'b09', name: 'Ilica / Frankopanska',   lat: 45.8129, lng: 15.9699, bikes: 4,  docks: 10 },
  { id: 'b10', name: 'KBC Rebro',              lat: 45.8259, lng: 15.9981, bikes: 3,  docks: 8  },
  { id: 'b11', name: 'Sveučilišna aleja',      lat: 45.8150, lng: 16.0350, bikes: 6,  docks: 12 },
  { id: 'b12', name: 'Trnsko (Novi Zagreb)',   lat: 45.7740, lng: 15.9980, bikes: 4,  docks: 10 },
  { id: 'b13', name: 'Črnomerec',              lat: 45.8201, lng: 15.9200, bikes: 3,  docks: 8  },
  { id: 'b14', name: 'Remete',                 lat: 45.8460, lng: 16.0340, bikes: 2,  docks: 8  },
  { id: 'b15', name: 'Kvaternikov trg',        lat: 45.8065, lng: 16.0200, bikes: 5,  docks: 12 },
]
