export interface SaveLocationInterface {
  success?: boolean;
  saveLocationData?: SaveLocationDataInterface | [];
  saveLocationDataUpdate?: SaveLocationUpdateInterface | [];
  saveLocationDataGet?: SaveLocationGetInterface;
  loading?: boolean;
  statusCode?: number | null | undefined;
}

export interface SaveLocationDataInterface {
  title?: string;
  location?: string;
  type?: string;
  location_coordinates?: {
    lat?: number;
    lng?: number;
  };
}

export interface SaveLocationUpdateInterface { }

export interface SaveLocationGetInterface { }
