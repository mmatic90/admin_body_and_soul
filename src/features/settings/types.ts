export type ServiceItem = {
  id: string;
  name: string;
  duration_minutes: number;
  service_group: string | null;
  priority_room: string | null;
  is_active: boolean;
};

export type RoomItem = {
  id: string;
  name: string;
  is_active: boolean;
};

export type EquipmentItem = {
  id: string;
  name: string;
  quantity: number;
  is_active: boolean;
};

export type EmployeeItem = {
  id: string;
  profile_id: string | null;
  display_name: string;
  email: string | null;
  phone: string | null;
  color_hex: string | null;
  is_active: boolean;
};

export type SalonWorkingHourItem = {
  day_of_week: number;
  opens_at: string;
  closes_at: string;
  is_closed: boolean;
};

export type ServiceGroupLimitItem = {
  group_name: string;
  max_parallel: number;
};
