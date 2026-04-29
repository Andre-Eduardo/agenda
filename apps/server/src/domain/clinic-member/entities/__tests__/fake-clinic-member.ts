import { ClinicId } from "../../../clinic/entities";
import { UserId } from "../../../user/entities";
import { ClinicMember, ClinicMemberId } from "../clinic-member.entity";
import { ClinicMemberRole } from "../clinic-member-role";

export function fakeClinicMember(payload: Partial<ClinicMember> = {}): ClinicMember {
  return new ClinicMember({
    id: ClinicMemberId.generate(),
    clinicId: ClinicId.generate(),
    userId: UserId.generate(),
    role: ClinicMemberRole.PROFESSIONAL,
    displayName: "Dra. Teste",
    color: "#4F81BD",
    isActive: true,
    invitedByMemberId: null,
    createdAt: new Date(1000),
    updatedAt: new Date(1000),
    ...payload,
  });
}
