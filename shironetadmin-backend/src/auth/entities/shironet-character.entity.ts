import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('shironet_characters')
export class ShironetCharacter {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true, name: 'ID' })
  id: number;

  @Column({ type: 'varchar', length: 50 })
  characterId: string;

  @Column({ type: 'varchar', length: 50 })
  version: string;

  @Column({ type: 'varchar', length: 100 })
  characterName: string;
}
