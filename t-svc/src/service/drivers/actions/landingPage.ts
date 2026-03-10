import { pool } from "../../db";

export const landingPage = async (landing_page: string, id: number) => {
    if (!landing_page) {
        return { message: 'landing_page is required' };
    }
    try {
        await pool.query(
                'UPDATE USERS SET landing_page = $1 where id = $2',
                [landing_page, id]
            );        
    } catch (error) {
        return { message: 'Internal Server Error' };
    }
};