import "reflect-metadata";
import { DataSource, DataSourceOptions } from "typeorm";
import { TournamentInstance } from "../entities/TournamentInstance";
import { UserEnrollment } from "../entities/UserEnrollment";
import { Match } from "../entities/Match";
import { Prediction } from "../entities/Prediction";
import { Team } from "../entities/Team";
import { Tournament } from "../entities/Tournament";
import { User } from "../entities/User";
import { MatchService } from "./services/Match.service";
import { PredictionService } from "./services/Prediction.service";
import { TeamService } from "./services/Team.service";
import { TournamentService } from "./services/Tournament.service";
import { TournamentInstanceService } from "./services/TournamentInstance.service";
import { UserService } from "./services/User.service";
import { UserEnrollmentService } from "./services/UserEnrollment.service";

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
    public readonly userEnrollments: UserEnrollmentService;
    public readonly tournaments: TournamentService;
    public readonly teams: TeamService;
    public readonly tournamentInstances: TournamentInstanceService;
    public readonly matches: MatchService;
    public readonly predictions: PredictionService;
    private readonly dataSource: DataSource;

    constructor(options: DataSourceOptions) {
        this.dataSource = new DataSource({
            ...options,
            entities: options.entities ?? DEFAULT_ENTITIES,
        });
        this.users = new UserService(this.dataSource.getRepository(User));
        this.userEnrollments = new UserEnrollmentService(this.dataSource.getRepository(UserEnrollment));
        this.tournaments = new TournamentService(this.dataSource.getRepository(Tournament));
        this.teams = new TeamService(this.dataSource.getRepository(Team));
        this.matches = new MatchService(this.dataSource.getRepository(Match));
        this.predictions = new PredictionService(this.dataSource.getRepository(Prediction));
        this.tournamentInstances = new TournamentInstanceService(this.dataSource.getRepository(TournamentInstance));
    }

    getServiceByName<T>(name: string): any {
        const serviceName = name.toLowerCase();
        const servicesMap: Record<string, any> = {
            users: this.users,
            tournaments: this.tournaments,
            teams: this.teams,
            tournament_instances: this.tournamentInstances,
            matches: this.matches,
            predictions: this.predictions,
            user_enrollments: this.userEnrollments,
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
