const prisma = require("./connection");
const mysql = require("./mysql");

class BaseModel {
  constructor({ table, columns = [], hidden = [], primaryKey = "id", limit = 10 }) {
    this.table = table;
    this.columns = columns;
    this.hidden = hidden;
    this.primaryKey = primaryKey;
    this.pageLimit = limit;
    this.db = prisma;
    this.mysql = mysql;
  }

  clean(data) {
    if (!data || typeof data !== 'object') {
      return {};
    }

    const validColumns = new Set([...this.columns, ...this.hidden]);

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

    // Numbers, booleans, etc. — Prisma / mysql2 parameterization handles
    // escaping, so no blocklist is applied (blocklists reject valid data and
    // are trivially bypassable).
    return value;
  }

  // BASIC CRUD
  async get() {
    return await this.db[this.table].findMany();
  }

  async find(query) {
    return this.db[this.table].findMany({ where: this.clean(query) });
  }

  async findOne(query) {
    return this.db[this.table].findFirst({ where: this.clean(query) });
  }

  async insert(data) {
    return await this.db[this.table].create({ data: this.clean(data) });
  }

  async update(id, data) {
    return await this.db[this.table].update({
      where: { [this.primaryKey]: id },
      data: this.clean(data)
    });
  }

  async delete(query) {
    return await this.db[this.table].deleteMany({ where: this.clean(query) });
  }

  async count(query = {}) {
    return this.db[this.table].count({ where: this.clean(query) });
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
   * @param {Object<string, "asc"|"desc">} [options.order={}] Sorting order
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
   *   order: { created_at: "desc" }
   *   pagination: true,
   * });
   */
  async paginate({
    page = 1,
    limit = this.pageLimit,
    filters = {},
    select = undefined,
    order = {},
    pagination = true
  } = {}) {

    if (!pagination) {
      return this.db[this.table].findMany({
        where: filters,
        select,
        orderBy: order
      });
    }
    
    const [data, total] = await this.db.$transaction([
      this.db[this.table].findMany({
        where: filters,
        select,
        orderBy: order,
        skip: (page - 1) * limit,
        take: limit
      }),
      this.db[this.table].count({ where: filters })
    ]);

    return {
      data,
      pagination: {
        totalRows: total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        limit
      }
    };
  }
}

module.exports = BaseModel;
