import { Repository } from "typeorm";
import { Payment } from "../../entities/Payment";
import { BaseDataService } from "./base.service";

export class PaymentService extends BaseDataService<Payment> {
    constructor(repository: Repository<Payment>) {
        super(Payment, repository);
    }

    async findByUserId(user_id: string): Promise<Payment[]> {
        return await this.repository.find({ where: { user_id } });
    }

    async findByTournamentId(tournament_id: string): Promise<Payment[]> {
        return await this.repository.find({ where: { tournament_id } });
    }

    async updateStatus(id: string, state_pay: 'failed' | 'pending' | 'paid'): Promise<void> {
        await this.repository.update(id, { state_pay });
    }
}
