import { Phone } from "../phone.vo";

describe("A value object representing a phone", () => {
  it.each<string>(["12345678901", "12 945678901", "(12) 4567-8901", "61 3456-8901"])(
    "can be created from a valid string",
    (phone) => {
      expect(() => Phone.create(phone)).not.toThrow();
      expect(Phone.create(phone)).toBeInstanceOf(Phone);
    },
  );

  it.each([
    "aaaaa",
    "123",
    "123..456.78901",
    "123.456--78901111",
    "(00)12345678917",
    "123(45)6789.-17",
    "",
    "-123",
    "(61)",
    "123.",
    "123-",
  ])("should reject invalid values", (phone) => {
    expect(() => Phone.validate(phone)).toThrow("Invalid phone format.");
  });

  it("should be comparable", () => {
    const phone = Phone.create("12945678912");
    const phone2 = Phone.create("12945678912");
    const phone3 = Phone.create("61345678902");
    const phone4 = Phone.create("(12)945678912");

    expect(phone.equals(phone2)).toBe(true);
    expect(phone.equals(phone3)).toBe(false);
    expect(phone.equals(phone4)).toBe(true);
  });

  it("can be converted to a string", () => {
    const phone = Phone.create("12945678912");
    const phone2 = Phone.create("(12) 94567-8912");

    expect(phone.toString()).toEqual("12945678912");
    expect(phone2.toString()).toEqual("12945678912");
  });

  it("can be converted to a JSON", () => {
    const phone = Phone.create("12945678912");
    const phone2 = Phone.create("(12) 94567-8912");

    expect(phone.toJSON()).toEqual("12945678912");
    expect(phone2.toJSON()).toEqual("12945678912");
  });
});
