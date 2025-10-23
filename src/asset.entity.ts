import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("property_tokenizations")
export class PropertyTokenization {
  @PrimaryGeneratedColumn()
  id: number;

  // 🏠 Property Details
  @Column()
  propertyTitle: string;

  @Column()
  propertyType: string;

  @Column()
  cityState: string;

  @Column()
  fullAddress: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ nullable: true })
  yearBuilt: string;

  @Column({ type: "float", nullable: true })
  propertySize: number;

  @Column({ type: "int", nullable: true })
  numberOfUnits: number;

  // 👤 Owner Information
  @Column()
  fullName: string;

  @Column({ nullable: true })
  companyName: string;

  @Column()
  email: string;

  @Column()
  phone: string;

  @Column({ type: "int", nullable: true })
  yearsExperience: number;

  // 💰 Financial Details
  @Column({ type: "float", nullable: true })
  purchasePrice: number;

  @Column({ type: "float", nullable: true })
  tokenizationValue: number;

  @Column({ type: "float", nullable: true })
  minInvestment: number;

  @Column({ type: "float", nullable: true })
  annualYield: number;

  @Column({ type: "float", nullable: true })
  monthlyRevenue: number;

  @Column({ type: "float", nullable: true })
  monthlyExpenses: number;

  // 📸 Uploads (after uploading to Pinata/IPFS, store URLs)
  @Column("simple-array", { nullable: true })
  propertyImages: string[];

  @Column("simple-array", { nullable: true })
  documents: string[];

  // ⚖️ Legal & Compliance
  @Column({ default: false })
  acceptedTerms: boolean;

  @Column({ default: false })
  acceptedPrivacy: boolean;

  @Column({ default: false })
  acceptedCompliance: boolean;

  // Meta
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
