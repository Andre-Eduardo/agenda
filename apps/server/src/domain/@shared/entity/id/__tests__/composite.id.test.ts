import {CompositeId, EntityId} from '../index';

class Id1 extends EntityId<'Id1'> {
    public constructor(value?: string) {
        super(value);
    }
}

class Id2 extends EntityId<'Id2'> {
    public constructor(value?: string) {
        super(value);
    }
}

const Id3 = 'foo';

class Ids extends CompositeId<Id1 | typeof Id3, Id2> {
    public constructor(id1: Id1 | typeof Id3, id2: Id2) {
        super(id1, id2);
    }
}

describe('CompositeId', () => {
    it.each([
        {
            ids1: new Ids(
                new Id1('35af63e3-e047-4821-82ed-d3dae115146a'),
                new Id2('35af63e3-e047-4821-82ed-d3dae115146a')
            ),
            ids2: new Ids(
                new Id1('35af63e3-e047-4821-82ed-d3dae115146a'),
                new Id2('35af63e3-e047-4821-82ed-d3dae115146a')
            ),
            result: true,
        },
        {
            ids1: new Ids(
                new Id1('35af63e3-e047-4821-82ed-d3dae115146a'),
                new Id2('f112d9e2-17f9-4059-9a29-24116de4aa18')
            ),
            ids2: new Ids(
                new Id1('35af63e3-e047-4821-82ed-d3dae115146a'),
                new Id2('35af63e3-e047-4821-82ed-d3dae115146a')
            ),
            result: false,
        },
        {
            ids1: new Ids(new Id1(), new Id2()),
            ids2: new Ids(new Id1(), new Id2()),
            result: false,
        },
        {
            ids1: new Ids(Id3, new Id2()),
            ids2: new Ids(new Id1(), new Id2()),
            result: false,
        },
        {
            ids1: new Ids(new Id1(), new Id2()),
            ids2: null,
            result: false,
        },
        {
            ids1: new Ids(new Id1(), new Id2()),
            ids2: undefined,
            result: false,
        },
    ])('should be comparable', ({ids1, ids2, result}) => {
        expect(ids1.equals(ids2)).toBe(result);
    });

    it('should be comparable with null', () => {
        const id1 = new Id1();
        const id2 = new Id2();
        const ids = new Ids(id1, id2);

        expect(ids.equals(null)).toBeFalse();
    });

    it('can be converted to a string', () => {
        const id1 = '83ad2cc7-2f30-45f4-aefb-9e835da774a8';
        const id2 = '029f78f1-e972-473a-8856-011eb4e71db0';

        const ids = new Ids(new Id1(id1), new Id2(id2));

        expect(ids.toString()).toBe(`${id1},${id2}`);

        const ids2 = new Ids(Id3, new Id2(id2));

        expect(ids2.toString()).toBe(`foo,${id2}`);
    });

    it('can be serializable to JSON', () => {
        const id1 = 'd4f753c6-65e8-4d75-b558-430c1f436b0a';
        const id2 = '90104d0d-848b-481b-b088-b876b2368acd';

        const ids = new Ids(new Id1(id1), new Id2(id2));

        expect(ids.toJSON()).toBe(`${id1},${id2}`);
    });
});
