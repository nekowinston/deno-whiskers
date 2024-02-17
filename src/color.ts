import tinycolor, { type Instance } from "https://esm.sh/v135/tinycolor2@1.6.0";

declare module "https://esm.sh/v135/tinycolor2@1.6.0" {
  interface Instance {
    toRgbFloat: (fractionDigits?: number) => {
      r: number;
      g: number;
      b: number;
      a: number;
    };

    getAlphaFloat: (fractionDigits?: number) => number;
  }
}

tinycolor.prototype = {
  ...tinycolor.prototype,

  /**
   * Return the object as a RGBA object, with {r, g, b, a} properties ranging from 0.0-1.0
   */
  toRgbFloat: function toRgb_f(
    this: Instance,
    fractionDigits = 2,
  ) {
    const { r, g, b, a } = this.toRgb();

    return {
      r: (r / 255).toFixed(fractionDigits),
      g: (g / 255).toFixed(fractionDigits),
      b: (b / 255).toFixed(fractionDigits),
      a: (a / 255).toFixed(fractionDigits),
    };
  },

  /**
   * Returns the alpha value of a color, from 0-255
   */
  getAlpha: function getAlpha(this: Instance) {
    return (this.toRgb().a * 255).toFixed(0);
  },

  /**
   * Returns the alpha value of a color, from 0-1
   * @param fractionDigits The number of digits to appear after the decimal point.
   */
  getAlphaFloat: function getAlphaFloat(
    this: Instance,
    fractionDigits = 2,
  ) {
    return (this.getAlpha() / 255).toFixed(fractionDigits);
  },
};

export { type Instance, tinycolor };
