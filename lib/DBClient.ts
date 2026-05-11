import "reflect-metadata";
import { DataSource, DataSourceOptions } from "typeorm";
import { TournamentInstance } from "../entities/TournamentInstance";
import { UserEnrollment } from "../entities/UserEnrollment";
import { Match } from "../entities/Match";
import { Prediction } from "../entities/Prediction";
import { Team } from "../entities/Team";
import { Tournament } from "../entities/Tournament";
import { User } from "../entities/User";
import { UserService } from "./services/User.service";
import { MatchService } from "./services/Match.service";

const DEFAULT_ENTITIES = [
    User,
    Tournament,
    Team,
    Match,
    TournamentInstance,
    UserEnrollment,
    Prediction,
];

export class DBClient {
    public readonly users: UserService;
    public readonly matches: MatchService;
    private readonly dataSource: DataSource;

    constructor(options: DataSourceOptions) {
        this.dataSource = new DataSource({
            ...options,
            entities: options.entities ?? DEFAULT_ENTITIES,
        });
        this.users = new UserService(this.dataSource.getRepository(User));
        this.matches = new MatchService(this.dataSource.getRepository(Match));
    }

    async connect() {
        if (!this.dataSource.isInitialized) await this.dataSource.initialize();
    }

    async disconnect() {
        if (this.dataSource.isInitialized) await this.dataSource.destroy();
    }
}