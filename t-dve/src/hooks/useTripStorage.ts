// src/hooks/useTripStorage.ts
export const useTripStorage = () => {
  const setTrip = (trip: any) => sessionStorage.setItem("trip", JSON.stringify(trip));
  const getTrip = () => {
    const data = sessionStorage.getItem("trip");
    return data ? JSON.parse(data) : null;
  };
  const clearTrip = () => sessionStorage.removeItem("trip");
  

  const setDriver = (driver: any) => sessionStorage.setItem("driver", JSON.stringify(driver));
  const getDriver = () => {
    const data = sessionStorage.getItem("driver");
    return data ? JSON.parse(data) : null;
  };
  const clearDriver = () => sessionStorage.removeItem("driver");

  return { setTrip, getTrip, clearTrip, setDriver, getDriver, clearDriver };
};
