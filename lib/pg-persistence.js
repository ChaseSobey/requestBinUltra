const { dbQuery } = require("./db-query");

module.exports = class PgPersistence {
  constructor() {}

  // RETURNS all bins.
  // No known fail clause.
  async getAllBins() {
    const GET_BINS = "SELECT * FROM bins";

    let result = await dbQuery(GET_BINS);
    return result.rows;
  }

  // Create a new bin with a specified bin path.
  // Returns `true` on successful insertion, `false` otherwise.
  async createBin(binPath) {
    const CREATE_BIN = `INSERT INTO bins (bin_path) VALUES ($1)`;
    let result = await dbQuery(CREATE_BIN, binPath);
    return result.rowCount > 0;
  }

  // Delete a bin and its requests.
  // Returns `true` if a bin is deleted, false otherwise.
  async deleteBin(binPath) {
    const binId = await this._getBinIdFromPath(binPath);

    if (!binId) return false;

    const deletedRequests = await this.clearBin(binPath);
    if (!deletedRequests) return false;

    const DELETE_BIN = `DELETE FROM bins WHERE id = $1`;
    let deletedBin = await dbQuery(DELETE_BIN, binId);

    return deletedBin.rowCount > 0;
  }

  // Deletes all requests in a bin.
  // Only fails if bin with matching path is not found.
  async clearBin(binPath) {
    const binId = await this._getBinIdFromPath(binPath);

    if (!binId) return false;

    const DELETE_REQUESTS = `DELETE FROM requests WHERE bin_id = $1`;
    await dbQuery(DELETE_REQUESTS, binId);

    return true;
  }

  // Create a new request with specified bin path, mongo id, http method,
  // and path.
  // Returns `true` on successful insertion, `false` otherwise.
  async createRequest(binPath, mongoId, method, path) {
    const binId = await this._getBinIdFromPath(binPath);

    if (!binId) return false;

    const CREATE_REQUEST = `INSERT INTO requests (bin_id, mongo_id, http_method, http_path) VALUES ($1, $2, $3, $4)`;

    let result = await dbQuery(CREATE_REQUEST, binId, mongoId, method, path);
    return result.rowCount > 0;
  }

  // Returns array of mongoIds of all requests with specified bin id.
  // No known false clauses.
  async getMongoIdsByBinId(binId) {
    const GET_REQUESTS = `SELECT mongo_id FROM requests WHERE bin_id = $1`;

    let result = await dbQuery(GET_REQUESTS, binId);
    return result.rows;
  }

  // Returns array of mongoIds of all requests with specified bin path.
  // No known false clauses.
  async getMongoIdsByBinPath(path) {
    const binId = await this._getBinIdFromPath(path);
    const GET_REQUESTS = `SELECT mongo_id FROM requests WHERE bin_id = $1`;

    let result = await dbQuery(GET_REQUESTS, binId);
    return result.rows.map(({ mongo_id }) => mongo_id);
  }

  // Return the id of the bin with the corresponding bin path.
  // Returns
  async _getBinIdFromPath(path) {
    const GET_ID = `SELECT id FROM bins WHERE bin_path = $1`;

    let result = await dbQuery(GET_ID, path);
    if (result.rowCount == 0) return false;

    return result.rows[0].id;
  }
};
