const { Pool } = require("pg");
const PgPersistence = require("../lib/pg-persistence");
const { dbQuery } = require("../lib/db-query");
const config = require("../config");

const pool = new Pool({
  user: config.POSTGRES_USERNAME,
  host: config.POSTGRES_HOST,
  database: config.POSTGRES_DB,
  password: config.POSTGRES_PASSWORD,
  port: 5432,
});

// Generates random uuid. Only for testing
function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var uuid = (Math.random() * 16) | 0,
      v = c == "x" ? uuid : (uuid & 0x3) | 0x8;
    return uuid.toString(16);
  });
}

describe("Postgres Bins Table Connection", () => {
  let pgPersistence;
  let uuid;
  // make random bin path
  const binPath = Math.random().toString(36).slice(2);

  beforeAll(async () => {
    pgPersistence = new PgPersistence();
    uuid = uuidv4();

    // Insert new bin with path random path and random uuid

    const CREATE_BIN_WITH_UUID = `INSERT INTO bins (bin_path, id) VALUES ($1, $2)`;
    // let result = await dbQuery(CREATE_BIN_WITH_UUID, "my_bin_path", uuid);
    await dbQuery(CREATE_BIN_WITH_UUID, binPath, uuid);

    // Insert requests into newly-created bin
    await pgPersistence.createRequest(binPath, "abcd", "POST", "/abcd");
    await pgPersistence.createRequest(binPath, "efgh", "POST", "/efgh");
    await pgPersistence.createRequest(binPath, "lmno", "POST", "/lmno");
  });

  afterAll(async () => {
    await pool.end();
  });

  test("can create request", async () => {
    try {
      const requestMade = await pgPersistence.createRequest(
        binPath,
        "xzy",
        "POST",
        "/xyz"
      );
      expect(requestMade).toBe(true);
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  });

  test("can get requests by bin id", async () => {
    const mongoIds = await pgPersistence.getMongoIdsByBinId(uuid);
    expect(mongoIds.length).not.toBe(0);
  });

  test("can get requests by bin path", async () => {
    const mongoIds = await pgPersistence.getMongoIdsByBinPath(binPath);
    expect(mongoIds.length).not.toBe(0);
  });

  test("can clear requests by bin path", async () => {
    await pgPersistence.clearBin(binPath);
    const mongoIds = await pgPersistence.getMongoIdsByBinPath(binPath);
    expect(mongoIds.length).toBe(0);
  });
});
