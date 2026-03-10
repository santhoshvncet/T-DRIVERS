export const getDateDifference = (d1: string, d2: string) => {
    const diff = Math.abs(new Date(d2).getTime() - new Date(d1).getTime());
    return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: diff / (1000 * 60),
        seconds: diff / 1000,
    };
};