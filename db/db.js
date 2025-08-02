import { Pool } from "pg";

let pool;

const connectToPg = (callback) => {
    pool = new Pool({
        connectionString: process.env.DATABASE_URL
    })
    callback()
}

const queryPG = (query, params) => {
    return pool.query(query, params);
}

export {connectToPg, queryPG};