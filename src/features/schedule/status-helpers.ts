export type WorkStatus = {
  isWorking: boolean;
  isOverride: boolean;
  label: string;
};

export function getWorkStatusClasses(status: WorkStatus) {
  if (status.isOverride) {
    return "bg-amber-50 text-amber-800 border-amber-200";
  }

  if (status.isWorking) {
    return "bg-green-50 text-green-800 border-green-200";
  }

  return "bg-red-50 text-red-700 border-red-200";
}
