import { FormControl } from "@angular/forms";
import { passwordStrength } from "./validators";

describe("validators", () => {
  describe("passwordStrength", () => {
    it("should return null for empty string or null value", () => {
      const control = new FormControl("");
      expect(passwordStrength(control)).toBeNull();

      control.setValue(null);
      expect(passwordStrength(control)).toBeNull();
    });

    it("should return weakPassword error if password is less than 8 characters", () => {
      const control = new FormControl("Ab1");
      expect(passwordStrength(control)).toEqual({ weakPassword: true });
    });

    it("should return weakPassword error if password has no numbers", () => {
      const control = new FormControl("Abcdefgh");
      expect(passwordStrength(control)).toEqual({ weakPassword: true });
    });

    it("should return weakPassword error if password has no letters", () => {
      const control = new FormControl("12345678");
      expect(passwordStrength(control)).toEqual({ weakPassword: true });
    });

    it("should return null for valid password with 8+ chars, letters and numbers", () => {
      const control = new FormControl("Pass1234");
      expect(passwordStrength(control)).toBeNull();
    });
  });
});
