import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';


export enum PropertyStatus {
  AVAILABLE = 'AVAILABLE',
  TOKENIZED = 'TOKENIZED',
  SOLD = 'SOLD',
}

@Entity()
export class Property {
  @PrimaryGeneratedColumn('uuid', {name: "id"})
  id: string;

  @Column({ type: 'varchar', nullable: true })
  ipfsMetadataUrl: string | null;
}





