export function getWeekDateRange(year, weekNum) {
    let janFirst = new Date(year, 0, 1);
    let weekStart = new Date(janFirst.getTime() + (weekNum - 1) * 7 * 24 * 60 * 60 * 1000);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    let weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 4);
    return { start: weekStart, end: weekEnd };
}