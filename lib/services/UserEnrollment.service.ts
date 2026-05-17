import { IsNull, Repository } from "typeorm";
import { UserEnrollment as UserEnrollmentEntity } from "../../entities/UserEnrollment";
import { BaseDataService } from "./base.service";

export class UserEnrollmentService extends BaseDataService<UserEnrollmentEntity> {
    constructor(repository: Repository<UserEnrollmentEntity>) {
        super(UserEnrollmentEntity, repository);
    }
}