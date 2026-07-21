export type ServiceItem = {
  id: string;
  name: string;
  name_en: string | null;
  description: string | null;
  description_en: string | null;
  duration_minutes: number;
  price_cents: number | null;
  service_group: string | null;
  service_group_en: string | null;
  priority_room: string | null;
  is_active: boolean;
  is_online_bookable: boolean;
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
