import { DataSource } from "typeorm";
// Importamos directamente desde la carpeta de entidades del proyecto principal
import { User, Match, Prediction, Tournament } from "../../../entities";

export const AppDataSource = new DataSource({
    type: "postgres",
    host: "localhost", // Cambiar por la IP del RDS si están en AWS
    port: 5432,
    username: "postgres",
    password: "tu_password",
    database: "skorify_db",
    entities: [User, Match, Prediction, Tournament],
    synchronize: false,
    logging: true,
});
