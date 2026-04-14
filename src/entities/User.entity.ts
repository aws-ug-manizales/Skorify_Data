import { 
    Entity, 
    PrimaryGeneratedColumn, 
    Column, 
    CreateDateColumn, 
    UpdateDateColumn,
    DeleteDateColumn
} from "typeorm";
import { 
    IsEmail, 
    IsNotEmpty, 
    Length, 
    IsOptional, 
    IsUUID 
} from "class-validator";

@Entity({ name: 'users' })
export class UserEntity {
    
    @PrimaryGeneratedColumn('uuid')
    @IsUUID()
    @IsOptional() // Opcional al crear, generado por la DB
    id!: string;

    @Column({ type: 'varchar', length: 100 })
    @IsNotEmpty({ message: 'El nombre es obligatorio' })
    @Length(2, 100, { message: 'El nombre debe tener entre 2 y 100 caracteres' })
    name!: string;

    @Column({ type: 'varchar', unique: true })
    @IsEmail({}, { message: 'Formato de email inválido' })
    @IsNotEmpty()
    email!: string;

    @Column({ type: 'boolean', default: true })
    isActive!: boolean;

    // --- Auditoría ---
    
    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;

    @DeleteDateColumn({ type: 'timestamp', nullable: true })
    deletedAt?: Date; // Soporte para Soft Delete (Eliminación lógica)
}