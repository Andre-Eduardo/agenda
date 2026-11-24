import type {ClinicMember} from '@domain/clinic-member/entities';
import {ClinicMemberRole} from '@domain/clinic-member/entities';

/** Ocupa licença quem atende: membro ativo com papel PROFESSIONAL. */
export function occupiesProfessionalSeat(member: Pick<ClinicMember, 'isActive' | 'roles'>): boolean {
    return member.isActive && member.roles.includes(ClinicMemberRole.PROFESSIONAL);
}

export function countProfessionalSeats(members: ReadonlyArray<Pick<ClinicMember, 'isActive' | 'roles'>>): number {
    return members.filter(occupiesProfessionalSeat).length;
}
