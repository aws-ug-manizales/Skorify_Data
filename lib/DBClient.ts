import "reflect-metadata";
import { DataSource, DataSourceOptions } from "typeorm";
import { Group } from "../entities/Group";
import { GroupTeam } from "../entities/GroupTeam";
import { Instance } from "../entities/Instance";
import { InstanceRule } from "../entities/InstanceRule";
import { InstanceUser } from "../entities/InstanceUser";
import { Leaderboard } from "../entities/Leaderboard";
import { Match } from "../entities/Match";
import { Payment } from "../entities/Payment";
import { Prediction } from "../entities/Prediction";
import { Rule } from "../entities/Rule";
import { Team } from "../entities/Team";
import { Tournament } from "../entities/Tournament";
import { TournamentTeam } from "../entities/TournamentTeam";
import { User } from "../entities/User";
import { UserService } from "./services/User.service";
import { MatchService } from "./services/Match.service";

const DEFAULT_ENTITIES = [
    User,
    Tournament,
    Team,
    TournamentTeam,
    Group,
    GroupTeam,
    Match,
    Rule,
    Instance,
    InstanceUser,
    InstanceRule,
    Prediction,
    Payment,
    Leaderboard,
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

    getServiceByName<T>(name: string): any {
        const serviceName = name.toLowerCase();
        const servicesMap: Record<string, any> = {
            users: this.users,
            matches: this.matches,
        };
        const service = servicesMap[serviceName];
        if (!service) {
            throw new Error(`Service for entity '${name}' not found`);
        }
        return service;
    }

    async connect() {
        if (!this.dataSource.isInitialized) await this.dataSource.initialize();
    }

    async disconnect() {
        if (this.dataSource.isInitialized) await this.dataSource.destroy();
    }
}