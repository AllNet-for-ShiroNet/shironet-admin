import { Entity, PrimaryColumn, Column, Index } from 'typeorm';

@Entity('chuni_static_character')
@Index('idx_version', ['version'])
export class ChuniStaticCharacter {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  characterId: string;

  @Column({ type: 'int' })
  version: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  sortName: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  worksName: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  rareType: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  imagePath1: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  imagePath2: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  imagePath3: string | null;

  @Column({ type: 'tinyint', nullable: true })
  isEnabled: boolean | null;

  @Column({ type: 'tinyint', nullable: true })
  defaultHave: boolean | null;
}
