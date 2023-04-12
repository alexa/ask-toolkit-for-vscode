import assert from "assert";
import * as sinon from "sinon";
import {Project} from "@alexa/acdl";
import * as server from "../../src/acdlServer/acdlServer";
import {getHoverText, initializeTestProject} from "./acdlTestUtils";
import {formatComment, getCommentContent} from "../../src/acdlServer/hover";

describe("Hover", () => {
  describe("jsdoc", () => {
    it("should get empty string from jsdoc", () => {
      const jsdoc = `/**
          */`;
      const result = getCommentContent(jsdoc);
      const expected = ``;
      assert.strictEqual(result, expected);
    });
    it("should get comment content from jsdoc", () => {
      const jsdoc = `/**
          * random text
          */`;
      const result = getCommentContent(jsdoc);
      const expected = `random text`;
      assert.strictEqual(result, expected);
    });

    it("should get comment content from jsdoc - multiline", () => {
      const jsdoc = `/**
          * random text
          * multiline comment
          */`;
      const result = getCommentContent(jsdoc);
      const expected = `random text\nmultiline comment`;
      assert.strictEqual(result, expected);
    });

    it("should highlight word after @param in jsdoc", () => {
      const decl = {
        comment: `/**
          * @param arg arg description
          */`,
      };
      const result = formatComment(decl);
      const expected = ["@param - `arg` arg description  "];
      assert.deepStrictEqual(result, expected);
    });
  });

  describe("definitions and declarations", () => {
    const sbox = sinon.createSandbox();
    const testFileName = "Weather.acdl";
    let project: Project | undefined;

    before(async () => {
      try {
        project = await initializeTestProject();
        sinon.stub(server, "getProject").returns(project);
      } catch (err) {
        throw new Error(`Failed to initialize ACDL test project: ${err.message}`);
      }
    });

    after(() => sbox.restore());

    it("should display the action declaration when hovering a user-defined action name", async () => {
      const hoverText = await getHoverText(/getWeather\(/, testFileName);

      const expectedText = "(action) getWeather(City cityName, DATE date) : WeatherResult";

      assert.strictEqual(hoverText, expectedText);
    });

    it("should display the type definition when hovering a user-defined complex type", async () => {
      const hoverText = await getHoverText(/WeatherResult getWea/, testFileName);

      const expectedText = "type WeatherResult {\n City cityName\n NUMBER highTemp\n NUMBER lowTemp\n}";

      assert.strictEqual(hoverText, expectedText);
    });

    it("should display the declaration for an `expect` call when hovering the expect keyword", async () => {
      const hoverText = await getHoverText(/expect\(/, testFileName);

      const expectedText = "(action) expect(Type<RequestAct> act, Event<CityAndDate> event) : CityAndDate";

      assert.strictEqual(hoverText, expectedText);
    });

    it("should display the string contents of an APLA document when hovering an APLA template", async () => {
      const hoverText = await getHoverText(/weather_apla, N/, testFileName);

      const expectedText =
        "(ResponseTemplate) weather_apla \n" +
        '"In {weatherResult.cityName}, it\'s a high of {weatherResult.highTemp} degrees and a low of {weatherResult.lowTemp} degrees."' +
        "\nwhen {weatherResult != null && payload.weatherResult.cityName != null && payload.weatherResult.highTemp != null && payload.weatherResult.lowTemp != null}";

      assert.strictEqual(hoverText, expectedText);
    });
  });
});
