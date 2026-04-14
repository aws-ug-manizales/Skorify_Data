import "reflect-metadata"; // ¡Importante para los decoradores!
import { DataSource, DataSourceOptions } from "typeorm";
import { User } from "../entities/User";
import { UserService } from "./services/User.service";

export class DBClient {
    public readonly users: UserService;
    private readonly dataSource: DataSource;

    constructor(options: DataSourceOptions) {
        this.dataSource = new DataSource({
            ...options,
            entities: [User],
        });
        this.users = new UserService(this.dataSource.getRepository(User));
    }

    async connect() {
        if (!this.dataSource.isInitialized) await this.dataSource.initialize();
    }
}