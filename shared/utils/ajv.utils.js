const Ajv = require("ajv");

class ValidationUtils {

  static ajv = new Ajv({
    allErrors: true,
    useDefaults: true,
    verbose: true
  });

  static customKey() {
    this.ajv.addKeyword({
      keyword: "customEmail",
      type: "string",
      error: { message: "Invalid email format" },
      validate: (schema, data) => {
        if (!schema || !data) return true;
        return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,8}$/.test(data);
      }
    });

    this.ajv.addKeyword({
      keyword: "customPhone",
      type: "string",
      validate: function (schema, data) {
        if (!schema || !data) return true;
        return /^\+?[0-9]{7,15}$/.test(data); // e.g., +12345678900
      },
      error: { message: "Invalid phone format" }
    });

    this.ajv.addKeyword({
      keyword: "customWebsite",
      type: "string",
      validate: function (schema, data) {
        if (!schema || !data) return true;
        return /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/[\w-./?%&=]*)?$/.test(data);
      },
      error: { message: "Invalid URL format" }
    });

    this.ajv.addKeyword({
      keyword: "customDate",
      type: "string",
      error: { message: "Invalid date format. Expected YYYY-MM-DD" },
      validate: (schema, data) => {
        if (!schema || !data) return true;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return false;
        const date = new Date(data);
        return !isNaN(date.getTime());
      }
    });

    this.ajv.addKeyword({
      keyword: "customTime",
      type: "string",
      error: { message: "Invalid time format. Expected HH:mm or HH:mm:ss" },
      validate: (schema, data) => {
        if (!schema || !data) return true;

        // Match HH:mm or HH:mm:ss (24-hour format)
        if (!/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/.test(data)) {
          return false;
        }

        return true;
      }
    });
  }

  static schemaGenerator(schemaData, options) {
    return {
      type: "object",
      properties: schemaData,
      required: options.required || Object.keys(schemaData),
      allOf: options.allOf,
      additionalProperties: false,
    };
  };

  /**
   * Creates a schema property object.
   *
   * @param {"number" | "string" | "array" | "object"} type - The type of the property
   * @param {PropOptions} [options={}] - Additional property constraints.
   * @returns {Object} Schema-like property object.
   *
   * @typedef {Object} PropOptions
   * @property {number} [minimum] - Minimum value (for numbers).
   * @property {number} [maximum] - Maximum value (for numbers).
   * @property {number} [minLength] - Minimum length (for strings).
   * @property {number} [maxLength] - Maximum length (for strings).
   * @property {number} [minItems] - Minimum items (for arrays).
   * @property {number} [maxItems] - Maximum items (for arrays).
   * @property {boolean} [uniqueItems] - Whether array items must be unique.
   * @property {Object|Array} [items] - Schema for array items.
   * @property {number} [minProperties] - Minimum properties (for objects).
   * @property {number} [maxProperties] - Maximum properties (for objects).
   * @property {Object} [properties] - Schema for object properties.
   * @property {string} [pattern] - Regex pattern (for strings).
   * @property {Array} [enum] - Allowed values.
   * @property {"customEmail" | "customPhone" | "customWebsite"} [format] - Special format flag.
   * @property {boolean} [required] - Whether field is required.
   */
  static prop(type, options = {}) {
    const propObj = { type };

    type.includes("number")
      ? (
        (propObj.minimum = options.minimum),
        (propObj.maximum = options.maximum)
      )
      : type.includes("string")
        ? (
          (propObj.minLength = options.minLength),
          (propObj.maxLength = options.maxLength)
        )
        : type.includes("array")
          ? (
            (propObj.minItems = options.minItems),
            (propObj.maxItems = options.maxItems),
            (propObj.uniqueItems = options.uniqueItems),
            (propObj.items = options.items)
          )
          : type.includes("object")
            ? (
              (propObj.minProperties = options.minProperties),
              (propObj.maxProperties = options.maxProperties),
              (propObj.properties = options.properties)
            )
            : null;

    options.title !== undefined && (propObj.title = options.title);
    options.pattern !== undefined && (propObj.pattern = options.pattern);
    options.enum !== undefined && (propObj.enum = options.enum);
    options.default !== undefined && (propObj.default = options.default);
    options.format !== undefined && (propObj[options.format] = true);
    options.required !== undefined && (propObj.required = options.required);

    return propObj;
  };

  static ajvCheck(schema, options = {}) {
    return this.ajv.compile(this.schemaGenerator(schema, options));
  }

  static errorMsg({ error }) {
    let field = error?.parentSchema?.title || error.params?.missingProperty || error.instancePath?.replace(/^\//, '') || '';
    field = field ? `'${field}'` : 'this field';
    const msg = error.message.replace(/'/g, '').replace(/must/, 'requires').trim();
    return `Field ${field} ${msg}.`;
  }
}

ValidationUtils.customKey();
module.exports = ValidationUtils;
