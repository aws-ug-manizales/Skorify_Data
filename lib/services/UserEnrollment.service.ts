import { UserEnrollmentEntity } from "@skorify/domain/user-enrollment";
import { Repository } from "typeorm";
import { UserEnrollment } from "../../entities/UserEnrollment";
import { UserEnrollmentMapper } from "../mappers/user-enrollment.mappert";
import { BaseDataService } from "./base.service";

export class UserEnrollmentService extends BaseDataService<
  UserEnrollment,
  UserEnrollmentEntity
> {
  constructor(
    repository: Repository<UserEnrollment>,
    mapper: UserEnrollmentMapper,
  ) {
    super(UserEnrollment, repository, mapper);
  }
}
