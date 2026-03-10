export function formatToISO(date: Date, hour = 18, minute = 30, second = 0) {
    const d = new Date(
        Date.UTC(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            hour,
            minute,
            second
        )
    );
    return d.toISOString();
}