'use strict';

const expect = require('chai').expect;
const modelSnippetProcessor = require('../../internalScript/snippetGeneration/modelSnippetProcessor');
const fs = require('fs');
const sinon = require('sinon');
const FAKE_PATH = 'fake_path';

describe('modelSnippetProcessor', () => {
    beforeEach(() => {
        sinon.stub(fs, 'appendFileSync');
    });

    afterEach(()=> {
        // fs.appendFileSync.restore();
        fs.appendFileSync.restore();
    })

    it('should handle all valid intents (all happy cases)', () => {
        const input = [
            {
                "availabilityState": "developer-preview",
                "builtinType": "NLU2.0",
                "locale": "en_us",
                "name": "AddAction<object@Book,targetCollection@ReadingList>",
                "owner": "AMAZON"
            },
            {
                "availabilityState": "developer-preview",
                "builtinType": "NLU2.0",
                "locale": "en_us",
                "name": "AddAction<object@BookSeries,targetCollection@ReadingList>",
                "owner": "AMAZON"
            },
            {
                "availabilityState": "developer-preview",
                "builtinType": "NLU2.0",
                "locale": "en_us",
                "name": "AddAction<object@Event>",
                "owner": "AMAZON"
            },
            {
                "availabilityState": "developer-preview",
                "builtinType": "NLU2.0",
                "locale": "en_us",
                "name": "AddAction<object@MusicCreativeWork,targetCollection@MusicPlaylist>",
                "owner": "AMAZON"
            },
            {
                "availabilityState": "released",
                "builtinType": "Legacy",
                "locale": "en_us",
                "name": "CancelIntent",
                "owner": "AMAZON"
            },
            {
                "availabilityState": "developer-preview",
                "builtinType": "NLU2.0",
                "locale": "en_us",
                "name": "ChooseAction<object@Book>",
                "owner": "AMAZON"
            }
        ];

        const expected = {
            "Built-in Intent: AddAction": {
                "prefix": "askModelAddAction",
                "body": [
                    "{",
                    "    \"name\": \"AMAZON.AddAction<object@${1|BookSeries\\,targetCollection@ReadingList,Book\\,targetCollection@ReadingList,Event,MusicCreativeWork\\,targetCollection@MusicPlaylist|}>\",",
                    "    \"samples\": []",
                    "}"
                ]
            },
            "Built-in Intent: CancelIntent": {
                "prefix": "askModelCancelIntent",
                "body": [
                    "{",
                    "    \"name\": \"AMAZON.CancelIntent\",",
                    "    \"samples\": []",
                    "}"
                ]
            },
            "Built-in Intent: ChooseAction": {
                "prefix": "askModelChooseAction",
                "body": [
                    "{",
                    "    \"name\": \"AMAZON.ChooseAction<object@${1|Book|}>\",",
                    "    \"samples\": []",
                    "}"
                ]
            },
        }

        const output = modelSnippetProcessor.process(input, FAKE_PATH);
        expect(output).deep.equal(expected);
    });

    it('should reject non Amazon owned intent', () => {
        const input = [
            {
                "availabilityState": "developer-preview",
                "owner": "gg"
            }
        ];

        const expectedOutput = {};
        const expectedExpectionFirst = [FAKE_PATH, 'Rejected non-Amazon owned intent:\n' ];
        const expectedExpectionSecond = [FAKE_PATH, `${JSON.stringify(input, null, "\t")}\n`];

        const output = modelSnippetProcessor.process(input, FAKE_PATH);
        expect(fs.appendFileSync.firstCall.args).deep.equal(expectedExpectionFirst);
        expect(fs.appendFileSync.secondCall.args).deep.equal(expectedExpectionSecond);

        expect(output).deep.equal(expectedOutput);
    });

    it('should reject all the non-Regex-matching intent', () => {
        const input = [
            {
                "availabilityState": "developer-preview",
                "name": "ChooseAction<object@Book",
                "owner": "AMAZON"
            },
            {
                "availabilityState": "developer-preview",
                "name": "ChooseAction<obect@Book>",
                "owner": "AMAZON"
            },
            {
                "availabilityState": "developer-preview",
                "name": "ChooseAction<obectBook>",
                "owner": "AMAZON"
            }
        ];

        const expectedOutput = {};
        const expectedExpectionThird = [FAKE_PATH, 'Rejected not ruled intent by defined regex:\n' ];
        const expectedExpectionFourth = [FAKE_PATH, `${JSON.stringify(input, null, "\t")}\n`];

        const output = modelSnippetProcessor.process(input, FAKE_PATH);
       
        expect(fs.appendFileSync.thirdCall.args).deep.equal(expectedExpectionThird);
        expect(fs.appendFileSync.getCall(3).args).deep.equal(expectedExpectionFourth);

        expect(output).deep.equal(expectedOutput);
    })
});
