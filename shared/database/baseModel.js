const db = require("./connection");

class BaseModel {
  constructor({ table, columns = [], hidden = [], primaryKey = "id", limit = 10 }) {
    this.table = table;
    this.columns = columns;
    this.hidden = hidden;
    this.primaryKey = primaryKey;
    this.pageLimit = limit;
    this.db_table = db;
  }

  clean(data) {
    if (!data || typeof data !== 'object') {
      return {};
    }

    const validColumns = new Set([...this.columns, this.hidden]);

    return Object.fromEntries(
      Object.entries(data)
      .filter(([key, value]) => {
        return value !== undefined && validColumns.has(key);
      })
      .map(([key, value]) => [key, this.sanitize(value)])
    )
  }

  sanitize(value) {
    if (value === null) {
      return null;
    }

    // Handle arrays
    if (Array.isArray(value)) {
      return value.map(item => this.sanitize(item));
    }

    // Handle Objects
    if (typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value).map(([k, v]) => [k, this.sanitize(v)])
      );
    }

    if (typeof value === 'string') {
      return value.trim().replace(/\0/g, '');
    }

    const injectionPatterns = [
      /(\bOR\b\s+\d+\s*=\s*\d+|\bOR\b\s+'[^']*'\s*=\s*'[^']*')/i,
      /(\bAND\b\s+\d+\s*=\s*\d+|\bAND\b\s+'[^']*'\s*=\s*'[^']*')/i,
      /\bUNION\b/i,
      /\bSELECT\b/i,
      /\bDROP\b/i,
      /\bINSERT\b/i,
      /\bUPDATE\b/i,
      /\bDELETE\b/i,
      /--/,
      /\/\*/,
      /;\s*(DROP|DELETE|UPDATE|INSERT)/i,
      /xp_/i,
      /sp_/i,
    ];

    // Check if value contains injection patterns
    if (injectionPatterns.some(pattern => pattern.test(value))) {
      throw new Error(`SQL injection attempt detected: ${value}`);
    }

    return value.toString().trim().replace(/\0/g, '');
  }

  // BASIC CRUD
  async get() {
    return await this.db.findMany();
  }

  async find(query) {
    return db(this.table).where(this.clean(query));
  }

  async findOne(query) {
    return db(this.table).where(this.clean(query)).first();
  }

  async insert(data) {
    return db(this.table).insert(this.clean(data));
  }

  async update(id, data) {
    return db(this.table).where(this.primaryKey, id).update(this.clean(data));
  }

  async delete(query) {
    return db(this.table).where(this.clean(query)).del();
  }

  async count(query = {}) {
    return db(this.table)
      .where(this.clean(query))
      .count(`${this.primaryKey} as count`)
      .first();
  }

  // PAGINATION + ADVANCED FILTERS
  /**
   * Fetch paginated data with filters, ordering, and selection.
   * @param {Object} options Options object
   * @param {number} [options.page=1] Current page number
   * @param {number} [options.limit=this.pageLimit] Number of records per page
   * @param {Object} [options.filters={}] Filter conditions
   * @param {Boolean} [options.pagination=true] Filter conditions
   * @param {string|string[]} [options.select="*"] Columns to select
   * @param {Array<{column: string, dir?: "asc"|"desc"}>} [options.order=[]] Sorting rules
   * @returns {Promise<Object|Array>} Paginated result object or array
   * @returns {Array<Object>} return.data Array of rows
   * @returns {Object} return.pagination Pagination info
   * @returns {number} return.pagination.totalRows Total number of rows matching the filters
   * @returns {number} return.pagination.totalPages Total number of pages
   * @returns {number} return.pagination.currentPage Current page number
   * @returns {number} return.pagination.limit Number of rows per page
   *
   * @example
   * const result = await User.pagination({
   *   page: 2,
   *   limit: 10,
   *   filters: { name: { like: "Romik" } },
   *   select: ["id","name","email"],
   *   order: [{ column: "created_at", dir: "desc" }]
   *   pagination: true,
   * });
   */
  async paginate({
    page = 1,
    limit = this.pageLimit,
    filters = {},
    select = "*",
    order = [],
    pagination = true
  } = {}) {
    let query = db(this.table).select(select);

    // FILTERS
    const cleaned = this.clean(filters);
    for (const [field, cond] of Object.entries(cleaned)) {
      if (typeof cond === "object") {
        if (cond.like) query.where(field, "like", `%${cond.like}%`);
        if (cond.eq) query.where(field, cond.eq);
        if (cond.gt) query.where(field, ">", cond.gt);
        if (cond.gte) query.where(field, ">=", cond.gte);
        if (cond.lt) query.where(field, "<", cond.lt);
        if (cond.lte) query.where(field, "<=", cond.lte);
        if (cond.between) query.whereBetween(field, cond.between);
        if (cond.in) query.whereIn(field, cond.in);
        if (cond.notIn) query.whereNotIn(field, cond.notIn);
        if (cond.null) query.whereNull(field);
        if (cond.notNull) query.whereNotNull(field);
      } else {
        query.where(field, cond);
      }
    }

    // ORDER BY
    order.forEach(o => {
      if (o.column) query.orderBy(o.column, o.dir || "asc");
    });

    if (!pagination) return query.clone();

    // PAGINATION
    const data = await query.clone().limit(limit).offset((page - 1) * limit);
    const total = await query.clone().count(`${this.primaryKey} as count`).first();

    return {
      data,
      pagination: {
        totalRows: total.count,
        totalPages: Math.ceil(total.count / limit),
        currentPage: page,
        limit,
      }
    };
  }
}

module.exports = BaseModel;
