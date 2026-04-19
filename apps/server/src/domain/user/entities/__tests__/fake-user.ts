import {Email} from '../../../@shared/value-objects';
import {GlobalRole} from '../../../auth';
import {ProfessionalId} from '../../../professional/entities';
import {ObfuscatedPassword, Username} from '../../value-objects';
import {User, UserId} from '../user.entity';

// Pa$$w0rd
const encodedPassword =
    '64:yLmVvBhiYeIjxe+e+IU7hg==:wYTiKiL5dKb14d44RXDpop7cqcZrlC/zRe53tATkENSG+lH0Tsq43Bw2TVx2BtCCx2oAHK8eM5Uf9nWoAw9yeg==';

export function fakeUser(payload: Partial<User> = {}): User {
    return new User({
        id: UserId.generate(),
        username: Username.create('john_doe'),
        email: Email.create('john_doe@example.com'),
        password: ObfuscatedPassword.decode(encodedPassword),
        name: 'John Doe',
        professionals: [ProfessionalId.generate()],
        createdAt: new Date(1000),
        updatedAt: new Date(1000),
        ...payload,
        globalRole: payload.globalRole ?? GlobalRole.NONE,
    });
}

