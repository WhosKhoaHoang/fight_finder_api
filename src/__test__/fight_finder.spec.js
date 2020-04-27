const supertest = require("supertest");
const app = require("../app.js");
const utils = require("../utils.js");


describe("Testing fight_finder API", () => {

  it("test can call API", async () => {
    const route = "/data/kazushi_sakuraba";
    const response = await supertest(app).get(route);

    expect(response.status).toBe(200);
  });

});
