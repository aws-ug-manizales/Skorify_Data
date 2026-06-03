import { DomainEvent } from "@skorify/domain/core";
import { UserEntity } from "@skorify/domain/user";
import { BaseMapper } from "./base.mapper";

export class UserMapper extends BaseMapper {
  fromJson(json: Record<string, any>): DomainEvent {
    return UserEntity.build({
      id: json.id,
      name: json.name,
      sub: json.sub,
      isActive: json.is_active,
      notificationToken: json.notification_token,
      email: json.email,
      image: json.image,
      role: json.role,
      createdAt: new Date(json.created_at),
      updatedAt: json.updated_at ? new Date(json.updated_at) : undefined,
      deletedAt: json.deleted_at ? new Date(json.deleted_at) : undefined,
    });
  }

  toJson(entity: UserEntity) {
    return {
      id: entity.id,
      name: entity.name,
      sub: entity.sub,
      is_active: entity.isActive,
      notification_token: entity.notificationToken,
      email: entity.email,
      image: entity.image,
      role: entity.role,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt,
      deleted_at: entity.deletedAt,
    };
  }
}
