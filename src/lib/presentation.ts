export const energyLabels = ['צריכה רגע', 'לאט היום', 'באמצע', 'יש לי כוח', 'מלאת אנרגיה'];

export function formatDate(
  date: string,
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' },
) {
  return new Intl.DateTimeFormat('he-IL', options).format(new Date(date + 'T12:00:00Z'));
}
