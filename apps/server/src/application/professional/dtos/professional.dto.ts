export class ProfessionalDto {
    id: string;
    specialty: string | null;
    allowSystemAccess: boolean;
    createdAt: Date;
    updatedAt: Date;
    // Add other fields as necessary from Person if needed, flattening the structure
}
