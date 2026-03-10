export const calculateFareAmount = (
    start_date: string,
    end_date: string,
    pickup_time: string,
    drop_time: string,
    distance_km: number
): {
    fare_amount: number;
    estimated_hours: number;
    duration_type: "LOCAL" | "OUTSTATION";
    night_charge: number;
    
} => {
    const startDateTime = new Date(`${start_date}T${pickup_time}:00`);
    let endDateTime = new Date(`${end_date}T${drop_time}:00`);

    if (endDateTime <= startDateTime) {
        endDateTime.setDate(endDateTime.getDate() + 1);
    }

    const diffMs = endDateTime.getTime() - startDateTime.getTime();
    const estimated_hours = Math.max(
        2,
        Math.ceil(diffMs / (1000 * 60 * 60))
    );


  



    const isOutstation =
        distance_km > 100 || estimated_hours > 12;

    const duration_type: "LOCAL" | "OUTSTATION" =
        isOutstation ? "OUTSTATION" : "LOCAL";

    let fare_amount = 0;

let night_charge = 0;

const nightStart = new Date(startDateTime);
nightStart.setHours(22, 0, 0, 0);

const nightEnd = new Date(startDateTime);
nightEnd.setDate(nightEnd.getDate() + 1);
nightEnd.setHours(5, 0, 0, 0);

const overlapStart =
        startDateTime > nightStart ? startDateTime : nightStart;
    const overlapEnd =
        endDateTime < nightEnd ? endDateTime : nightEnd;

 if (duration_type === "LOCAL") {
        
        fare_amount =
            estimated_hours <= 2
                ? 350
                : 350 + (estimated_hours - 2) * 100;

        
        if (overlapEnd > overlapStart) {
            night_charge = 150;
            fare_amount += night_charge;
        }
    } else {
  
        if (estimated_hours <= 12) {
            fare_amount = 1500;
        } else if (estimated_hours < 24) {
            fare_amount = 3000;
        } else {
            const full24Blocks = Math.floor(estimated_hours / 24);
            fare_amount = full24Blocks * 2000;

            const remainingHours = estimated_hours % 24;
            if (remainingHours > 0) {
                fare_amount += remainingHours <= 12 ? 1500 : 2000;
            }
        }
    }

    return {
        fare_amount,
        estimated_hours,
        duration_type,
        night_charge,
    };
};
