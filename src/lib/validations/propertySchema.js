import { z } from "zod";

export const propertySchema = z.object({
  propertyTitle: z.string().min(3, "Title is required"),
  propertyType: z.string().min(1, "Select a property type"),
  cityState: z.string().min(2, "Enter location"),
  fullAddress: z.string().min(5, "Enter full address"),
  description: z.string().min(10, "Description too short"),
  propertySize: z.number().min(100, "Enter valid size"),
  yearBuilt: z.string(),
  numberOfUnits: z.number().min(1, "Enter number of units"),

  fullName: z.string().min(3, "Enter full name"),
  companyName: z.string().optional(),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  yearsExperience: z.number().min(0),

  purchasePrice: z.number().positive(),
  tokenizationValue: z.number().positive(),
  minInvestment: z.number().positive(),
  annualYield: z.number().min(0),
  monthlyRevenue: z.number().nonnegative(),
  monthlyExpenses: z.number().nonnegative(),

  propertyImages: z.array(z.any()).max(5, "Max 5 images").min(1, "At least 1 image"),
  documents: z.array(z.any()).max(5, "Max 5 documents").min(1, "At least 1 document"),

  acceptedTerms: z.boolean().refine(v => v === true, "Must accept terms"),
  acceptedPrivacy: z.boolean().refine(v => v === true, "Must accept privacy policy"),
  acceptedCompliance: z.boolean().refine(v => v === true, "Must accept compliance"),
});
