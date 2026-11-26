import {InvalidInputException} from '../../../@shared/exceptions';
import {ClinicId} from '../../../clinic/entities';
import {UserId} from '../../../user/entities';
import {ClinicMemberCreatedEvent} from '../../events';
import {ClinicMemberRole} from '../clinic-member-role';
import {ClinicMember, ClinicMemberId} from '../clinic-member.entity';

describe('A clinic member support access', () => {
    const clinicId = ClinicId.generate();
    const userId = UserId.generate();

    it('should be created without clinic roles and flagged as support access', () => {
        const member = ClinicMember.createSupportAccess({clinicId, userId, displayName: 'Ana (suporte)'});

        expect(member).toMatchObject({
            clinicId,
            userId,
            roles: [],
            displayName: 'Ana (suporte)',
            isActive: true,
            supportAccess: true,
            invitedByMemberId: null,
        });
        expect(member.events[0]).toBeInstanceOf(ClinicMemberCreatedEvent);
    });

    it('should never receive clinic roles', () => {
        const member = ClinicMember.createSupportAccess({clinicId, userId, displayName: 'Ana (suporte)'});

        expect(() => member.change({roles: [ClinicMemberRole.OWNER]})).toThrow(InvalidInputException);
        expect(
            () =>
                new ClinicMember({
                    ...member,
                    id: ClinicMemberId.generate(),
                    roles: [ClinicMemberRole.ADMIN],
                })
        ).toThrow(InvalidInputException);
    });

    it('should keep regular members out of support access and requiring a role', () => {
        const member = ClinicMember.create({clinicId, userId, roles: [ClinicMemberRole.SECRETARY], isActive: true});

        expect(member.supportAccess).toBe(false);
        expect(() => member.change({roles: []})).toThrow(InvalidInputException);
    });
});
