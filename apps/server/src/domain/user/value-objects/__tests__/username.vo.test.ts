import {Username} from '../username.vo';

describe('A value object representing a username', () => {
    it.each<string>(['john.doe', 'foo1bar', 'john_doe123', '__johndoe__'])(
        'can be created from a valid string',
        (username) => {
            expect(() => Username.create(username)).not.toThrow();
            expect(Username.create(username)).toBeInstanceOf(Username);
        }
    );

    it.each([
        'john.doe.',
        '.john.doe',
        'john..doe',
        '-john_doe',
        'john.doe..',
        '..john.doe',
        'john.doe!',
        'john@doe',
        'johndo&',
        'john.doeeeeeeeeeeeeeeeeeeeeeeee',
    ])('should reject invalid values', (username) => {
        expect(() => Username.validate(username)).toThrow(
            'The username must be between 1 and 30 characters long and can only contain letters, numbers, hyphens, underscores, and periods.'
        );
    });

    it('should be comparable', () => {
        const username = Username.create('john.doe');
        const username2 = Username.create('john.doe');
        const username3 = Username.create('wanda-brown');
        const username4 = Username.create('John.Doe');

        expect(username.equals(username2)).toBe(true);
        expect(username.equals(username3)).toBe(false);
        expect(username.equals(username4)).toBe(true);
    });

    it('can be converted to a string', () => {
        const username = Username.create('john.doe');
        const username2 = Username.create('John.Doe');

        expect(username.toString()).toEqual('john.doe');
        expect(username2.toString()).toEqual('John.Doe');
    });

    it('can be converted to a JSON', () => {
        const username = Username.create('john.doe');
        const username2 = Username.create('John.Doe');

        expect(username.toJSON()).toEqual('john.doe');
        expect(username2.toJSON()).toEqual('John.Doe');
    });
});
