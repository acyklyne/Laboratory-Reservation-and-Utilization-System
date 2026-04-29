export type LabStatus = 'Available' | 'Unavailable' | 'Maintenance';

export interface Lab {
  id: string;
  name: string;
  description?: string;
  capacity?: number;
  status: string;
  imageUrl?: string;
}
