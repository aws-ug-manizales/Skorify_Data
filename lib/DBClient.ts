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
import { GroupService } from "./services/Group.service";
import { GroupTeamService } from "./services/GroupTeam.service";
import { InstanceService } from "./services/Instance.service";
import { InstanceRuleService } from "./services/InstanceRule.service";
import { InstanceUserService } from "./services/InstanceUser.service";
import { LeaderboardService } from "./services/Leaderboard.service";
import { MatchService } from "./services/Match.service";
import { PaymentService } from "./services/Payment.service";
import { PredictionService } from "./services/Prediction.service";
import { RuleService } from "./services/Rule.service";
import { TeamService } from "./services/Team.service";
import { TournamentService } from "./services/Tournament.service";
import { TournamentTeamService } from "./services/TournamentTeam.service";
import { UserService } from "./services/User.service";

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
    public readonly tournaments: TournamentService;
    public readonly teams: TeamService;
    public readonly tournamentTeams: TournamentTeamService;
    public readonly groups: GroupService;
    public readonly groupTeams: GroupTeamService;
    public readonly matches: MatchService;
    public readonly rules: RuleService;
    public readonly instances: InstanceService;
    public readonly instanceUsers: InstanceUserService;
    public readonly instanceRules: InstanceRuleService;
    public readonly predictions: PredictionService;
    public readonly payments: PaymentService;
    public readonly leaderboards: LeaderboardService;
    private readonly dataSource: DataSource;

    constructor(options: DataSourceOptions) {
        this.dataSource = new DataSource({
            ...options,
            entities: options.entities ?? DEFAULT_ENTITIES,
        });
        this.users = new UserService(this.dataSource.getRepository(User));
        this.tournaments = new TournamentService(this.dataSource.getRepository(Tournament));
        this.teams = new TeamService(this.dataSource.getRepository(Team));
        this.tournamentTeams = new TournamentTeamService(this.dataSource.getRepository(TournamentTeam));
        this.groups = new GroupService(this.dataSource.getRepository(Group));
        this.groupTeams = new GroupTeamService(this.dataSource.getRepository(GroupTeam));
        this.matches = new MatchService(this.dataSource.getRepository(Match));
        this.rules = new RuleService(this.dataSource.getRepository(Rule));
        this.instances = new InstanceService(this.dataSource.getRepository(Instance));
        this.instanceUsers = new InstanceUserService(this.dataSource.getRepository(InstanceUser));
        this.instanceRules = new InstanceRuleService(this.dataSource.getRepository(InstanceRule));
        this.predictions = new PredictionService(this.dataSource.getRepository(Prediction));
        this.payments = new PaymentService(this.dataSource.getRepository(Payment));
        this.leaderboards = new LeaderboardService(this.dataSource.getRepository(Leaderboard));
    }

    getServiceByName<T>(name: string): any {
        const serviceName = name.toLowerCase();
        const servicesMap: Record<string, any> = {
            users: this.users,
            tournaments: this.tournaments,
            teams: this.teams,
            tournament_teams: this.tournamentTeams,
            groups: this.groups,
            group_teams: this.groupTeams,
            matches: this.matches,
            rules: this.rules,
            instances: this.instances,
            instance_users: this.instanceUsers,
            instance_rules: this.instanceRules,
            predictions: this.predictions,
            payments: this.payments,
            leaderboards: this.leaderboards,
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
