import { UserEntity } from "@skorify/domain/user";
import { Repository } from "typeorm";
import { User } from "../../entities/User";
import { UserMapper } from "../mappers/user.mapper";
import { BaseDataService } from "./base.service";

export class UserService extends BaseDataService<User, UserEntity> {
  constructor(repository: Repository<User>, mapper: UserMapper) {
    super(User, repository, mapper);
  }
}
