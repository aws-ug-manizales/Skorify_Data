import { DBClient } from 'skorifydata';

const dbClient = new DBClient({
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || "polla_mundial",
    username: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "password",
});


export const handler = async (event: any): Promise<void> => {
    console.log("Received event:", JSON.stringify(event, null, 2));
    console.log("Saving matches data:", JSON.stringify(event.body, null, 2));
    try {
        await dbClient.connect();
        const matchData = JSON.parse(event.body);
        await dbClient.matches.create(matchData);
        console.log("Match data saved successfully.");
    } catch (error) {
        console.error("Error saving match data:", error);
        throw error;
    } finally {
        await dbClient.disconnect();
    }    
};